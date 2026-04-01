# Custom Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users define, register, and use custom `VistralTheme` objects that control all non-data visual presentation — background, font, axis, legend, tooltip, and data palette — on both `VistralChart` and `StreamChart`.

**Architecture:** A new `VistralTheme` interface lives in `src/types/theme.ts`. A `theme-registry.ts` module provides `registerTheme`, `resolveTheme` (string → full theme object via deep-merge onto a base), and `buildG2ThemeObject` (VistralTheme → G2 theme options). `buildG2Options` in `spec-engine.ts` calls these to replace the current `applySpecTheme` + `getChartThemeColors` approach. Tooltip CSS is injected into the G2 interaction config inside `buildG2Options`. `VistralChart` gains a `theme` prop. Both components accept `string | VistralTheme`.

**Tech Stack:** TypeScript, AntV G2 5.x, Vitest

---

## File Map

| File | Change |
|------|--------|
| `src/types/theme.ts` | **New.** `VistralTheme`, `AxisStyleSpec`, `DARK_THEME`, `LIGHT_THEME` |
| `src/core/theme-registry.ts` | **New.** `registerTheme`, `resolveTheme`, `buildG2ThemeObject` |
| `src/__tests__/core/theme-registry.test.ts` | **New.** Tests for all registry and translation functions |
| `src/core/spec-engine.ts` | Export `deepMerge`; wire `resolveTheme`+`buildG2ThemeObject` into `buildG2Options`; update `translateAxes` signature; remove `applySpecTheme` |
| `src/__tests__/core/spec-engine-pipeline.test.ts` | Replace `applySpecTheme` tests; add custom theme integration tests |
| `src/types/spec.ts` | `VistralSpec.theme` type → `string \| VistralTheme` |
| `src/core/chart-utils.ts` | `applyChartTheme` and `renderChart` accept `string \| VistralTheme` |
| `src/charts/VistralChart.tsx` | Add `theme?: string \| VistralTheme` prop |
| `src/charts/StreamChart.tsx` | `theme` prop type → `string \| VistralTheme` |
| `src/index.ts` | Export `registerTheme`, `VistralTheme`, `AxisStyleSpec`; deprecate `ChartTheme` etc. |

---

## Task 1: Create `VistralTheme` type and built-in theme objects

**Files:**
- Create: `src/types/theme.ts`

- [ ] **Step 1: Create `src/types/theme.ts`**

```typescript
// src/types/theme.ts

export interface AxisStyleSpec {
  label?: { color?: string; size?: number };
  title?: { color?: string; size?: number; fontWeight?: number };
  grid?:  { color?: string; dash?: number[] };
  line?:  { color?: string };
  tick?:  { color?: string };
}

/**
 * A Vistral theme controls the non-data visual presentation of a chart:
 * background, font, axis, legend, tooltip, and data series palette.
 *
 * Custom themes are deep-merged onto a base (`'dark'` or `'light'`).
 * Only the fields you specify are overridden; everything else falls back
 * to the base.
 *
 * @example
 * registerTheme('corporate', {
 *   extends: 'light',
 *   palette: ['#0066CC', '#FF6600'],
 *   font: { family: 'Roboto, sans-serif' },
 *   axis: { grid: { color: '#E0E0E0' } },
 * });
 */
export interface VistralTheme {
  /** Base to inherit from. Defaults to 'dark'. */
  extends?: 'dark' | 'light';

  /** Data series color palette — replaces the default palette for this render. */
  palette?: string[];

  /** Chart background color. */
  background?: string;

  /** Font applied to all text elements. */
  font?: {
    family?: string;
    size?: number;
  };

  /** Axis styling — applies to both x and y axes uniformly. */
  axis?: AxisStyleSpec;

  legend?: {
    label?: { color?: string; size?: number };
    title?: { color?: string; size?: number };
    background?: string;
  };

  tooltip?: {
    background?: string;
    text?: { color?: string; size?: number };
    border?: { color?: string };
  };

  /**
   * Raw G2 theme options deep-merged on top of the compiled theme object.
   * Same array-replace semantics as VistralSpec.g2Overrides.
   */
  g2ThemeOverrides?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Built-in themes
// ---------------------------------------------------------------------------

export const DARK_THEME: VistralTheme = {
  background: 'transparent',
  font: { family: 'Inter, system-ui, sans-serif', size: 11 },
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
  font: { family: 'Inter, system-ui, sans-serif', size: 11 },
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

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit --project /Users/gangtao/Code/timeplus/vistral/tsconfig.json 2>&1 | head -20
```

