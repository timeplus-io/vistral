/**
 * Streaming Data Table Component
 * Displays tabular data with streaming update support
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { TableConfig, StreamDataSource, ColumnDefinition } from '../types';
import { useChart } from '../hooks';
import { isNumericColumn, rowToArray, formatNumber, applyTemporalFilter } from '../utils';

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
  theme?: 'dark' | 'light';
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
  theme: 'dark' | 'light';
}> = ({ value, isNumeric, miniChart, sparklineData = [], color, wrap, theme }) => {
  const bgColor = getCellBackgroundColor(value, color);
  const displayValue = isNumeric ? formatNumber(Number(value)) : String(value ?? '');

  return (
    <td
      style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
        textAlign: isNumeric ? 'right' : 'left',
        backgroundColor: bgColor,
        whiteSpace: wrap ? 'normal' : 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '200px',
      }}
      title={String(value ?? '')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
  theme: 'dark' | 'light';
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
        position: 'relative',
        padding: '12px',
        borderBottom: `2px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
        backgroundColor: theme === 'dark' ? '#1F2937' : '#F3F4F6',
        textAlign: 'left',
        fontWeight: 600,
        width: `${width}px`,
        minWidth: `${width}px`,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 4px',
            borderRadius: '4px',
            backgroundColor: theme === 'dark' ? '#374151' : '#E5E7EB',
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          }}
        >
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
          backgroundColor: isResizing ? (theme === 'dark' ? '#3B82F6' : '#2563EB') : 'transparent',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#4B5563' : '#D1D5DB';
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
  maxRows = 100,
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
      className={className}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
        color: theme === 'dark' ? '#F3F4F6' : '#1F2937',
        ...style,
      }}
      data-testid="data-table"
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <tr>
            <th
              style={{
                padding: '12px 8px',
                borderBottom: `2px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                backgroundColor: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                textAlign: 'center',
                fontWeight: 600,
                width: '40px',
                minWidth: '40px',
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
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
            <tr
              key={rowIndex}
              style={{
                backgroundColor:
                  rowIndex % 2 === 0
                    ? 'transparent'
                    : theme === 'dark'
                    ? 'rgba(55, 65, 81, 0.3)'
                    : 'rgba(243, 244, 246, 0.5)',
              }}
            >
              <td
                style={{
                  padding: '8px',
                  borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                  textAlign: 'center',
                  color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                  fontWeight: 500,
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
                    theme={theme}
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
            color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
          }}
        >
          No data available
        </div>
      )}
    </div>
  );
};

export default DataTable;
