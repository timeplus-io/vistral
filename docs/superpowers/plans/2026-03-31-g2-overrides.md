# G2 Escape Hatch + Silent-Drop Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three VistralSpec fields that are silently dropped during G2 translation, and add a `g2Overrides` escape hatch for arbitrary G2 options.

**Architecture:** Three targeted fixes in `spec-engine.ts` (tooltip translation, legend.interactive passthrough, deepMerge for g2Overrides), one new field in `VistralSpec`, and new tests in the existing translate test file. All changes are self-contained in the spec-engine pipeline.

**Tech Stack:** TypeScript, AntV G2 5.x, Vitest

---

## File Map

| File | Change |
|---|---|
| `src/types/spec.ts` | Add `g2Overrides?: Record<string, unknown>` to `VistralSpec` |
| `src/core/spec-engine.ts` | Add `translateTooltip` helper; fix `legend.interactive`; add `deepMerge`; apply at end of `buildG2Options` |
| `src/__tests__/core/spec-engine-translate.test.ts` | New tests for tooltip translation and legend.interactive |
| `src/__tests__/core/spec-engine-pipeline.test.ts` | New tests for g2Overrides deep-merge behavior |

---

### Task 1: Fix `spec.tooltip` translation

**Files:**
- Modify: `src/core/spec-engine.ts`
- Test: `src/__tests__/core/spec-engine-translate.test.ts`

- [ ] **Step 1: Write the failing tests**

Open `src/__tests__/core/spec-engine-translate.test.ts` and add a new `describe` block at the bottom:

```typescript
describe('translateToG2Spec — tooltip', () => {
  it('should translate top-level tooltip and rename format to valueFormatter', () => {
    const formatter = (v: unknown) => `${v} bps`;
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      tooltip: {
        title: (d: Record<string, unknown>) => String(d.time),
        items: [{ field: 'value', name: 'Throughput', format: formatter }],
      },
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.tooltip).toBeDefined();
    expect(g2.tooltip.title).toBe((spec.tooltip as { title: unknown }).title);
    expect(g2.tooltip.items).toHaveLength(1);
    expect(g2.tooltip.items[0].field).toBe('value');
    expect(g2.tooltip.items[0].name).toBe('Throughput');
    expect(g2.tooltip.items[0].valueFormatter).toBe(formatter);
    expect(g2.tooltip.items[0].format).toBeUndefined();
  });

  it('should pass tooltip: false through unchanged', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      tooltip: false,
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.tooltip).toBe(false);
  });

  it('should not set tooltip on g2 when spec.tooltip is undefined', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.tooltip).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm run test -- src/__tests__/core/spec-engine-translate.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: 3 failures mentioning `g2.tooltip` is undefined.

- [ ] **Step 3: Add `TooltipSpec` to imports in `spec-engine.ts`**

In `src/core/spec-engine.ts`, extend the existing import block (lines 11-20):

```typescript
import type {
  VistralSpec,
  TransformSpec,
  MarkSpec,
  LabelSpec,
  AnnotationSpec,
  CoordinateSpec,
  AxesSpec,
  AxisChannelSpec,
  TooltipSpec,
} from '../types/spec';
```

- [ ] **Step 4: Add the `translateTooltip` helper in `spec-engine.ts`**

Add this function immediately after the `translateAxisChannel` function (around line 216):

```typescript
/**
 * Translate a TooltipSpec to G2 tooltip format.
 * Renames `items[].format` to `items[].valueFormatter` to match G2's API.
 */
function translateTooltip(
  tooltip: TooltipSpec
): Record<string, any> {
  const result: Record<string, any> = {};

  if (tooltip.title !== undefined) {
    result.title = tooltip.title;
  }

  if (tooltip.items) {
    result.items = tooltip.items.map(({ format, ...rest }) => {
      const item: Record<string, any> = { ...rest };
      if (format !== undefined) {
        item.valueFormatter = format;
      }
      return item;
    });
  }

  return result;
}
```

- [ ] **Step 5: Apply tooltip translation in `translateToG2Spec`**

In `translateToG2Spec`, add the tooltip block after the Interactions block (after line ~456, before the Children block). Find the comment `// Children: marks + annotations` and insert above it:

```typescript
  // Tooltip
  if (spec.tooltip !== undefined) {
    g2.tooltip = spec.tooltip === false ? false : translateTooltip(spec.tooltip);
  }
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
npm run test -- src/__tests__/core/spec-engine-translate.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all tests in the file pass.

- [ ] **Step 7: Commit**

```bash
git add src/core/spec-engine.ts src/__tests__/core/spec-engine-translate.test.ts
git commit -m "fix: translate spec.tooltip to G2 and rename format to valueFormatter"
```

---

### Task 2: Fix `legend.interactive`

**Files:**
- Modify: `src/core/spec-engine.ts`
- Test: `src/__tests__/core/spec-engine-translate.test.ts`

- [ ] **Step 1: Write the failing test**

Add a new `describe` block at the bottom of `src/__tests__/core/spec-engine-translate.test.ts`:

```typescript
describe('translateToG2Spec — legend.interactive', () => {
  it('should set interactive: true on legend.color when legend.interactive is true', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      legend: { interactive: true },
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.legend).toBeDefined();
    expect(g2.legend.color).toBeDefined();
    expect(g2.legend.color.interactive).toBe(true);
  });

  it('should not set interactive on legend.color when legend.interactive is false', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      legend: { interactive: false },
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.legend?.color?.interactive).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm run test -- src/__tests__/core/spec-engine-translate.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: the new `legend.interactive` tests fail.

- [ ] **Step 3: Add `LegendSpec` to imports in `spec-engine.ts`**

Extend the import block in `src/core/spec-engine.ts`:

```typescript
import type {
  VistralSpec,
  TransformSpec,
  MarkSpec,
  LabelSpec,
  AnnotationSpec,
  CoordinateSpec,
  AxesSpec,
  AxisChannelSpec,
  TooltipSpec,
  LegendSpec,
} from '../types/spec';
```

- [ ] **Step 4: Pass `legend.interactive` through in the legend block**

In `translateToG2Spec`, find the legend translation block (around line 418-447). After this line in the `else` branch:

```typescript
      g2.legend = {
        color: {
          position: spec.legend.position,
          // ...theme colors...
        },
      };
```

Add `interactive` to the `color` object. The full `color` object should be:

```typescript
        color: {
          position: spec.legend.position,
          interactive: (spec.legend as LegendSpec).interactive === true ? true : undefined,
          // Explicitly inject colors to override G2 defaults/dimming
          itemLabelFill: colors.text,
          itemLabelFillOpacity: 1,
          itemNameFill: colors.text,
          itemNameFillOpacity: 1,
          titleFill: colors.text,
          titleFillOpacity: 1,
          // G2 5.0+ specific style overrides
          itemLabel: {
            fill: colors.text,
            fillOpacity: 1,
            fontSize: 12,
          },
          itemName: {
            fill: colors.text,
            fillOpacity: 1,
            fontSize: 12,
          },
        },
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npm run test -- src/__tests__/core/spec-engine-translate.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/core/spec-engine.ts src/__tests__/core/spec-engine-translate.test.ts
git commit -m "fix: pass legend.interactive through to G2 legend config"
```

---

### Task 3: Add `g2Overrides` field and `deepMerge`

**Files:**
- Modify: `src/types/spec.ts`
- Modify: `src/core/spec-engine.ts`
- Test: `src/__tests__/core/spec-engine-pipeline.test.ts`

- [ ] **Step 1: Write the failing tests**

Open `src/__tests__/core/spec-engine-pipeline.test.ts` and add a new `describe` block at the bottom:

```typescript
describe('buildG2Options — g2Overrides', () => {
  it('should deep-merge g2Overrides on top of compiled G2 spec (override wins at leaf)', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      axes: { y: { grid: true } },
      g2Overrides: {
        axis: { y: { tickCount: 5 } },
      },
    };

    const g2 = buildG2Options(spec, []);

    // Compiled axis.y props still present
    expect(g2.axis.y.grid).toBe(true);
    // g2Overrides value merged in
    expect(g2.axis.y.tickCount).toBe(5);
  });

  it('should replace arrays in g2Overrides rather than merging them', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      g2Overrides: {
        customArray: [10, 20, 30],
      },
    };

    const g2 = buildG2Options(spec, []);

    expect(g2.customArray).toEqual([10, 20, 30]);
  });

  it('should let g2Overrides override a scalar value set by compilation', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      g2Overrides: {
        type: 'cell', // overrides the compiled 'view'
      },
    };

    const g2 = buildG2Options(spec, []);

    expect(g2.type).toBe('cell');
  });

  it('should not mutate the spec.g2Overrides object', () => {
    const overrides = { axis: { y: { tickCount: 5 } } };
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      g2Overrides: overrides,
    };

    buildG2Options(spec, []);

    expect(overrides).toEqual({ axis: { y: { tickCount: 5 } } });
  });

  it('should return unchanged output when g2Overrides is undefined', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
    };

    const g2 = buildG2Options(spec, []);

    expect(g2.type).toBe('view');
    expect(g2.children).toHaveLength(1);
  });
});
```

Check that `buildG2Options` is already imported at the top of the pipeline test file. If not, add it:

```typescript
import { buildG2Options } from '../../core/spec-engine';
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm run test -- src/__tests__/core/spec-engine-pipeline.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: the new `g2Overrides` tests fail with TypeScript errors about `g2Overrides` not existing on `VistralSpec`.

- [ ] **Step 3: Add `g2Overrides` to `VistralSpec` in `src/types/spec.ts`**

In `src/types/spec.ts`, add the field to the `VistralSpec` interface after the `animate` field:

```typescript
  /** Enable/disable animation globally. */
  animate?: boolean;
  /**
   * Raw G2 options deep-merged on top of the compiled output. Values in
   * g2Overrides always win. Arrays replace rather than merge.
   *
   * Use this to access any G2 option that VistralSpec does not model directly.
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

- [ ] **Step 4: Add the `deepMerge` utility in `src/core/spec-engine.ts`**

Add this function immediately after the `translateTooltip` helper:

```typescript
/**
 * Recursively merge `overrides` on top of `target`.
 * - Plain objects: keys are merged recursively (overrides win at leaf).
 * - Arrays: the overrides array replaces the target array entirely.
 * - Primitives / functions: the overrides value replaces the target value.
 * The target is never mutated; a new object is returned.
 */
function deepMerge(
  target: Record<string, any>,
  overrides: Record<string, unknown>
): Record<string, any> {
  const result: Record<string, any> = { ...target };

  for (const key of Object.keys(overrides)) {
    const overrideVal = overrides[key];
    const targetVal = result[key];

    if (
      overrideVal !== null &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, any>,
        overrideVal as Record<string, unknown>
      );
    } else {
      result[key] = overrideVal;
    }
  }

  return result;
}
```

- [ ] **Step 5: Apply `deepMerge` at the end of `buildG2Options`**

In `buildG2Options`, find the final `return g2Spec;` statement (last line of the function, around line 889). Replace it with:

```typescript
  if (spec.g2Overrides) {
    return deepMerge(g2Spec, spec.g2Overrides);
  }

  return g2Spec;
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
npm run test -- src/__tests__/core/spec-engine-pipeline.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all `g2Overrides` tests pass.

- [ ] **Step 7: Run the full test suite to confirm no regressions**

```bash
npm run test 2>&1 | tail -30
```

Expected: all existing tests still pass alongside the new ones.

- [ ] **Step 8: Commit**

```bash
git add src/types/spec.ts src/core/spec-engine.ts src/__tests__/core/spec-engine-pipeline.test.ts
git commit -m "feat: add g2Overrides escape hatch to VistralSpec

Adds deepMerge applied at the end of buildG2Options so users can pass
any raw G2 option that VistralSpec does not model. Resolves the workaround
path for issue #39 (tooltip formatter).

Closes #39"
```