Expected: no errors (new file has no imports yet).

- [ ] **Step 3: Commit**

```bash
git add src/types/theme.ts
git commit -m "feat: add VistralTheme type and built-in dark/light theme objects"
```

---

## Task 2: Export `deepMerge` + create theme registry

**Files:**
- Modify: `src/core/spec-engine.ts` (export `deepMerge`)
- Create: `src/core/theme-registry.ts`
- Create: `src/__tests__/core/theme-registry.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/core/theme-registry.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { registerTheme, resolveTheme, buildG2ThemeObject } from '../../core/theme-registry';
import { DARK_THEME, LIGHT_THEME } from '../../types/theme';
import type { VistralTheme } from '../../types/theme';

describe('resolveTheme', () => {
  it('returns DARK_THEME for "dark"', () => {
    expect(resolveTheme('dark')).toBe(DARK_THEME);
  });

  it('returns LIGHT_THEME for "light"', () => {
    expect(resolveTheme('light')).toBe(LIGHT_THEME);
  });

  it('returns DARK_THEME for undefined', () => {
    expect(resolveTheme(undefined)).toBe(DARK_THEME);
  });

  it('falls back to DARK_THEME for unknown name', () => {
    const result = resolveTheme('does-not-exist');
    expect(result).toEqual(DARK_THEME);
  });

  it('merges a theme object onto dark base by default', () => {
    const custom: VistralTheme = { axis: { grid: { color: '#FF0000' } } };
    const result = resolveTheme(custom);
    // Override wins
    expect(result.axis?.grid?.color).toBe('#FF0000');
    // Base values preserved
    expect(result.axis?.label?.color).toBe(DARK_THEME.axis!.label!.color);
    expect(result.background).toBe(DARK_THEME.background);
  });

  it('merges onto light base when extends: "light"', () => {
    const custom: VistralTheme = { extends: 'light', axis: { grid: { color: '#FF0000' } } };
    const result = resolveTheme(custom);
    expect(result.axis?.grid?.color).toBe('#FF0000');
    expect(result.axis?.label?.color).toBe(LIGHT_THEME.axis!.label!.color);
  });

  it('does not mutate the input theme object', () => {
    const custom: VistralTheme = { axis: { grid: { color: '#FF0000' } } };
    const before = JSON.stringify(custom);
    resolveTheme(custom);
    expect(JSON.stringify(custom)).toBe(before);
  });
});

describe('registerTheme', () => {
  it('registers and retrieves a custom theme by name', () => {
    const myTheme: VistralTheme = { background: '#123456' };
    registerTheme('my-test-theme', myTheme);
    const resolved = resolveTheme('my-test-theme');
    expect(resolved.background).toBe('#123456');
  });

  it('throws when trying to overwrite "dark"', () => {
    expect(() => registerTheme('dark', {})).toThrow();
  });

  it('throws when trying to overwrite "light"', () => {
    expect(() => registerTheme('light', {})).toThrow();
  });
});

describe('buildG2ThemeObject', () => {
  it('produces correct G2 view fill from background', () => {
    const g2 = buildG2ThemeObject(DARK_THEME);
    expect((g2.view as any).viewFill).toBe('transparent');
  });

  it('produces axis label fill from theme', () => {
    const g2 = buildG2ThemeObject(DARK_THEME);
    expect((g2.axis as any).x.label.fill).toBe('#E5E5E5');
    expect((g2.axis as any).y.label.fill).toBe('#E5E5E5');
  });

  it('produces axis grid stroke from theme', () => {
    const g2 = buildG2ThemeObject(DARK_THEME);
    expect((g2.axis as any).x.grid.stroke).toBe('#374151');
  });

  it('produces legend label fill from theme', () => {
    const g2 = buildG2ThemeObject(DARK_THEME);
    expect((g2.legend as any).label.fill).toBe('#E5E5E5');
  });

  it('applies font family to label', () => {
    const theme: VistralTheme = { ...DARK_THEME, font: { family: 'Roboto', size: 13 } };
    const g2 = buildG2ThemeObject(theme);
    expect((g2.label as any).fontFamily).toBe('Roboto');
    expect((g2.label as any).fontSize).toBe(13);
  });

  it('applies grid dash when specified', () => {
    const theme: VistralTheme = {
      ...DARK_THEME,
      axis: { ...DARK_THEME.axis, grid: { color: '#444', dash: [4, 4] } },
    };
    const g2 = buildG2ThemeObject(theme);
    expect((g2.axis as any).x.grid.lineDash).toEqual([4, 4]);
  });

  it('g2ThemeOverrides win over compiled values', () => {
    const theme: VistralTheme = {
      ...DARK_THEME,
      g2ThemeOverrides: { view: { viewFill: '#ABCDEF' } },
    };
    const g2 = buildG2ThemeObject(theme);
    expect((g2.view as any).viewFill).toBe('#ABCDEF');
  });

  it('does not mutate the input theme', () => {
    const theme = { ...DARK_THEME, g2ThemeOverrides: { view: { viewFill: '#ABCDEF' } } };
    const before = JSON.stringify(theme);
    buildG2ThemeObject(theme);
    expect(JSON.stringify(theme)).toBe(before);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run --config vitest.verify.config.ts src/__tests__/core/theme-registry.test.ts --reporter=verbose 2>&1 | tail -15
```

