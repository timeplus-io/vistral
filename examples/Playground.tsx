/**
 * Interactive Playground
 * Build streaming visualizations using grammar bindings
 */

import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import {
  StreamChart,
  VistralChart,
  compileTimeSeriesConfig,
  compileBarColumnConfig,
  useStreamingData,
  type StreamDataSource,
  type ChartConfig,
  type TemporalMode,
  type VistralSpec,
  type ChartHandle,
  type TimeSeriesConfig,
  type BarColumnConfig,
} from '@timeplus/vistral';
import { ThemeContext } from './App';

// Hook to get current theme
function useTheme() {
  const context = useContext(ThemeContext);
  return context?.theme || 'dark';
}

import { dataGenerators, type DataGenerator } from './data-utils';

// =============================================================================
// Chart Type Definitions
// =============================================================================

type ChartType = 'line' | 'area' | 'bar' | 'column' | 'table' | 'geo' | 'singleValue';

interface ChartTypeInfo {
  name: string;
  requiredFields: string[];
  optionalFields: string[];
  supportedTemporal: TemporalMode[];
}

const chartTypeInfo: Record<ChartType, ChartTypeInfo> = {
  line: {
    name: 'Line Chart',
    requiredFields: ['xAxis', 'yAxis'],
    optionalFields: ['color'],
    supportedTemporal: ['axis'],
  },
  area: {
    name: 'Area Chart',
    requiredFields: ['xAxis', 'yAxis'],
    optionalFields: ['color'],
    supportedTemporal: ['axis'],
  },
  bar: {
    name: 'Bar Chart',
    requiredFields: ['xAxis', 'yAxis'],
    optionalFields: ['color'],
    supportedTemporal: ['frame', 'key'],
  },
  column: {
    name: 'Column Chart',
    requiredFields: ['xAxis', 'yAxis'],
    optionalFields: ['color'],
    supportedTemporal: ['frame', 'key'],
  },
  table: {
    name: 'Data Table',
    requiredFields: [],
    optionalFields: [],
    supportedTemporal: ['frame', 'key'],
  },
  geo: {
    name: 'Geo Map',
    requiredFields: ['latitude', 'longitude'],
    optionalFields: ['color', 'size'],
    supportedTemporal: ['frame', 'key'],
  },
  singleValue: {
    name: 'Single Value',
    requiredFields: ['yAxis'],
    optionalFields: [],
    supportedTemporal: [],
  },
};

// =============================================================================
// Playground Component
// =============================================================================

