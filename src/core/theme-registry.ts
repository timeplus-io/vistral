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

  const buildAxisConfig = () => ({
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
  });

  const g2Theme: Record<string, unknown> = {
    view:  { viewFill: theme.background },
    label: { fill: theme.axis?.label?.color, fontSize, fillOpacity: 1, fontFamily },
    axis:  { x: buildAxisConfig(), y: buildAxisConfig() },
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

  if (theme.palette && theme.palette.length > 0) {
    g2Theme.color = theme.palette;
  }

  if (theme.g2ThemeOverrides) {
    return deepMerge(g2Theme, theme.g2ThemeOverrides);
  }
  return g2Theme;
}

/**
 * Returns true if the theme resolves to dark mode.
 * - undefined or string 'dark' → true
 * - string 'light' → false
 * - other string → resolves via registry, checks extends field (defaults to 'dark')
 * - VistralTheme object → checks extends field (defaults to 'dark')
 */
export function isDarkTheme(theme: string | VistralTheme | undefined): boolean {
  if (theme === undefined || theme === 'dark') return true;
  if (theme === 'light') return false;
  if (typeof theme === 'string') {
    // Access registry directly to check the raw theme's extends field,
    // avoiding the risk of resolveTheme stripping extends from the merged result.
    const raw = registry.get(theme);
    return (raw?.extends ?? 'dark') !== 'light';
  }
  // VistralTheme object — check extends field
  return (theme.extends ?? 'dark') !== 'light';
}

/**
 * Build the tooltip CSS object from a resolved theme, for injection into
 * G2's interaction config.
 */
export function buildTooltipCss(theme: VistralTheme): Record<string, string> {
  const borderColor = theme.tooltip?.border?.color;
  return {
    'background-color': theme.tooltip?.background ?? 'rgba(0,0,0,0.8)',
    color:              theme.tooltip?.text?.color ?? '#FFFFFF',
    'font-size':        `${theme.tooltip?.text?.size ?? 12}px`,
    'border-radius':    '4px',
    padding:            '8px 12px',
    border:             borderColor ? `1px solid ${borderColor}` : 'none',
  };
}