Expected: fails with "Cannot find module '../../core/theme-registry'".

- [ ] **Step 3: Export `deepMerge` from `spec-engine.ts`**

In `src/core/spec-engine.ts`, change line 252 from:

```typescript
function deepMerge(
```

to:

```typescript
export function deepMerge(
```

- [ ] **Step 4: Create `src/core/theme-registry.ts`**

```typescript
// src/core/theme-registry.ts
import type { VistralTheme } from '../types/theme';
import { DARK_THEME, LIGHT_THEME } from '../types/theme';
import { deepMerge } from './spec-engine';

const registry = new Map<string, VistralTheme>([
  ['dark',  DARK_THEME],
  ['light', LIGHT_THEME],
]);

/**
 * Register a custom theme by name.
 * The built-in names 'dark' and 'light' cannot be overwritten.
 */
export function registerTheme(name: string, theme: VistralTheme): void {
  if (name === 'dark' || name === 'light') {
    throw new Error(`Cannot overwrite built-in theme '${name}'`);
  }
  registry.set(name, theme);
}

/**
 * Resolve a theme name or object into a fully merged VistralTheme.
 * Custom themes are deep-merged on top of their declared base ('dark' by default).
 */
export function resolveTheme(theme: string | VistralTheme | undefined): VistralTheme {
  if (theme === undefined || theme === 'dark') return DARK_THEME;
  if (theme === 'light') return LIGHT_THEME;

  const raw: VistralTheme = typeof theme === 'string'
    ? (registry.get(theme) ?? DARK_THEME)
    : theme;

  // Return base directly when the raw IS the base (registered built-ins)
  if (raw === DARK_THEME || raw === LIGHT_THEME) return raw;

  const base: VistralTheme = raw.extends === 'light' ? LIGHT_THEME : DARK_THEME;
  return deepMerge(
    base as Record<string, unknown>,
    raw as Record<string, unknown>
  ) as VistralTheme;
}

/**
 * Convert a resolved VistralTheme into the G2 theme object shape.
 * Replaces both applySpecTheme() and applyChartTheme().
 */
export function buildG2ThemeObject(theme: VistralTheme): Record<string, unknown> {
  const fontSize   = theme.font?.size   ?? 11;
  const fontFamily = theme.font?.family ?? 'Inter, system-ui, sans-serif';

  const axisConfig = {
    label: {
      fill:        theme.axis?.label?.color,
      fontSize:    theme.axis?.label?.size ?? fontSize,
      fillOpacity: 1,
      fontFamily,
    },
    title: {
      fill:        theme.axis?.title?.color,
      fontSize:    theme.axis?.title?.size ?? 12,
      fontWeight:  theme.axis?.title?.fontWeight ?? 500,
      fillOpacity: 1,
      fontFamily,
    },
    grid: {
      stroke:   theme.axis?.grid?.color,
      lineDash: theme.axis?.grid?.dash,
    },
    line: { stroke: theme.axis?.line?.color, strokeOpacity: 1 },
    tick: { stroke: theme.axis?.tick?.color, strokeOpacity: 1 },
  };

  const g2Theme: Record<string, unknown> = {
    view:  { viewFill: theme.background },
    label: { fill: theme.axis?.label?.color, fontSize, fillOpacity: 1, fontFamily },
    axis:  { x: axisConfig, y: axisConfig },
    legend: {
      label:     { fill: theme.legend?.label?.color, fontSize: theme.legend?.label?.size ?? fontSize, fillOpacity: 1 },
      title:     { fill: theme.legend?.title?.color, fontSize: theme.legend?.title?.size ?? fontSize, fillOpacity: 1 },
      itemLabel: { fill: theme.legend?.label?.color, fontSize: theme.legend?.label?.size ?? fontSize, fillOpacity: 1 },
      itemName:  { fill: theme.legend?.label?.color, fontSize: theme.legend?.label?.size ?? fontSize, fillOpacity: 1 },
      itemValue: { fill: theme.legend?.label?.color, fontSize: theme.legend?.label?.size ?? fontSize, fillOpacity: 1 },
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

/**
 * Build the tooltip CSS object from a resolved theme, for injection into
 * G2's interaction config.
 */
export function buildTooltipCss(theme: VistralTheme): Record<string, string> {
  const borderColor = theme.tooltip?.border?.color;
  return {
    'background-color': theme.tooltip?.background ?? 'rgba(0,0,0,0.8)',
    color:              theme.tooltip?.text?.color ?? '#fff',
    'font-size':        `${theme.tooltip?.text?.size ?? 12}px`,
    'border-radius':    '4px',
    padding:            '8px 12px',
    border:             borderColor ? `1px solid ${borderColor}` : 'none',
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run --config vitest.verify.config.ts src/__tests__/core/theme-registry.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 6: Run the full suite to check no regressions**

```bash
npx vitest run --config vitest.verify.config.ts 2>&1 | tail -10
```

Expected: same pass/fail counts as before (109 passing, 1 pre-existing failure).

- [ ] **Step 7: Commit**

```bash
git add src/core/spec-engine.ts src/core/theme-registry.ts src/__tests__/core/theme-registry.test.ts
git commit -m "feat: add theme registry with registerTheme, resolveTheme, buildG2ThemeObject"
```

---

## Task 3: Wire theme through `spec-engine.ts` pipeline

**Files:**
- Modify: `src/types/spec.ts`
- Modify: `src/core/spec-engine.ts`
- Modify: `src/__tests__/core/spec-engine-pipeline.test.ts`

- [ ] **Step 1: Write the failing tests**

Open `src/__tests__/core/spec-engine-pipeline.test.ts` and replace the `applySpecTheme` describe block with this (the current tests reference `applySpecTheme` which will be removed):

```typescript
import { describe, it, expect } from 'vitest';
import { buildG2Options, filterDataByTemporal } from '../../core/spec-engine';
import { registerTheme } from '../../core/theme-registry';
import type { VistralSpec } from '../../types/spec';
import type { VistralTheme } from '../../types/theme';

