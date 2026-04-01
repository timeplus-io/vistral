# Design: Custom Theme System for Vistral

**Date:** 2026-03-31
**Status:** Approved
**Related issue:** timeplus-io/vistral#37 (color scheme), follow-up

## Problem

Vistral's theme system is locked to two built-in strings: `'dark'` and `'light'`. Internally, both names map to a hardcoded 5-token color object (`getChartThemeColors`) that is applied inconsistently across two separate functions (`applySpecTheme` for the declarative path, `applyChartTheme` for the legacy imperative path). Several properties declared in the existing `ChartTheme` interface — font family, tooltip colors — are never applied to G2 at all.

Users have no way to define their own visual presentation: brand fonts, custom grid colors, corporate color palettes, or alternate background colors.

## Goals

1. Define a typed `VistralTheme` interface covering all non-data ink: background, font, axis (label, title, grid, line, tick), legend, tooltip, and data color palette.
2. Support registering custom themes by name (`registerTheme`) and passing themes directly as objects.
3. Both `VistralChart` and `StreamChart` accept `theme: string | VistralTheme`.
4. Custom themes inherit from a base (`'dark'` or `'light'`) and override only specified fields.
5. Unify the two existing theme application paths (`applySpecTheme` / `applyChartTheme`) into a single pipeline.
6. Fix the existing gaps: font family and tooltip colors are never applied to G2 — they will be now.

## Out of Scope

- Per-axis theme overrides (x vs y styled differently) — use `g2ThemeOverrides` for that.
- Hiding tooltip or legend via theme — that remains a `VistralSpec`/config concern (`tooltip: false`, `legend: false`).
- Theming the `DataTable` or `GeoChart` components — separate work.
- `StreamChart` config-level theme compilation changes beyond passing `theme` through.

## The `VistralTheme` Interface

```typescript
// src/types/theme.ts  (new file)

export interface AxisStyleSpec {
  label?: { color?: string; size?: number; };
  title?: { color?: string; size?: number; fontWeight?: number; };
  grid?:  { color?: string; dash?: number[]; };
  line?:  { color?: string; };
  tick?:  { color?: string; };
}

export interface VistralTheme {
  /**
   * Base theme to inherit from. Unspecified fields fall back to this base.
   * Defaults to 'dark'.
   */
  extends?: 'dark' | 'light';

  /** Data series color palette. Replaces DEFAULT_PALETTE for this render. */
  palette?: string[];

  /** Chart/view background color. */
  background?: string;

  /** Font settings applied to all text elements. */
  font?: {
    family?: string;   // e.g. 'Roboto, sans-serif'
    size?: number;     // base font size in px (default: 11)
  };

  /**
   * Axis styling — applies uniformly to both x and y axes.
   * For per-axis overrides, use g2ThemeOverrides.
   */
  axis?: AxisStyleSpec;

  legend?: {
    label?:      { color?: string; size?: number; };
    title?:      { color?: string; size?: number; };
    background?: string;
  };

  tooltip?: {
    background?: string;
    text?:       { color?: string; size?: number; };
    border?:     { color?: string; };
  };

  /**
   * Raw G2 theme options deep-merged on top of the compiled theme object.
   * Same semantics as VistralSpec.g2Overrides — overrides always win, arrays replace.
   */
  g2ThemeOverrides?: Record<string, unknown>;
}
```

## Built-in Themes as `VistralTheme` Objects

The two built-in themes are redefined as `VistralTheme` objects. They are the merge base for all custom themes.

```typescript
// src/types/theme.ts

export const DARK_THEME: VistralTheme = {
  background: 'transparent',
  font:    { family: 'Inter, system-ui, sans-serif', size: 11 },
  axis: {
    label: { color: '#E5E5E5', size: 11 },
    title: { color: '#E5E5E5', size: 12, fontWeight: 500 },
    grid:  { color: '#374151' },
    line:  { color: '#6B7280' },
    tick:  { color: '#6B7280' },
  },
  legend: {
    label: { color: '#E5E5E5', size: 12 },
    title: { color: '#E5E5E5', size: 12 },
  },
  tooltip: {
    background: 'rgba(0,0,0,0.8)',
    text:       { color: '#FFFFFF', size: 12 },
    border:     { color: 'transparent' },
  },
};

export const LIGHT_THEME: VistralTheme = {
  background: 'transparent',
  font:    { family: 'Inter, system-ui, sans-serif', size: 11 },
  axis: {
    label: { color: '#000000', size: 11 },
    title: { color: '#000000', size: 12, fontWeight: 500 },
    grid:  { color: '#9CA3AF' },
    line:  { color: '#4B5563' },
    tick:  { color: '#4B5563' },
  },
  legend: {
    label: { color: '#000000', size: 12 },
    title: { color: '#000000', size: 12 },
  },
  tooltip: {
    background: '#FFFFFF',
    text:       { color: '#111111', size: 12 },
    border:     { color: '#E5E7EB' },
  },
};
```

