/**
 * Config Compilers — bridge between legacy chart configs and VistralSpec.
 *
 * These functions convert the existing high-level chart configuration
 * objects (TimeSeriesConfig, BarColumnConfig) into the declarative
 * VistralSpec grammar.
 */

import type { TimeSeriesConfig, BarColumnConfig } from '../types';
import {
  DEFAULT_MAX_ITEMS,
} from '../types/spec';
import type {
  VistralSpec,
  MarkSpec,
  TransformSpec,
  TemporalSpec,
  LabelSpec,
} from '../types/spec';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map the legacy TemporalConfig to a TemporalSpec.
 * Falls back to the given `defaultField` when the config's field is empty.
 */
function mapTemporal(
  temporal: TimeSeriesConfig['temporal'] | BarColumnConfig['temporal'],
  defaultField: string | string[]
): TemporalSpec | undefined {
  if (!temporal) return undefined;
  return {
    mode: temporal.mode,
    field: temporal.field || defaultField,
    range: temporal.range,
  };
}

// ---------------------------------------------------------------------------
// compileTimeSeriesConfig
// ---------------------------------------------------------------------------

/**
 * Compile a `TimeSeriesConfig` into a `VistralSpec`.
 *
 * Mapping summary:
 * - `chartType` -> mark type ('line' | 'area')
 * - `xAxis` / `yAxis` / `color` -> encode channels
 * - `lineStyle: 'curve'` -> style.shape: 'smooth', else 'line'
 * - Always adds style.connect: true
 * - `points: true` -> adds second point mark (tooltip: false)
 * - `dataLabel: true` -> adds label; if showAll is false, selector: 'last'
 * - area + color -> transforms: [{ type: 'stackY' }]
 * - scales.x: time scale with optional mask from xFormat
 * - scales.y: linear, nice, optional domain from yRange
 * - temporal -> maps to TemporalSpec
 * - streaming: { maxItems: config.maxItems ?? DEFAULT_MAX_ITEMS }
 * - axes, legend, theme, animate configured per defaults
 */
export function compileTimeSeriesConfig(
  config: TimeSeriesConfig,
  theme: 'dark' | 'light' = 'dark'
): VistralSpec {
  const { chartType, xAxis, yAxis, color } = config;

  // -- Primary mark ----------------------------------------------------------
  const mark: MarkSpec = {
    type: chartType, // 'line' | 'area'
    encode: {
      x: xAxis,
      y: yAxis,
      ...(color ? { color } : {}),
    },
    style: {
      connect: true,
      ...(config.chartType === 'line'
        ? { shape: config.lineStyle === 'curve' ? 'smooth' : 'line' }
        : {}),
      ...(config.chartType === 'area' && config.lineStyle === 'curve'
        ? { shape: 'smooth' }
        : {}),
    },
  };

  // Labels
  if (config.dataLabel) {
    const label: LabelSpec = {
      text: yAxis,
      overlapHide: true,
    };
    if (config.showAll === false) {
      label.selector = 'last';
    }
    mark.labels = [label];
  }

  // -- Marks array -----------------------------------------------------------
  const marks: MarkSpec[] = [mark];

  if (config.points) {
    marks.push({
      type: 'point',
      encode: {
        x: xAxis,
        y: yAxis,
        ...(color ? { color } : {}),
      },
      tooltip: false,
    });
  }

  // -- Transforms ------------------------------------------------------------
  const transforms: TransformSpec[] = [];
  if (chartType === 'area' && color) {
    transforms.push({ type: 'stackY' });
  }

  // -- Scales ----------------------------------------------------------------
  const xScale: Record<string, unknown> = { type: 'time' };
  if (config.xFormat) {
    xScale.mask = config.xFormat;
  }

  const yScale: Record<string, unknown> = { type: 'linear', nice: true };
  if (
    config.yRange &&
    config.yRange.min != null &&
    config.yRange.max != null
  ) {
    yScale.domain = [config.yRange.min, config.yRange.max];
  }

  // -- Temporal --------------------------------------------------------------
  const temporal = mapTemporal(config.temporal, xAxis);

  // -- Axes ------------------------------------------------------------------
  const gridY = config.gridlines ?? true;

  // -- Legend ----------------------------------------------------------------
  const legend =
    config.legend === false
      ? (false as const)
      : { position: 'bottom' as const, interactive: true };

  // -- Assemble spec ---------------------------------------------------------
  const spec: VistralSpec = {
    marks,
    scales: {
      x: xScale,
      y: yScale,
    },
    ...(transforms.length > 0 ? { transforms } : {}),
    ...(temporal ? { temporal } : {}),
    streaming: { maxItems: config.maxItems ?? DEFAULT_MAX_ITEMS },
    axes: {
      x: { title: config.xTitle || false, grid: false },
      y: { title: config.yTitle || false, grid: gridY },
    },
    legend,
    theme: theme,
    animate: false,
  };

  return spec;
}