describe('buildG2Options — theme integration', () => {
  const baseSpec: VistralSpec = {
    marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
  };

  it('uses dark theme colors by default', () => {
    const g2 = buildG2Options(baseSpec, []);
    expect((g2.theme as any).axis.x.label.fill).toBe('#E5E5E5');
  });

  it('uses light theme colors when spec.theme is "light"', () => {
    const spec: VistralSpec = { ...baseSpec, theme: 'light' };
    const g2 = buildG2Options(spec, []);
    expect((g2.theme as any).axis.x.label.fill).toBe('#000000');
  });

  it('applies a custom VistralTheme object passed via spec.theme', () => {
    const customTheme: VistralTheme = { axis: { label: { color: '#AABBCC' } } };
    const spec: VistralSpec = { ...baseSpec, theme: customTheme };
    const g2 = buildG2Options(spec, []);
    expect((g2.theme as any).axis.x.label.fill).toBe('#AABBCC');
  });

  it('applies a registered custom theme by name', () => {
    registerTheme('test-corporate', {
      extends: 'light',
      axis: { grid: { color: '#FEDCBA' } },
    });
    const spec: VistralSpec = { ...baseSpec, theme: 'test-corporate' };
    const g2 = buildG2Options(spec, []);
    expect((g2.theme as any).axis.x.grid.stroke).toBe('#FEDCBA');
    // Light base preserved for label
    expect((g2.theme as any).axis.x.label.fill).toBe('#000000');
  });

  it('injects tooltip CSS into interaction config', () => {
    const spec: VistralSpec = { ...baseSpec, theme: 'dark' };
    const g2 = buildG2Options(spec, []);
    const tooltipCss = (g2.interaction as any)?.tooltip?.css?.['.g2-tooltip'];
    expect(tooltipCss).toBeDefined();
    expect(tooltipCss['background-color']).toBe('rgba(0,0,0,0.8)');
    expect(tooltipCss['color']).toBe('#FFFFFF');
  });

  it('tooltip CSS uses custom theme colors', () => {
    const spec: VistralSpec = {
      ...baseSpec,
      theme: { tooltip: { background: '#FF0000', text: { color: '#00FF00' } } },
    };
    const g2 = buildG2Options(spec, []);
    const tooltipCss = (g2.interaction as any)?.tooltip?.css?.['.g2-tooltip'];
    expect(tooltipCss['background-color']).toBe('#FF0000');
    expect(tooltipCss['color']).toBe('#00FF00');
  });

  it('spec.g2Overrides still wins over theme', () => {
    const spec: VistralSpec = {
      ...baseSpec,
      g2Overrides: { type: 'cell' },
    };
    const g2 = buildG2Options(spec, []);
    expect(g2.type).toBe('cell');
  });
});
```

Also keep the existing `buildG2Options — g2Overrides` describe block (lines below it in the file) — do not remove it.

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run --config vitest.verify.config.ts src/__tests__/core/spec-engine-pipeline.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: the new `buildG2Options — theme integration` tests fail (applySpecTheme import missing or wrong output).

- [ ] **Step 3: Update `VistralSpec.theme` type in `src/types/spec.ts`**

In `src/types/spec.ts`, change:

```typescript
import type { VistralTheme } from './theme';
```

Add this import at the top of the file (after the existing imports).

Then change:

```typescript
  /** Theme name. */
  theme?: 'dark' | 'light';
