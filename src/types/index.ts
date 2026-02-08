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

// Table Chart Configuration
export interface TableConfig extends ChartConfigBase {
  chartType: 'table';
  /** Column styles and visibility */
  tableStyles?: Record<
    string,
    {
      name?: string;
      show?: boolean;
      width?: number;
      miniChart?: 'none' | 'sparkline';
      color?: {
        type: 'none' | 'scale' | 'condition';
        colorScale?: string;
        conditions?: Array<{
          operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
          value: number;
          color: string;
        }>;
      };
    }
  >;
  /** Enable text wrapping */
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
}

// Union of all chart configurations
export type ChartConfig =
  | TimeSeriesConfig
  | BarColumnConfig
  | SingleValueConfig
  | TableConfig
  | OHLCConfig
  | GeoChartConfig;

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
