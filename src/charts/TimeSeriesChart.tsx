/**
 * Time Series Chart Component
 * Supports line and area charts for time-based streaming data
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import type { TimeSeriesConfig, StreamDataSource } from '../types';
import { findPaletteByValues, DEFAULT_PALETTE } from '../themes';
import { useChart, useDataSource } from '../hooks';
import {
  AXIS_HEIGHT_WITH_TITLE,
  AXIS_HEIGHT_WITHOUT_TITLE,
  horizontalAxisLabelConfig,
  applyColorEncoding,
  applyLegend,
  applyDataLabel,
  applyTooltip,
  truncateLabel,
  renderChart,
  MAX_LEGEND_ITEMS,
} from '../core/chart-utils';
import { getTimeMask } from '../utils';

export interface TimeSeriesChartProps {
  /** Chart configuration */
  config: TimeSeriesConfig;
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
 * Get default configuration for time series chart
 */
export function getTimeSeriesDefaults(
  columns: { name: string; type: string }[]
): Partial<TimeSeriesConfig> | null {
  const dateCol = columns.find(({ type }) =>
    ['datetime', 'datetime64', 'date', 'timestamp'].some((t) =>
      type.toLowerCase().includes(t)
    )
  );
  const numericCol = columns.find(({ type }) =>
    ['int', 'float', 'double', 'decimal', 'number'].some((t) =>
      type.toLowerCase().includes(t)
    )
  );

  if (!dateCol || !numericCol) return null;

  return {
    xAxis: dateCol.name,
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
    showAll: false,
    lineStyle: 'curve',
    points: false,
    xRange: 'Infinity',
    yRange: { min: null, max: null },
    yTickLabel: { maxChar: 25 },
    xFormat: '',
  };
}

/**
 * Time Series Chart Component (Line/Area)
 */
