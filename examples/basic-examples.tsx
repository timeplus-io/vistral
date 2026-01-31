/**
 * @timeplus/vistral - Streaming Examples
 *
 * This file demonstrates streaming data visualization patterns.
 * All examples use simulated real-time data updates.
 */

import React, { useState, useEffect } from 'react';
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
} from '@timeplus/vistral';

// =============================================================================
// Helper: Generate random value with some continuity
// =============================================================================

function generateNextValue(current: number, min: number, max: number, volatility: number = 0.1): number {
  const change = (Math.random() - 0.5) * 2 * volatility * (max - min);
  return Math.min(max, Math.max(min, current + change));
}

// =============================================================================
// Example 1: Streaming Line Chart
// =============================================================================

export function BasicLineChart() {
  const [dataPoints, setDataPoints] = useState<unknown[][]>(() => {
    // Initialize with some historical data
    const now = Date.now();
    const points: unknown[][] = [];
    let value = 50;
    for (let i = 30; i >= 0; i--) {
      value = generateNextValue(value, 20, 80, 0.15);
      points.push([new Date(now - i * 1000).toISOString(), value]);
    }
    return points;
  });

  useEffect(() => {
    let currentValue = dataPoints.length > 0
      ? (dataPoints[dataPoints.length - 1][1] as number)
      : 50;

    const interval = setInterval(() => {
      currentValue = generateNextValue(currentValue, 20, 80, 0.15);
      const newPoint = [new Date().toISOString(), currentValue];

      setDataPoints(prev => {
        const updated = [...prev, newPoint];
        // Keep last 60 points
        return updated.slice(-60);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const data: StreamDataSource = {
    columns: [
      { name: 'timestamp', type: 'datetime64' },
      { name: 'cpu_usage', type: 'float64' },
    ],
    data: dataPoints,
    isStreaming: true,
  };

  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'timestamp',
    yAxis: 'cpu_usage',
    lineStyle: 'curve',
    gridlines: true,
    yTitle: 'CPU Usage (%)',
    yRange: { min: 0, max: 100 },
    unit: { position: 'right', value: '%' },
    fractionDigits: 1,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={data} theme="dark" />
    </div>
  );
}

// =============================================================================
// Example 2: Multi-Series Streaming Area Chart
// =============================================================================

export function MultiSeriesAreaChart() {
  const [dataPoints, setDataPoints] = useState<unknown[][]>(() => {
    const now = Date.now();
    const points: unknown[][] = [];
    let usValue = 100, euValue = 80, apacValue = 60;

    for (let i = 20; i >= 0; i--) {
      const time = new Date(now - i * 2000).toISOString();
      usValue = generateNextValue(usValue, 50, 200, 0.1);
      euValue = generateNextValue(euValue, 40, 150, 0.1);
      apacValue = generateNextValue(apacValue, 30, 120, 0.1);
      points.push([time, usValue, 'US']);
      points.push([time, euValue, 'EU']);
      points.push([time, apacValue, 'APAC']);
    }
    return points;
  });

  const valuesRef = React.useRef({ us: 120, eu: 95, apac: 75 });

  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toISOString();
      valuesRef.current.us = generateNextValue(valuesRef.current.us, 50, 200, 0.1);
      valuesRef.current.eu = generateNextValue(valuesRef.current.eu, 40, 150, 0.1);
      valuesRef.current.apac = generateNextValue(valuesRef.current.apac, 30, 120, 0.1);

      setDataPoints(prev => {
        const updated = [
          ...prev,
          [time, valuesRef.current.us, 'US'],
          [time, valuesRef.current.eu, 'EU'],
          [time, valuesRef.current.apac, 'APAC'],
        ];
        // Keep last 60 points per series (180 total)
        return updated.slice(-180);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const data: StreamDataSource = {
    columns: [
      { name: 'time', type: 'datetime64' },
      { name: 'value', type: 'float64' },
      { name: 'region', type: 'string' },
    ],
    data: dataPoints,
    isStreaming: true,
  };

  const config: TimeSeriesConfig = {
    chartType: 'area',
    xAxis: 'time',
    yAxis: 'value',
    color: 'region',
    legend: true,
    gridlines: true,
    xTitle: 'Time',
    yTitle: 'Active Users',
    colors: findPaletteByLabel('Morning')?.values,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={data} theme="dark" />
    </div>
  );
}

// =============================================================================
// Example 3: Streaming Stacked Column Chart
// =============================================================================

export function StackedBarChart() {
  const [revenues, setRevenues] = useState({
    Q1: { A: 45000, B: 32000, C: 28000 },
    Q2: { A: 52000, B: 38000, C: 35000 },
    Q3: { A: 48000, B: 42000, C: 31000 },
    Q4: { A: 61000, B: 45000, C: 42000 },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRevenues(prev => ({
        Q1: {
          A: generateNextValue(prev.Q1.A, 30000, 70000, 0.05),
          B: generateNextValue(prev.Q1.B, 20000, 50000, 0.05),
          C: generateNextValue(prev.Q1.C, 15000, 40000, 0.05),
        },
        Q2: {
          A: generateNextValue(prev.Q2.A, 35000, 75000, 0.05),
          B: generateNextValue(prev.Q2.B, 25000, 55000, 0.05),
          C: generateNextValue(prev.Q2.C, 20000, 50000, 0.05),
        },
        Q3: {
          A: generateNextValue(prev.Q3.A, 30000, 70000, 0.05),
          B: generateNextValue(prev.Q3.B, 28000, 58000, 0.05),
          C: generateNextValue(prev.Q3.C, 18000, 45000, 0.05),
        },
        Q4: {
          A: generateNextValue(prev.Q4.A, 40000, 85000, 0.05),
          B: generateNextValue(prev.Q4.B, 30000, 60000, 0.05),
          C: generateNextValue(prev.Q4.C, 25000, 55000, 0.05),
        },
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const data: StreamDataSource = {
    columns: [
      { name: 'quarter', type: 'string' },
      { name: 'revenue', type: 'float64' },
      { name: 'product', type: 'string' },
    ],
    data: [
      ['Q1', revenues.Q1.A, 'Product A'],
      ['Q1', revenues.Q1.B, 'Product B'],
      ['Q1', revenues.Q1.C, 'Product C'],
      ['Q2', revenues.Q2.A, 'Product A'],
      ['Q2', revenues.Q2.B, 'Product B'],
      ['Q2', revenues.Q2.C, 'Product C'],
      ['Q3', revenues.Q3.A, 'Product A'],
      ['Q3', revenues.Q3.B, 'Product B'],
      ['Q3', revenues.Q3.C, 'Product C'],
      ['Q4', revenues.Q4.A, 'Product A'],
      ['Q4', revenues.Q4.B, 'Product B'],
      ['Q4', revenues.Q4.C, 'Product C'],
    ],
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
      <StreamChart config={config} data={data} theme="dark" />
    </div>
  );
}

// =============================================================================
// Example 4: Streaming Grouped Bar Chart
// =============================================================================

export function GroupedBarChart() {
  const [values, setValues] = useState({
    Electronics: { '2023': 85, '2024': 92 },
    Clothing: { '2023': 62, '2024': 71 },
    Food: { '2023': 45, '2024': 48 },
    Books: { '2023': 28, '2024': 35 },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setValues(prev => ({
        Electronics: {
          '2023': generateNextValue(prev.Electronics['2023'], 60, 100, 0.08),
          '2024': generateNextValue(prev.Electronics['2024'], 70, 110, 0.08),
        },
        Clothing: {
          '2023': generateNextValue(prev.Clothing['2023'], 40, 80, 0.08),
          '2024': generateNextValue(prev.Clothing['2024'], 50, 90, 0.08),
        },
        Food: {
          '2023': generateNextValue(prev.Food['2023'], 30, 60, 0.08),
          '2024': generateNextValue(prev.Food['2024'], 35, 65, 0.08),
        },
        Books: {
          '2023': generateNextValue(prev.Books['2023'], 15, 45, 0.08),
          '2024': generateNextValue(prev.Books['2024'], 20, 50, 0.08),
        },
      }));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const data: StreamDataSource = {
    columns: [
      { name: 'category', type: 'string' },
      { name: 'value', type: 'float64' },
      { name: 'year', type: 'string' },
    ],
    data: [
      ['Electronics', values.Electronics['2023'], '2023'],
      ['Electronics', values.Electronics['2024'], '2024'],
      ['Clothing', values.Clothing['2023'], '2023'],
      ['Clothing', values.Clothing['2024'], '2024'],
      ['Food', values.Food['2023'], '2023'],
      ['Food', values.Food['2024'], '2024'],
      ['Books', values.Books['2023'], '2023'],
      ['Books', values.Books['2024'], '2024'],
    ],
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
      <StreamChart config={config} data={data} theme="dark" />
    </div>
  );
}

// =============================================================================
// Example 5: Single Value with Sparkline (Streaming)
// =============================================================================

export function SingleValueWithSparkline() {
  const [value, setValue] = useState(1234);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(prev => {
        const newValue = Math.floor(generateNextValue(prev, 800, 1800, 0.1));
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const data: StreamDataSource = {
    columns: [{ name: 'activeUsers', type: 'int64' }],
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
      <StreamChart config={config} data={data} theme="dark" />
    </div>
  );
}

// =============================================================================
// Example 6: Streaming Data Table
// =============================================================================

export function StreamingDataTable() {
  const { data, append } = useStreamingData<unknown[]>([], 50);

  useEffect(() => {
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const messages = [
      'User login successful',
      'API request completed',
      'Database query executed',
      'Cache hit for key',
      'Connection established',
      'Request timeout',
      'Invalid token detected',
      'Rate limit exceeded',
      'Memory usage high',
      'Background job started',
    ];

    const interval = setInterval(() => {
      const now = new Date().toISOString();
      const level = levels[Math.floor(Math.random() * levels.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      const duration = Math.floor(Math.random() * 500) + 10;

      // Wrap in array since append treats arrays as multiple items
      append([[now, level, message, duration]]);
    }, 800);

    return () => clearInterval(interval);
  }, [append]);

  const dataSource: StreamDataSource = {
    columns: [
      { name: 'timestamp', type: 'datetime64' },
      { name: 'level', type: 'string' },
      { name: 'message', type: 'string' },
      { name: 'duration_ms', type: 'int64' },
    ],
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
      message: { name: 'Message', width: 300 },
      duration_ms: { name: 'Duration (ms)', width: 120 },
    },
    tableWrap: false,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={dataSource} theme="dark" />
    </div>
  );
}

// =============================================================================
// Example 7: Real-time Metrics Dashboard
// =============================================================================

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 62,
    requests: 1520,
    errors: 3,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: generateNextValue(prev.cpu, 10, 95, 0.15),
        memory: generateNextValue(prev.memory, 30, 90, 0.08),
        requests: prev.requests + Math.floor(Math.random() * 50) + 10,
        errors: prev.errors + (Math.random() > 0.85 ? 1 : 0),
      }));
    }, 1000);

    return () => clearInterval(interval);
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
          theme="dark"
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
          theme="dark"
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
          theme="dark"
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
          theme="dark"
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
  const [showTable, setShowTable] = useState(false);
  const [dataPoints, setDataPoints] = useState<unknown[][]>(() => {
    const now = Date.now();
    const points: unknown[][] = [];
    let temp = 22, humidity = 45;

    for (let i = 20; i >= 0; i--) {
      temp = generateNextValue(temp, 18, 30, 0.1);
      humidity = generateNextValue(humidity, 30, 70, 0.1);
      points.push([new Date(now - i * 3000).toISOString(), temp, humidity]);
    }
    return points;
  });

  const valuesRef = React.useRef({ temp: 24, humidity: 45 });

  useEffect(() => {
    const interval = setInterval(() => {
      valuesRef.current.temp = generateNextValue(valuesRef.current.temp, 18, 30, 0.1);
      valuesRef.current.humidity = generateNextValue(valuesRef.current.humidity, 30, 70, 0.1);

      setDataPoints(prev => {
        const updated = [
          ...prev,
          [new Date().toISOString(), valuesRef.current.temp, valuesRef.current.humidity],
        ];
        return updated.slice(-30);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const data: StreamDataSource = {
    columns: [
      { name: 'timestamp', type: 'datetime64' },
      { name: 'temperature', type: 'float64' },
      { name: 'humidity', type: 'float64' },
    ],
    data: dataPoints,
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
          theme="dark"
          showTable={showTable}
        />
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
};
