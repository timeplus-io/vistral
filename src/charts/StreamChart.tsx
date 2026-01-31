/**
 * StreamChart - Universal Streaming Chart Component
 * Automatically renders the appropriate chart based on configuration
 */

import React, { useMemo } from 'react';
import type {
  ChartConfig,
  StreamDataSource,
  TimeSeriesConfig,
  BarColumnConfig,
  SingleValueConfig,
  TableConfig,
} from '../types';
import { TimeSeriesChart } from './TimeSeriesChart';
import { BarColumnChart } from './BarColumnChart';
import { SingleValueChart } from './SingleValueChart';
import { DataTable } from './DataTable';

export interface StreamChartProps {
  /** Chart configuration */
  config: ChartConfig;
  /** Data source with columns and data */
  data: StreamDataSource;
  /** Color theme */
  theme?: 'dark' | 'light';
  /** Show data table instead of chart */
  showTable?: boolean;
  /** Container className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
  /** Callback when configuration changes */
  onConfigChange?: (config: ChartConfig) => void;
}

/**
 * Check if configuration is for a time series chart
 */
function isTimeSeriesConfig(config: ChartConfig): config is TimeSeriesConfig {
  return config.chartType === 'line' || config.chartType === 'area';
}

/**
 * Check if configuration is for a bar/column chart
 */
function isBarColumnConfig(config: ChartConfig): config is BarColumnConfig {
  return config.chartType === 'bar' || config.chartType === 'column';
}

/**
 * Check if configuration is for a single value chart
 */
function isSingleValueConfig(config: ChartConfig): config is SingleValueConfig {
  return config.chartType === 'singleValue';
}

/**
 * Check if configuration is for a table
 */
function isTableConfig(config: ChartConfig): config is TableConfig {
  return config.chartType === 'table';
}

/**
 * Error Boundary for chart rendering errors
 */
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; theme: 'dark' | 'light' },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; theme: 'dark' | 'light' }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const { theme } = this.props;
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            color: theme === 'dark' ? '#F87171' : '#DC2626',
            backgroundColor: theme === 'dark' ? 'rgba(127, 29, 29, 0.1)' : 'rgba(254, 226, 226, 0.5)',
            borderRadius: '8px',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ marginTop: '16px', fontWeight: 500 }}>Chart rendering error</p>
          <p
            style={{
              marginTop: '8px',
              fontSize: '12px',
              color: theme === 'dark' ? '#FCA5A5' : '#F87171',
            }}
          >
            {this.state.error?.message || 'Unknown error'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Placeholder for unsupported chart types
 */
const UnsupportedChart: React.FC<{ chartType: string; theme: 'dark' | 'light' }> = ({
  chartType,
  theme,
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      color: theme === 'dark' ? '#FCD34D' : '#D97706',
      backgroundColor: theme === 'dark' ? 'rgba(120, 53, 15, 0.1)' : 'rgba(254, 243, 199, 0.5)',
      borderRadius: '8px',
    }}
  >
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
    <p style={{ marginTop: '16px', fontWeight: 500 }}>
      Unsupported chart type: "{chartType}"
    </p>
    <p
      style={{
        marginTop: '8px',
        fontSize: '12px',
        color: theme === 'dark' ? '#FDE68A' : '#F59E0B',
      }}
    >
      Supported types: line, area, bar, column, singleValue, table
    </p>
  </div>
);

/**
 * StreamChart Component
 * 
 * Universal chart component for streaming data visualization.
 * Automatically renders the appropriate chart based on the config.chartType property.
 * 
 * @example
 * ```tsx
 * <StreamChart
 *   config={{
 *     chartType: 'line',
 *     xAxis: 'timestamp',
 *     yAxis: 'value',
 *     legend: true,
 *   }}
 *   data={{
 *     columns: [
 *       { name: 'timestamp', type: 'datetime64' },
 *       { name: 'value', type: 'float64' },
 *     ],
 *     data: [...],
 *   }}
 *   theme="dark"
 * />
 * ```
 */
export const StreamChart: React.FC<StreamChartProps> = ({
  config,
  data,
  theme = 'dark',
  showTable = false,
  className,
  style,
  onConfigChange,
}) => {
  // If showTable is true, always render as table
  if (showTable) {
    const tableConfig: TableConfig = {
      chartType: 'table',
      tableStyles: {},
      tableWrap: false,
      updateMode: 'all',
    };

    return (
      <ChartErrorBoundary theme={theme}>
        <DataTable
          config={tableConfig}
          data={data}
          theme={theme}
          className={className}
          style={style}
          onConfigChange={onConfigChange as (config: TableConfig) => void}
        />
      </ChartErrorBoundary>
    );
  }

  // Render appropriate chart based on config type
  const chartComponent = useMemo(() => {
    if (isTimeSeriesConfig(config)) {
      return (
        <TimeSeriesChart
          config={config}
          data={data}
          theme={theme}
          className={className}
          style={style}
        />
      );
    }

    if (isBarColumnConfig(config)) {
      return (
        <BarColumnChart
          config={config}
          data={data}
          theme={theme}
          className={className}
          style={style}
        />
      );
    }

    if (isSingleValueConfig(config)) {
      return (
        <SingleValueChart
          config={config}
          data={data}
          theme={theme}
          className={className}
          style={style}
        />
      );
    }

    if (isTableConfig(config)) {
      return (
        <DataTable
          config={config}
          data={data}
          theme={theme}
          className={className}
          style={style}
          onConfigChange={onConfigChange as (config: TableConfig) => void}
        />
      );
    }

    // Unsupported chart type
    return <UnsupportedChart chartType={config.chartType} theme={theme} />;
  }, [config, data, theme, className, style, onConfigChange]);

  return <ChartErrorBoundary theme={theme}>{chartComponent}</ChartErrorBoundary>;
};

export default StreamChart;

// Re-export individual chart components
export { TimeSeriesChart } from './TimeSeriesChart';
export { BarColumnChart } from './BarColumnChart';
export { SingleValueChart } from './SingleValueChart';
export { DataTable } from './DataTable';
