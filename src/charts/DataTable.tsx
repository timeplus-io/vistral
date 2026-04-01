/**
 * Streaming Data Table Component
 * Displays tabular data with streaming update support
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
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
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
    color: string;
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
  colorConfig?: TableCellColorConfig
): string | undefined {
  if (!colorConfig || colorConfig.type === 'none') return undefined;

  if (colorConfig.type === 'condition' && colorConfig.conditions) {
    const numValue = Number(value);
    if (isNaN(numValue)) return undefined;

    for (const condition of colorConfig.conditions) {
      let matches = false;
      switch (condition.operator) {
        case 'gt':
          matches = numValue > condition.value;
          break;
        case 'lt':
          matches = numValue < condition.value;
          break;
        case 'eq':
          matches = numValue === condition.value;
          break;
        case 'gte':
          matches = numValue >= condition.value;
          break;
        case 'lte':
          matches = numValue <= condition.value;
          break;
      }
      if (matches) return condition.color;
    }
  }

  return undefined;
}

const tableStyles = `
  .vistral-data-table {
    width: 100%;
    border-collapse: collapse;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
  }
  
  /* Light Theme */
  .vistral-data-table.theme-light {
    color: #1a1c1d;
    background-color: #ffffff;
  }
  .vistral-data-table.theme-light th {
    background-color: #e0e0e0;
    border-bottom: 1px solid #c0c0c0;
    color: #4a4a4a;
  }
  .vistral-data-table.theme-light td {
    border-bottom: 1px solid #f0f0f0;
  }
  .vistral-data-table.theme-light tbody tr:nth-child(even) {
    background-color: #fafafa;
  }
  .vistral-data-table.theme-light tbody tr:hover {
    background-color: #f2f7ff;
  }
  .vistral-data-table.theme-light td.monospace {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    color: #333;
  }
  
  /* Dark Theme */
  .vistral-data-table.theme-dark {
    color: #e5e7eb;
    background-color: #111827;
  }
  .vistral-data-table.theme-dark th {
    background-color: #374151; /* Darker gray header */
    border-bottom: 1px solid #4b5563;
    color: #d1d5db;
  }
  .vistral-data-table.theme-dark td {
    border-bottom: 1px solid #1f2937;
  }
  .vistral-data-table.theme-dark tbody tr:nth-child(even) {
    background-color: #1f2937; /* Even row background */
  }
  .vistral-data-table.theme-dark tbody tr:hover {
    background-color: #374151; /* Hover effect */
  }
  .vistral-data-table.theme-dark td.monospace {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    color: #d1d5db;
  }

  /* Common Cell Styles */
  .vistral-data-table th, .vistral-data-table td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .vistral-data-table th {
    padding: 8px 12px;
    text-align: left;
    font-weight: 500;
    position: relative;
  }
  .vistral-data-table td {
    padding: 10px 12px;
  }
  
  /* Column type badge */
  .type-badge {
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 4px;
  }
  .theme-light .type-badge {
    background-color: #e5e7eb;
    color: #6b7280;
  }
  .theme-dark .type-badge {
    background-color: #374151;
    color: #9ca3af;
  }
`;

/**
 * Table Cell Component
 */
const TableCell: React.FC<{
  value: unknown;
  isNumeric: boolean;
  miniChart?: 'none' | 'sparkline';
  sparklineData?: number[];
  color?: TableCellColorConfig;
  wrap?: boolean;
  isMonospace?: boolean;
}> = ({ value, isNumeric, miniChart, sparklineData = [], color, wrap, isMonospace }) => {
  const bgColor = getCellBackgroundColor(value, color);
  const displayValue = String(value ?? '');

  return (
    <td
      className={isMonospace ? 'monospace' : ''}
      style={{
        textAlign: isNumeric ? 'right' : 'left',
        backgroundColor: bgColor,
        whiteSpace: wrap ? 'normal' : 'nowrap',
        maxWidth: '200px',
      }}
      title={String(value ?? '')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isNumeric ? 'flex-end' : 'flex-start' }}>
        {miniChart === 'sparkline' && sparklineData.length > 0 && (
          <CellSparkline data={sparklineData} />
        )}
        <span>{displayValue}</span>
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
  theme: string | VistralTheme;
}> = ({ column, displayName, width, onResize, theme }) => {
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
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '8px',
          cursor: 'col-resize',
          backgroundColor: isResizing ? (isDarkTheme(theme) ? '#3B82F6' : '#2563EB') : 'transparent',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = isDarkTheme(theme) ? '#4B5563' : '#D1D5DB';
          }
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
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

  return (
    <div
      ref={containerRef}
      className={`${className || ''} vistral-data-table ${isDarkTheme(theme) ? 'theme-dark' : 'theme-light'}`}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        ...style,
      }}
      data-testid="data-table"
    >
      <style>{tableStyles}</style>
      <table>
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
                theme={theme}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, rowIndex) => (
            <tr key={rowIndex}>
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

                return (
                  <TableCell
                    key={col.name}
                    value={value}
                    isNumeric={isNumericColumn(col.type)}
                    miniChart={colStyle?.miniChart}
                    sparklineData={sparklineHistoryRef.current[sparklineKey]}
                    color={colStyle?.color}
                    wrap={config.tableWrap}
                    isMonospace={col.type === 'string'}
                  />
                );
              })}
            </tr>
          ))}
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
