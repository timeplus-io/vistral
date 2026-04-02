/**
 * Streaming Data Table Component
 * Displays tabular data with streaming update support
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import './DataTable.css';
import type { TableConfig, StreamDataSource, ColumnDefinition } from '../types';
import type { VistralTheme } from '../types/theme';
import { DEFAULT_MAX_ITEMS } from '../types/spec';
import { useChart } from '../hooks';
import { isNumericColumn, rowToArray, applyTemporalFilter } from '../utils';
import { isDarkTheme } from '../core/theme-registry';

// Type alias for table cell color config
type TableCellColorConfig = {
  type: 'none' | 'scale' | 'condition';
  colorScale?: string;
  conditions?: Array<{
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | '!contains';
    value: string | number;
    color: string;
    highlightRow?: boolean;
  }>;
};

export interface DataTableProps {
  /** Chart configuration */
  config: TableConfig;
  /** Data source */
  data: StreamDataSource;
  /** Theme */
  theme?: string | VistralTheme;
  /** Container className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
  /** Callback when configuration changes (e.g., column resize) */
  onConfigChange?: (config: TableConfig) => void;
  /** Max rows to display */
  maxRows?: number;
}

// Exported for unit testing. These are internal helpers and not part of the
// package's public API surface (not re-exported from src/index.ts).
export function evaluateCondition(
  cellValue: unknown,
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | '!contains',
  conditionValue: string | number
): boolean {
  if (cellValue === null || cellValue === undefined) return false;
  if (operator === 'contains') {
    return String(cellValue).includes(String(conditionValue));
  }
  if (operator === '!contains') {
    return !String(cellValue).includes(String(conditionValue));
  }
  if (operator === 'eq') {
    return String(cellValue) === String(conditionValue);
  }
  const num = Number(cellValue);
  if (isNaN(num)) return false;
  const condNum = Number(conditionValue);
  switch (operator) {
    case 'gt':  return num > condNum;
    case 'gte': return num >= condNum;
    case 'lt':  return num < condNum;
    case 'lte': return num <= condNum;
    default:    return false;
  }
}

