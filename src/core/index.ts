/**
 * Core Chart Utilities Exports
 */

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
} from './chart-utils';

export {
  applyTemporalTransforms,
  translateToG2Spec,
  applySpecTheme,
  buildG2Options,
} from './spec-engine';

export { compileTimeSeriesConfig, compileBarColumnConfig } from './compilers';