```

to:

```typescript
  /** Theme — built-in name, registered custom name, or a VistralTheme object. */
  theme?: string | VistralTheme;
```

- [ ] **Step 4: Update `src/core/spec-engine.ts` — imports and `translateAxes`**

At the top of `src/core/spec-engine.ts`, replace:

```typescript
import { getChartThemeColors } from './chart-utils';
```

with:

```typescript
import { resolveTheme, buildG2ThemeObject, buildTooltipCss } from './theme-registry';
import type { VistralTheme } from '../types/theme';
```

Then update `translateAxes` (line 285) — change its signature and body to accept a `VistralTheme` instead of a theme string:

```typescript
function translateAxes(
  axes: AxesSpec,
  theme: VistralTheme
): Record<string, any> {
  const result: Record<string, any> = {};
  const colors = {
    text:     theme.axis?.label?.color ?? '#E5E5E5',
    gridline: theme.axis?.grid?.color  ?? '#374151',
    line:     theme.axis?.line?.color  ?? '#6B7280',
  };

  for (const channel of ['x', 'y'] as const) {
    const value = axes[channel];
    if (value === undefined) continue;
    if (value === false) {
      result[channel] = false;
    } else {
      result[channel] = translateAxisChannel(value, colors);
    }
  }

  return result;
}
```

- [ ] **Step 5: Update `translateToG2Spec` to accept a resolved theme**

In `src/core/spec-engine.ts`, change the signature of `translateToG2Spec` (line 434):

```typescript
export function translateToG2Spec(
  spec: VistralSpec,
  resolvedTheme?: VistralTheme
): Record<string, any> {
```

Inside `translateToG2Spec`, replace the two occurrences of:

```typescript
g2.axis = translateAxes(effectiveAxes, spec.theme);
```

with:

```typescript
g2.axis = translateAxes(effectiveAxes, resolvedTheme ?? resolveTheme(spec.theme));
```

And replace the inline legend colors block (around line 486) that calls `getChartThemeColors(spec.theme ?? 'dark')`:

Find this block:
```typescript
      const colors = getChartThemeColors(spec.theme ?? 'dark');
```

Replace with:
```typescript
      const thm = resolvedTheme ?? resolveTheme(spec.theme);
      const colors = {
        text: thm.legend?.label?.color ?? thm.axis?.label?.color ?? '#E5E5E5',
      };
```

And replace all subsequent `colors.text` references in the legend block with `colors.text`.

- [ ] **Step 6: Update `buildG2Options` in `src/core/spec-engine.ts`**

In `buildG2Options` (line 818), replace the existing `translateToG2Spec` and `applySpecTheme` calls:

Find:
```typescript
  const g2Spec = translateToG2Spec(spec);
  g2Spec.theme = applySpecTheme(spec.theme);
```

Replace with:
```typescript
  const resolvedTheme = resolveTheme(spec.theme);
  const g2Spec = translateToG2Spec(spec, resolvedTheme);
  g2Spec.theme = buildG2ThemeObject(resolvedTheme);

  // Inject tooltip CSS into interaction config so tooltip is themed correctly
  const tooltipCss = buildTooltipCss(resolvedTheme);
  const existingInteraction = (g2Spec.interaction as Record<string, unknown>) ?? {};
  g2Spec.interaction = {
    ...existingInteraction,
    tooltip: {
      mount: typeof document !== 'undefined' ? document.body : undefined,
      css: { '.g2-tooltip': tooltipCss },
    },
  };
```

- [ ] **Step 7: Remove `applySpecTheme` from `spec-engine.ts`**

Delete the entire `applySpecTheme` function (lines 591–627):

```typescript
export function applySpecTheme(
  theme: 'dark' | 'light' | undefined
): Record<string, any> {
  // ... delete the whole function ...
}
```

- [ ] **Step 8: Run the tests**

```bash
npx vitest run --config vitest.verify.config.ts src/__tests__/core/spec-engine-pipeline.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all tests in the file pass.

- [ ] **Step 9: Run full suite**

```bash
npx vitest run --config vitest.verify.config.ts 2>&1 | tail -10
```

Expected: 109 passing + new theme tests passing, 1 pre-existing failure unchanged.

- [ ] **Step 10: Commit**

```bash
git add src/types/spec.ts src/core/spec-engine.ts src/__tests__/core/spec-engine-pipeline.test.ts
git commit -m "feat: wire custom theme through spec-engine pipeline, replace applySpecTheme"
```

---

## Task 4: Update legacy theme functions in `chart-utils.ts`

**Files:**
- Modify: `src/core/chart-utils.ts`

- [ ] **Step 1: Update imports in `chart-utils.ts`**

Add at the top of `src/core/chart-utils.ts`:

```typescript
import { resolveTheme, buildG2ThemeObject, buildTooltipCss } from './theme-registry';
import type { VistralTheme } from '../types/theme';
```

- [ ] **Step 2: Update `applyChartTheme` signature and body**

Replace the entire `applyChartTheme` function (lines 379–432):

```typescript
/**
 * Apply a Vistral theme to a G2 Chart instance imperatively.
 * Accepts a theme name (built-in or registered) or a VistralTheme object.
 */
export function applyChartTheme(
  chart: Chart,
  theme: string | VistralTheme = 'dark'
): void {
  const resolved = resolveTheme(theme);
  chart.theme(buildG2ThemeObject(resolved));
}
```

- [ ] **Step 3: Update `renderChart` to accept `string | VistralTheme`**

Replace the `renderChart` function signature and tooltip CSS section:

```typescript
export async function renderChart(
  chart: Chart,
  theme: string | VistralTheme = 'dark'
): Promise<void> {
  const resolvedTheme = resolveTheme(theme);
  const tooltipCss = buildTooltipCss(resolvedTheme);

  chart.interaction('tooltip', {
    mount: document.body,
    css: { '.g2-tooltip': tooltipCss },
  });
  chart.interaction('legendFilter', false);
  await chart.render();

  // Apply CSS-based legend text styling after render
  const container = chart.getContainer();
  const legendTextColor = resolvedTheme.legend?.label?.color ?? resolvedTheme.axis?.label?.color ?? '#E5E5E5';
  if (container) {
    const legendSelectors = [
      'g[class*="bindClick"] text',
      'g[class*="bindChange"] text',
      'g[class*="legend"] text',
      'g[class*="Legend"] text',
      '[class*="category"] text',
      '[class*="item-label"] text',
      '[class*="itemLabel"] text',
    ];

    legendSelectors.forEach((selector) => {
      try {
        const elements = container.querySelectorAll(selector);
        elements.forEach((el) => {
          if (el instanceof SVGElement) {
            el.setAttribute('fill', legendTextColor);
          }
        });
      } catch {
        // Ignore invalid selectors
      }
    });

    const styleId = 'vistral-legend-style';
    let styleEl = container.querySelector(`#${styleId}`) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      container.appendChild(styleEl);
    }
    styleEl.textContent = `
      g[bindClick] text,
      g[bindChange] text,
      [class*="legend"] text,
      [class*="Legend"] text {
        fill: ${legendTextColor} !important;
      }
    `;
  }
}
```

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run --config vitest.verify.config.ts 2>&1 | tail -10
```

