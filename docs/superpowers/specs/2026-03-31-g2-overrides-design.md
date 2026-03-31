# Design: G2 Escape Hatch + Silent-Drop Fixes for VistralSpec

**Date:** 2026-03-31
**Status:** Approved
**Related issue:** timeplus-io/vistral#39

## Problem

`VistralSpec` compiles to AntV G2 options via `translateToG2Spec` / `buildG2Options` in
`src/core/spec-engine.ts`. Several G2 options are either:

1. **Silently dropped** — declared in a `VistralSpec` type but never written to the G2 output.
2. **Missing entirely** — G2 options that `VistralSpec` has no field for at all.

### Known silent drops (confirmed by code audit)

| VistralSpec field | G2 target | Status |
|---|---|---|
| `spec.tooltip` (top-level) | `g2Options.tooltip` | ❌ Never written |
| `spec.legend.interactive` | `g2Options.legend.color.itemMarker` (toggle) | ❌ Dropped |
| `mark.tooltip.items[].format` | G2 `valueFormatter` | ⚠️ Wrong key name — G2 expects `valueFormatter`, Vistral passes `format` |

### G2 options with no VistralSpec coverage (non-exhaustive examples)

- Axis tick count (`tickCount`), tick interval, nice rounding, label rotation per-axis
- View padding / inset (`paddingLeft`, `paddingTop`, `inset`, …)
- Per-mark style overrides beyond what `StyleSpec` covers
- Interaction config details beyond `{ type }` (e.g. brush extent)

## Goals

1. Fix the three known silent drops so typed fields work as documented.
2. Add a `g2Overrides` escape hatch on `VistralSpec` for everything else, applied at the
   end of the `buildG2Options` pipeline so it covers all compiled output.

## Out of Scope

- The `StreamChart` config path (`TimeSeriesConfig`, `BarColumnConfig`, etc.) — separate work.
- Adding more typed fields to `VistralSpec` beyond fixing the silent drops.
- Per-mark, per-axis, or per-scale escape hatches — top-level only.

## Architecture

### 1. Fix `spec.tooltip` translation

Add a `translateTooltip` helper in `spec-engine.ts`. The key translation is `items[].format`
→ `items[].valueFormatter` (G2's actual key name). `title` passes through unchanged.

```typescript
// VistralSpec (user writes)
tooltip: {
  title: (d) => d.time,
  items: [{ field: 'value', name: 'Throughput', format: (v) => formatBps(v) }]
}

// G2 output (after translateTooltip)
tooltip: {
  title: (d) => d.time,
  items: [{ field: 'value', name: 'Throughput', valueFormatter: (v) => formatBps(v) }]
}
```

### 2. Fix `legend.interactive`

In `translateToG2Spec`, when `spec.legend.interactive === true`, add
`itemMarker: { active: true }` to the compiled legend object so G2 toggles series on click.

### 3. Add `g2Overrides` field

```typescript
// src/types/spec.ts — addition to VistralSpec
/**
 * Raw G2 options merged on top of the compiled output. g2Overrides always win.
 * Use this to access any G2 option that VistralSpec does not model.
 *
 * @example
 * // Control axis tick count
 * g2Overrides: { axis: { y: { tickCount: 5 } } }
 *
 * @example
 * // Custom tooltip value formatter (issue #39)
 * g2Overrides: {
 *   tooltip: {
 *     items: [{ channel: 'y', name: 'Throughput', valueFormatter: (v) => formatBps(Number(v)) }]
 *   }
 * }
 *
 * @example
 * // View padding
 * g2Overrides: { paddingLeft: 60 }
 */
g2Overrides?: Record<string, unknown>;
```

### 4. Deep-merge in `buildG2Options`

Applied as the **last step** of `buildG2Options`, after theme, data, and temporal domain are
all set. `g2Overrides` wins at every leaf. Arrays replace (not concat).

```
filterDataByTemporal(spec, data)
  → stable sort
  → time field conversion
  → translateToG2Spec(spec)         ← includes tooltip + legend.interactive fixes
  → applySpecTheme
  → attach data
  → set temporal domain
  → deepMerge(g2Spec, spec.g2Overrides)    ← NEW: last step
  → return
```

A `deepMerge(target, overrides)` utility is added locally in `spec-engine.ts`:
- Plain objects: recurse and merge keys
- Arrays: `overrides` array replaces `target` array entirely
- Primitives / functions: `overrides` value replaces `target` value
- `target` is never mutated; a new object is returned

## Files Changed

| File | Change |
|---|---|
| `src/types/spec.ts` | Add `g2Overrides?: Record<string, unknown>` to `VistralSpec` |
| `src/core/spec-engine.ts` | Add `translateTooltip`, fix `legend.interactive`, add `deepMerge`, apply at end of `buildG2Options` |
| `src/__tests__/core/spec-engine.test.ts` | Tests for tooltip translation, legend.interactive, deepMerge behavior |

## Testing

Three new test cases in `spec-engine.test.ts`:

1. **`spec.tooltip` translation** — `translateToG2Spec` with a top-level tooltip produces
   the correct G2 `tooltip` object with `valueFormatter` (not `format`) on items.

2. **`legend.interactive`** — `translateToG2Spec` with `legend: { interactive: true }` produces
   G2 legend with the appropriate interactive marker config.

3. **`g2Overrides` deep-merge** — `buildG2Options` with `g2Overrides` set:
   - Override leaf values win over compiled values
   - Arrays in overrides replace (not merge) arrays in compiled output
   - `spec` and the compiled G2 object are not mutated

## Usage Example (issue #39)

```typescript
const spec: VistralSpec = {
  marks: [{ type: 'line', encode: { x: 'time', y: 'value', color: 'series' } }],
  axes: {
    y: {
      labels: {
        format: (v) => formatBps(Number(v)),  // axis labels — already works
      }
    }
  },
  // Typed fix: spec.tooltip now translates correctly
  tooltip: {
    items: [{ field: 'value', name: 'Throughput', format: (v) => formatBps(Number(v)) }]
  },
  // Or via escape hatch if more G2-level control is needed:
  // g2Overrides: {
  //   tooltip: { items: [{ channel: 'y', valueFormatter: (v) => formatBps(Number(v)) }] }
  // }
};
```
