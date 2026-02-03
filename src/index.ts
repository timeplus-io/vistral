/**
 * @timeplus/stream-viz
 * A powerful streaming data visualization library built on AntV G2
 * 
 * @packageDocumentation
 */

// Main Chart Components
export {
  StreamChart,
  TimeSeriesChart,
  BarColumnChart,
  SingleValueChart,
  DataTable,
  GeoChart,
  VistralChart,
  getTimeSeriesDefaults,
  getBarColumnDefaults,
  getSingleValueDefaults,
  getTableDefaults,
  getGeoChartDefaults,
} from './charts';

// Chart Component Props
export type {
  StreamChartProps,
  TimeSeriesChartProps,
  BarColumnChartProps,
  SingleValueChartProps,
  DataTableProps,
  GeoChartProps,
  VistralChartProps,
  ChartHandle,
} from './charts';

// Types
export type {
  ColumnType,
  ColumnDefinition,
  DataRow,
  StreamDataSource,
  ChartConfigBase,
  TimeSeriesConfig,
  BarColumnConfig,
  SingleValueConfig,
  TableConfig,
  OHLCConfig,
  GeoChartConfig,
  ChartConfig,
  ColorPalette,
  ColumnStatistics,
  ProcessedDataSource,
  TemporalMode,
  TemporalConfig,
} from './types';

// VistralSpec types
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
  AxesSpec,
  LegendSpec,
  TooltipSpec,
  AnnotationSpec,
  InteractionSpec,
} from './types';

// Themes and Colors
export {
  singleColorPalettes,
  multiColorPalettes,
  allPalettes,
  DEFAULT_PALETTE,
  findPaletteByValues,
  findPaletteByLabel,
  getPaletteKeyColor,
  getSeriesColors,
  darkTheme,
  lightTheme,
  getTheme,
} from './themes';

export type { ChartTheme, ThemeName } from './themes';

// Hooks
export {
  useChart,
  useDataSource,
  useStreamingData,
  useResizeObserver,
  useChartTheme,
  useLastUpdated,
  useSparklineData,
  useChartAnimation,
  useDebouncedValue,
  usePrevious,
  useAutoConfig,
} from './hooks';

// Utilities
export {
  isNumericColumn,
  isDateTimeColumn,
  isStringColumn,
  isBooleanColumn,
  getTimeMask,
  clamp,
  truncateWithEllipsis,
  formatNumber,
  abbreviateNumber,
  formatDuration,
  formatBytes,
  debounce,
  getRowValue,
  rowToArray,
  findColumnIndex,
  getColumnsByType,
  calculateColumnStats,
  getUniqueValues,
  parseDateTime,
  processDataSource,
  mergeDeep,
  generateId,
  // Temporal utilities
  applyTemporalFilter,
  filterByLatestTimestamp,
  filterByKey,
} from './utils';

// Core utilities for advanced usage
export {
  AXIS_HEIGHT_WITH_TITLE,
  AXIS_HEIGHT_WITHOUT_TITLE,
  MAX_LEGEND_ITEMS,
  horizontalAxisLabelConfig,
  verticalAxisLabelConfig,
  applyColorEncoding,
  applyLegend,
  applyDataLabel,
  applyTooltip,
  truncateLabel,
  renderChart,
  createDefaultConfig,
  applyChartTheme,
  getChartThemeColors,
  compileTimeSeriesConfig,
  compileBarColumnConfig,
} from './core';

// Default export
export { StreamChart as default } from './charts';