Expected: same pass counts as after Task 3.

- [ ] **Step 5: Commit**

```bash
git add src/core/chart-utils.ts
git commit -m "feat: update applyChartTheme and renderChart to accept string | VistralTheme"
```

---

## Task 5: Add `theme` prop to `VistralChart`

**Files:**
- Modify: `src/charts/VistralChart.tsx`

- [ ] **Step 1: Update `VistralChartProps` to add `theme`**

In `src/charts/VistralChart.tsx`, add the import:

```typescript
import type { VistralTheme } from '../types/theme';
```

Then in `VistralChartProps`, add after the `onReady` field:

```typescript
  /** Theme — built-in name ('dark'|'light'), registered custom name, or VistralTheme object.
   *  When set, overrides spec.theme. */
  theme?: string | VistralTheme;
```

- [ ] **Step 2: Apply the `theme` prop in the render logic**

In the `VistralChart` component body, destructure `theme` from props:

```typescript
const { spec, source, width, height, className, style, onReady, theme } = props;
```

In the `renderChart` callback (the inner one, not `chart-utils.renderChart`), replace:

```typescript
      const g2Options = buildG2Options(spec, data);
```

with:

```typescript
      const effectiveSpec = theme !== undefined ? { ...spec, theme } : spec;
      const g2Options = buildG2Options(effectiveSpec, data);
```

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run --config vitest.verify.config.ts 2>&1 | tail -10
```

Expected: same pass counts.

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit --project /Users/gangtao/Code/timeplus/vistral/tsconfig.json 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/charts/VistralChart.tsx
git commit -m "feat: add theme prop to VistralChart accepting string | VistralTheme"
```

