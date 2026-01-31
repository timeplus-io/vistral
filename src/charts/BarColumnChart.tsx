/**
 * Bar and Column Chart Component
 * Supports both horizontal (bar) and vertical (column) orientations
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { BarColumnConfig, StreamDataSource } from '../types';
import { findPaletteByValues, DEFAULT_PALETTE } from '../themes';
import { useChart, useDataSource } from '../hooks';
import {
  AXIS_HEIGHT_WITH_TITLE,
  AXIS_HEIGHT_WITHOUT_TITLE,
  horizontalAxisLabelConfig,
  verticalAxisLabelConfig,
  applyColorEncoding,
  applyLegend,
  applyDataLabel,
  truncateLabel,
  renderChart,
  MAX_LEGEND_ITEMS,
} from '../core/chart-utils';

export interface BarColumnChartProps {
  /** Chart configuration */
  config: BarColumnConfig;
  /** Data source */
  data: StreamDataSource;
  /** Theme */
  theme?: 'dark' | 'light';
  /** Container className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
}

/**
 * Get default configuration for bar/column chart
 */
export function getBarColumnDefaults(
  columns: { name: string; type: string }[]
): Partial<BarColumnConfig> | null {
  const stringCol = columns.find(({ type }) =>
    ['string', 'varchar', 'text', 'char'].some((t) =>
      type.toLowerCase().includes(t)
    )
  );
  const numericCol = columns.find(({ type }) =>
    ['int', 'float', 'double', 'decimal', 'number'].some((t) =>
      type.toLowerCase().includes(t)
    )
  );

  if (!stringCol || !numericCol) return null;

  return {
    xAxis: stringCol.name,
    yAxis: numericCol.name,
    xTitle: '',
    yTitle: '',
    legend: false,
    dataLabel: false,
    colors: DEFAULT_PALETTE.values,
    gridlines: false,
    unit: { position: 'left', value: '' },
    fractionDigits: 2,
    color: '',
    groupType: 'stack',
    xTickLabel: { maxChar: 10 },
    yTickLabel: { maxChar: 25 },
  };
}

/**
 * Bar/Column Chart Component
 */
