/**
 * Example source code for display in the Code tab
 * Each key matches the example name in App.tsx
 */

export const exampleSources: Record<string, string> = {
     'Line Chart': `import { StreamChart, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';
import { useTheme } from './App';

function BasicLineChart() {
  const theme = useTheme();
  const [dataPoints, setDataPoints] = useState<unknown[][]>(() => {
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
}`,

     'Area Chart': `import { StreamChart, useStreamingData, findPaletteByLabel, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function MultiSeriesAreaChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>(
    [],
    240 // Keep ~240 points
  );

  useEffect(() => {
    const generator = dataGenerators.sensors;

    const interval = setInterval(() => {
      const newData = generator.generate();
      append(newData);
    }, generator.interval);

    return () => clearInterval(interval);
  }, [append]);

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
    yTitle: 'Temperature (°C)',
    colors: findPaletteByLabel('Morning')?.values,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={source} theme={theme} />
    </div>
  );
}`,

     'Column Chart (Stacked)': `import { StreamChart, useStreamingData, findPaletteByLabel, type StreamDataSource, type BarColumnConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function StackedBarChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>(
    [],
    20
  );

  useEffect(() => {
    const generator = dataGenerators.revenue;

    const interval = setInterval(() => {
      const newData = generator.generate();
      append(newData);
    }, generator.interval);

    return () => clearInterval(interval);
  }, [append]);

  const source: StreamDataSource = {
    columns: dataGenerators.revenue.columns,
    data: data.slice(-12),
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
}`,

     'Bar Chart (Grouped)': `import { StreamChart, useStreamingData, type StreamDataSource, type BarColumnConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function GroupedBarChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>(
    [],
    12
  );

  useEffect(() => {
    const generator = dataGenerators.sales;

    const interval = setInterval(() => {
      const newData = generator.generate();
      append(newData);
    }, generator.interval);

    return () => clearInterval(interval);
  }, [append]);

  const source: StreamDataSource = {
    columns: dataGenerators.sales.columns,
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
}`,

  'Single Value': `import { StreamChart, type StreamDataSource, type SingleValueConfig } from '@timeplus/vistral';

function SingleValue() {
  const [value, setValue] = useState(1234);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(prev => Math.floor(generateNextValue(prev, 800, 1800, 0.1)));
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
}`,

     'Data Table': `import { StreamChart, useStreamingData, type StreamDataSource, type TableConfig } from '@timeplus/vistral';
import { useTheme } from './App';

function StreamingDataTable() {
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
}`,

     'Metrics Dashboard': `import { SingleValueChart, type StreamDataSource } from '@timeplus/vistral';
import { useTheme } from './App';

function MetricsDashboard() {
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
}`,

     'Chart/Table Toggle': `import { StreamChart, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';
import { useTheme } from './App';

function ChartWithTableToggle() {
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

  const valuesRef = useRef({ temp: 24, humidity: 45 });

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
}`,

     'Geo Chart': `import { StreamChart, type StreamDataSource, type GeoChartConfig } from '@timeplus/vistral';
import { useTheme } from './App';

function StreamingGeoChart() {
  const theme = useTheme();
  const [points, setPoints] = useState<unknown[][]>(() => {
    const initialPoints: unknown[][] = [];
    const cities = [
      { lat: 40.7128, lng: -74.006 },
      { lat: 51.5074, lng: -0.1278 },
      { lat: 35.6762, lng: 139.6503 },
    ];

    cities.forEach((city) => {
      for (let i = 0; i < 3; i++) {
        initialPoints.push([
          city.lat + (Math.random() - 0.5) * 2,
          city.lng + (Math.random() - 0.5) * 2,
          Math.floor(Math.random() * 100),
          'Category A',
        ]);
      }
    });
    return initialPoints;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const lat = (Math.random() - 0.5) * 140;
      const lng = (Math.random() - 0.5) * 360;
      const value = Math.floor(Math.random() * 100);
      const categories = ['Category A', 'Category B', 'Category C'];
      const category = categories[Math.floor(Math.random() * categories.length)];

      setPoints((prev) => {
        const updated = [...prev, [lat, lng, value, category]];
        return updated.slice(-100);
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
}`,

     'Table (Frame-Bound)': `import { StreamChart, useStreamingData, type StreamDataSource, type TableConfig } from '@timeplus/vistral';
import { useTheme } from './App';

function FrameBoundTable() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 200);

  useEffect(() => {
    const servers = ['server-01', 'server-02', 'server-03', 'server-04'];

    const interval = setInterval(() => {
      const now = new Date().toISOString();
      const newRows = servers.map(server => [
        now,
        server,
        generateNextValue(50, 10, 95, 0.2),
        generateNextValue(60, 20, 90, 0.15),
        Math.floor(Math.random() * 1000) + 100,
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
}`,

     'Table (Key-Bound)': `import { StreamChart, useStreamingData, type StreamDataSource, type TableConfig } from '@timeplus/vistral';
import { useTheme } from './App';

function KeyBoundTable() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 500);

  useEffect(() => {
    const services = ['auth-service', 'api-gateway', 'user-service', 'payment-service', 'notification-service'];

    const interval = setInterval(() => {
      const service = services[Math.floor(Math.random() * services.length)];
      const statuses = ['healthy', 'healthy', 'healthy', 'degraded', 'down'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      append([[
        new Date().toISOString(),
        service,
        status,
        Math.floor(Math.random() * 200) + 10,
        generateNextValue(99, 95, 100, 0.02),
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
}`,

     'Geo Chart (Key-Bound)': `import { StreamChart, type StreamDataSource, type GeoChartConfig } from '@timeplus/vistral';
import { useTheme } from './App';

function KeyBoundGeoChart() {
  const theme = useTheme();
  const [points, setPoints] = useState<unknown[][]>(() => {
    const vehicles: unknown[][] = [];
    for (let i = 1; i <= 10; i++) {
      vehicles.push([
        new Date().toISOString(),
        \`vehicle-\${i}\`,
        40 + Math.random() * 5,
        -74 + Math.random() * 2,
        Math.floor(Math.random() * 60) + 20,
      ]);
    }
    return vehicles;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const vehicleId = \`vehicle-\${Math.floor(Math.random() * 10) + 1}\`;

      setPoints(prev => {
        const currentVehicle = prev.find(p => p[1] === vehicleId);
        const currentLat = currentVehicle ? Number(currentVehicle[2]) : 42;
        const currentLng = currentVehicle ? Number(currentVehicle[3]) : -73;

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
        ].slice(-200);
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
}`,

     'Bar Chart (Frame-Bound)': `import { StreamChart, findPaletteByLabel, type StreamDataSource, type BarColumnConfig } from '@timeplus/vistral';
import { useTheme } from './App';

function FrameBoundBarChart() {
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
      ].slice(-100));
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
}`,

     'Line Chart (Axis-Bound)': `import { StreamChart, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';
import { useTheme } from './App';

function AxisBoundLineChart() {
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

      setDataPoints(prev => [...prev, newPoint].slice(-300));
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

  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'timestamp',
    yAxis: 'value',
    temporal: {
      mode: 'axis',
      field: 'timestamp',
      range: 1,
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
}`,

  // =========================================================================
  // Grammar API Examples
  // =========================================================================

     'Grammar: Line Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

function GrammarLineChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const valueRef = useRef(50);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'line',
        encode: { x: 'time', y: 'value' },
        style: { connect: true, shape: 'smooth' },
      },
    ],
    scales: {
      x: { type: 'time' },
      y: { type: 'linear', nice: true, domain: [0, 100] },
    },
    temporal: { mode: 'axis', field: 'time', range: 1 },
    streaming: { maxItems: 500, throttle: 100 },
    axes: {
      x: { title: false, grid: false },
      y: { title: 'CPU Usage (%)', grid: true },
    },
    legend: false,
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    // Pre-populate with 30 historical points
    const now = Date.now();
    const history: Record<string, unknown>[] = [];
    let v = 50;
    for (let i = 30; i >= 0; i--) {
      v = generateNextValue(v, 10, 90, 0.15);
      history.push({ time: new Date(now - i * 1000).toISOString(), value: v });
    }
    valueRef.current = v;

    if (handleRef.current) {
      handleRef.current.append(history);
    }

    // Continue streaming
    const interval = setInterval(() => {
      if (handleRef.current) {
        valueRef.current = generateNextValue(valueRef.current, 10, 90, 0.15);
        handleRef.current.append([
          { time: new Date().toISOString(), value: valueRef.current },
        ]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: 400 }}>
      <VistralChart
        spec={spec}
        height={400}
        onReady={(handle) => {
          handleRef.current = handle;
        }}
      />
    </div>
  );
}`,

     'Grammar: Multi-Mark': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

function GrammarMultiMark() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const valuesRef = useRef({ cpu: 55, memory: 65 });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'line',
        encode: { x: 'time', y: 'value', color: 'series' },
        style: { connect: true, shape: 'smooth' },
      },
      {
        type: 'point',
        encode: { x: 'time', y: 'value', color: 'series' },
        tooltip: false,
      },
    ],
    scales: {
      x: { type: 'time' },
      y: { type: 'linear', nice: true },
    },
    temporal: { mode: 'axis', field: 'time', range: 2 },
    streaming: { maxItems: 1000, throttle: 100 },
    axes: {
      x: { title: false, grid: false },
      y: { title: 'Usage (%)', grid: true },
    },
    legend: { position: 'bottom', interactive: true },
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    // Pre-populate with 20 historical points for each series
    const now = Date.now();
    const history: Record<string, unknown>[] = [];
    let cpu = 55, mem = 65;
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now - i * 2000).toISOString();
      cpu = generateNextValue(cpu, 20, 90, 0.12);
      mem = generateNextValue(mem, 30, 95, 0.1);
      history.push({ time, value: cpu, series: 'cpu' });
      history.push({ time, value: mem, series: 'memory' });
    }
    valuesRef.current = { cpu, memory: mem };

    if (handleRef.current) {
      handleRef.current.append(history);
    }

    // Continue streaming
    const interval = setInterval(() => {
      if (handleRef.current) {
        const time = new Date().toISOString();
        valuesRef.current.cpu = generateNextValue(valuesRef.current.cpu, 20, 90, 0.12);
        valuesRef.current.memory = generateNextValue(valuesRef.current.memory, 30, 95, 0.1);
        handleRef.current.append([
          { time, value: valuesRef.current.cpu, series: 'cpu' },
          { time, value: valuesRef.current.memory, series: 'memory' },
        ]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: 400 }}>
      <VistralChart
        spec={spec}
        height={400}
        onReady={(handle) => {
          handleRef.current = handle;
        }}
      />
    </div>
  );
}`,

     'Grammar: Bar Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

function GrammarBarChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const currentValues = useRef<Record<string, number>>({
    Widgets: 120,
    Gadgets: 85,
    Gizmos: 95,
    Doodads: 65,
    Thingamajigs: 110,
  });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',
        encode: { x: 'category', y: 'value', color: 'category' },
      },
    ],
    scales: {
      x: { padding: 0.5 },
      y: { type: 'linear', nice: true },
    },
    coordinate: {
      transforms: [{ type: 'transpose' }],
    },
    temporal: { mode: 'frame', field: 'snapshot' },
    streaming: { maxItems: 500 },
    axes: {
      x: { title: false, grid: false },
      y: { title: 'Value', grid: true },
    },
    legend: false,
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    const categories = Object.keys(currentValues.current);

    // Pre-populate with initial data
    const snapshot = new Date().toISOString();
    const initialRows = categories.map((category) => ({
      snapshot, category, value: Math.round(currentValues.current[category]),
    }));
    if (handleRef.current) {
      handleRef.current.replace(initialRows);
    }

    // Continue streaming updates
    const interval = setInterval(() => {
      if (handleRef.current) {
        const snap = new Date().toISOString();
        const rows = categories.map((category) => {
          currentValues.current[category] = generateNextValue(currentValues.current[category], 30, 160, 0.1);
          return { snapshot: snap, category, value: Math.round(currentValues.current[category]) };
        });
        handleRef.current.replace(rows);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: 400 }}>
      <VistralChart
        spec={spec}
        height={400}
        onReady={(handle) => {
          handleRef.current = handle;
        }}
      />
    </div>
  );
}`,

     'Grammar: Stacked Area': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

function GrammarStackedArea() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const valuesRef = useRef({ requests: 200, errors: 30, timeouts: 15 });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'area',
        encode: { x: 'time', y: 'value', color: 'series' },
        style: { connect: true },
        labels: [{ text: 'value', selector: 'last', overlapHide: true }],
      },
    ],
    scales: {
      x: { type: 'time' },
      y: { type: 'linear', nice: true },
    },
    transforms: [{ type: 'stackY' }],
    temporal: { mode: 'axis', field: 'time', range: 2 },
    streaming: { maxItems: 1000, throttle: 100 },
    axes: {
      x: { title: false, grid: false },
      y: { title: 'Count', grid: true },
    },
    legend: { position: 'bottom', interactive: true },
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    // Pre-populate with 20 historical points for each series
    const now = Date.now();
    const history: Record<string, unknown>[] = [];
    let req = 200, err = 30, tout = 15;
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now - i * 2000).toISOString();
      req = generateNextValue(req, 100, 400, 0.1);
      err = generateNextValue(err, 5, 80, 0.15);
      tout = generateNextValue(tout, 2, 40, 0.12);
      history.push({ time, value: req, series: 'requests' });
      history.push({ time, value: err, series: 'errors' });
      history.push({ time, value: tout, series: 'timeouts' });
    }
    valuesRef.current = { requests: req, errors: err, timeouts: tout };

    if (handleRef.current) {
      handleRef.current.append(history);
    }

    // Continue streaming
    const interval = setInterval(() => {
      if (handleRef.current) {
        const time = new Date().toISOString();
        valuesRef.current.requests = generateNextValue(valuesRef.current.requests, 100, 400, 0.1);
        valuesRef.current.errors = generateNextValue(valuesRef.current.errors, 5, 80, 0.15);
        valuesRef.current.timeouts = generateNextValue(valuesRef.current.timeouts, 2, 40, 0.12);
        handleRef.current.append([
          { time, value: valuesRef.current.requests, series: 'requests' },
          { time, value: valuesRef.current.errors, series: 'errors' },
          { time, value: valuesRef.current.timeouts, series: 'timeouts' },
        ]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: 400 }}>
      <VistralChart
        spec={spec}
        height={400}
        onReady={(handle) => {
          handleRef.current = handle;
        }}
      />
    </div>
  );
}`,

     'Grammar: Compiled Config': `import {
  VistralChart, compileTimeSeriesConfig,
  type VistralSpec, type ChartHandle, type TimeSeriesConfig,
} from '@timeplus/vistral';

function GrammarCompiledChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const valueRef = useRef(50);

  // Start with a high-level TimeSeriesConfig
  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'timestamp',
    yAxis: 'cpu_usage',
    lineStyle: 'curve',
    gridlines: true,
    yTitle: 'CPU Usage (%)',
    yRange: { min: 0, max: 100 },
    temporal: { mode: 'axis', field: 'timestamp', range: 1 },
  };

  // Compile it into a VistralSpec using the config compiler
  const compiledSpec = compileTimeSeriesConfig(config);

  // Override the theme to match the current context
  const spec: VistralSpec = {
    ...compiledSpec,
    theme: theme as 'dark' | 'light',
  };

  useEffect(() => {
    // Pre-populate with 30 historical data points
    const now = Date.now();
    const history: Record<string, unknown>[] = [];
    let v = 50;
    for (let i = 30; i >= 0; i--) {
      v = generateNextValue(v, 10, 90, 0.15);
      history.push({ timestamp: new Date(now - i * 1000).toISOString(), cpu_usage: v });
    }
    valueRef.current = v;

    if (handleRef.current) {
      handleRef.current.append(history);
    }

    // Continue streaming
    const interval = setInterval(() => {
      if (handleRef.current) {
        valueRef.current = generateNextValue(valueRef.current, 10, 90, 0.15);
        handleRef.current.append([
          { timestamp: new Date().toISOString(), cpu_usage: valueRef.current },
        ]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: 400 }}>
      <p style={{ color: '#9CA3AF', marginBottom: '8px' }}>
        Uses compileTimeSeriesConfig() to convert a TimeSeriesConfig into a VistralSpec, then renders with VistralChart.
      </p>
      <VistralChart
        spec={spec}
        height={360}
        onReady={(handle) => {
          handleRef.current = handle;
        }}
      />
    </div>
  );
}`,

     'Grammar: Rose Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

function GrammarRoseChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const currentValues = useRef<Record<string, number>>({
    'API': 80, 'Auth': 45, 'Database': 95,
    'Cache': 60, 'Worker': 70, 'Gateway': 55,
  });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',
        encode: { x: 'service', y: 'requests', color: 'service' },
        style: { lineWidth: 1 },
      },
    ],
    scales: {
      x: { padding: 0.1 },
      y: { type: 'linear', nice: true },
    },
    coordinate: { type: 'polar' },
    temporal: { mode: 'frame', field: 'snapshot' },
    streaming: { maxItems: 500 },
    axes: {
      x: { title: false },
      y: { title: false, grid: true },
    },
    legend: { position: 'bottom' },
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    const services = Object.keys(currentValues.current);
    const snapshot = new Date().toISOString();
    const initialRows = services.map((service) => ({
      snapshot, service, requests: Math.round(currentValues.current[service]),
    }));
    if (handleRef.current) {
      handleRef.current.replace(initialRows);
    }

    const interval = setInterval(() => {
      if (handleRef.current) {
        const snap = new Date().toISOString();
        const rows = services.map((service) => {
          currentValues.current[service] = generateNextValue(currentValues.current[service], 10, 150, 0.15);
          return { snapshot: snap, service, requests: Math.round(currentValues.current[service]) };
        });
        handleRef.current.replace(rows);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: 400 }}>
      <VistralChart
        spec={spec}
        height={400}
        onReady={(handle) => { handleRef.current = handle; }}
      />
    </div>
  );
}`,

     'Grammar: Donut Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

function GrammarDonutChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const currentValues = useRef<Record<string, number>>({
    'HTTP 200': 600, 'HTTP 301': 80, 'HTTP 404': 45,
    'HTTP 500': 20, 'HTTP 503': 12,
  });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',
        encode: { y: 'count', color: 'status' },
        transforms: [{ type: 'stackY' }],
        style: { lineWidth: 1 },
        labels: [{ text: 'status', style: { fontSize: 11 } }],
      },
    ],
    coordinate: {
      type: 'theta',
      innerRadius: 0.5,
    },
    temporal: { mode: 'frame', field: 'snapshot' },
    streaming: { maxItems: 500 },
    legend: { position: 'bottom' },
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    const statuses = Object.keys(currentValues.current);

    const snapshot = new Date().toISOString();
    const initialRows = statuses.map((status) => ({
      snapshot, status,
      count: Math.round(currentValues.current[status]),
    }));
    if (handleRef.current) {
      handleRef.current.replace(initialRows);
    }

    const interval = setInterval(() => {
      if (handleRef.current) {
        const snap = new Date().toISOString();
        const rows = statuses.map((status) => {
          currentValues.current[status] =
            generateNextValue(currentValues.current[status], 5, 800, 0.1);
          return { snapshot: snap, status, count: Math.round(currentValues.current[status]) };
        });
        handleRef.current.replace(rows);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: 400 }}>
      <VistralChart
        spec={spec}
        height={400}
        onReady={(handle) => { handleRef.current = handle; }}
      />
    </div>
  );
}`,

  'Grammar: Radar Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