---

## Task 6: Update `StreamChart` theme prop type

**Files:**
- Modify: `src/charts/StreamChart.tsx`

- [ ] **Step 1: Update `StreamChartProps` in `StreamChart.tsx`**

Add the import at the top of `src/charts/StreamChart.tsx`:

```typescript
import type { VistralTheme } from '../types/theme';
```

Change in `StreamChartProps`:

```typescript
  /** Color theme */
  theme?: 'dark' | 'light';
```

to:

```typescript
  /** Theme — built-in name ('dark'|'light'), registered custom name, or VistralTheme object. */
  theme?: string | VistralTheme;
```

- [ ] **Step 2: Update `compileTimeSeriesConfig` and `compileBarColumnConfig` in `src/core/compilers.ts`**

Both functions have `theme: 'dark' | 'light' = 'dark'` at lines 64 and 188. Change both to:

```typescript
theme: string | VistralTheme = 'dark'
```

Also add the import at the top of `compilers.ts`:

```typescript
import type { VistralTheme } from '../types/theme';
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit --project /Users/gangtao/Code/timeplus/vistral/tsconfig.json 2>&1 | head -30
```

Expected: no errors. Fix any type errors found (likely the compiler signature).

- [ ] **Step 4: Run full suite**

```bash
npx vitest run --config vitest.verify.config.ts 2>&1 | tail -10
```

