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
