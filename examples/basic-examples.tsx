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
  type StreamDataSource,
  type TimeSeriesConfig,
  type BarColumnConfig,
  type SingleValueConfig,
  type TableConfig,
  type GeoChartConfig,
} from '@timeplus/vistral';
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
// Example 9: Streaming Geo Chart
// =============================================================================

export function StreamingGeoChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>([], 300);
  const loadedRef = React.useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      append(dataGenerators.globalEvents.generate(40));
    }
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
    latitude: 'latitude',
    longitude: 'longitude',
    color: 'category',
    size: {
      key: 'value',
      min: 4,
      max: 16,
    },
    zoom: 2,
    showZoomControl: true,
    showCenterDisplay: true,
    pointOpacity: 0.7,
  };

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <StreamChart config={config} data={source} theme={theme} />
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
            { operator: 'eq', value: 'down' as unknown as number, color: 'rgba(239, 68, 68, 0.3)' },
            { operator: 'eq', value: 'degraded' as unknown as number, color: 'rgba(251, 146, 60, 0.3)' },
          ],
        },
      },
      latency_ms: { name: 'Latency (ms)', width: 120 },
      uptime: { name: 'Uptime %', width: 100 },
    },
  };

  return (
    <div>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Key-bound mode: Shows latest value per service (deduplication by key)
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
  const { data, append } = useStreamingData<Record<string, unknown>[]>([], 500);
  const loadedRef = React.useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      append(dataGenerators.vehicles.generate(10));
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
    latitude: 'latitude',
    longitude: 'longitude',
    temporal: {
      mode: 'key',
      field: 'vehicle_id',
    },
    size: {
      key: 'speed',
      min: 6,
      max: 14,
    },
    center: [40, -74],
    zoom: 5,
    showZoomControl: true,
    showCenterDisplay: true,
    pointOpacity: 0.9,
    color: 'vehicle_id',
  };

  return (
    <div>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Key-bound GeoChart: Shows latest position per vehicle (vehicles in NYC area)
      </p>
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
// Default Export - All Examples
// =============================================================================

export default {
  BasicLineChart,
  MultiSeriesAreaChart,
  StackedBarChart,
  GroupedBarChart,
  SingleValueWithSparkline,
  StreamingDataTable,
  MetricsDashboard,
  ChartWithTableToggle,
  StreamingGeoChart,
  // New temporal binding examples
  FrameBoundTable,
  KeyBoundTable,
  KeyBoundGeoChart,
  FrameBoundBarChart,
  AxisBoundLineChart,
};