export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  config: configRaw,
  data: dataSource,
  theme = 'dark',
  className,
  style,
}) => {
  // Merge with defaults
  const defaults = getTimeSeriesDefaults(dataSource.columns);
  const config = useMemo(
    () => ({
      ...defaults,
      ...configRaw,
    } as TimeSeriesConfig),
    [configRaw, defaults]
  );

  // Get color palette
  const colorPalette = useMemo(
    () => findPaletteByValues(config.colors || [], DEFAULT_PALETTE),
    [config.colors]
  );

  // Process data source
  const source = useDataSource(dataSource, config.xAxis, config.yAxis, config.color);

  // Initialize chart
  const { chart, chartRef, isMouseOver, activeColor, setActiveColor } = useChart();

  // Calculate time domain
  const domain = useMemo(() => {
    if (!source) return { min: 0, max: 0 };

    const xMin = source.x.min ?? 0;
    const xMax = source.x.max ?? 0;
    const xRange = config.xRange;

    if (xRange === 'Infinity' || xRange === undefined) {
      return { min: xMin, max: xMax };
    }

    const rangeMs = Number(xRange) * 60 * 1000;
    return {
      min: Math.max(xMin, xMax - rangeMs),
      max: Math.max(xMin + rangeMs, xMax),
    };
  }, [source, config.xRange]);

  // Update chart options
  const updateOptions = useCallback(() => {
    if (!chart || !source || source.x.index < 0 || source.y.index < 0) return;

    chart.clear();

    // Configure axes
    chart.axis({
      x: {
        size: config.xTitle ? AXIS_HEIGHT_WITH_TITLE : AXIS_HEIGHT_WITHOUT_TITLE,
        title: config.xTitle || false,
        grid: false,
        ...horizontalAxisLabelConfig,
      },
    });

    chart
      .axisY()
      .attr('grid', config.gridlines ? true : false)
      .attr('labelFormatter', (v: number | string = '') => {
        const unit = config.unit;
        if (unit?.position === 'right') {
          return `${v}${unit?.value ?? ''}`;
        }
        return truncateLabel(`${unit?.value ?? ''}${v}`, config.yTickLabel?.maxChar ?? 25);
      })
      .attr('title', config.yTitle || false);

    // Y scale options
    const yMin = config.yRange?.min ?? source.y.min ?? 0;
    const yMax = config.yRange?.max ?? source.y.max ?? 100;
    const yScaleOption = {
      type: 'linear' as const,
      domain: config.chartType === 'area' ? undefined : [yMin, yMax],
      clamp: true,
      nice: true,
    };

    // Create points if enabled
    if (config.points) {
      const pointMark = chart
        .point()
        .tooltip(false)
        .animate(false)
        .encode('x', (d: unknown[]) => source.xTransform(d[source.x.index]))
        .encode('y', `${source.y.index}`);

      applyColorEncoding(pointMark, {
        domain: source.z.values,
        zIndex: source.z.index,
        colors: colorPalette,
        activeIndex: activeColor,
      });
    }

    // Create main mark (line or area)
    let mainMark =
      config.chartType === 'area'
        ? chart.area()
        : chart.line().style('shape', config.lineStyle === 'curve' ? 'smooth' : 'line');

    mainMark = mainMark
      .style('connect', true)
      .animate(false)
      .encode('x', (d: unknown[]) => source.xTransform(d[source.x.index]))
      .encode('y', (d: unknown[]) => Number(d[source.y.index]))
      .scale('x', {
        type: 'time',
        domainMin: domain.min,
        domainMax: domain.max,
        mask: config.xFormat || getTimeMask(domain.min, domain.max),
        tickMethod: () => {
          const interval = 20;
          const step = (domain.max - domain.min) / interval;
          return [...Array(interval).keys()].map((i) => new Date(domain.min + step * i)).concat(new Date(domain.max));
        },
      })
      .scale('y', yScaleOption);

    // Apply color encoding
    mainMark = applyColorEncoding(mainMark, {
      domain: source.z.values,
      zIndex: source.z.index,
      colors: colorPalette,
      activeIndex: activeColor,
    });

    // Apply data labels
    mainMark = applyDataLabel(mainMark, {
      enabled: !!config.dataLabel,
      yIndex: source.y.index,
      unit: config.unit,
      fractionDigits: config.fractionDigits,
      showAll: config.showAll,
    });

    // Apply tooltip
    mainMark = applyTooltip(mainMark, isMouseOver, {
      xIndex: source.x.index,
      yIndex: source.y.index,
      zIndex: source.z.index,
      zValues: source.z.values,
      colors: colorPalette,
      fractionDigits: config.fractionDigits,
      yLabel: config.yAxis,
    });

    // Apply legend
    applyLegend(
      mainMark,
      !!config.legend && source.z.values.length <= MAX_LEGEND_ITEMS,
      (index) => setActiveColor((prev) => (prev === index ? -1 : index)),
      source.z.values
    );
  }, [
    chart,
    source,
    config,
    colorPalette,
    domain,
    isMouseOver,
    activeColor,
    setActiveColor,
  ]);

  // Update chart when data or options change
  useEffect(() => {
    if (!chart || !source) return;

    updateOptions();

    // Set data with transformations
    const chartData = chart.data({
      type: 'inline',
      value: source.data,
      transform: [
        {
          type: 'filter',
          callback: (v: unknown[]) => {
            const x = Number(source.xTransform(v[source.x.index]));
            return x >= domain.min && x <= domain.max;
          },
        },
        {
          type: 'sortBy',
          fields: [source.x.index],
        },
      ],
    });

    // Apply stack transform for area charts
    if (config.chartType === 'area') {
      chartData.transform([
        { type: 'stackY', orderBy: source.z.index >= 0 ? 'series' : null },
      ]);
    }

    renderChart(chart);
  }, [chart, source, updateOptions, domain, config.chartType]);

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
      data-testid="time-series-chart"
    >
      <div ref={chartRef} style={{ flex: 1, width: '100%', minHeight: 0 }} />
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

export default TimeSeriesChart;
