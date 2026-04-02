/**
 * Core types for the stream visualization library
 */

// Column/Field Types
export type ColumnType =
  | 'string'
  | 'number'
  | 'datetime'
  | 'boolean'
  | 'array'
  | 'object'
  | 'int8'
  | 'int16'
  | 'int32'
  | 'int64'
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'uint64'
  | 'float32'
  | 'float64'
  | 'datetime64';

// Column Definition
export interface ColumnDefinition {
  name: string;
  type: ColumnType | string;
  nullable?: boolean;
}

// Data Row - can be array or object format
export type DataRow = Record<string, unknown> | unknown[];

// Streaming Data Source
export interface StreamDataSource {
  /** Column definitions/schema */
  columns: ColumnDefinition[];
  /** Data rows */
  data: DataRow[];
  /** Whether the data is streaming (continuously updated) */
  isStreaming?: boolean;
}

// Temporal Binding Modes
export type TemporalMode = 'axis' | 'frame' | 'key';

// Temporal Configuration
export interface TemporalConfig {
  /** Temporal binding mode */
  mode: TemporalMode;
  /** Field used for temporal binding */
  field: string | string[];
  /** Time range in minutes (for axis mode only) */
  range?: number | 'Infinity';
}

// Chart Configuration Base
export interface ChartConfigBase {
  /** Chart type identifier */
  chartType: string;
  /** Custom color palette */
  colors?: string[];
  /** Temporal binding configuration */
  temporal?: TemporalConfig;
  /** Maximum number of data items to keep for streaming. Defaults to DEFAULT_MAX_ITEMS (1000). */
  maxItems?: number;
}

// Time Series Chart Configuration
export interface TimeSeriesConfig extends ChartConfigBase {
  chartType: 'line' | 'area';
  /** X-axis field (time field) */
  xAxis: string;
  /** Y-axis field (numeric field) */
  yAxis: string;
  /** Color/series grouping field */
  color?: string;
  /** X-axis title */
  xTitle?: string;
  /** Y-axis title */
  yTitle?: string;
  /** Y-axis range */
  yRange?: { min?: number | null; max?: number | null };
  /** Show data labels */
  dataLabel?: boolean;
  /** Show all labels or just last */
  showAll?: boolean;
  /** Show legend */
  legend?: boolean;
  /** Show gridlines */
  gridlines?: boolean;
  /** Show data points */
  points?: boolean;
  /** Line style */
  lineStyle?: 'curve' | 'straight';
  /** Decimal places */
  fractionDigits?: number;
  /** Unit configuration */
  unit?: { position: 'left' | 'right'; value: string };
  /** X-axis format mask */
  xFormat?: string;
  /** Y-axis tick label max characters */
  yTickLabel?: { maxChar: number };
}

// Bar/Column Chart Configuration
export interface BarColumnConfig extends ChartConfigBase {
  chartType: 'bar' | 'column';
  /** X-axis field */
  xAxis: string;
  /** Y-axis field */
  yAxis: string;
  /** Color/grouping field */
  color?: string;
  /** Group type for multi-series */
  groupType?: 'stack' | 'dodge';
  /** X-axis title */
  xTitle?: string;
  /** Y-axis title */
  yTitle?: string;
  /** Show data labels */
  dataLabel?: boolean;
  /** Show legend */
  legend?: boolean;
  /** Show gridlines */
  gridlines?: boolean;
  /** Decimal places */
  fractionDigits?: number;
  /** Unit configuration */
  unit?: { position: 'left' | 'right'; value: string };
  /** X-axis tick label max characters */
  xTickLabel?: { maxChar: number };
  /** Y-axis tick label max characters */
  yTickLabel?: { maxChar: number };
}

// Single Value Chart Configuration
export interface SingleValueConfig extends ChartConfigBase {
  chartType: 'singleValue';
  /** Value field */
  yAxis: string;
  /** Font size */
  fontSize?: number;
  /** Value color */
  color?: string;
  /** Decimal places */
  fractionDigits?: number;
  /** Show sparkline */
  sparkline?: boolean;
  /** Sparkline color */
  sparklineColor?: string;
  /** Show delta/change indicator */
  delta?: boolean;
  /** Color for positive changes */
  increaseColor?: string;
  /** Color for negative changes */
  decreaseColor?: string;
  /** Unit configuration */
  unit?: { position: 'left' | 'right'; value: string };
}

// Multiple Value Chart Configuration
export interface MultipleValueConfig extends ChartConfigBase {
  chartType: 'multipleValue';
  /** Value field */
  yAxis: string;
  /** Field used to group/split values horizontally */
  key?: string;
  /** Font size */
  fontSize?: number;
  /** Value color */
  color?: string;
  /** Decimal places */
  fractionDigits?: number;
  /** Show sparkline */
  sparkline?: boolean;
  /** Sparkline color */
  sparklineColor?: string;
  /** Show delta/change indicator */
  delta?: boolean;
  /** Color for positive changes */
  increaseColor?: string;
  /** Color for negative changes */
  decreaseColor?: string;
  /** Unit configuration */
  unit?: { position: 'left' | 'right'; value: string };
}