// ---------------------------------------------------------------------------
// compileBarColumnConfig
// ---------------------------------------------------------------------------

/**
 * Compile a `BarColumnConfig` into a `VistralSpec`.
 *
 * Mapping summary:
 * - mark type is always 'interval'
 * - `chartType 'bar'` -> coordinate: { transforms: [{ type: 'transpose' }] }
 * - `color` set -> transforms: stackY (if groupType==='stack') or dodgeX
 * - `dataLabel: true` -> label with text: yAxis, overlapHide: true
 * - scales: x with padding 0.5, y linear with nice
 * - Same streaming/axes/legend/theme/animate defaults as time series
 */
export function compileBarColumnConfig(
  config: BarColumnConfig,
  theme: 'dark' | 'light' = 'dark'
): VistralSpec {
  const { xAxis, yAxis, color, chartType } = config;
  const isBar = chartType === 'bar';

  // Standard Mapping:
  // xAxis -> Independent Variable (Category) -> x channel (Band scale)
  // yAxis -> Dependent Variable (Value)    -> y channel (Linear scale)
  //
  // For Bar Charts, we apply 'transpose' to flip the visual axes.

  // -- Primary mark ----------------------------------------------------------
  const mark: MarkSpec = {
    type: 'interval',
    encode: {
      x: xAxis,
      y: yAxis,
      ...(color ? { color } : {}),
    },
  };

  // Labels: Always display the VALUE (yAxis)
  if (config.dataLabel) {
    mark.labels = [
      {
        text: yAxis,
        overlapHide: true,
      },
    ];
  }

  // -- Transforms ------------------------------------------------------------
  const transforms: TransformSpec[] = [];
  if (color) {
    transforms.push({
      type: config.groupType === 'stack' ? 'stackY' : 'dodgeX',
    });
  }

  // -- Coordinate ------------------------------------------------------------
  const coordinate = isBar
    ? { transforms: [{ type: 'transpose' }] }
    : undefined;

  // -- Scales ----------------------------------------------------------------
  // G2 Interval Mark expects 'x' to be the discrete (band) axis.
  // We use Transpose for Bar Charts to flip it to the vertical axis.
  const scales = {
    x: { type: 'band' as const, padding: 0.5 },
    y: { type: 'linear' as const, nice: true },
  };

  // -- Temporal --------------------------------------------------------------
  // Default temporal field is the Category field (xAxis)
  const temporal = mapTemporal(config.temporal, xAxis);

  // -- Axes ------------------------------------------------------------------
  const gridY = config.gridlines ?? true;

  // -- Legend ----------------------------------------------------------------
  const legend =
    config.legend === false
      ? (false as const)
      : { position: 'bottom' as const, interactive: true };

  // -- Assemble spec ---------------------------------------------------------
  const spec: VistralSpec = {
    marks: [mark],
    scales,
    ...(transforms.length > 0 ? { transforms } : {}),
    ...(coordinate ? { coordinate } : {}),
    ...(temporal ? { temporal } : {}),
    streaming: { maxItems: config.maxItems ?? DEFAULT_MAX_ITEMS },
    axes: {
      x: { title: config.xTitle || false, grid: false },
      y: { title: config.yTitle || false, grid: gridY },
    },
    legend,
    theme: theme,
    animate: false,
  };

  return spec;
}
