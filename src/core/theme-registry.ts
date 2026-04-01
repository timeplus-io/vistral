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
 *
 * IMPORTANT: G2 5.x uses *flat* keys in its theme (e.g. `axis.labelFill`,
 * `axis.labelOpacity`) — NOT the nested `axis.x.label.fill` format.
 * The default G2 light theme sets `axis.labelOpacity: 0.45` which makes labels
 * appear gray.  We must override the flat keys to take effect.
 */
export function buildG2ThemeObject(theme: VistralTheme): Record<string, unknown> {
  const fontSize   = theme.font?.size   ?? 11;
  const fontFamily = theme.font?.family ?? 'Inter, system-ui, sans-serif';
  const labelColor = theme.axis?.label?.color;
  const titleColor = theme.axis?.title?.color;
  const legendLabelColor = theme.legend?.label?.color;
  const legendTitleColor = theme.legend?.title?.color;

  // G2's axis theme uses flat keys.  Setting labelOpacity / titleOpacity to 1
  // is critical — G2's built-in light theme defaults to alpha45 (0.45) for
  // labels, which makes them appear gray even when labelFill is black.
  const axisConfig: Record<string, unknown> = {
    labelFill:        labelColor,
    labelOpacity:     1,
    labelFontSize:    theme.axis?.label?.size ?? fontSize,
    labelFontFamily:  fontFamily,
    titleFill:        titleColor,
    titleOpacity:     1,
    titleFontSize:    theme.axis?.title?.size ?? 12,
    titleFontWeight:  theme.axis?.title?.fontWeight ?? 500,
    gridStroke:       theme.axis?.grid?.color,
    gridLineDash:     theme.axis?.grid?.dash,
    lineStroke:       theme.axis?.line?.color,
    lineStrokeOpacity: 1,
    tickStroke:       theme.axis?.tick?.color,
    tickOpacity:      1,
  };

  const g2Theme: Record<string, unknown> = {
    view:  { viewFill: theme.background },
    label: { fill: labelColor, fontSize, fillOpacity: 1, fontFamily },
    // Flat axis config applies to all axes (x and y).
    axis:  axisConfig,
    // Mark-level legend() API uses nested keys; keep for backward compatibility.
    legend: {
      label:     { fill: legendLabelColor, fontSize: theme.legend?.label?.size ?? fontSize, fillOpacity: 1 },
      title:     { fill: legendTitleColor, fontSize: theme.legend?.title?.size ?? fontSize, fillOpacity: 1 },
      itemLabel: { fill: legendLabelColor, fontSize: theme.legend?.label?.size ?? fontSize, fillOpacity: 1 },
      itemName:  { fill: legendLabelColor, fontSize: theme.legend?.label?.size ?? fontSize, fillOpacity: 1 },
      itemValue: { fill: legendLabelColor, fontSize: theme.legend?.label?.size ?? fontSize, fillOpacity: 1 },
    },
    // legendCategory uses flat keys in G2's theme system.
    legendCategory: {
      itemLabelFill:        legendLabelColor,
      itemLabelFillOpacity: 1,
      itemLabelFontSize:    theme.legend?.label?.size ?? fontSize,
      itemValueFill:        legendLabelColor,
      itemValueFillOpacity: 1,
      titleFill:            legendTitleColor,
      titleFillOpacity:     1,
      titleFontSize:        theme.legend?.title?.size ?? fontSize,
    },
  };

  if (theme.palette && theme.palette.length > 0) {
    // color: single default stroke for marks with no color encode (single series)
    g2Theme.color = theme.palette[0];
    // category10/20: palette used by G2's categorical color scale (multi-series)
    g2Theme.category10 = theme.palette;
    g2Theme.category20 = theme.palette;
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