## Theme Registry

```typescript
// src/core/theme-registry.ts  (new file)

import type { VistralTheme } from '../types/theme';
import { DARK_THEME, LIGHT_THEME } from '../types/theme';
import { deepMerge } from './spec-engine';  // existing utility

const registry = new Map<string, VistralTheme>([
  ['dark',  DARK_THEME],
  ['light', LIGHT_THEME],
]);

/**
 * Register a custom theme by name. Built-in names 'dark' and 'light' cannot be overwritten.
 */
export function registerTheme(name: string, theme: VistralTheme): void {
  if (name === 'dark' || name === 'light') {
    throw new Error(`Cannot overwrite built-in theme '${name}'`);
  }
  registry.set(name, theme);
}

/**
 * Resolve a theme name or object to a complete VistralTheme, deep-merged onto its base.
 */
export function resolveTheme(theme: string | VistralTheme | undefined): VistralTheme {
  if (theme === undefined || theme === 'dark') return DARK_THEME;
  if (theme === 'light') return LIGHT_THEME;

  const raw: VistralTheme = typeof theme === 'string'
    ? (registry.get(theme) ?? DARK_THEME)
    : theme;

  const base = raw.extends === 'light' ? LIGHT_THEME : DARK_THEME;
  return deepMerge(base as Record<string, unknown>, raw as Record<string, unknown>) as VistralTheme;
}
```

## Theme-to-G2 Translation

```typescript
// src/core/theme-registry.ts

/**
 * Convert a resolved VistralTheme to the G2 theme object shape.
 * Replaces both applySpecTheme() and applyChartTheme().
 */
export function buildG2ThemeObject(theme: VistralTheme): Record<string, unknown> {
  const fontSize   = theme.font?.size ?? 11;
  const fontFamily = theme.font?.family ?? 'Inter, system-ui, sans-serif';

  const axisConfig = {
    label: { fill: theme.axis?.label?.color, fontSize: theme.axis?.label?.size ?? fontSize, fillOpacity: 1, fontFamily },
    title: { fill: theme.axis?.title?.color, fontSize: theme.axis?.title?.size ?? 12, fontWeight: theme.axis?.title?.fontWeight ?? 500, fillOpacity: 1, fontFamily },
    grid:  { stroke: theme.axis?.grid?.color, lineDash: theme.axis?.grid?.dash },
    line:  { stroke: theme.axis?.line?.color, strokeOpacity: 1 },
    tick:  { stroke: theme.axis?.tick?.color, strokeOpacity: 1 },
  };

  const g2Theme: Record<string, unknown> = {
    view: { viewFill: theme.background },
    label: { fill: theme.axis?.label?.color, fontSize, fillOpacity: 1, fontFamily },
    axis:  { x: axisConfig, y: axisConfig },
    legend: {
      label:     { fill: theme.legend?.label?.color, fontSize: theme.legend?.label?.size ?? fontSize, fillOpacity: 1 },
      title:     { fill: theme.legend?.title?.color, fontSize: theme.legend?.title?.size ?? fontSize, fillOpacity: 1 },
      itemLabel: { fill: theme.legend?.label?.color, fontSize: theme.legend?.label?.size ?? fontSize, fillOpacity: 1 },
      itemName:  { fill: theme.legend?.label?.color, fontSize: theme.legend?.label?.size ?? fontSize, fillOpacity: 1 },
    },
    legendCategory: {
      itemLabel: { fill: theme.legend?.label?.color, fillOpacity: 1 },
      itemName:  { fill: theme.legend?.label?.color, fillOpacity: 1 },
    },
  };

  if (theme.g2ThemeOverrides) {
    return deepMerge(g2Theme, theme.g2ThemeOverrides);
  }
  return g2Theme;
}
```

Tooltip background/border are injected as CSS on the chart container (G2 renders tooltips as DOM elements, not canvas), not as part of the G2 theme object. This is done in `VistralChart.tsx` by writing a `<style>` tag scoped to the chart's container ID.

## Rendering Pipeline Changes

### `buildG2Options` in `spec-engine.ts`