// Radar Chart — line + area + point marks in polar coordinate
// Combines three marks (line for outline, area for fill, point for vertices)
// all in polar coordinates to create a multi-series radar comparison.

function GrammarRadarChart() {
  const handleRef = useRef<ChartHandle | null>(null);
  const currentValues = useRef({
    'server-a': { CPU: 70, Memory: 55, Disk: 40, Network: 80, Latency: 30 },
    'server-b': { CPU: 50, Memory: 75, Disk: 60, Network: 45, Latency: 65 },
  });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'line',                          // Outline
        encode: { x: 'metric', y: 'value', color: 'server' },
        style: { connect: true },
      },
      {
        type: 'area',                          // Filled region
        encode: { x: 'metric', y: 'value', color: 'server' },
        style: { fillOpacity: 0.15 },
      },
      {
        type: 'point',                         // Vertices
        encode: { x: 'metric', y: 'value', color: 'server' },
        tooltip: false,
      },
    ],
    scales: {
      x: { padding: 0.5 },
      y: { type: 'linear', domain: [0, 100], nice: true },
    },
    coordinate: { type: 'polar' },            // Polar makes it a radar
    temporal: { mode: 'frame', field: 'snapshot' },
    streaming: { maxItems: 500 },
    axes: {
      x: { title: false, grid: true },
      y: { title: false, grid: true },
    },
    legend: { position: 'bottom', interactive: true },
    animate: false,
  };

  useEffect(() => {
    const servers = Object.keys(currentValues.current);
    const metrics = ['CPU', 'Memory', 'Disk', 'Network', 'Latency'];

    // Build rows: one per server per metric
    const buildRows = (snap: string) => {
      const rows = [];
      for (const server of servers) {
        for (const metric of metrics) {
          currentValues.current[server][metric] =
            generateNextValue(currentValues.current[server][metric], 10, 95, 0.12);
          rows.push({
            snapshot: snap, server, metric,
            value: Math.round(currentValues.current[server][metric]),
          });
        }
      }
      return rows;
    };

    handleRef.current?.replace(buildRows(new Date().toISOString()));

    const interval = setInterval(() => {
      handleRef.current?.replace(buildRows(new Date().toISOString()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <VistralChart
      spec={spec}
      height={400}
      onReady={(handle) => { handleRef.current = handle; }}
    />
  );
}`,

  'Grammar: Radial Bar': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

// Radial Bar Chart — interval mark + radial coordinate
// Uses "radial" coordinate which maps categories to concentric arcs.
// Compare with the regular bar chart (interval + transpose) and
// rose chart (interval + polar) — same mark, different coordinates.

function GrammarRadialBar() {
  const handleRef = useRef<ChartHandle | null>(null);
  const currentValues = useRef<Record<string, number>>({
    'us-east': 72, 'us-west': 58, 'eu-west': 85,
    'ap-south': 43, 'ap-east': 66,
  });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',
        encode: { x: 'region', y: 'throughput', color: 'region' },
        style: { lineWidth: 1 },
      },
    ],
    scales: {
      x: { padding: 0.3 },
      y: { type: 'linear', domain: [0, 100] },
    },
    coordinate: {
      type: 'radial',                         // Radial = concentric arc bars
      innerRadius: 0.3,
    },
    temporal: { mode: 'frame', field: 'snapshot' },
    streaming: { maxItems: 500 },
    axes: {
      x: { title: false },
      y: { title: false, grid: true },
    },
    legend: false,
    animate: false,
  };

  useEffect(() => {
    const regions = Object.keys(currentValues.current);

    handleRef.current?.replace(
      regions.map(region => ({
        snapshot: new Date().toISOString(), region,
        throughput: Math.round(currentValues.current[region]),
      }))
    );

    const interval = setInterval(() => {
      const snap = new Date().toISOString();
      const rows = regions.map(region => {
        currentValues.current[region] =
          generateNextValue(currentValues.current[region], 15, 98, 0.1);
        return { snapshot: snap, region, throughput: Math.round(currentValues.current[region]) };
      });
      handleRef.current?.replace(rows);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <VistralChart
      spec={spec}
      height={400}
      onReady={(handle) => { handleRef.current = handle; }}
    />
  );
}`,

  'Grammar: Scatter/Bubble': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

// Scatter / Bubble Chart — point mark with size encoding
// Each point encodes 4 dimensions: x=latency, y=throughput,
// color=region, size=connections. Live streaming updates move
// the bubbles around as metrics change in real time.

function GrammarScatterChart() {
  const handleRef = useRef<ChartHandle | null>(null);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'point',                         // Point mark = scatter/bubble
        encode: {
          x: 'latency',
          y: 'throughput',
          color: 'region',
          size: 'connections',                 // Size encoding = bubble chart
        },
        style: { fillOpacity: 0.7 },
      },
    ],
    scales: {
      x: { type: 'linear', nice: true },
      y: { type: 'linear', nice: true },
      size: { range: [4, 20] },
    },
    temporal: { mode: 'frame', field: 'snapshot' },
    streaming: { maxItems: 500 },
    axes: {
      x: { title: 'Latency (ms)', grid: true },
      y: { title: 'Throughput (req/s)', grid: true },
    },
    legend: { position: 'bottom', interactive: true },
    animate: false,
  };

  const regions = useRef([
    { name: 'us-east', latency: 45, throughput: 850, connections: 120 },
    { name: 'us-west', latency: 65, throughput: 720, connections: 90 },
    { name: 'eu-west', latency: 30, throughput: 950, connections: 150 },
    { name: 'ap-south', latency: 120, throughput: 450, connections: 60 },
    { name: 'ap-east', latency: 95, throughput: 580, connections: 80 },
  ]);

  useEffect(() => {
    const buildRows = (snap: string) =>
      regions.current.map(r => {
        r.latency = generateNextValue(r.latency, 10, 200, 0.12);
        r.throughput = generateNextValue(r.throughput, 200, 1200, 0.1);
        r.connections = generateNextValue(r.connections, 20, 200, 0.08);
        return {
          snapshot: snap, region: r.name,
          latency: Math.round(r.latency),
          throughput: Math.round(r.throughput),
          connections: Math.round(r.connections),
        };
      });

    handleRef.current?.replace(buildRows(new Date().toISOString()));

    const interval = setInterval(() => {
      handleRef.current?.replace(buildRows(new Date().toISOString()));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <VistralChart
      spec={spec}
      height={400}
      onReady={(handle) => { handleRef.current = handle; }}
    />
  );
}`,

  'Grammar: Heatmap': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

// Heatmap — cell mark with color encoding
// The "cell" mark renders a grid where each cell's color intensity
// represents a value. Great for showing patterns across two
// categorical dimensions (day of week x hour of day).

function GrammarHeatmap() {
  const handleRef = useRef<ChartHandle | null>(null);
  const hours = ['00', '04', '08', '12', '16', '20'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const gridValues = useRef<Record<string, number>>({});

  const spec: VistralSpec = {
    marks: [
      {
        type: 'cell',                          // Cell mark = heatmap grid
        encode: { x: 'hour', y: 'day', color: 'load' },
        style: { lineWidth: 1 },
      },
    ],
    scales: {
      color: {
        type: 'sequential',
        range: ['#0d47a1', '#2196f3', '#64b5f6', '#fff176', '#ff9800', '#f44336'],
      },
    },
    temporal: { mode: 'frame', field: 'snapshot' },
    streaming: { maxItems: 500 },
    axes: {
      x: { title: 'Hour of Day', grid: false },
      y: { title: false, grid: false },
    },
    legend: { position: 'bottom' },
    animate: false,
  };

  useEffect(() => {
    // Initialize with realistic load pattern
    days.forEach(day => {
      hours.forEach(hour => {
        const hourNum = parseInt(hour);
        const base = (hourNum >= 8 && hourNum <= 16) ? 70 : 30;
        const weekendFactor = (day === 'Sat' || day === 'Sun') ? 0.5 : 1;
        gridValues.current[\`\${day}_\${hour}\`] = base * weekendFactor + Math.random() * 20;
      });
    });

    const buildRows = (snap: string) => {
      const rows = [];
      for (const day of days) {
        for (const hour of hours) {
          const key = \`\${day}_\${hour}\`;
          gridValues.current[key] =
            generateNextValue(gridValues.current[key], 5, 100, 0.08);
          rows.push({ snapshot: snap, day, hour, load: Math.round(gridValues.current[key]) });
        }
      }
      return rows;
    };

    handleRef.current?.replace(buildRows(new Date().toISOString()));

    const interval = setInterval(() => {
      handleRef.current?.replace(buildRows(new Date().toISOString()));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <VistralChart
      spec={spec}
      height={400}
      onReady={(handle) => { handleRef.current = handle; }}
    />
  );
}`,
};