// Table Chart Configuration
export interface TableConfig extends ChartConfigBase {
  chartType: 'table';
  /** Column styles and visibility */
  tableStyles?: Record<
    string,
    {
      /** Display name override for the column header */
      name?: string;
      /** Whether column is visible */
      show?: boolean;
      /** Column width in pixels */
      width?: number;
      /** Decimal places for numeric display; omit to preserve full precision */
      fractionDigits?: number;
      /** Show ▲▼ trend indicator when value changes */
      trend?: boolean;
      /** CSS color for upward trend (default: #22c55e) */
      increaseColor?: string;
      /** CSS color for downward trend (default: #ef4444) */
      decreaseColor?: string;
      /** Mini chart type rendered inside cell */
      miniChart?: 'none' | 'sparkline' | 'bar';
      /** Cell background color configuration */
      color?: {
        type: 'none' | 'scale' | 'condition';
        colorScale?: string;
        conditions?: Array<{
          /** Comparison operator */
          operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | '!contains';
          /** Value to compare against (string for text operators, number for numeric) */
          value: string | number;
          /** CSS color to apply to the cell background */
          color: string;
          /** When true, the entire row gets this background color at 20% opacity */
          highlightRow?: boolean;
        }>;
      };
    }
  >;
  /** Enable text wrapping in cells */
  tableWrap?: boolean;
}

// OHLC/Candlestick Chart Configuration
export interface OHLCConfig extends ChartConfigBase {
  chartType: 'ohlc' | 'candlestick';
  /** Time field */
  time: string;
  /** Open price field */
  open: string;
  /** High price field */
  high: string;
  /** Low price field */
  low: string;
  /** Close price field */
  close: string;
  /** Bullish candle color */
  bullishColor?: string;
  /** Bearish candle color */
  bearishColor?: string;
}

// Geo/Map Chart Configuration
export interface GeoChartConfig extends ChartConfigBase {
  chartType: 'geo';
  /** Longitude field name */
  longitude: string;
  /** Latitude field name */
  latitude: string;
  /** Color field for point coloring */
  color?: string;
  /** Size configuration for points */
  size?: {
    key?: string;
    min?: number;
    max?: number;
  };
  /** Initial map center [lat, lng] */
  center?: [number, number];
  /** Initial zoom level (1-18) */
  zoom?: number;
  /** Map tile provider */
  tileProvider?: 'openstreetmap' | 'cartodb-dark' | 'cartodb-light';
  /** Show zoom controls */
  showZoomControl?: boolean;
  /** Show center coordinates */
  showCenterDisplay?: boolean;
  /** Point opacity (0-1) */
  pointOpacity?: number;
  /** Default point color */
  pointColor?: string;
  /** Automatically fit map to data bounds */
  autoFit?: boolean;
  /**
   * Map rendering engine.
   * - `'l7'` (default) — AntV L7 / MapLibre GL, WebGL-accelerated, no API token required.
   * - `'canvas'` — built-in canvas tile renderer, no external dependencies.
   */
  mapEngine?: 'l7' | 'canvas';
  /**
   * Mapbox API token. Only needed when `tileProvider` is a Mapbox-hosted style
   * (e.g. `'mapbox-dark'`, `'mapbox-light'`) with the `l7` engine.
   * Free tile providers (cartodb-dark, cartodb-light, openstreetmap) work without a token.
   */
  mapboxToken?: string;
}

// Markdown Chart Configuration
export interface MarkdownConfig extends ChartConfigBase {
  chartType: 'markdown';
  /**
   * Markdown template string with placeholder syntax:
   * - `{{fieldName}}` — replaced with the value from the latest row (frame/axis/no-temporal modes)
   * - `{{@keyValue::fieldName}}` — replaced with the value for the row whose key field equals
   *   `keyValue` (key mode only; `temporal.field` specifies the key column)
   */
  content: string;
}

// Union of all chart configurations
export type ChartConfig =
  | TimeSeriesConfig
  | BarColumnConfig
  | SingleValueConfig
  | MultipleValueConfig
  | TableConfig
  | OHLCConfig
  | GeoChartConfig
  | MarkdownConfig;

// Chart Props
export interface StreamChartProps<T extends ChartConfig = ChartConfig> {
  /** Chart configuration */
  config: T;
  /** Data source */
  data: StreamDataSource;
  /** Edit mode flag */
  isEditMode?: boolean;
  /** Show data table instead of chart */
  showTable?: boolean;
  /** Container className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
  /** Callback when config changes */
  onConfigChange?: (config: T) => void;
}

// Color Palette
export interface ColorPalette {
  label: string;
  values: string[];
  keyColor: number;
  keyColorValue: string;
}

// Statistics for a column
export interface ColumnStatistics {
  min?: number | { value: number };
  max?: number | { value: number };
  categories?: Record<string, number>;
  count?: number;
}

// Processed data source (internal use)
export interface ProcessedDataSource {
  data: DataRow[];
  header: ColumnDefinition[];
  x: {
    index: number;
    values?: string[];
    isTime?: boolean;
    offset?: number;
    min?: number;
    max?: number;
  };
  y: {
    index: number;
    min?: number;
    max?: number;
  };
  z: {
    index: number;
    values: string[];
  };
  xTransform: (value: unknown) => unknown;
}

// VistralSpec grammar types
export { DEFAULT_MAX_ITEMS } from './spec';
export type {
  VistralSpec,
  MarkSpec,
  EncodeSpec,
  EncodeFn,
  ScaleSpec,
  TransformSpec,
  CoordinateSpec,
  StreamingSpec,
  TemporalSpec,
  StyleSpec,
  LabelSpec,
  MarkTooltipSpec,
  AxesSpec,
  AxisChannelSpec,
  AxisLabelSpec,
  LegendSpec,
  TooltipSpec,
  TooltipItemSpec,
  AnnotationSpec,
  InteractionSpec,
} from './spec';
