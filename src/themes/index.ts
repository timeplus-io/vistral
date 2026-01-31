/**
 * Color palettes for stream visualization
 */

import type { ColorPalette } from '../types';

// Single color palettes (monochromatic)
export const singleColorPalettes: ColorPalette[] = [
  {
    label: 'red',
    keyColor: 5,
    keyColorValue: '#FF3B65',
    values: [
      '#FFD2D9',
      '#FFB0BF',
      '#FF90A2',
      '#FF6780',
      '#FF3B65',
      '#D12D50',
      '#A31E3B',
      '#751025',
      '#470110',
      '#35010E',
    ],
  },
  {
    label: 'pink',
    keyColor: 5,
    keyColorValue: '#D53C97',
    values: [
      '#F5D2E3',
      '#EDB0CF',
      '#E590BD',
      '#D967A4',
      '#D53C97',
      '#B52D7F',
      '#961F68',
      '#761050',
      '#560238',
      '#330124',
    ],
  },
  {
    label: 'purple',
    keyColor: 5,
    keyColorValue: '#AC1BB5',
    values: [
      '#EACAEA',
      '#DAA6DA',
      '#CB81CC',
      '#B553BA',
      '#AC1BB5',
      '#911698',
      '#75127C',
      '#5A0E5F',
      '#3E0942',
      '#250528',
    ],
  },
  {
    label: 'blue',
    keyColor: 5,
    keyColorValue: '#664CFC',
    values: [
      '#D9D3FC',
      '#BEB4F9',
      '#A395F8',
      '#806DF4',
      '#664CFC',
      '#523DCE',
      '#3F2F9F',
      '#2B2171',
      '#171242',
      '#0E0E35',
    ],
  },
  {
    label: 'green',
    keyColor: 5,
    keyColorValue: '#52FFDB',
    values: [
      '#D5FFF6',
      '#B8FFF0',
      '#99FEE9',
      '#73FEE0',
      '#52FFDB',
      '#43D2B4',
      '#34A68D',
      '#23AD8F',
      '#1F8D77',
      '#113027',
    ],
  },
  {
    label: 'orange',
    keyColor: 2,
    keyColorValue: '#F97316',
    values: ['#FDBA74', '#FB923C', '#F97316'],
  },
  {
    label: 'yellow',
    keyColor: 2,
    keyColorValue: '#EAB308',
    values: ['#FDE047', '#FACC15', '#EAB308'],
  },
  {
    label: 'cyan',
    keyColor: 2,
    keyColorValue: '#06B6D4',
    values: ['#67E8F9', '#22D3EE', '#06B6D4'],
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
export interface ChartTheme {
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  axisColor: string;
  tooltipBackground: string;
  tooltipTextColor: string;
  fontFamily: string;
}

export const darkTheme: ChartTheme = {
  backgroundColor: 'transparent',
  textColor: '#E5E5E5',
  gridColor: '#374151',
  axisColor: '#6B7280',
  tooltipBackground: '#1F2937',
  tooltipTextColor: '#E5E5E5',
  fontFamily: 'Inter, system-ui, sans-serif',
};

export const lightTheme: ChartTheme = {
  backgroundColor: 'transparent',
  textColor: '#1F2937',
  gridColor: '#E5E7EB',
  axisColor: '#9CA3AF',
  tooltipBackground: '#FFFFFF',
  tooltipTextColor: '#1F2937',
  fontFamily: 'Inter, system-ui, sans-serif',
};

export type ThemeName = 'dark' | 'light';

export function getTheme(name: ThemeName): ChartTheme {
  return name === 'dark' ? darkTheme : lightTheme;
}