export function Playground() {
  const theme = useTheme();
  const isDark = theme === 'dark';

  // Data source state
  const [dataSourceKey, setDataSourceKey] = useState<string>('metrics');
  const { data, append, clear } = useStreamingData<Record<string, unknown>[]>(
    [],
    500,
  );

  // Chart type state
  const [chartType, setChartType] = useState<ChartType>('line');

  // Field bindings state
  const [xAxis, setXAxis] = useState<string>('timestamp');
  const [yAxis, setYAxis] = useState<string>('cpu');
  const [colorField, setColorField] = useState<string>('server');
  const [latitudeField, setLatitudeField] = useState<string>('latitude');
  const [longitudeField, setLongitudeField] = useState<string>('longitude');
  const [sizeField, setSizeField] = useState<string>('');

  // Temporal binding state
  const [temporalMode, setTemporalMode] = useState<TemporalMode | ''>('axis');
  const [temporalField, setTemporalField] = useState<string>('timestamp');
  const [temporalRange, setTemporalRange] = useState<number>(2);

  // Style options state
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showGridlines, setShowGridlines] = useState<boolean>(true);
  const [showDataLabels, setShowDataLabels] = useState<boolean>(false);
  const [lineStyle, setLineStyle] = useState<'curve' | 'straight'>('curve');
  const [groupType, setGroupType] = useState<'stack' | 'dodge'>('dodge');

  // Current data generator
  const generator = dataGenerators[dataSourceKey];

  // Reset data when data source changes
  useEffect(() => {
    clear();
    // Reset field bindings based on new data source
    const cols = generator.columns;
    const timeCol = cols.find(c => c.type.includes('datetime'))?.name || cols[0]?.name || '';
    const numCol = cols.find(c => c.type.includes('float') || c.type.includes('int'))?.name || '';
    const strCol = cols.find(c => c.type === 'string')?.name || '';
    const latCol = cols.find(c => c.name.includes('lat'))?.name || '';
    const lngCol = cols.find(c => c.name.includes('lon') || c.name.includes('lng'))?.name || '';

    // Smart defaults based on chart type
    if (chartType === 'bar') {
      // Horizontal Bar: X is Value/Numeric, Y is Category/Time
      setXAxis(numCol);
      setYAxis(timeCol || strCol);
    } else {
      // Standard: X is Time/Category, Y is Value
      setXAxis(timeCol);
      setYAxis(numCol);
    }

    setColorField(strCol);
    setTemporalField(timeCol);
    setLatitudeField(latCol);
    setLongitudeField(lngCol);
  }, [dataSourceKey, generator, clear, chartType]);

  // Adjust temporal mode when chart type changes
  // We derive the effective mode during render to avoid race conditions
  const chartTypeInfoItem = chartTypeInfo[chartType];
  const isTemporalModeSupported = temporalMode !== '' && chartTypeInfoItem.supportedTemporal.includes(temporalMode as TemporalMode);
  const effectiveTemporalMode = temporalMode === ''
    ? ''
    : (isTemporalModeSupported ? temporalMode : chartTypeInfoItem.supportedTemporal[0] || '');

  // Sync state (optional, for UI consistency)
  useEffect(() => {
    if (temporalMode !== '' && temporalMode !== effectiveTemporalMode) {
      setTemporalMode(effectiveTemporalMode as TemporalMode);
    }
  }, [chartType, temporalMode, effectiveTemporalMode]);

  // Generate streaming data
  useEffect(() => {
    const interval = setInterval(() => {
      const newRows = generator.generate();
      append(newRows);
    }, generator.interval);

    return () => clearInterval(interval);
  }, [generator, append]);

  // Build data source
  const dataSource: StreamDataSource = useMemo(() => ({
    columns: generator.columns,
    data,
    isStreaming: true,
  }), [generator.columns, data]);

  // Build chart config
  const chartConfig: ChartConfig = useMemo(() => {
    const temporal = effectiveTemporalMode ? {
      mode: effectiveTemporalMode,
      field: temporalField,
      ...(effectiveTemporalMode === 'axis' ? { range: temporalRange } : {}),
    } : undefined;

    const baseConfig = {
      temporal,
      colors: undefined, // Use default palette
    };

    switch (chartType) {
      case 'line':
      case 'area':
        return {
          ...baseConfig,
          chartType,
          xAxis,
          yAxis,
          color: colorField || undefined,
          legend: showLegend,
          gridlines: showGridlines,
          dataLabel: showDataLabels,
          lineStyle,
          fractionDigits: 2,
        };
      case 'bar':
        // Bar Chart: Transposed.
        // User inputs Visual X (Horizontal) -> config.yAxis (Value role)
        // User inputs Visual Y (Vertical) -> config.xAxis (Category role)
        return {
          ...baseConfig,
          chartType: 'bar',
          xAxis: yAxis, // Category
          yAxis: xAxis, // Value
          color: colorField || undefined,
          legend: showLegend,
          gridlines: showGridlines,
          dataLabel: showDataLabels,
          groupType,
          fractionDigits: 2,
        } as BarColumnConfig;
      case 'column':
        // Column Chart: Standard.
        return {
          ...baseConfig,
          chartType: 'column',
          xAxis, // Category
          yAxis, // Value
          color: colorField || undefined,
          legend: showLegend,
          gridlines: showGridlines,
          dataLabel: showDataLabels,
          groupType,
          fractionDigits: 2,
        } as BarColumnConfig;
      case 'table':
        return {
          ...baseConfig,
          chartType: 'table',
          tableWrap: false,
        };
      case 'geo':
        return {
          ...baseConfig,
          chartType: 'geo',
          latitude: latitudeField,
          longitude: longitudeField,
          color: colorField || undefined,
          size: sizeField ? { key: sizeField, min: 4, max: 16 } : undefined,
          zoom: 6,
          center: [40.7, -74] as [number, number],
          showZoomControl: true,
          pointOpacity: 0.8,
        };
      case 'singleValue':
        return {
          ...baseConfig,
          chartType: 'singleValue',
          yAxis,
          fontSize: 64,
          sparkline: true,
          delta: true,
          fractionDigits: 2,
        };
      default:
        return {
          ...baseConfig,
          chartType: 'line',
          xAxis,
          yAxis,
        } as ChartConfig;
    }
  }, [
    chartType, xAxis, yAxis, colorField, effectiveTemporalMode, temporalField, temporalRange,
    showLegend, showGridlines, showDataLabels, lineStyle, groupType,
    latitudeField, longitudeField, sizeField,
  ]);

  // Get available columns for field selectors
  const columns = generator.columns;
  const numericColumns = columns.filter(c =>
    c.type.includes('float') || c.type.includes('int') || c.type.includes('number')
  );
  const stringColumns = columns.filter(c => c.type === 'string');
  const dateColumns = columns.filter(c => c.type.includes('datetime') || c.type.includes('date'));

  // Styles
  const panelStyle: React.CSSProperties = {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '12px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: isDark ? '#9CA3AF' : '#6B7280',
    marginBottom: '3px',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    backgroundColor: isDark ? '#374151' : '#F3F4F6',
    color: isDark ? '#F3F4F6' : '#1F2937',
    border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
    borderRadius: '4px',
    fontSize: '13px',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: isDark ? '#D1D5DB' : '#4B5563',
    cursor: 'pointer',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: isDark ? '#F3F4F6' : '#1F2937',
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      gap: '16px',
      overflow: 'hidden',
    }}>
      {/* Chart Preview - Main Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
      }}>
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          borderRadius: '8px 8px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              fontSize: '16px',
              fontWeight: 600,
              color: isDark ? '#F3F4F6' : '#1F2937',
            }}>
              {chartTypeInfo[chartType].name}
            </span>
            <span style={{
              fontSize: '12px',
              padding: '4px 8px',
              backgroundColor: isDark ? '#374151' : '#E5E7EB',
              borderRadius: '4px',
              color: isDark ? '#9CA3AF' : '#6B7280',
            }}>
              {generator.name}
            </span>
            {temporalMode && (
              <span style={{
                fontSize: '12px',
                padding: '4px 8px',
                backgroundColor: isDark ? '#4C1D95' : '#EDE9FE',
                borderRadius: '4px',
                color: isDark ? '#C4B5FD' : '#6D28D9',
              }}>
                {temporalMode === 'axis' ? `Axis (${temporalRange}min)` :
                  temporalMode === 'frame' ? 'Frame' : 'Key'}: {temporalField}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: isDark ? '#6B7280' : '#9CA3AF' }}>
              {data.length} rows
            </span>
            <button
              onClick={clear}
              style={{
                padding: '6px 12px',
                backgroundColor: isDark ? '#374151' : '#E5E7EB',
                color: isDark ? '#D1D5DB' : '#4B5563',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div style={{
          flex: 1,
          minHeight: 0,
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ flex: 1, minHeight: 0, width: '100%', height: '100%' }}>
            <StreamChart
              config={chartConfig}
              data={dataSource}
              theme={theme}
            />
          </div>
        </div>
      </div>

      {/* Grammar Binding Panel - Right Side */}
      <div style={{
        width: '280px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {/* Data Source */}
          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Data Source</div>
            <select
              value={dataSourceKey}
              onChange={(e) => setDataSourceKey(e.target.value)}
              style={selectStyle}
            >
              {Object.entries(dataGenerators).map(([key, gen]) => (
                <option key={key} value={key}>{gen.name}</option>
              ))}
            </select>
            <p style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: '6px', marginBottom: 0 }}>
              {columns.map(c => c.name).join(', ')}
            </p>
          </div>

          {/* Chart Type */}
          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Chart Type</div>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              style={selectStyle}
            >
              {Object.entries(chartTypeInfo).map(([key, info]) => (
                <option key={key} value={key}>{info.name}</option>
              ))}
            </select>
          </div>

          {/* Temporal Binding */}
          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Temporal Binding</div>
            <label style={labelStyle}>Mode</label>
            <select
              value={temporalMode}
              onChange={(e) => setTemporalMode(e.target.value as TemporalMode | '')}
              style={selectStyle}
            >
              <option value="">None</option>
              <option value="axis">Axis (Sliding Window)</option>
              <option value="frame">Frame (Latest Timestamp)</option>
              <option value="key">Key (Deduplicate)</option>
            </select>

            {temporalMode && (
              <>
                <label style={{ ...labelStyle, marginTop: '10px' }}>Field</label>
                <select
                  value={temporalField}
                  onChange={(e) => setTemporalField(e.target.value)}
                  style={selectStyle}
                >
                  {columns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </>
            )}

            {temporalMode === 'axis' && (
              <>
                <label style={{ ...labelStyle, marginTop: '10px' }}>Range (min)</label>
                <input
                  type="number"
                  value={temporalRange}
                  onChange={(e) => setTemporalRange(Number(e.target.value))}
                  min={1}
                  max={60}
                  style={selectStyle}
                />
              </>
            )}
          </div>

          {/* Field Bindings */}
          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Field Bindings</div>

            {chartType !== 'table' && chartType !== 'geo' && chartType !== 'singleValue' && (
              <>
                <label style={labelStyle}>
                  {chartType === 'bar' ? 'X-Axis (Value)' : 'X-Axis'}
                </label>
                <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} style={selectStyle}>
                  {(chartType === 'bar' ? numericColumns : columns).map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>

                <label style={{ ...labelStyle, marginTop: '10px' }}>
                  {chartType === 'bar' ? 'Y-Axis (Category)' : 'Y-Axis'}
                </label>
                <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} style={selectStyle}>
                  {(chartType === 'bar' ? stringColumns.concat(columns.filter(c => c.type.includes('datetime'))) : numericColumns).map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>

                <label style={{ ...labelStyle, marginTop: '10px' }}>Color</label>
                <select value={colorField} onChange={(e) => setColorField(e.target.value)} style={selectStyle}>
                  <option value="">None</option>
                  {stringColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </>
            )}

            {chartType === 'singleValue' && (
              <>
                <label style={labelStyle}>Value</label>
                <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} style={selectStyle}>
                  {numericColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </>
            )}

            {chartType === 'geo' && (
              <>
                <label style={labelStyle}>Latitude</label>
                <select value={latitudeField} onChange={(e) => setLatitudeField(e.target.value)} style={selectStyle}>
                  {numericColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>

                <label style={{ ...labelStyle, marginTop: '10px' }}>Longitude</label>
                <select value={longitudeField} onChange={(e) => setLongitudeField(e.target.value)} style={selectStyle}>
                  {numericColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>

                <label style={{ ...labelStyle, marginTop: '10px' }}>Color</label>
                <select value={colorField} onChange={(e) => setColorField(e.target.value)} style={selectStyle}>
                  <option value="">None</option>
                  {stringColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>

                <label style={{ ...labelStyle, marginTop: '10px' }}>Size</label>
                <select value={sizeField} onChange={(e) => setSizeField(e.target.value)} style={selectStyle}>
                  <option value="">None</option>
                  {numericColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </>
            )}

            {chartType === 'table' && (
              <p style={{ fontSize: '12px', color: isDark ? '#6B7280' : '#9CA3AF', margin: 0 }}>
                All columns displayed
              </p>
            )}
          </div>

          {/* Style Options */}
          {chartType !== 'table' && chartType !== 'singleValue' && chartType !== 'geo' && (
            <div style={panelStyle}>
              <div style={sectionTitleStyle}>Style</div>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                />
                Legend
              </label>

              <label style={{ ...checkboxLabelStyle, marginTop: '6px' }}>
                <input
                  type="checkbox"
                  checked={showGridlines}
                  onChange={(e) => setShowGridlines(e.target.checked)}
                />
                Gridlines
              </label>

              <label style={{ ...checkboxLabelStyle, marginTop: '6px' }}>
                <input
                  type="checkbox"
                  checked={showDataLabels}
                  onChange={(e) => setShowDataLabels(e.target.checked)}
                />
                Data Labels
              </label>

              {(chartType === 'line' || chartType === 'area') && (
                <>
                  <label style={{ ...labelStyle, marginTop: '10px' }}>Line Style</label>
                  <select value={lineStyle} onChange={(e) => setLineStyle(e.target.value as 'curve' | 'straight')} style={selectStyle}>
                    <option value="curve">Curved</option>
                    <option value="straight">Straight</option>
                  </select>
                </>
              )}

              {(chartType === 'bar' || chartType === 'column') && (
                <>
                  <label style={{ ...labelStyle, marginTop: '10px' }}>Group Type</label>
                  <select value={groupType} onChange={(e) => setGroupType(e.target.value as 'stack' | 'dodge')} style={selectStyle}>
                    <option value="dodge">Side by Side</option>
                    <option value="stack">Stacked</option>
                  </select>
                </>
              )}
            </div>
          )}

          {/* Config Preview */}
          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Config JSON</div>
            <pre style={{
              fontSize: '10px',
              backgroundColor: isDark ? '#111827' : '#F9FAFB',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '150px',
              color: isDark ? '#9CA3AF' : '#6B7280',
              margin: 0,
            }}>
              {JSON.stringify(chartConfig, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Playground;
