/**
 * Core chart utilities and base functionality
 */

import { Chart, MarkNode } from '@antv/g2';
import type { ColorPalette, ProcessedDataSource } from '../types';
import { DEFAULT_PALETTE } from '../themes';

// Chart axis configuration constants
export const AXIS_HEIGHT_WITH_TITLE = 70;
export const AXIS_HEIGHT_WITHOUT_TITLE = 40;
export const MAX_LEGEND_ITEMS = 30;

/**
 * Horizontal axis label transformation configuration
 */
export const horizontalAxisLabelConfig = {
  labelAutoHide: {
    type: 'hide',
    keepHeader: true,
    keepTail: true,
  },
  labelAutoRotate: false,
  labelAutoEllipsis: {
    type: 'ellipsis',
    minLength: 100,
    maxLength: 150,
  },
};

/**
 * Vertical axis label transformation configuration
 */
export const verticalAxisLabelConfig = {
  transform: [
    {
      margin: [1, 1, 1, 1],
      type: 'hide',
    },
  ],
};

/**
 * Apply color encoding to a chart mark
 */
export function applyColorEncoding(
  node: MarkNode,
  config: {
    zIndex: number;
    colors: ColorPalette;
    domain?: string[];
    activeIndex?: number;
  }
): MarkNode {
  const { values, keyColor } = config.colors;
  const domain = config.domain ?? [];

  // Generate colors for each domain value
  const colorRange = domain.map((_, index) => {
    const color = values[index % values.length];
    // Apply transparency if there's an active selection and this isn't it
    if (config.activeIndex !== undefined && config.activeIndex >= 0) {
      return index === config.activeIndex ? color : `${color}30`;
    }
    return color;
  });

  if (config.zIndex >= 0) {
    return node.encode('color', `${config.zIndex}`).scale('color', {
      type: 'ordinal',
      domain,
      range: colorRange,
    });
  }

  // Single color mode based on mark type
  switch (node.type) {
    case 'area':
      return node.style('stroke', values[keyColor]).style('fill', values[keyColor]);
    case 'line':
      return node.style('stroke', values[keyColor]);
    case 'interval':
      return node.style('fill', values[keyColor]);
    case 'point':
      return node.style('stroke', values[keyColor]);
    default:
      return node;
  }
}

/**
 * Apply legend configuration to a chart mark
 */