export const BarColumnChart: React.FC<BarColumnChartProps> = ({
  config: configRaw,
  data: dataSource,
  theme = 'dark',
  className,
  style,
}) => {
  // Merge with defaults
  const defaults = getBarColumnDefaults(dataSource.columns);
  const config = useMemo(
    () => ({
      ...defaults,
      ...configRaw,
    } as BarColumnConfig),
    [configRaw, defaults]
  );

  // Determine if this is a bar chart (horizontal) or column chart (vertical)
  const isBarChart = config.chartType === 'bar';

  // Get color palette
  const colorPalette = useMemo(
    () => findPaletteByValues(config.colors || [], DEFAULT_PALETTE),
    [config.colors]
  );

  // Process data source
  const source = useDataSource(dataSource, config.xAxis, config.yAxis, config.color);

  // Initialize chart
  const { chart, chartRef, isMouseOver, activeColor, setActiveColor } = useChart();

  // Track render errors
  const [hasError, setHasError] = useState(false);

  // Update chart options
  const updateOptions = useCallback(() => {
    if (!chart || !source || source.x.index < 0 || source.y.index < 0) return;

    chart.clear();

    // Apply coordinate transform for bar chart (horizontal)
    if (isBarChart) {
      chart.coordinate({ transform: [{ type: 'transpose' }] });
    }

    // Configure axes
    const verticalConfig = { ...verticalAxisLabelConfig };
    const horizontalConfig = {
      size: config.xTitle ? AXIS_HEIGHT_WITH_TITLE : AXIS_HEIGHT_WITHOUT_TITLE,
      ...horizontalAxisLabelConfig,
    };

    // Y scale options
    const yMin = source.y.min ?? 0;
    const yMax = source.y.max ?? 100;
    const yScaleOption = {
      type: 'linear' as const,
      nice: true,
      domain: [Math.min(yMin, 0), yMax],
    };

    chart.axis({
      x: {
        title: config.xTitle || false,
        ...(isBarChart ? verticalConfig : horizontalConfig),
        labelFormatter: (v: string = '') =>
          truncateLabel(v, config.xTickLabel?.maxChar ?? 10),
      },
      y: {
        title: config.yTitle || false,
        labelFormatter: (v: number | string = '') => {
          const unit = config.unit;
          if (unit?.position === 'right') {
            return `${v}${unit?.value ?? ''}`;
          }
          return truncateLabel(`${unit?.value ?? ''}${v}`, config.yTickLabel?.maxChar ?? 25);
        },
        grid: config.gridlines ? true : false,
        ...(isBarChart ? horizontalConfig : verticalConfig),
      },
    });

    // Create interval (bar) mark
    let intervalMark = chart
      .interval()
      .tooltip(
        isMouseOver
          ? {
              items: [
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (_d: any, i?: number, data?: any, column?: any) => ({
                  name: column?.color ? String(column.color.value[i ?? 0]) : '',
                  value: Number.parseFloat(String(data?.[i ?? 0]?.[source.y.index] || 0)).toFixed(
                    config.fractionDigits || 0
                  ),
                }),
              ],
            }
          : false
      )
      .animate(false)
      .encode('x', (d: unknown[]) => source.xTransform(d[source.x.index]))
      .encode('y', (d: unknown[]) => Number(d[source.y.index]))
      .scale('x', { padding: 0.5 })
      .scale('y', yScaleOption);

    // Apply color encoding
    intervalMark = applyColorEncoding(intervalMark, {
      domain: source.z.values,
      zIndex: source.z.index,
      colors: colorPalette,
      activeIndex: activeColor,
    });

    // Apply data labels
    intervalMark = applyDataLabel(intervalMark, {
      enabled: !!config.dataLabel,
      yIndex: source.y.index,
      unit: config.unit,
      fractionDigits: config.fractionDigits,
      textAlign: isBarChart ? 'start' : 'center',
      textBaseline: isBarChart ? 'middle' : 'alphabetic',
    });

    // Apply legend
    applyLegend(
      intervalMark,
      !!config.legend && source.z.values.length <= MAX_LEGEND_ITEMS,
      (index) => setActiveColor((prev) => (prev === index ? -1 : index)),
      source.z.values
    );
  }, [
    chart,
    source,
    config,
    colorPalette,
    isBarChart,
    isMouseOver,
    activeColor,
    setActiveColor,
  ]);

  // Update chart when data or options change
  useEffect(() => {
    if (!chart || !source) return;

    updateOptions();

    // Set data with transformations
    chart
      .data({
        type: 'inline',
        value: source.data,
        transform: source.x.isTime
          ? [{ type: 'sortBy', fields: [source.x.index] }]
          : [],
      })
      .transform({
        type: config.groupType === 'stack' ? 'stackY' : 'dodgeX',
        orderBy: source.z.index >= 0 ? 'series' : null,
      });

    renderChart(chart)
      .then(() => setHasError(false))
      .catch(() => setHasError(true));
  }, [chart, source, updateOptions, config.groupType]);

  // Warning for too many series
  const hasWarning = source && source.z.values.length > MAX_LEGEND_ITEMS;

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      data-testid={`${config.chartType}-chart`}
    >
      <div
        ref={chartRef}
        style={{ flex: 1, width: '100%', minHeight: 0 }}
        data-error={hasError ? 'true' : 'false'}
      />
      {hasWarning && (
        <div
          style={{
            fontSize: '12px',
            color: theme === 'dark' ? '#FCD34D' : '#D97706',
            textAlign: 'right',
            padding: '4px 8px',
          }}
        >
          Warning: Too many series ({source?.z.values.length}), some may not display
        </div>
      )}
    </div>
  );
};

export default BarColumnChart;
