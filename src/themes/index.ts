/**
 * Color palettes for stream visualization
 */

import type { ColorPalette } from '../types';

// Single color palettes (monochromatic)
export const singleColorPalettes: ColorPalette[] = [
  {
    label: 'red',
    keyColor: 5,
    keyColorValue: '#FF465F',
    values: [
      '#FFD2D9',
      '#FFB0BF',
      '#FF90A2',
      '#FF6780',
      '#FF465F',
      '#D13049',
      '#A32035',
      '#751020',
      '#47010D',
      '#35010A',
    ],
  },
  {
    label: 'pink',
    keyColor: 5,
    keyColorValue: '#FF73B6',
    values: [
      '#FFE0F0',
      '#FFC2E0',
      '#FFA3CF',
      '#FF8CC2',
      '#FF73B6',
      '#D95A97',
      '#B34278',
      '#8C2A59',
      '#66123A',
      '#400025',
    ],
  },
  {
    label: 'purple',
    keyColor: 5,
    keyColorValue: '#B275FF',
    values: [
      '#EDD9FF',
      '#DBBFFF',
      '#C9A3FF',
      '#BF8CFF',
      '#B275FF',
      '#8F5AD4',
      '#6C40A9',
      '#4A277E',
      '#280E53',
      '#170538',
    ],
  },
  {
    label: 'indigo',
    keyColor: 5,
    keyColorValue: '#8890FF',
    values: [
      '#D9DBFF',
      '#BBBFFF',
      '#9DA3FF',
      '#9299FF',
      '#8890FF',
      '#6068D4',
      '#3840A9',
      '#10187E',
      '#000053',
      '#000038',
    ],
  },
  {
    label: 'green',
    keyColor: 5,
    keyColorValue: '#27CCA8',
    values: [
      '#C5F5EC',
      '#9DEED9',
      '#75E7C6',
      '#4EDDB7',
      '#27CCA8',
      '#1FA888',
      '#178468',
      '#0F5F48',
      '#073B28',
      '#032718',
    ],
  },
  {
    label: 'teal',
    keyColor: 5,
    keyColorValue: '#0BC5EA',
    values: [
      '#C5F3FB',
      '#9DEAF7',
      '#75DFF3',
      '#4DD5EF',
      '#0BC5EA',
      '#09A0BE',
      '#077B91',
      '#055665',
      '#033038',
      '#021D22',
    ],
  },
  {
    label: 'orange',
    keyColor: 2,
    keyColorValue: '#FF7C27',
    values: ['#FFBA8C', '#FF9855', '#FF7C27'],
  },
  {
    label: 'yellow',
    keyColor: 2,
    keyColorValue: '#FFBF00',
    values: ['#FFE380', '#FFD040', '#FFBF00'],
  },
  {
    label: 'gray',
    keyColor: 2,
    keyColorValue: '#71717A',
    values: ['#A1A1AA', '#71717A', '#52525B'],
  },
];