export function applyLegend(
  node: MarkNode,
  enabled: boolean,
  onItemClick?: (index: number) => void,
  values?: string[]
): MarkNode {
  if (!enabled || !values || values.length > MAX_LEGEND_ITEMS) {
    return node.legend(false);
  }

  return node.legend('color', {
    position: 'bottom',
    layout: {
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    click: onItemClick
      ? (e: { __data__?: { index?: number } }) => {
          const index = e?.__data__?.index;
          if (index !== undefined) {
            onItemClick(index);
          }
        }
      : undefined,
  });
}

/**
 * Apply data label configuration to a chart mark
 */
export function applyDataLabel(
  node: MarkNode,
  config: {
    enabled: boolean;
    yIndex: number;
    unit?: { position: 'left' | 'right'; value: string };
    fractionDigits?: number;
    showAll?: boolean;
    textAlign?: 'start' | 'center' | 'end';
    textBaseline?: 'top' | 'middle' | 'bottom' | 'alphabetic';
  }
): MarkNode {
  if (!config.enabled) return node;

  const { unit, yIndex, fractionDigits = 0, showAll = false, textAlign = 'center', textBaseline = 'alphabetic' } = config;

  return node.label({
    textAlign,
    textBaseline,
    text: (d: unknown[]) => {
      const v = Number.parseFloat(String(d?.[yIndex] ?? 0)).toFixed(fractionDigits);
      if (unit?.position === 'right') {
        return `${v}${unit.value}`;
      }
      return `${unit?.value ?? ''}${v}`;
    },
    transform: [{ type: 'overlapHide' }],
    ...(showAll ? {} : { selector: 'last' }),
  });
}

/**
 * Truncate label with ellipsis
 */
export function truncateLabel(value: string, maxChar: number | null): string {
  if (maxChar === null || !value) return value;
  const result = value.slice(0, maxChar);
  return result === value ? result : `${result}...`;
}

/**
 * Render chart with standard interactions
 */
export async function renderChart(chart: Chart): Promise<void> {
  chart.interaction('tooltip', {
    mount: document.body,
    css: {
      '.g2-tooltip': {
        'z-index': '10000',
        'background-color': 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        'border-radius': '4px',
        padding: '8px 12px',
        'font-size': '12px',
      },
    },
  });
  chart.interaction('legendFilter', false);
  await chart.render();
}

/**
 * Configure tooltip for a chart mark
 */
export function applyTooltip(
  node: MarkNode,
  enabled: boolean,
  config: {
    xIndex: number;
    yIndex: number;
    zIndex?: number;
    zValues?: string[];
    colors: ColorPalette;
    fractionDigits?: number;
    yLabel?: string;
  }
): MarkNode {
  if (!enabled) {
    return node.tooltip(false);
  }

  const { xIndex, yIndex, zIndex = -1, zValues = [], colors, fractionDigits = 0, yLabel = '' } = config;

  return node.tooltip({
    title: (d: unknown[]) => String(d[xIndex] ?? ''),
    items: [
      (d: unknown[]) => {
        const colorValueIndex = zValues.indexOf(String(d[zIndex] ?? ''));
        const color = colors.values[colorValueIndex % colors.values.length] ?? colors.values[0];

        return {
          name: zIndex >= 0 ? String(d[zIndex]) : yLabel,
          value: Number.parseFloat(String(d[yIndex] ?? 0)).toFixed(fractionDigits),
          color,
        };
      },
    ],
  });
}

/**
 * Create default chart configuration based on data source
 */
export function createDefaultConfig(
  source: ProcessedDataSource,
  chartType: string
): Record<string, unknown> {
  const { header, x, y, z } = source;

  const baseConfig = {
    chartType,
    xAxis: x.index >= 0 ? header[x.index].name : '',
    yAxis: y.index >= 0 ? header[y.index].name : '',
    color: z.index >= 0 ? header[z.index].name : '',
    colors: DEFAULT_PALETTE.values,
  };

  switch (chartType) {
    case 'line':
    case 'area':
      return {
        ...baseConfig,
        xTitle: '',
        yTitle: '',
        legend: z.values.length > 0,
        dataLabel: false,
        gridlines: false,
        points: false,
        lineStyle: 'curve',
        fractionDigits: 2,
        xRange: 'Infinity',
        yRange: { min: null, max: null },
      };
    case 'bar':
    case 'column':
      return {
        ...baseConfig,
        xTitle: '',
        yTitle: '',
        legend: z.values.length > 0,
        dataLabel: false,
        gridlines: false,
        fractionDigits: 2,
        groupType: 'stack',
      };
    case 'singleValue':
      return {
        chartType,
        yAxis: y.index >= 0 ? header[y.index].name : '',
        fontSize: 64,
        color: 'blue',
        fractionDigits: 2,
        sparkline: false,
        delta: false,
      };
    default:
      return baseConfig;
  }
}

/**
 * Apply chart theme
 */
export function applyChartTheme(
  chart: Chart,
  theme: 'dark' | 'light' = 'dark'
): void {
  const themeConfig =
    theme === 'dark'
      ? {
          view: { viewFill: 'transparent' },
          label: { fill: '#E5E5E5' },
          axis: {
            x: { line: { stroke: '#374151' }, tick: { stroke: '#374151' } },
            y: { line: { stroke: '#374151' }, tick: { stroke: '#374151' } },
          },
        }
      : {
          view: { viewFill: 'transparent' },
          label: { fill: '#1F2937' },
          axis: {
            x: { line: { stroke: '#E5E7EB' }, tick: { stroke: '#E5E7EB' } },
            y: { line: { stroke: '#E5E7EB' }, tick: { stroke: '#E5E7EB' } },
          },
        };

  chart.theme(themeConfig);
}