```
filterDataByTemporal(spec, data)
  → stable sort
  → time field conversion
  → resolveTheme(spec.theme)              ← NEW: produces full VistralTheme
  → translateToG2Spec(spec, theme)        ← theme passed in; no more inline getChartThemeColors
  → g2Spec.theme = buildG2ThemeObject(theme)   ← replaces applySpecTheme
  → attach data
  → set temporal domain
  → deepMerge(g2Spec, spec.g2Overrides)
  → return
```

### `VistralChart.tsx`

- Accepts `theme?: string | VistralTheme` prop (was `'dark' | 'light'`)
- Resolves theme once: `const resolved = resolveTheme(theme ?? spec.theme)`
- Injects tooltip CSS on mount/theme change via a scoped `<style>` tag

### `StreamChart.tsx`

- Already accepts `theme?: string | VistralTheme` (type change only)
- Passes through to `VistralChart` — no other changes needed

### Legacy path (`applyChartTheme` in `chart-utils.ts`)

Used by `SingleValueChart` sparklines etc. Updated to:

```typescript
export function applyChartTheme(chart: Chart, theme: string | VistralTheme = 'dark'): void {
  const resolved = resolveTheme(theme);
  chart.theme(buildG2ThemeObject(resolved));
}
```

## Public API

```typescript
// New exports from '@timeplus/vistral'
export { registerTheme } from './core/theme-registry';
export type { VistralTheme, AxisStyleSpec } from './types/theme';

// Deprecated (kept for one version)
export type { ChartTheme } from './themes';           // was ChartTheme
export { darkTheme, lightTheme, getTheme } from './themes';  // unused internally
```

### Usage Examples

```typescript
import { registerTheme, type VistralTheme } from '@timeplus/vistral';

// Register once at app startup
registerTheme('corporate', {
  extends: 'light',
  palette:    ['#0066CC', '#FF6600', '#00AA44', '#9900CC'],
  background: '#F8F9FA',
  font:       { family: 'Roboto, sans-serif', size: 12 },
  axis: {
    grid:  { color: '#E0E0E0', dash: [4, 4] },
    label: { color: '#333333' },
    line:  { color: '#CCCCCC' },
    tick:  { color: '#CCCCCC' },
  },
  tooltip:  { background: '#FFFFFF', text: { color: '#111111' }, border: { color: '#E0E0E0' } },
  legend:   { label: { color: '#333333' } },
});

// Use by name
<VistralChart spec={spec} theme="corporate" />
<StreamChart config={config} data={data} theme="corporate" />

// Use by object (no registration)
const minimalDark: VistralTheme = {
  palette: ['#FF73B6', '#8890FF', '#27CCA8'],
  axis: { grid: { color: '#1A1A2E' } },
};
<VistralChart spec={spec} theme={minimalDark} />
```

## Files Changed

| File | Change |
|------|--------|
| `src/types/theme.ts` | New: `VistralTheme`, `AxisStyleSpec`, `DARK_THEME`, `LIGHT_THEME` |
| `src/core/theme-registry.ts` | New: `registerTheme`, `resolveTheme`, `buildG2ThemeObject` |
| `src/core/spec-engine.ts` | Export `deepMerge` (currently private); `buildG2Options` calls `resolveTheme` + `buildG2ThemeObject`; `translateToG2Spec` receives resolved theme; remove `applySpecTheme`; remove `getChartThemeColors` calls |
| `src/core/chart-utils.ts` | `applyChartTheme` updated to accept `string \| VistralTheme`, call `resolveTheme` + `buildG2ThemeObject` |
| `src/charts/VistralChart.tsx` | `theme` prop type → `string \| VistralTheme`; tooltip CSS injection |
| `src/charts/StreamChart.tsx` | `theme` prop type → `string \| VistralTheme` |
| `src/types/spec.ts` | `VistralSpec.theme` type → `string \| VistralTheme` |
| `src/index.ts` | Export `registerTheme`, `VistralTheme`, `AxisStyleSpec` |
| `src/themes/index.ts` | Mark `ChartTheme`, `darkTheme`, `lightTheme`, `getTheme` as deprecated |

## Testing

1. **`resolveTheme`** — built-in names, registered names, object passthrough, missing name falls back to dark, `extends: 'light'` merges correctly
2. **`buildG2ThemeObject`** — produces correct G2 shape from a fully resolved theme, `g2ThemeOverrides` wins at leaf
3. **`registerTheme`** — rejects `'dark'`/`'light'`, stores and retrieves custom themes
4. **`buildG2Options` integration** — resolved theme is applied, `spec.g2Overrides` still wins over theme
5. **Regression** — all existing 109 tests pass
