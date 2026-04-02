/**
 * @timeplus/vistral - Streaming Examples
 *
 * This file demonstrates streaming data visualization patterns.
 * All examples use simulated real-time data updates.
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  StreamChart,
  SingleValueChart,
  useStreamingData,
  findPaletteByLabel,
} from '@timeplus/vistral';
import type {
  StreamDataSource,
  TimeSeriesConfig,
  BarColumnConfig,
  SingleValueConfig,
  MultipleValueConfig,
  TableConfig,
  GeoChartConfig,
  MarkdownConfig,
} from '../src/types';
import { ThemeContext } from './App';
import { dataGenerators } from './data-utils';

// Hook to get current theme
function useTheme() {
  const context = useContext(ThemeContext);
  return context?.theme || 'dark';
}

// =============================================================================
// Example 1: Streaming Line Chart
// =============================================================================

export function BasicLineChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>([], 300);
  const loadedRef = React.useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      append(dataGenerators.cpuLoad.generate(30));
    }
    const id = setInterval(() => {
      append(dataGenerators.cpuLoad.generate());
    }, dataGenerators.cpuLoad.interval);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const source: StreamDataSource = {
    columns: dataGenerators.cpuLoad.columns,
    data,
    isStreaming: true,
  };

  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'time',
    yAxis: 'value',
    lineStyle: 'curve',
    gridlines: true,
    yTitle: 'CPU Usage (%)',
    yRange: { min: 0, max: 100 },
    unit: { position: 'right', value: '%' },
    fractionDigits: 1,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={source} theme={theme} />
    </div>
  );
}

// =============================================================================
// Example 2: Multi-Series Streaming Area Chart
// =============================================================================

export function MultiSeriesAreaChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>(
    [],
    240 // Keep ~240 points (60 per location * 4 locations)
  );
  const loadedRef = React.useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      append(dataGenerators.sensors.generate(30));
    }
    const id = setInterval(() => {
      append(dataGenerators.sensors.generate());
    }, dataGenerators.sensors.interval);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const source: StreamDataSource = {
    columns: dataGenerators.sensors.columns,
    data: data,
    isStreaming: true,
  };

  const config: TimeSeriesConfig = {
    chartType: 'area',
    xAxis: 'timestamp',
    yAxis: 'temperature',
    color: 'location',
    legend: true,
    gridlines: true,
    xTitle: 'Time',
    yTitle: 'Temperature (\u00B0C)',
    colors: findPaletteByLabel('Morning')?.values,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={source} theme={theme} />
    </div>
  );
}

// =============================================================================
// Example 3: Streaming Stacked Column Chart
// =============================================================================

export function StackedBarChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>(
    [],
    20
  );

  useEffect(() => {
    const id = setInterval(() => {
      append(dataGenerators.revenue.generate());
    }, dataGenerators.revenue.interval);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const source: StreamDataSource = {
    columns: dataGenerators.revenue.columns,
    data: data.slice(-12), // Show only the latest snapshot (12 bars: 4 quarters * 3 products)
    isStreaming: true,
  };

  const config: BarColumnConfig = {
    chartType: 'column',
    xAxis: 'quarter',
    yAxis: 'revenue',
    color: 'product',
    groupType: 'stack',
    legend: true,
    dataLabel: false,
    yTitle: 'Revenue',
    unit: { position: 'left', value: '$' },
    fractionDigits: 0,
    colors: findPaletteByLabel('Sunset')?.values,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={source} theme={theme} />
    </div>
  );
}

// =============================================================================
// Example 4: Streaming Grouped Bar Chart
// =============================================================================

export function GroupedBarChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>(
    [],
    12
  );

  useEffect(() => {
    const id = setInterval(() => {
      append(dataGenerators.sales.generate());
    }, dataGenerators.sales.interval);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const source: StreamDataSource = {
    columns: dataGenerators.sales.columns,
    // Show only the latest snapshot (8 bars: 4 categories * 2 years)
    data: data.slice(-8),
    isStreaming: true,
  };

  const config: BarColumnConfig = {
    chartType: 'bar',
    xAxis: 'category',
    yAxis: 'value',
    color: 'year',
    groupType: 'dodge',
    legend: true,
    dataLabel: true,
    gridlines: true,
    fractionDigits: 0,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={source} theme={theme} />
    </div>
  );
}

// =============================================================================
// Example 5: Single Value with Sparkline (Streaming)
// =============================================================================

export function SingleValueWithSparkline() {
  const theme = useTheme();
  const [value, setValue] = useState(1234);

  useEffect(() => {
    const id = setInterval(() => {
      const row = dataGenerators.activeUsers.generate()[0];
      setValue(row.activeUsers as number);
    }, dataGenerators.activeUsers.interval);
    return () => clearInterval(id);
  }, []);

  const data: StreamDataSource = {
    columns: dataGenerators.activeUsers.columns,
    data: [[value]],
    isStreaming: true,
  };

  const config: SingleValueConfig = {
    chartType: 'singleValue',
    yAxis: 'activeUsers',
    fontSize: 72,
    color: 'green',
    fractionDigits: 0,
    sparkline: true,
    sparklineColor: 'cyan',
    delta: true,
    increaseColor: 'green',
    decreaseColor: 'red',
  };

  return (
    <div style={{ width: '300px', height: '200px' }}>
      <StreamChart config={config} data={data} theme={theme} />
    </div>
  );
}

// =============================================================================
// Example 15: Multiple Value Chart (Streaming)
// =============================================================================

export function MultipleValueExample() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 500);

  useEffect(() => {
    // initialize with history
    append(
      dataGenerators.metrics.generate(20).map(r => [r.timestamp, r.server, r.cpu])
    );
    const id = setInterval(() => {
      const rows = dataGenerators.metrics.generate();
      append(rows.map(r => [r.timestamp, r.server, r.cpu]));
    }, dataGenerators.metrics.interval);
    return () => clearInterval(id);
  }, []);

  const dataSource: StreamDataSource = {
    columns: [
      { name: 'timestamp', type: 'datetime64' },
      { name: 'server_id', type: 'string' },
      { name: 'cpu_usage', type: 'float64' },
    ],
    data,
    isStreaming: true,
  };

  const config: MultipleValueConfig = {
    chartType: 'multipleValue',
    yAxis: 'cpu_usage',
    key: 'server_id',
    fontSize: 48,
    color: 'cyan',
    fractionDigits: 0,
    sparkline: true,
    sparklineColor: 'blue',
    delta: true,
    increaseColor: 'red',
    decreaseColor: 'green',
    unit: { position: 'right', value: '%' }
  };

  return (
    <div>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Multiple Value Component: Auto-splits values by a specific key horizontally
      </p>
      <div style={{ width: '100%', height: '300px' }}>
        <StreamChart config={config} data={dataSource} theme={theme} />
      </div>
    </div>
  );
}

// =============================================================================
// Example 6: Streaming Data Table
// =============================================================================

export function StreamingDataTable() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 50);

  useEffect(() => {
    const id = setInterval(() => {
      const row = dataGenerators.logs.generate()[0];
      append([[row.timestamp, row.level, row.service, row.message, row.duration_ms]]);
    }, dataGenerators.logs.interval);
    return () => clearInterval(id);
  }, []);

  const dataSource: StreamDataSource = {
    columns: dataGenerators.logs.columns,
    data,
    isStreaming: true,
  };

  const config: TableConfig = {
    chartType: 'table',
    tableStyles: {
      timestamp: { name: 'Time', width: 200 },
      level: {
        name: 'Level',
        width: 100,
        color: {
          type: 'condition',
          conditions: [
            { operator: 'eq', value: 'ERROR' as unknown as number, color: 'rgba(239, 68, 68, 0.3)' },
            { operator: 'eq', value: 'WARN' as unknown as number, color: 'rgba(251, 146, 60, 0.3)' },
          ],
        },
      },
      service: { name: 'Service', width: 120 },
      message: { name: 'Message', width: 300 },
      duration_ms: { name: 'Duration (ms)', width: 120 },
    },
    tableWrap: false,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={dataSource} theme={theme} />
    </div>
  );
}

// =============================================================================
// Example 7: Real-time Metrics Dashboard
// =============================================================================

export function MetricsDashboard() {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 62,
    requests: 1520,
    errors: 3,
  });

  useEffect(() => {
    const id = setInterval(() => {
      const rows = dataGenerators.metrics.generate();
      const s01 = rows.find(r => r.server === 'server-01');
      if (s01) {
        setMetrics(prev => ({
          cpu: s01.cpu as number,
          memory: s01.memory as number,
          requests: prev.requests + Math.floor(Math.random() * 50) + 10,
          errors: prev.errors + (Math.random() > 0.85 ? 1 : 0),
        }));
      }
    }, dataGenerators.metrics.interval);
    return () => clearInterval(id);
  }, []);

  const createMetricData = (value: number): StreamDataSource => ({
    columns: [{ name: 'value', type: 'float64' }],
    data: [[value]],
    isStreaming: true,
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
      <div style={{ height: '150px' }}>
        <SingleValueChart
          config={{
            chartType: 'singleValue',
            yAxis: 'value',
            fontSize: 48,
            color: metrics.cpu > 80 ? 'red' : metrics.cpu > 60 ? 'orange' : 'green',
            unit: { position: 'right', value: '%' },
            fractionDigits: 1,
            sparkline: true,
            delta: true,
          }}
          data={createMetricData(metrics.cpu)}
          theme={theme}
        />
        <div style={{ textAlign: 'center', color: '#9CA3AF' }}>CPU Usage</div>
      </div>

      <div style={{ height: '150px' }}>
        <SingleValueChart
          config={{
            chartType: 'singleValue',
            yAxis: 'value',
            fontSize: 48,
            color: metrics.memory > 80 ? 'red' : metrics.memory > 60 ? 'orange' : 'blue',
            unit: { position: 'right', value: '%' },
            fractionDigits: 1,
            sparkline: true,
            delta: true,
          }}
          data={createMetricData(metrics.memory)}
          theme={theme}
        />
        <div style={{ textAlign: 'center', color: '#9CA3AF' }}>Memory Usage</div>
      </div>

      <div style={{ height: '150px' }}>
        <SingleValueChart
          config={{
            chartType: 'singleValue',
            yAxis: 'value',
            fontSize: 48,
            color: 'cyan',
            fractionDigits: 0,
            sparkline: true,
            delta: true,
          }}
          data={createMetricData(metrics.requests)}
          theme={theme}
        />
        <div style={{ textAlign: 'center', color: '#9CA3AF' }}>Total Requests</div>
      </div>

      <div style={{ height: '150px' }}>
        <SingleValueChart
          config={{
            chartType: 'singleValue',
            yAxis: 'value',
            fontSize: 48,
            color: metrics.errors > 10 ? 'red' : 'gray',
            fractionDigits: 0,
            sparkline: true,
            delta: true,
          }}
          data={createMetricData(metrics.errors)}
          theme={theme}
        />
        <div style={{ textAlign: 'center', color: '#9CA3AF' }}>Errors</div>
      </div>
    </div>
  );
}

// =============================================================================
// Example 8: Streaming Chart with Table Toggle
// =============================================================================

export function ChartWithTableToggle() {
  const theme = useTheme();
  const [showTable, setShowTable] = useState(false);
  const { data: streamData, append } = useStreamingData<unknown[]>([], 30);
  const loadedRef = React.useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      // Pre-populate with 20 sensor readings from Warehouse A
      const history = dataGenerators.sensors.generate(20)
        .filter(r => r.location === 'Warehouse A')
        .map(r => [r.timestamp, r.temperature, r.humidity]);
      append(history as unknown[][]);
    }

    const id = setInterval(() => {
      const row = dataGenerators.sensors.generate().find(r => r.location === 'Warehouse A');
      if (row) append([[row.timestamp, row.temperature, row.humidity]]);
    }, dataGenerators.sensors.interval);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const data: StreamDataSource = {
    columns: [
      { name: 'timestamp', type: 'datetime64' },
      { name: 'temperature', type: 'float64' },
      { name: 'humidity', type: 'float64' },
    ],
    data: streamData,
    isStreaming: true,
  };

  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'timestamp',
    yAxis: 'temperature',
    gridlines: true,
    legend: false,
    yTitle: 'Temperature (°C)',
    fractionDigits: 1,
  };

  return (
    <div>
      <button
        onClick={() => setShowTable(!showTable)}
        style={{
          marginBottom: '16px',
          padding: '8px 16px',
          backgroundColor: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {showTable ? 'Show Chart' : 'Show Table'}
      </button>

      <div style={{ width: '100%', height: '400px' }}>
        <StreamChart
          config={config}
          data={data}
          theme={theme}
          showTable={showTable}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Example 9: Streaming Geo Chart (switchable map engine)
// =============================================================================

export function StreamingGeoChart() {
  const theme = useTheme();
  const [mapEngine, setMapEngine] = useState<'l7' | 'canvas'>('l7');
  const { data, append } = useStreamingData<Record<string, unknown>[]>([], 300);

  useEffect(() => {
    const id = setInterval(() => {
      append(dataGenerators.globalEvents.generate());
    }, dataGenerators.globalEvents.interval);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const source: StreamDataSource = {
    columns: dataGenerators.globalEvents.columns,
    data,
    isStreaming: true,
  };

  const config: GeoChartConfig = {
    chartType: 'geo',
    mapEngine,
    latitude: 'latitude',
    longitude: 'longitude',
    color: 'category',
    size: { key: 'value', min: 4, max: 16 },
    showZoomControl: true,
    showCenterDisplay: true,
    pointOpacity: 0.7,
  };

  const btnBase: React.CSSProperties = {
    padding: '4px 12px',
    border: '1px solid #514e58',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  };
  const active: React.CSSProperties = { ...btnBase, backgroundColor: '#D53F8C', color: '#fff', borderColor: '#D53F8C' };
  const inactive: React.CSSProperties = { ...btnBase, backgroundColor: 'transparent', color: '#9CA3AF' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Map engine:</span>
        <button style={mapEngine === 'l7' ? active : inactive} onClick={() => setMapEngine('l7')}>L7 (WebGL)</button>
        <button style={mapEngine === 'canvas' ? active : inactive} onClick={() => setMapEngine('canvas')}>Canvas</button>
      </div>
      <div style={{ width: '100%', height: '500px' }}>
        <StreamChart config={config} data={source} theme={theme} />
      </div>
    </div>
  );
}

// =============================================================================
// Example 10: Table with Frame-Bound Temporal Mode
// Shows only rows from the latest timestamp (real-time snapshot)
// =============================================================================

export function FrameBoundTable() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 200);

  useEffect(() => {
    const id = setInterval(() => {
      const rows = dataGenerators.metrics.generate();
      append(rows.map(r => [r.timestamp, r.server, r.cpu, r.memory, r.requests]));
    }, dataGenerators.metrics.interval);
    return () => clearInterval(id);
  }, []);

  const dataSource: StreamDataSource = {
    columns: [
      { name: 'timestamp', type: 'datetime64' },
      { name: 'server', type: 'string' },
      { name: 'cpu', type: 'float64' },
      { name: 'memory', type: 'float64' },
      { name: 'requests', type: 'int64' },
    ],
    data,
    isStreaming: true,
  };

  const config: TableConfig = {
    chartType: 'table',
    temporal: {
      mode: 'frame',
      field: 'timestamp',
    },
    tableStyles: {
      timestamp: { name: 'Time', width: 200 },
      server: { name: 'Server', width: 120 },
      cpu: { name: 'CPU %', width: 100 },
      memory: { name: 'Memory %', width: 100 },
      requests: { name: 'Requests', width: 100 },
    },
  };

  return (
    <div>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Frame-bound mode: Shows only the latest timestamp snapshot
      </p>
      <div style={{ width: '100%', height: '300px' }}>
        <StreamChart config={config} data={dataSource} theme={theme} />
      </div>
    </div>
  );
}

// =============================================================================
// Example 11: Table with Key-Bound Temporal Mode
// Keeps latest value per unique key (live dashboard)
// =============================================================================

export function KeyBoundTable() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 500);

  useEffect(() => {
    const services = ['auth-service', 'api-gateway', 'user-service', 'payment-service', 'notification-service'];
    const statuses = ['healthy', 'healthy', 'healthy', 'degraded', 'down'];

    const id = setInterval(() => {
      const service = services[Math.floor(Math.random() * services.length)];
      append([[
        new Date().toISOString(),
        service,
        statuses[Math.floor(Math.random() * statuses.length)],
        Math.floor(Math.random() * 200) + 10,
        99 + (Math.random() - 0.5) * 2,
      ]]);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const dataSource: StreamDataSource = {
    columns: [
      { name: 'last_updated', type: 'datetime64' },
      { name: 'service', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'latency_ms', type: 'int64' },
      { name: 'uptime', type: 'float64' },
    ],
    data,
    isStreaming: true,
  };

  const config: TableConfig = {
    chartType: 'table',
    temporal: {
      mode: 'key',
      field: 'service',
    },
    tableStyles: {
      last_updated: { name: 'Last Updated', width: 200 },
      service: { name: 'Service', width: 150 },
      status: {
        name: 'Status',
        width: 100,
        color: {
          type: 'condition',
          conditions: [
            { operator: 'eq', value: 'down', color: 'rgba(239, 68, 68, 0.3)', highlightRow: true },
            { operator: 'eq', value: 'degraded', color: 'rgba(251, 146, 60, 0.3)' },
            { operator: 'eq', value: 'healthy', color: 'rgba(34, 197, 94, 0.2)' },
          ],
        },
      },
      latency_ms: {
        name: 'Latency (ms)',
        width: 140,
        fractionDigits: 0,
        trend: true,
        increaseColor: '#ef4444',
        decreaseColor: '#22c55e',
        miniChart: 'bar',
      },
      uptime: {
        name: 'Uptime %',
        width: 110,
        fractionDigits: 2,
        trend: true,
        increaseColor: '#22c55e',
        decreaseColor: '#ef4444',
      },
    },
  };

  return (
    <div>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Key-bound mode: latest value per service with trend indicators (▲▼), bar chart, and conditional row highlighting
      </p>
      <div style={{ width: '100%', height: '300px' }}>
        <StreamChart config={config} data={dataSource} theme={theme} />
      </div>
    </div>
  );
}

// =============================================================================
// Example 12: GeoChart with Key-Bound Mode
// Shows latest position per vehicle ID
// =============================================================================

export function KeyBoundGeoChart() {
  const theme = useTheme();
  const [mapEngine, setMapEngine] = useState<'l7' | 'canvas'>('l7');
  const { data, append } = useStreamingData<Record<string, unknown>[]>([], 500);
  const loadedRef = React.useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      append(dataGenerators.vehicles.generate(3));
    }
    const id = setInterval(() => {
      append(dataGenerators.vehicles.generate());
    }, dataGenerators.vehicles.interval);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const source: StreamDataSource = {
    columns: dataGenerators.vehicles.columns,
    data,
    isStreaming: true,
  };

  const config: GeoChartConfig = {
    chartType: 'geo',
    mapEngine,
    latitude: 'latitude',
    longitude: 'longitude',
    temporal: {
      mode: 'key',
      field: 'vehicle_id',
    },
    size: { key: 'speed', min: 6, max: 14 },
    autoFit: true,
    showZoomControl: true,
    showCenterDisplay: true,
    pointOpacity: 0.9,
    color: 'vehicle_id',
  };

  const btnBase: React.CSSProperties = {
    padding: '4px 12px',
    border: '1px solid #514e58',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  };
  const active: React.CSSProperties = { ...btnBase, backgroundColor: '#D53F8C', color: '#fff', borderColor: '#D53F8C' };
  const inactive: React.CSSProperties = { ...btnBase, backgroundColor: 'transparent', color: '#9CA3AF' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Map engine:</span>
        <button style={mapEngine === 'l7' ? active : inactive} onClick={() => setMapEngine('l7')}>L7 (WebGL)</button>
        <button style={mapEngine === 'canvas' ? active : inactive} onClick={() => setMapEngine('canvas')}>Canvas</button>
      </div>
      <div style={{ width: '100%', height: '500px' }}>
        <StreamChart config={config} data={source} theme={theme} />
      </div>
    </div>
  );
}

// =============================================================================
// Example 13: BarColumnChart with Frame-Bound Mode
// Shows current snapshot of category values
// =============================================================================

export function FrameBoundBarChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>([], 100);

  useEffect(() => {
    append(dataGenerators.productInventory.generate());
    const id = setInterval(() => {
      append(dataGenerators.productInventory.generate());
    }, dataGenerators.productInventory.interval);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const source: StreamDataSource = {
    columns: dataGenerators.productInventory.columns,
    data,
    isStreaming: true,
  };

  const config: BarColumnConfig = {
    chartType: 'column',
    xAxis: 'product',
    yAxis: 'sales',
    temporal: { mode: 'frame', field: 'timestamp' },
    dataLabel: true,
    gridlines: true,
    yTitle: 'Sales',
    fractionDigits: 0,
    colors: findPaletteByLabel('Ocean')?.values,
  };

  return (
    <div>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Frame-bound BarChart: Shows only the latest timestamp snapshot
      </p>
      <div style={{ width: '100%', height: '400px' }}>
        <StreamChart config={config} data={source} theme={theme} />
      </div>
    </div>
  );
}

// =============================================================================
// Example 14: TimeSeriesChart with Axis-Bound Temporal Mode
// Uses temporal config for sliding time window
// =============================================================================

export function AxisBoundLineChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>([], 300);

  useEffect(() => {
    const id = setInterval(() => {
      append(dataGenerators.cpuLoad.generate());
    }, dataGenerators.cpuLoad.interval);
    return () => clearInterval(id);
  }, []);

  const source: StreamDataSource = {
    columns: dataGenerators.cpuLoad.columns,
    data,
    isStreaming: true,
  };

  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'time',
    yAxis: 'value',
    temporal: { mode: 'axis', field: 'time', range: 1 },
    lineStyle: 'curve',
    gridlines: true,
    yTitle: 'Metric Value',
    yRange: { min: 0, max: 100 },
    fractionDigits: 1,
  };

  return (
    <div>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Axis-bound mode: 1-minute sliding window (starts with no data)
      </p>
      <div style={{ width: '100%', height: '400px' }}>
        <StreamChart config={config} data={source} theme={theme} />
      </div>
    </div>
  );
}



// =============================================================================
// Example 13: Table with Trend Indicators — Stock Ticker
// Demonstrates ▲▼ trend arrows with fast per-key updates
// =============================================================================

export function TrendIndicatorTable() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 500);

  useEffect(() => {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'TSLA'];
    // Seed initial prices
    const prices: Record<string, number> = {
      AAPL: 185, GOOGL: 140, MSFT: 415, AMZN: 178, NVDA: 880, TSLA: 172,
    };

    const id = setInterval(() => {
      // Update all symbols each tick for fast visible changes
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const prev = prices[symbol];
      const change = (Math.random() - 0.48) * prev * 0.02; // slight upward bias
      const price = Math.max(1, prev + change);
      prices[symbol] = price;
      const changePct = (change / prev) * 100;
      const volume = Math.floor(Math.random() * 50_000_000) + 1_000_000;

      append([[
        new Date().toISOString(),
        symbol,
        price,
        changePct,
        volume,
      ]]);
    }, 400);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dataSource: StreamDataSource = {
    columns: [
      { name: 'time', type: 'datetime64' },
      { name: 'symbol', type: 'string' },
      { name: 'price', type: 'float64' },
      { name: 'change_pct', type: 'float64' },
      { name: 'volume', type: 'int64' },
    ],
    data,
    isStreaming: true,
  };

  const config: TableConfig = {
    chartType: 'table',
    temporal: { mode: 'key', field: 'symbol' },
    tableStyles: {
      time: { name: 'Time', width: 180 },
      symbol: { name: 'Symbol', width: 90 },
      price: {
        name: 'Price ($)',
        width: 120,
        fractionDigits: 2,
        trend: true,
        increaseColor: '#22c55e',
        decreaseColor: '#ef4444',
      },
      change_pct: {
        name: 'Change %',
        width: 120,
        fractionDigits: 2,
        trend: true,
        increaseColor: '#22c55e',
        decreaseColor: '#ef4444',
        color: {
          type: 'condition',
          conditions: [
            { operator: 'lt', value: 0, color: 'rgba(239, 68, 68, 0.15)' },
            { operator: 'gte', value: 0, color: 'rgba(34, 197, 94, 0.12)' },
          ],
        },
      },
      volume: {
        name: 'Volume',
        width: 160,
        fractionDigits: 0,
        miniChart: 'bar',
      },
    },
  };

  return (
    <div>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Stock ticker: ▲▼ trend arrows on price and change%, bar chart for volume, cell color by direction
      </p>
      <div style={{ width: '100%', height: '280px' }}>
        <StreamChart config={config} data={dataSource} theme={theme} />
      </div>
    </div>
  );
}

// =============================================================================
// Example 14: Table with Mini Bar Charts — Server Resources
// Demonstrates bar miniChart for utilization metrics (0–100%)
// =============================================================================

export function MiniBarTable() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 500);

  useEffect(() => {
    const hosts = ['web-01', 'web-02', 'api-01', 'api-02', 'db-primary', 'db-replica'];
    // Seed initial utilizations
    const state: Record<string, { cpu: number; mem: number; disk: number; rps: number }> = {};
    hosts.forEach((h) => {
      state[h] = {
        cpu: 20 + Math.random() * 40,
        mem: 30 + Math.random() * 50,
        disk: 40 + Math.random() * 40,
        rps: Math.floor(Math.random() * 5000) + 500,
      };
    });

    const id = setInterval(() => {
      const host = hosts[Math.floor(Math.random() * hosts.length)];
      const s = state[host];
      // Drift values slowly
      s.cpu = Math.min(99, Math.max(1, s.cpu + (Math.random() - 0.5) * 8));
      s.mem = Math.min(99, Math.max(10, s.mem + (Math.random() - 0.5) * 4));
      s.disk = Math.min(99, Math.max(10, s.disk + (Math.random() - 0.45) * 1));
      s.rps = Math.max(100, s.rps + Math.floor((Math.random() - 0.5) * 800));

      append([[
        new Date().toISOString(),
        host,
        s.cpu,
        s.mem,
        s.disk,
        s.rps,
      ]]);
    }, 600);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dataSource: StreamDataSource = {
    columns: [
      { name: 'time', type: 'datetime64' },
      { name: 'host', type: 'string' },
      { name: 'cpu_pct', type: 'float64' },
      { name: 'mem_pct', type: 'float64' },
      { name: 'disk_pct', type: 'float64' },
      { name: 'rps', type: 'int64' },
    ],
    data,
    isStreaming: true,
  };

  const config: TableConfig = {
    chartType: 'table',
    temporal: { mode: 'key', field: 'host' },
    tableStyles: {
      time: { name: 'Last Seen', width: 180 },
      host: { name: 'Host', width: 110 },
      cpu_pct: {
        name: 'CPU %',
        width: 150,
        fractionDigits: 1,
        miniChart: 'bar',
        trend: true,
        increaseColor: '#ef4444',
        decreaseColor: '#22c55e',
        color: {
          type: 'condition',
          conditions: [
            { operator: 'gte', value: 90, color: 'rgba(239, 68, 68, 0.3)', highlightRow: true },
            { operator: 'gte', value: 70, color: 'rgba(251, 146, 60, 0.2)' },
          ],
        },
      },
      mem_pct: {
        name: 'Memory %',
        width: 150,
        fractionDigits: 1,
        miniChart: 'bar',
        trend: true,
        increaseColor: '#f59e0b',
        decreaseColor: '#22c55e',
      },
      disk_pct: {
        name: 'Disk %',
        width: 150,
        fractionDigits: 1,
        miniChart: 'bar',
      },
      rps: {
        name: 'Req/s',
        width: 130,
        fractionDigits: 0,
        trend: true,
        increaseColor: '#22c55e',
        decreaseColor: '#ef4444',
      },
    },
  };

  return (
    <div>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Server resources: bar charts for CPU/memory/disk utilization, trend arrows on CPU and Req/s, row highlight when CPU ≥ 90%
      </p>
      <div style={{ width: '100%', height: '310px' }}>
        <StreamChart config={config} data={dataSource} theme={theme} />
      </div>
    </div>
  );
}

// =============================================================================
// Markdown Examples
// =============================================================================

// Example 15: Markdown — latest-row substitution (no temporal / frame mode)
// Shows a status summary card updated with the most recent streaming row.
export function MarkdownLatestRow() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 200);

  useEffect(() => {
    const services = ['api-gateway', 'auth-service', 'db-primary', 'cache', 'queue'];
    const statuses = ['healthy', 'degraded', 'healthy', 'healthy', 'healthy'];
    let tick = 0;

    const id = setInterval(() => {
      tick++;
      // Occasionally flip one service to an error state
      const idx = Math.floor(Math.random() * services.length);
      const rps = Math.floor(Math.random() * 8000) + 2000;
      const latency = (Math.random() * 80 + 10).toFixed(1);
      const errors = Math.floor(Math.random() * 5);
      statuses[idx] = errors > 3 ? 'degraded' : 'healthy';

      append([[
        new Date().toISOString(),
        services[idx],
        statuses[idx],
        rps,
        latency,
        errors,
        tick,
      ]]);
    }, 1200);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dataSource: StreamDataSource = {
    columns: [
      { name: 'time', type: 'datetime64' },
      { name: 'service', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'rps', type: 'int64' },
      { name: 'latency_ms', type: 'float64' },
      { name: 'errors', type: 'int64' },
      { name: 'tick', type: 'int64' },
    ],
    data,
    isStreaming: true,
  };

  const config: MarkdownConfig = {
    chartType: 'markdown',
    content: `## System Status

**Last update:** {{time}}

| Field | Value |
|-------|-------|
| Service | **{{service}}** |
| Status | {{status}} |
| Requests/s | {{rps}} |
| Latency | {{latency_ms}} ms |
| Errors | {{errors}} |

> Values reflect the most recently received data row.`,
  };

  return (
    <div style={{ width: '100%', height: '340px' }}>
      <StreamChart config={config} data={dataSource} theme={theme} />
    </div>
  );
}

// Example 16: Markdown — frame mode (latest snapshot per timestamp)
export function MarkdownFrameBound() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 200);

  useEffect(() => {
    const id = setInterval(() => {
      const cpu = (Math.random() * 60 + 20).toFixed(1);
      const mem = (Math.random() * 40 + 40).toFixed(1);
      const disk = (Math.random() * 20 + 60).toFixed(1);
      const uptime = Math.floor(Date.now() / 1000) % 86400;
      append([[new Date().toISOString(), cpu, mem, disk, uptime]]);
    }, 1500);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dataSource: StreamDataSource = {
    columns: [
      { name: 'time', type: 'datetime64' },
      { name: 'cpu_pct', type: 'float64' },
      { name: 'mem_pct', type: 'float64' },
      { name: 'disk_pct', type: 'float64' },
      { name: 'uptime_s', type: 'int64' },
    ],
    data,
    isStreaming: true,
  };

  const config: MarkdownConfig = {
    chartType: 'markdown',
    temporal: { mode: 'frame', field: 'time' },
    content: `## Host Snapshot

- **CPU:** {{cpu_pct}}%
- **Memory:** {{mem_pct}}%
- **Disk:** {{disk_pct}}%
- **Uptime:** {{uptime_s}} s

_Snapshot updated on every new timestamp (frame mode)._`,
  };

  return (
    <div style={{ width: '100%', height: '260px' }}>
      <StreamChart config={config} data={dataSource} theme={theme} />
    </div>
  );
}

// Example 17: Markdown — key mode (per-entity substitution via {{@key::field}})
export function MarkdownKeyBound() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 200);

  useEffect(() => {
    const regions: Record<string, { temp: number; humidity: number; wind: number }> = {
      'New York': { temp: 18, humidity: 55, wind: 12 },
      'London': { temp: 12, humidity: 70, wind: 18 },
      'Tokyo': { temp: 22, humidity: 65, wind: 8 },
    };

    const id = setInterval(() => {
      const name = Object.keys(regions)[Math.floor(Math.random() * 3)];
      const r = regions[name];
      r.temp += (Math.random() - 0.5) * 2;
      r.humidity = Math.min(99, Math.max(10, r.humidity + (Math.random() - 0.5) * 3));
      r.wind = Math.max(0, r.wind + (Math.random() - 0.5) * 4);

      append([[
        new Date().toISOString(),
        name,
        r.temp.toFixed(1),
        r.humidity.toFixed(0),
        r.wind.toFixed(1),
      ]]);
    }, 800);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dataSource: StreamDataSource = {
    columns: [
      { name: 'time', type: 'datetime64' },
      { name: 'city', type: 'string' },
      { name: 'temp_c', type: 'float64' },
      { name: 'humidity', type: 'int64' },
      { name: 'wind_kph', type: 'float64' },
    ],
    data,
    isStreaming: true,
  };

  const config: MarkdownConfig = {
    chartType: 'markdown',
    temporal: { mode: 'key', field: 'city' },
    content: `## Weather Dashboard

| City | Temp | Humidity | Wind |
|------|------|----------|------|
| New York | {{@New York::temp_c}} °C | {{@New York::humidity}}% | {{@New York::wind_kph}} kph |
| London | {{@London::temp_c}} °C | {{@London::humidity}}% | {{@London::wind_kph}} kph |
| Tokyo | {{@Tokyo::temp_c}} °C | {{@Tokyo::humidity}}% | {{@Tokyo::wind_kph}} kph |

> Each city's values update independently as new data arrives (key mode).`,
  };

  return (
    <div style={{ width: '100%', height: '280px' }}>
      <StreamChart config={config} data={dataSource} theme={theme} />
    </div>
  );
}

// =============================================================================
// Default Export - All Examples
// =============================================================================

export default {
  BasicLineChart,
  MultiSeriesAreaChart,
  StackedBarChart,
  GroupedBarChart,
  SingleValueWithSparkline,
  MultipleValueExample,
  StreamingDataTable,
  MetricsDashboard,
  ChartWithTableToggle,
  StreamingGeoChart,
  // Temporal binding examples
  FrameBoundTable,
  KeyBoundTable,
  KeyBoundGeoChart,
  FrameBoundBarChart,
  AxisBoundLineChart,
  // Table feature examples
  TrendIndicatorTable,
  MiniBarTable,
  // Markdown examples
  MarkdownLatestRow,
  MarkdownFrameBound,
  MarkdownKeyBound,
};
