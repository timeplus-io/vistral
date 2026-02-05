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

// Hook to get current theme
function useTheme() {
  const context = useContext(ThemeContext);
  return context?.theme || 'dark';
}

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
  const theme = useTheme();
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
      <StreamChart config={config} data={data} theme={theme} />
    </div>
  );
}

// =============================================================================
// Example 2: Multi-Series Streaming Area Chart
// =============================================================================

export function MultiSeriesAreaChart() {
  const theme = useTheme();
  // Using 'regional_sales' generator
  const { data, append } = useStreamingData<Record<string, unknown>[]>(
    [],
    180 // Keep ~180 points (60 per series * 3 series)
  );

  useEffect(() => {
    const generator = dataGenerators.regional_sales;

    // Simulate streaming
    const interval = setInterval(() => {
      const newData = generator.generate();
      append(newData);
    }, generator.interval);

    return () => clearInterval(interval);
  }, [append]);

  const source: StreamDataSource = {
    columns: dataGenerators.regional_sales.columns,
    data: data,
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
      <StreamChart config={config} data={source} theme={theme} />
    </div>
  );
}

// =============================================================================
// Example 3: Streaming Stacked Column Chart
// =============================================================================

export function StackedBarChart() {
  const theme = useTheme();
  // Using 'revenue' generator from data-utils
  const { data, append } = useStreamingData<Record<string, unknown>[]>(
    [],
    20 // Keep enough history if needed, though this updates in-place conceptually
  );

  useEffect(() => {
    // Initial fetch
    const generator = dataGenerators.revenue;

    // Simulate streaming by calling generator
    const interval = setInterval(() => {
      const newData = generator.generate();
      // For this specific chart, we are replacing the whole dataset effectively each tick
      // But useStreamingData appends. 
      // Wait, StreamChart expects a stream. If we want to update the bars in place, we usually use `isStreaming: true` and push updates.
      // However, the original code used `setRevenues` which updated the *source* state, causing a re-render with new data array.
      // Vistral's StreamChart with isStreaming: true and VistralChart handle appends.
      // For a bar chart where categories are fixed (Q1-Q4), we might want to REPLACE data or just append new snapshots?
      // The original logic updated keys in place. 

      // Actually, StreamChart reacts to `data` prop changes.
      // If we use useStreamingData, it appends.
      // If we want to replace/update existing keys (like Q1 A changing value), we should probably just use local state + generator
      // OR better: use existing Vistral behavior.

      // Let's stick to the pattern:
      // We can just call generator.generate() and pass it to StreamChart if we don't need history.
      // BUT, useStreamingData is good for appending.
      // The generator returns the FULL set of bars (12 items) every time.
      // If we append 12 items every 1.5s, the chart will grow indefinitely or shift if we slice.
      // The original code passed the 12 items as the `data` prop every render.

      // So let's use useState + generator.generate()
      append(newData);
    }, generator.interval);

    return () => clearInterval(interval);
  }, [append]);

  const source: StreamDataSource = {
    columns: dataGenerators.revenue.columns,
    // We only want the latest snapshot for this visualization, but StreamChart might expect history?
    // The original code was: data: [ ...12 items... ]. 
    // It updated those 12 items in place.
    // If we simply pass the latest generated batch, it mimics that.
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
  // Using 'sales' generator
  const { data, append } = useStreamingData<Record<string, unknown>[]>(
    [],
    12 // Keep enough history for snapshot
  );

  useEffect(() => {
    const generator = dataGenerators.sales;

    // Simulate streaming
    const interval = setInterval(() => {
      const newData = generator.generate();
      append(newData);
    }, generator.interval);

    return () => clearInterval(interval);
  }, [append]);

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
  const [points, setPoints] = useState<unknown[][]>(() => {
    // Initialize with some random points around the world
    const initialPoints: unknown[][] = [];
    const cities = [
      { lat: 40.7128, lng: -74.006, name: 'New York' },
      { lat: 51.5074, lng: -0.1278, name: 'London' },
      { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
      { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
      { lat: 48.8566, lng: 2.3522, name: 'Paris' },
      { lat: 55.7558, lng: 37.6173, name: 'Moscow' },
      { lat: -23.5505, lng: -46.6333, name: 'São Paulo' },
      { lat: 19.4326, lng: -99.1332, name: 'Mexico City' },
      { lat: 31.2304, lng: 121.4737, name: 'Shanghai' },
      { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
    ];

    cities.forEach((city) => {
      // Add some random variation
      for (let i = 0; i < 3; i++) {
        initialPoints.push([
          city.lat + (Math.random() - 0.5) * 2,
          city.lng + (Math.random() - 0.5) * 2,
          Math.floor(Math.random() * 100),
          city.name,
        ]);
      }
    });
    return initialPoints;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Add a new random point
      const lat = (Math.random() - 0.5) * 140; // -70 to 70
      const lng = (Math.random() - 0.5) * 360; // -180 to 180
      const value = Math.floor(Math.random() * 100);
      const categories = ['Category A', 'Category B', 'Category C'];
      const category = categories[Math.floor(Math.random() * categories.length)];

      setPoints((prev) => {
        const updated = [...prev, [lat, lng, value, category]];
        return updated.slice(-100); // Keep last 100 points
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const data: StreamDataSource = {
    columns: [
      { name: 'latitude', type: 'float64' },
      { name: 'longitude', type: 'float64' },
      { name: 'value', type: 'int64' },
      { name: 'category', type: 'string' },
    ],
    data: points,
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
      <StreamChart config={config} data={data} theme={theme} />
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
    const servers = ['server-01', 'server-02', 'server-03', 'server-04'];

    const interval = setInterval(() => {
      const now = new Date().toISOString();
      // Add metrics for all servers at the same timestamp
      const newRows = servers.map(server => [
        now,
        server,
        generateNextValue(50, 10, 95, 0.2), // CPU
        generateNextValue(60, 20, 90, 0.15), // Memory
        Math.floor(Math.random() * 1000) + 100, // Requests
      ]);
      append(newRows);
    }, 2000);

    return () => clearInterval(interval);
  }, [append]);

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

  // Using new temporal config for frame-bound mode
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

    const interval = setInterval(() => {
      // Update a random service
      const service = services[Math.floor(Math.random() * services.length)];
      const statuses = ['healthy', 'healthy', 'healthy', 'degraded', 'down'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      append([[
        new Date().toISOString(),
        service,
        status,
        Math.floor(Math.random() * 200) + 10, // latency
        generateNextValue(99, 95, 100, 0.02), // uptime
      ]]);
    }, 1000);

    return () => clearInterval(interval);
  }, [append]);

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

  // Using new temporal config for key-bound mode
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
  const [points, setPoints] = useState<unknown[][]>(() => {
    // Initialize vehicles with starting positions
    const vehicles: unknown[][] = [];
    for (let i = 1; i <= 10; i++) {
      vehicles.push([
        new Date().toISOString(),
        `vehicle-${i}`,
        40 + Math.random() * 5,  // lat around NYC area
        -74 + Math.random() * 2, // lng around NYC area
        Math.floor(Math.random() * 60) + 20, // speed
      ]);
    }
    return vehicles;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Update a random vehicle's position
      const vehicleId = `vehicle-${Math.floor(Math.random() * 10) + 1}`;

      setPoints(prev => {
        // Find current position of this vehicle
        const currentVehicle = prev.find(p => p[1] === vehicleId);
        const currentLat = currentVehicle ? Number(currentVehicle[2]) : 42;
        const currentLng = currentVehicle ? Number(currentVehicle[3]) : -73;

        // Move slightly
        const newLat = currentLat + (Math.random() - 0.5) * 0.1;
        const newLng = currentLng + (Math.random() - 0.5) * 0.1;

        return [
          ...prev,
          [
            new Date().toISOString(),
            vehicleId,
            newLat,
            newLng,
            Math.floor(Math.random() * 60) + 20,
          ],
        ].slice(-200); // Keep history for key-bound deduplication
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const data: StreamDataSource = {
    columns: [
      { name: 'timestamp', type: 'datetime64' },
      { name: 'vehicle_id', type: 'string' },
      { name: 'lat', type: 'float64' },
      { name: 'lng', type: 'float64' },
      { name: 'speed', type: 'int64' },
    ],
    data: points,
    isStreaming: true,
  };

  // Using new temporal config for key-bound mode
  const config: GeoChartConfig = {
    chartType: 'geo',
    latitude: 'lat',
    longitude: 'lng',
    temporal: {
      mode: 'key',
      field: 'vehicle_id',
    },
    size: {
      key: 'speed',
      min: 6,
      max: 14,
    },
    center: [41, -73],
    zoom: 7,
    showZoomControl: true,
    showCenterDisplay: true,
    pointOpacity: 0.9,
    pointColor: '#10B981',
  };

  return (
    <div>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Key-bound GeoChart: Shows latest position per vehicle (10 vehicles tracking)
      </p>
      <div style={{ width: '100%', height: '500px' }}>
        <StreamChart config={config} data={data} theme={theme} />
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
  const [dataPoints, setDataPoints] = useState<unknown[][]>(() => {
    const now = new Date().toISOString();
    return [
      [now, 'Widgets', 120],
      [now, 'Gadgets', 85],
      [now, 'Gizmos', 95],
      [now, 'Doodads', 65],
    ];
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      setDataPoints(prev => [
        ...prev,
        [now, 'Widgets', generateNextValue(Number(prev[prev.length - 4]?.[2] || 120), 80, 160, 0.1)],
        [now, 'Gadgets', generateNextValue(Number(prev[prev.length - 3]?.[2] || 85), 50, 120, 0.1)],
        [now, 'Gizmos', generateNextValue(Number(prev[prev.length - 2]?.[2] || 95), 60, 130, 0.1)],
        [now, 'Doodads', generateNextValue(Number(prev[prev.length - 1]?.[2] || 65), 40, 100, 0.1)],
      ].slice(-100)); // Keep some history
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const data: StreamDataSource = {
    columns: [
      { name: 'timestamp', type: 'datetime64' },
      { name: 'product', type: 'string' },
      { name: 'sales', type: 'float64' },
    ],
    data: dataPoints,
    isStreaming: true,
  };

  // Using new temporal config for frame-bound mode
  const config: BarColumnConfig = {
    chartType: 'column',
    xAxis: 'product',
    yAxis: 'sales',
    temporal: {
      mode: 'frame',
      field: 'timestamp',
    },
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
        <StreamChart config={config} data={data} theme={theme} />
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
  const [dataPoints, setDataPoints] = useState<unknown[][]>(() => {
    const now = Date.now();
    const points: unknown[][] = [];
    let value = 50;
    for (let i = 120; i >= 0; i--) {
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

      setDataPoints(prev => [...prev, newPoint].slice(-300)); // Keep 5 minutes of data
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const data: StreamDataSource = {
    columns: [
      { name: 'timestamp', type: 'datetime64' },
      { name: 'value', type: 'float64' },
    ],
    data: dataPoints,
    isStreaming: true,
  };

  // Using new temporal config for axis-bound mode (sliding window)
  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'timestamp',
    yAxis: 'value',
    temporal: {
      mode: 'axis',
      field: 'timestamp',
      range: 1, // 1 minute sliding window
    },
    lineStyle: 'curve',
    gridlines: true,
    yTitle: 'Metric Value',
    yRange: { min: 0, max: 100 },
    fractionDigits: 1,
  };

  return (
    <div>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Axis-bound mode: 1-minute sliding window
      </p>
      <div style={{ width: '100%', height: '400px' }}>
        <StreamChart config={config} data={data} theme={theme} />
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