// Multi-color palettes for categorical data
export const multiColorPalettes: ColorPalette[] = [
  {
    label: 'Timeplus',
    keyColor: 0,
    keyColorValue: '#FF73B6',
    values: [
      '#FF73B6', // pink
      '#8890FF', // indigo
      '#27CCA8', // green
      '#FF465F', // red
      '#0BC5EA', // teal
      '#B275FF', // purple
      '#FF7C27', // orange
      '#FFBF00', // yellow
    ],
  },
  {
    label: 'Dawn',
    keyColor: 0,
    keyColorValue: '#EC4899',
    values: [
      '#EC4899', // pink-400
      '#FACC15', // yellow-400
      '#DA4B36',
      '#9A1563',
      '#F87171', // red-400
      '#EF4444', // red-500
      '#A855F7', // purple-500
      '#DB2777', // pink-500
      '#F7775A',
      '#8B5CF6', // purple-500
    ],
  },
  {
    label: 'Morning',
    keyColor: 0,
    keyColorValue: '#3B82F6',
    values: [
      '#3B82F6', // blue-500
      '#FB923C', // orange-400
      '#F87171', // red-400
      '#22D3EE', // cyan-400
      '#C084FC', // purple-400
      '#FACC15', // yellow-400
      '#F472B6', // pink-400
      '#4ADE80', // green-400
      '#EC4899', // pink-500
      '#4E5ADF',
    ],
  },
  {
    label: 'Midnight',
    keyColor: 0,
    keyColorValue: '#4E5ADF',
    values: [
      '#4E5ADF',
      '#A855F7', // purple-500
      '#3B82F6', // blue-500
      '#084B8A',
      '#22C55E', // green-500
      '#C084FC', // purple-400
      '#244E47',
      '#0891B2', // cyan-600
      '#6626A3',
      '#2563EB', // blue-600
    ],
  },
  {
    label: 'Ocean',
    keyColor: 0,
    keyColorValue: '#0EA5E9',
    values: [
      '#0EA5E9', // sky-500
      '#06B6D4', // cyan-500
      '#14B8A6', // teal-500
      '#22C55E', // green-500
      '#3B82F6', // blue-500
      '#6366F1', // indigo-500
      '#8B5CF6', // violet-500
      '#0284C7', // sky-600
      '#0891B2', // cyan-600
      '#0D9488', // teal-600
    ],
  },
  {
    label: 'Sunset',
    keyColor: 0,
    keyColorValue: '#F97316',
    values: [
      '#F97316', // orange-500
      '#EF4444', // red-500
      '#EC4899', // pink-500
      '#F59E0B', // amber-500
      '#FACC15', // yellow-500
      '#FB923C', // orange-400
      '#F87171', // red-400
      '#F472B6', // pink-400
      '#FBBF24', // amber-400
      '#FDE047', // yellow-400
    ],
  },
];

// All palettes combined
export const allPalettes: ColorPalette[] = [...multiColorPalettes, ...singleColorPalettes];

// Default palette
export const DEFAULT_PALETTE = multiColorPalettes[0];

/**
 * Find a color palette by its values array
 */
export function findPaletteByValues(values: string[], defaultPalette = DEFAULT_PALETTE): ColorPalette {
  return (
    allPalettes.find((palette) => palette.values.join(',') === values.join(',')) || defaultPalette
  );
}

/**
 * Find a color palette by label
 */
export function findPaletteByLabel(label: string, defaultPalette = DEFAULT_PALETTE): ColorPalette {
  return allPalettes.find((palette) => palette.label === label) || defaultPalette;
}

/**
 * Get the key color from a palette with optional opacity
 */
export function getPaletteKeyColor(label: string, opacity = 1): string {
  const palette = findPaletteByLabel(label);
  if (!palette) return '';

  if (opacity === 1) return palette.keyColorValue;

  const hex = palette.keyColorValue;
  const alpha = Math.floor(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alpha}`;
}

/**
 * Generate colors for a given number of series from a palette
 */
export function getSeriesColors(palette: ColorPalette, count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(palette.values[i % palette.values.length]);
  }
  return colors;
}

// Chart Theme Configuration
/** @deprecated Use VistralTheme and registerTheme from the main package instead. */
export interface ChartTheme {
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  axisColor: string;
  tooltipBackground: string;
  tooltipTextColor: string;
  fontFamily: string;
}

/** @deprecated Use VistralTheme and registerTheme from the main package instead. */
export const darkTheme: ChartTheme = {
  backgroundColor: 'transparent',
  textColor: '#E5E5E5',
  gridColor: '#374151',
  axisColor: '#6B7280',
  tooltipBackground: '#1F2937',
  tooltipTextColor: '#E5E5E5',
  fontFamily: 'Inter, system-ui, sans-serif',
};

/** @deprecated Use VistralTheme and registerTheme from the main package instead. */
export const lightTheme: ChartTheme = {
  backgroundColor: 'transparent',
  textColor: '#1F2937',
  gridColor: '#E5E7EB',
  axisColor: '#9CA3AF',
  tooltipBackground: '#FFFFFF',
  tooltipTextColor: '#1F2937',
  fontFamily: 'Inter, system-ui, sans-serif',
};

/** @deprecated Use VistralTheme and registerTheme from the main package instead. */
export type ThemeName = 'dark' | 'light';

/** @deprecated Use VistralTheme and registerTheme from the main package instead. */
export function getTheme(name: ThemeName): ChartTheme {
  return name === 'dark' ? darkTheme : lightTheme;
}