Expected: same pass counts.

- [ ] **Step 5: Commit**

```bash
git add src/charts/StreamChart.tsx src/core/compilers.ts
git commit -m "feat: update StreamChart theme prop to accept string | VistralTheme"
```

---

## Task 7: Update public exports in `src/index.ts`

**Files:**
- Modify: `src/index.ts`
- Modify: `src/themes/index.ts` (add deprecation JSDoc)
- Modify: `src/core/index.ts` (re-export new functions)

- [ ] **Step 1: Check `src/core/index.ts` exports**

```bash
cat /Users/gangtao/Code/timeplus/vistral/src/core/index.ts
```

Add `registerTheme`, `resolveTheme`, `buildG2ThemeObject`, `buildTooltipCss` to the core barrel if it exists. If `src/core/index.ts` exports functions individually, add:

```typescript
export { registerTheme, resolveTheme, buildG2ThemeObject, buildTooltipCss } from './theme-registry';
```

- [ ] **Step 2: Add new exports to `src/index.ts`**

In `src/index.ts`, after the existing `// Themes and Colors` block, add:

```typescript
// Custom theme system
export { registerTheme } from './core/theme-registry';
export type { VistralTheme, AxisStyleSpec } from './types/theme';
export { DARK_THEME, LIGHT_THEME } from './types/theme';
```

- [ ] **Step 3: Mark deprecated exports in `src/themes/index.ts`**

In `src/themes/index.ts`, add `@deprecated` JSDoc to `ChartTheme`, `darkTheme`, `lightTheme`, `getTheme`:

```typescript
/**
 * @deprecated Use VistralTheme from '@timeplus/vistral' instead.
 */
export interface ChartTheme { ... }

/**
 * @deprecated Use DARK_THEME from '@timeplus/vistral' instead.
 */
export const darkTheme: ChartTheme = { ... };

/**
 * @deprecated Use LIGHT_THEME from '@timeplus/vistral' instead.
 */
export const lightTheme: ChartTheme = { ... };

/**
 * @deprecated Use resolveTheme from '@timeplus/vistral' instead.
 */
export function getTheme(name: ThemeName): ChartTheme { ... }
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit --project /Users/gangtao/Code/timeplus/vistral/tsconfig.json 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Run the full test suite**

```bash
npx vitest run --config vitest.verify.config.ts 2>&1 | tail -10
```

Expected: all theme tests pass, 109+ passing, 1 pre-existing failure.

- [ ] **Step 6: Commit**

```bash
git add src/index.ts src/themes/index.ts src/core/index.ts
git commit -m "feat: export registerTheme, VistralTheme, DARK_THEME, LIGHT_THEME from public API

Marks ChartTheme, darkTheme, lightTheme, getTheme as deprecated — they
remain exported for one version to avoid breaking external consumers."
```