/** Format a cell value for display, applying fractionDigits when column is numeric. */
export function formatCellValue(
  value: unknown,
  isNumeric: boolean,
  fractionDigits?: number
): string {
  if (value === null || value === undefined) return '';
  if (isNumeric && fractionDigits !== undefined) {
    const num = Number(value);
    if (!isNaN(num)) {
      return num.toLocaleString(undefined, { maximumFractionDigits: fractionDigits });
    }
  }
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value !== null && typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

/** Convert a hex color string to rgba() with the given alpha (0–1). Non-hex colors pass through unchanged. */
export function hexToRgba(hex: string, alpha: number): string {
  // Expand 3-digit hex: #rgb → #rrggbb
  const normalized = hex.replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i, '#$1$1$2$2$3$3');
  const match = /^#([0-9a-f]{6})$/i.exec(normalized);
  if (!match) return hex;
  const r = parseInt(match[1].slice(0, 2), 16);
  const g = parseInt(match[1].slice(2, 4), 16);
  const b = parseInt(match[1].slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get default table configuration
 */
export function getTableDefaults(
  columns: { name: string; type: string }[]
): Partial<TableConfig> {
  const tableStyles: TableConfig['tableStyles'] = {};

  columns.forEach((col) => {
    tableStyles[col.name] = {
      name: col.name,
      show: true,
      width: 150,
      miniChart: 'none',
      color: { type: 'none' },
    };
  });

  return {
    chartType: 'table',
    tableStyles,
    tableWrap: false,
  };
}

/**
 * Mini Sparkline for table cells
 */
const CellSparkline: React.FC<{ data: number[]; width?: number; height?: number }> = ({
  data,
  width = 80,
  height = 30,
}) => {
  const { chart, chartRef } = useChart({ height });

  useEffect(() => {
    if (!chart || data.length === 0) return;

    chart.clear();

    const indexedData = data.map((d, i) => ({ index: i, value: d }));

    chart
      .line()
      .data(indexedData)
      .animate(false)
      .encode('x', 'index')
      .encode('y', 'value')
      .style('stroke', '#8B5CF6')
      .style('lineWidth', 1)
      .style('shape', 'smooth')
      .scale({
        x: { type: 'linear', range: [0, 1] },
        y: { type: 'linear', nice: true },
      })
      .axis(false)
      .tooltip(false);

    chart.render();
  }, [chart, data]);

  return <div ref={chartRef} style={{ width, height }} />;
};

/**
 * Get cell background color based on conditions
 */
function getCellBackgroundColor(
  value: unknown,
  colorConfig?: TableCellColorConfig,
  forHighlightRow = false
): string | undefined {
  if (!colorConfig || colorConfig.type === 'none') return undefined;

  if (colorConfig.type === 'condition' && colorConfig.conditions) {
    for (const condition of colorConfig.conditions) {
      // highlightRow conditions belong to row-level coloring, not cell-level
      if (condition.highlightRow && !forHighlightRow) continue;
      if (!condition.highlightRow && forHighlightRow) continue;
      if (evaluateCondition(value, condition.operator, condition.value)) {
        return condition.color;
      }
    }
  }

  return undefined;
}


const CellBar: React.FC<{ value: number; maxValue: number; isDark: boolean }> = ({
  value,
  maxValue,
  isDark,
}) => {
  const pct = maxValue > 0 ? Math.min(100, (Math.abs(value) / maxValue) * 100) : 0;
  return (
    <div
      style={{
        width: '80px',
        height: '8px',
        backgroundColor: isDark ? '#374151' : '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: isDark ? '#6366f1' : '#4f46e5',
          borderRadius: '4px',
        }}
      />
    </div>
  );
};

function computeRowHighlight(
  row: unknown[],
  columns: { name: string; type: string }[],
  styles: TableConfig['tableStyles']
): string | undefined {
  if (!styles) return undefined;
  for (const col of columns) {
    const colStyle = styles[col.name];
    if (colStyle?.color?.type !== 'condition' || !colStyle.color.conditions) continue;
    const colIndex = columns.indexOf(col);
    const cellValue = row[colIndex];
    for (const cond of colStyle.color.conditions) {
      if (cond.highlightRow && evaluateCondition(cellValue, cond.operator, cond.value)) {
        return hexToRgba(cond.color, 0.2);
      }
    }
  }
  return undefined;
}

function getTrend(
  currentValue: unknown,
  prevValue: number | undefined,
  increaseColor = '#22c55e',
  decreaseColor = '#ef4444'
): { sign: '+' | '-'; color: string } | null {
  if (prevValue === undefined) return null;
  const curr = Number(currentValue);
  if (isNaN(curr) || curr === prevValue) return null;
  return curr > prevValue
    ? { sign: '+', color: increaseColor }
    : { sign: '-', color: decreaseColor };
}

/**
 * Table Cell Component
 */
const TableCell: React.FC<{
  value: unknown;
  isNumeric: boolean;
  fractionDigits?: number;
  miniChart?: 'none' | 'sparkline' | 'bar';
  sparklineData?: number[];
  barMaxValue?: number;
  color?: TableCellColorConfig;
  trend?: { sign: '+' | '-'; color: string } | null;
  trendEnabled?: boolean;
  wrap?: boolean;
  isMonospace?: boolean;
  isDark?: boolean;
}> = ({
  value,
  isNumeric,
  fractionDigits,
  miniChart,
  sparklineData = [],
  barMaxValue = 0,
  color,
  trend,
  trendEnabled,
  wrap,
  isMonospace,
  isDark = true,
}) => {
  const bgColor = getCellBackgroundColor(value, color);
  const displayValue = formatCellValue(value, isNumeric, fractionDigits);

  return (
    <td
      className={isMonospace ? 'monospace' : ''}
      style={{
        textAlign: isNumeric ? 'right' : 'left',
        backgroundColor: bgColor,
        maxWidth: '300px',
      }}
      title={String(value ?? '')}
    >
      <div
        className={`value-box${wrap ? ' wrap' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: isNumeric && miniChart !== 'bar' ? 'flex-end' : 'flex-start',
        }}
      >
        {miniChart === 'sparkline' && sparklineData.length > 0 && (
          <CellSparkline data={sparklineData} />
        )}
        {miniChart === 'bar' && (
          <CellBar value={Number(value)} maxValue={barMaxValue} isDark={isDark ?? true} />
        )}
        <span>{displayValue}</span>
        {trendEnabled && (
          <span
            style={{
              display: 'inline-block',
              width: 0,
              height: 0,
              marginLeft: '2px',
              borderStyle: 'solid',
              ...(trend
                ? trend.sign === '+'
                  ? {
                      borderWidth: '0 4px 7px 4px',
                      borderColor: `transparent transparent ${trend.color} transparent`,
                      marginBottom: '1px',
                    }
                  : {
                      borderWidth: '7px 4px 0 4px',
                      borderColor: `${trend.color} transparent transparent transparent`,
                      marginTop: '1px',
                    }
                : {
                    borderWidth: '0 4px 7px 4px',
                    borderColor: 'transparent',
                  }),
            }}
          />
        )}
      </div>
    </td>
  );
};

/**
 * Table Header Cell Component
 */
const TableHeaderCell: React.FC<{
  column: ColumnDefinition;
  displayName?: string;
  width: number;
  onResize: (width: number) => void;
}> = ({ column, displayName, width, onResize }) => {
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, onResize]);

  return (
    <th
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="type-badge">
          {column.type}
        </span>
        <span>{displayName || column.name}</span>
      </div>
      <div
        ref={resizeRef}
        className={`resizer${isResizing ? ' is-resizing' : ''}`}
        onMouseDown={handleMouseDown}
      />
    </th>
  );
};

/**
 * Streaming Data Table Component
 */
export const DataTable: React.FC<DataTableProps> = ({
  config: configRaw,
  data: dataSource,
  theme = 'dark',
  className,
  style,
  onConfigChange,
  maxRows = DEFAULT_MAX_ITEMS,
}) => {
  // Merge with defaults
  const defaults = getTableDefaults(dataSource.columns);
  const config = useMemo(
    () => ({
      ...defaults,
      ...configRaw,
    } as TableConfig),
    [configRaw, defaults]
  );

  // Column widths state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    dataSource.columns.forEach((col) => {
      widths[col.name] = config.tableStyles?.[col.name]?.width || 150;
    });
    return widths;
  });

  // Track sparkline data per row/column using ref to avoid infinite loops
  const sparklineHistoryRef = useRef<Record<string, number[]>>({});
  // Trend tracking: stores previous numeric value per bucket (key value or row index) per column
  const trendHistoryRef = useRef<Record<string, Record<string, number>>>({});
  // Version counter to trigger re-renders when sparkline data changes
  const [, setSparklineVersion] = useState(0);

  // Container ref for auto-scrolling
  const containerRef = useRef<HTMLDivElement>(null);

  // Process data for display
  const displayData = useMemo(() => {
    const { columns, data } = dataSource;
    const { temporal } = config;

    let processedData = data.map((row) => rowToArray(row, columns));

    // Apply temporal filtering if configured
    if (temporal) {
      processedData = applyTemporalFilter(processedData, columns, temporal);
    }

    // Limit rows
    return processedData.slice(-maxRows);
  }, [dataSource, config, maxRows]);

  // Auto-scroll to bottom when data changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayData]);

  // Update sparkline history - use ref to avoid infinite loop
  const prevDataLengthRef = useRef(0);
  useEffect(() => {
    if (!config.tableStyles) return;

    const sparklineCols = Object.entries(config.tableStyles)
      .filter(([_, style]) => style?.miniChart === 'sparkline')
      .map(([name]) => name);

    // Only update if we have sparkline columns and data changed
    if (sparklineCols.length === 0) return;
    if (displayData.length === prevDataLengthRef.current && displayData.length > 0) return;

    prevDataLengthRef.current = displayData.length;

    let hasChanges = false;
    displayData.forEach((row, rowIndex) => {
      sparklineCols.forEach((colName) => {
        const colIndex = dataSource.columns.findIndex((c) => c.name === colName);
        if (colIndex >= 0) {
          const key = `${rowIndex}-${colName}`;
          const value = Number(row[colIndex]);
          if (!isNaN(value)) {
            const existing = sparklineHistoryRef.current[key] || [];
            const lastValue = existing[existing.length - 1];
            if (lastValue !== value || existing.length === 0) {
              sparklineHistoryRef.current[key] = [...existing, value].slice(-20);
              hasChanges = true;
            }
          }
        }
      });
    });

    // Only trigger re-render if there were actual changes
    if (hasChanges) {
      setSparklineVersion((v) => v + 1);
    }
  }, [displayData, config.tableStyles, dataSource.columns]);

  // Update trend history after each data change
  useEffect(() => {
    if (!config.tableStyles) return;

    const trendCols = Object.entries(config.tableStyles)
      .filter(([, style]) => style?.trend)
      .map(([name]) => name);

    if (trendCols.length === 0) return;

    const isKeyMode = config.temporal?.mode === 'key';
    const keyField = isKeyMode
      ? (Array.isArray(config.temporal!.field) ? config.temporal!.field[0] : config.temporal!.field)
      : null;
    const keyColIndex = keyField
      ? dataSource.columns.findIndex((c) => c.name === keyField)
      : -1;

    displayData.forEach((row, rowIndex) => {
      const bucket = isKeyMode && keyColIndex >= 0
        ? String(row[keyColIndex])
        : `__row_${rowIndex}`;

      if (!trendHistoryRef.current[bucket]) {
        trendHistoryRef.current[bucket] = {};
      }

      trendCols.forEach((colName) => {
        const colIndex = dataSource.columns.findIndex((c) => c.name === colName);
        if (colIndex < 0) return;
        const value = Number(row[colIndex]);
        if (!isNaN(value)) {
          trendHistoryRef.current[bucket][colName] = value;
        }
      });
    });
  }, [displayData, config.tableStyles, config.temporal, dataSource.columns]);

  // Handle column resize
  const handleColumnResize = useCallback(
    (columnName: string, width: number) => {
      setColumnWidths((prev) => ({ ...prev, [columnName]: width }));

      if (onConfigChange) {
        const newConfig = {
          ...config,
          tableStyles: {
            ...config.tableStyles,
            [columnName]: {
              ...config.tableStyles?.[columnName],
              width,
            },
          },
        };
        onConfigChange(newConfig);
      }
    },
    [config, onConfigChange]
  );

  // Visible columns
  const visibleColumns = useMemo(
    () =>
      dataSource.columns.filter((col) => {
        const style = config.tableStyles?.[col.name];
        return style?.show !== false;
      }),
    [dataSource.columns, config.tableStyles]
  );

  // Precompute max absolute value per bar-chart column (hoisted out of render loop)
  const barMaxValues = useMemo(() => {
    const map: Record<string, number> = {};
    if (!config.tableStyles) return map;
    visibleColumns.forEach((col) => {
      const colStyle = config.tableStyles?.[col.name];
      if (isNumericColumn(col.type) && colStyle?.miniChart === 'bar') {
        const colIndex = dataSource.columns.findIndex((c) => c.name === col.name);
        const values = displayData
          .map((r) => Math.abs(Number(r[colIndex])))
          .filter((v) => !isNaN(v));
        map[col.name] = values.length > 0 ? Math.max(...values) : 0;
      }
    });
    return map;
  }, [displayData, visibleColumns, config.tableStyles, dataSource.columns]);

  return (
    <div
      ref={containerRef}
      className={className || ''}
      style={{ width: '100%', height: '100%', overflow: 'auto', ...style }}
      data-testid="data-table"
    >
      <table className={`vistral-table ${isDarkTheme(theme) ? 'theme-dark' : 'theme-light'}`}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <tr>
            <th
              style={{
                width: '40px',
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              No.
            </th>
            {visibleColumns.map((col) => (
              <TableHeaderCell
                key={col.name}
                column={col}
                displayName={config.tableStyles?.[col.name]?.name}
                width={columnWidths[col.name] || 150}
                onResize={(width) => handleColumnResize(col.name, width)}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, rowIndex) => {
            // Row highlight: check all columns for highlightRow conditions
            const rowHighlight = computeRowHighlight(
              row,
              dataSource.columns,
              config.tableStyles
            );

            // Trend bucket key
            const isKeyMode = config.temporal?.mode === 'key';
            const keyField = isKeyMode
              ? (Array.isArray(config.temporal!.field) ? config.temporal!.field[0] : config.temporal!.field)
              : null;
            const keyColIndex = keyField
              ? dataSource.columns.findIndex((c) => c.name === keyField)
              : -1;
            const bucket = isKeyMode && keyColIndex >= 0
              ? String(row[keyColIndex])
              : `__row_${rowIndex}`;

            return (
              <tr key={rowIndex} style={rowHighlight ? { backgroundColor: rowHighlight } : undefined}>
                <td
                  style={{
                    textAlign: 'center',
                    fontWeight: 500,
                    opacity: 0.7,
                  }}
                >
                  {rowIndex + 1}
                </td>
                {visibleColumns.map((col) => {
                  const colIndex = dataSource.columns.findIndex((c) => c.name === col.name);
                  const value = row[colIndex];
                  const colStyle = config.tableStyles?.[col.name];
                  const sparklineKey = `${rowIndex}-${col.name}`;
                  const numeric = isNumericColumn(col.type);

                  // Trend: read previous value from ref (before this render's update)
                  const prevValue = trendHistoryRef.current[bucket]?.[col.name];
                  const trend = colStyle?.trend
                    ? getTrend(value, prevValue, colStyle.increaseColor, colStyle.decreaseColor)
                    : null;

                  const barMaxValue = barMaxValues[col.name] ?? 0;

                  return (
                    <TableCell
                      key={col.name}
                      value={value}
                      isNumeric={numeric}
                      fractionDigits={colStyle?.fractionDigits}
                      miniChart={colStyle?.miniChart}
                      sparklineData={sparklineHistoryRef.current[sparklineKey]}
                      barMaxValue={barMaxValue}
                      color={colStyle?.color as TableCellColorConfig}
                      trend={trend}
                      trendEnabled={!!colStyle?.trend}
                      wrap={config.tableWrap}
                      isMonospace={col.type === 'string'}
                      isDark={isDarkTheme(theme)}
                    />
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {displayData.length === 0 && (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            opacity: 0.6,
          }}
        >
          No data available
        </div>
      )}
    </div>
  );
};

export default DataTable;
