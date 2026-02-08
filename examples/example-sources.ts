/**
 * Example source code for display in the Code tab
 * Each key matches the example name in App.tsx
 */

export const exampleSources: Record<string, string> = {
  'Line Chart': `import { StreamChart, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';

function LineChart() {
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
    let currentValue = dataPoints[dataPoints.length - 1]?.[1] as number ?? 50;
    const interval = setInterval(() => {
      currentValue = generateNextValue(currentValue, 20, 80, 0.15);
      setDataPoints(prev => [...prev, [new Date().toISOString(), currentValue]].slice(-60));
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
}`,

  'Area Chart': `import { StreamChart, findPaletteByLabel, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';

function AreaChart() {
  const [dataPoints, setDataPoints] = useState<unknown[][]>([]);
  const valuesRef = useRef({ us: 120, eu: 95, apac: 75 });

  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toISOString();
      valuesRef.current.us = generateNextValue(valuesRef.current.us, 50, 200, 0.1);
      valuesRef.current.eu = generateNextValue(valuesRef.current.eu, 40, 150, 0.1);
      valuesRef.current.apac = generateNextValue(valuesRef.current.apac, 30, 120, 0.1);

      setDataPoints(prev => [
        ...prev,
        [time, valuesRef.current.us, 'US'],
        [time, valuesRef.current.eu, 'EU'],
        [time, valuesRef.current.apac, 'APAC'],
      ].slice(-180));
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
    colors: findPaletteByLabel('Morning')?.values,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={data} theme="dark" />
    </div>
  );
}`,

  'Column Chart (Stacked)': `import { StreamChart, findPaletteByLabel, type StreamDataSource, type BarColumnConfig } from '@timeplus/vistral';

function StackedColumnChart() {
  const [revenues, setRevenues] = useState({
    Q1: { A: 45000, B: 32000, C: 28000 },
    Q2: { A: 52000, B: 38000, C: 35000 },
    Q3: { A: 48000, B: 42000, C: 31000 },
    Q4: { A: 61000, B: 45000, C: 42000 },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRevenues(prev => ({
        Q1: { A: generateNextValue(prev.Q1.A, 30000, 70000, 0.05), ... },
        // ... update all quarters
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
      // ... more data
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
    unit: { position: 'left', value: '$' },
    colors: findPaletteByLabel('Sunset')?.values,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={data} theme="dark" />
    </div>
  );
}`,

  'Bar Chart (Grouped)': `import { StreamChart, type StreamDataSource, type BarColumnConfig } from '@timeplus/vistral';

function GroupedBarChart() {
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
        // ... update other categories
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
      // ... more data
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
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={data} theme="dark" />
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

function DataTable() {
  const { data, append } = useStreamingData<unknown[]>([], 50);

  useEffect(() => {
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const messages = ['User login successful', 'API request completed', ...];

    const interval = setInterval(() => {
      const now = new Date().toISOString();
      const level = levels[Math.floor(Math.random() * levels.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      append([[now, level, message, Math.floor(Math.random() * 500) + 10]]);
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
            { operator: 'eq', value: 'ERROR', color: 'rgba(239, 68, 68, 0.3)' },
            { operator: 'eq', value: 'WARN', color: 'rgba(251, 146, 60, 0.3)' },
          ],
        },
      },
      message: { name: 'Message', width: 300 },
      duration_ms: { name: 'Duration (ms)', width: 120 },
    },
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={dataSource} theme="dark" />
    </div>
  );
}`,

  'Metrics Dashboard': `import { SingleValueChart, type StreamDataSource } from '@timeplus/vistral';

function MetricsDashboard() {
  const [metrics, setMetrics] = useState({ cpu: 45, memory: 62, requests: 1520, errors: 3 });

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
      <SingleValueChart
        config={{
          chartType: 'singleValue',
          yAxis: 'value',
          fontSize: 48,
          color: metrics.cpu > 80 ? 'red' : metrics.cpu > 60 ? 'orange' : 'green',
          unit: { position: 'right', value: '%' },
          sparkline: true,
          delta: true,
        }}
        data={createMetricData(metrics.cpu)}
        theme="dark"
      />
      {/* ... more metrics */}
    </div>
  );
}`,

  'Chart/Table Toggle': `import { StreamChart, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';

function ChartWithTableToggle() {
  const [showTable, setShowTable] = useState(false);
  const [dataPoints, setDataPoints] = useState<unknown[][]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const temp = generateNextValue(prevTemp, 18, 30, 0.1);
      const humidity = generateNextValue(prevHumidity, 30, 70, 0.1);
      setDataPoints(prev => [...prev, [new Date().toISOString(), temp, humidity]].slice(-30));
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
    yTitle: 'Temperature (°C)',
  };

  return (
    <div>
      <button onClick={() => setShowTable(!showTable)}>
        {showTable ? 'Show Chart' : 'Show Table'}
      </button>
      <StreamChart config={config} data={data} showTable={showTable} theme="dark" />
    </div>
  );
}`,

  'Geo Chart': `import { StreamChart, type StreamDataSource, type GeoChartConfig } from '@timeplus/vistral';

function GeoChart() {
  const [points, setPoints] = useState<unknown[][]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const lat = (Math.random() - 0.5) * 140;
      const lng = (Math.random() - 0.5) * 360;
      const value = Math.floor(Math.random() * 100);
      const categories = ['Category A', 'Category B', 'Category C'];
      const category = categories[Math.floor(Math.random() * categories.length)];

      setPoints(prev => [...prev, [lat, lng, value, category]].slice(-100));
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
    size: { key: 'value', min: 4, max: 16 },
    zoom: 2,
    showZoomControl: true,
    pointOpacity: 0.7,
  };

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <StreamChart config={config} data={data} theme="dark" />
    </div>
  );
}`,

  'Table (Frame-Bound)': `import { StreamChart, useStreamingData, type StreamDataSource, type TableConfig } from '@timeplus/vistral';

// Frame-bound mode: Shows only rows from the latest timestamp
function FrameBoundTable() {
  const { data, append } = useStreamingData<unknown[]>([], 200);

  useEffect(() => {
    const servers = ['server-01', 'server-02', 'server-03', 'server-04'];
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      // Add metrics for all servers at the same timestamp
      const newRows = servers.map(server => [
        now, server,
        generateNextValue(50, 10, 95, 0.2),  // CPU
        generateNextValue(60, 20, 90, 0.15), // Memory
        Math.floor(Math.random() * 1000) + 100,
      ]);
      append(newRows);
    }, 2000);
    return () => clearInterval(interval);
  }, [append]);

  const config: TableConfig = {
    chartType: 'table',
    temporal: {
      mode: 'frame',      // Only show latest timestamp
      field: 'timestamp',
    },
    tableStyles: {
      timestamp: { name: 'Time', width: 200 },
      server: { name: 'Server', width: 120 },
      cpu: { name: 'CPU %', width: 100 },
    },
  };

  return <StreamChart config={config} data={dataSource} theme="dark" />;
}`,

  'Table (Key-Bound)': `import { StreamChart, useStreamingData, type StreamDataSource, type TableConfig } from '@timeplus/vistral';

// Key-bound mode: Keeps latest value per unique key
function KeyBoundTable() {
  const { data, append } = useStreamingData<unknown[]>([], 500);

  useEffect(() => {
    const services = ['auth-service', 'api-gateway', 'user-service', 'payment-service'];
    const interval = setInterval(() => {
      const service = services[Math.floor(Math.random() * services.length)];
      const status = ['healthy', 'healthy', 'degraded', 'down'][Math.floor(Math.random() * 4)];
      append([[new Date().toISOString(), service, status, Math.floor(Math.random() * 200) + 10]]);
    }, 1000);
    return () => clearInterval(interval);
  }, [append]);

  const config: TableConfig = {
    chartType: 'table',
    temporal: {
      mode: 'key',       // Deduplicate by service
      field: 'service',
    },
    tableStyles: {
      service: { name: 'Service', width: 150 },
      status: {
        name: 'Status',
        color: {
          type: 'condition',
          conditions: [
            { operator: 'eq', value: 'down', color: 'rgba(239, 68, 68, 0.3)' },
          ],
        },
      },
    },
  };

  return <StreamChart config={config} data={dataSource} theme="dark" />;
}`,

  'Geo Chart (Key-Bound)': `import { StreamChart, type StreamDataSource, type GeoChartConfig } from '@timeplus/vistral';

// Key-bound GeoChart: Shows latest position per vehicle
function KeyBoundGeoChart() {
  const [points, setPoints] = useState<unknown[][]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const vehicleId = \`vehicle-\${Math.floor(Math.random() * 10) + 1}\`;
      // Find and update vehicle position
      setPoints(prev => {
        const currentVehicle = prev.find(p => p[1] === vehicleId);
        const lat = (currentVehicle?.[2] ?? 42) + (Math.random() - 0.5) * 0.1;
        const lng = (currentVehicle?.[3] ?? -73) + (Math.random() - 0.5) * 0.1;
        return [...prev, [new Date().toISOString(), vehicleId, lat, lng, Math.floor(Math.random() * 60) + 20]].slice(-200);
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const config: GeoChartConfig = {
    chartType: 'geo',
    latitude: 'lat',
    longitude: 'lng',
    temporal: {
      mode: 'key',
      field: 'vehicle_id',  // Show only latest position per vehicle
    },
    size: { key: 'speed', min: 6, max: 14 },
    center: [41, -73],
    zoom: 7,
    pointColor: '#10B981',
  };

  return <StreamChart config={config} data={data} theme="dark" />;
}`,

  'Bar Chart (Frame-Bound)': `import { StreamChart, findPaletteByLabel, type StreamDataSource, type BarColumnConfig } from '@timeplus/vistral';

// Frame-bound BarChart: Shows current snapshot of category values
function FrameBoundBarChart() {
  const [dataPoints, setDataPoints] = useState<unknown[][]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      setDataPoints(prev => [
        ...prev,
        [now, 'Widgets', generateNextValue(prev[prev.length-4]?.[2] ?? 120, 80, 160, 0.1)],
        [now, 'Gadgets', generateNextValue(prev[prev.length-3]?.[2] ?? 85, 50, 120, 0.1)],
        [now, 'Gizmos', generateNextValue(prev[prev.length-2]?.[2] ?? 95, 60, 130, 0.1)],
        [now, 'Doodads', generateNextValue(prev[prev.length-1]?.[2] ?? 65, 40, 100, 0.1)],
      ].slice(-100));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const config: BarColumnConfig = {
    chartType: 'column',
    xAxis: 'product',
    yAxis: 'sales',
    temporal: {
      mode: 'frame',       // Only show latest timestamp
      field: 'timestamp',
    },
    dataLabel: true,
    gridlines: true,
    colors: findPaletteByLabel('Ocean')?.values,
  };

  return <StreamChart config={config} data={data} theme="dark" />;
}`,

  'Line Chart (Axis-Bound)': `import { StreamChart, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';

// Axis-bound mode: Sliding time window on the X-axis
function AxisBoundLineChart() {
  const [dataPoints, setDataPoints] = useState<unknown[][]>([]);

  useEffect(() => {
    let currentValue = 50;
    const interval = setInterval(() => {
      currentValue = generateNextValue(currentValue, 20, 80, 0.15);
      setDataPoints(prev => [...prev, [new Date().toISOString(), currentValue]].slice(-300));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'timestamp',
    yAxis: 'value',
    temporal: {
      mode: 'axis',
      field: 'timestamp',
      range: 1,  // 1-minute sliding window
    },
    lineStyle: 'curve',
    gridlines: true,
    yRange: { min: 0, max: 100 },
  };

  return <StreamChart config={config} data={data} theme="dark" />;
}`,

  // =========================================================================
  // Grammar API Examples
  // =========================================================================

  'Grammar: Line Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

// Streaming line chart using VistralSpec directly
function GrammarLineChart() {
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
    theme: 'dark',
    animate: false,
  };

  useEffect(() => {
    // Pre-populate with 30 historical points
    const now = Date.now();
    const history = [];
    let v = 50;
    for (let i = 30; i >= 0; i--) {
      v = generateNextValue(v, 10, 90, 0.15);
      history.push({ time: new Date(now - i * 1000).toISOString(), value: v });
    }
    valueRef.current = v;
    handleRef.current?.append(history);

    // Continue streaming new points
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
    <VistralChart
      spec={spec}
      height={400}
      onReady={(handle) => { handleRef.current = handle; }}
    />
  );
}`,

  'Grammar: Multi-Mark': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

// Multi-mark composition: line + point for two series
function GrammarMultiMark() {
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
    legend: { position: 'bottom', interactive: true },
    theme: 'dark',
    animate: false,
  };

  useEffect(() => {
    // Pre-populate with 20 historical points per series
    const now = Date.now();
    const history = [];
    let cpu = 55, mem = 65;
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now - i * 2000).toISOString();
      cpu = generateNextValue(cpu, 20, 90, 0.12);
      mem = generateNextValue(mem, 30, 95, 0.1);
      history.push({ time, value: cpu, series: 'cpu' });
      history.push({ time, value: mem, series: 'memory' });
    }
    valuesRef.current = { cpu, memory: mem };
    handleRef.current?.append(history);

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
    <VistralChart
      spec={spec}
      height={400}
      onReady={(handle) => { handleRef.current = handle; }}
    />
  );
}`,

  'Grammar: Bar Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

// Bar chart with transposed coordinate using handle.replace()
function GrammarBarChart() {
  const handleRef = useRef<ChartHandle | null>(null);

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
    legend: false,
    theme: 'dark',
    animate: false,
  };

  useEffect(() => {
    const categories = ['Widgets', 'Gadgets', 'Gizmos', 'Doodads', 'Thingamajigs'];
    const currentValues = { Widgets: 120, Gadgets: 85, Gizmos: 95, Doodads: 65, Thingamajigs: 110 };

    // Pre-populate with initial snapshot
    const snapshot = new Date().toISOString();
    const initial = categories.map((cat) => ({
      snapshot, category: cat, value: Math.round(currentValues[cat]),
    }));
    handleRef.current?.replace(initial);

    // Continue streaming updates
    const interval = setInterval(() => {
      if (handleRef.current) {
        const snap = new Date().toISOString();
        const rows = categories.map((category) => {
          currentValues[category] = generateNextValue(currentValues[category], 30, 160, 0.1);
          return { snapshot: snap, category, value: Math.round(currentValues[category]) };
        });
        handleRef.current.replace(rows);
      }
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

  'Grammar: Stacked Area': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

// Stacked area chart with stackY transform and label on last point
function GrammarStackedArea() {
  const handleRef = useRef<ChartHandle | null>(null);
  const valuesRef = useRef({ requests: 200, errors: 30, timeouts: 15 });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'area',
        encode: { x: 'time', y: 'value', color: 'series' },
        style: { connect: true },
        labels: [
          { text: 'value', selector: 'last', overlapHide: true },
        ],
      },
    ],
    scales: {
      x: { type: 'time' },
      y: { type: 'linear', nice: true },
    },
    transforms: [{ type: 'stackY' }],
    temporal: { mode: 'axis', field: 'time', range: 2 },
    streaming: { maxItems: 1000, throttle: 100 },
    legend: { position: 'bottom', interactive: true },
    theme: 'dark',
    animate: false,
  };

  useEffect(() => {
    // Pre-populate with 20 historical points per series
    const now = Date.now();
    const history = [];
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
    handleRef.current?.append(history);

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
    <VistralChart
      spec={spec}
      height={400}
      onReady={(handle) => { handleRef.current = handle; }}
    />
  );
}`,

  'Grammar: Compiled Config': `import {
  VistralChart, compileTimeSeriesConfig,
  type VistralSpec, type ChartHandle, type TimeSeriesConfig,
} from '@timeplus/vistral';

// Demonstrates bridging a high-level TimeSeriesConfig to VistralSpec
function GrammarCompiledChart() {
  const handleRef = useRef<ChartHandle | null>(null);
  const valueRef = useRef(50);

  // Start with the familiar high-level config
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

  // Compile it into a VistralSpec
  const spec: VistralSpec = {
    ...compileTimeSeriesConfig(config),
    theme: 'dark',
  };

  useEffect(() => {
    // Pre-populate with 30 historical points
    const now = Date.now();
    const history = [];
    let v = 50;
    for (let i = 30; i >= 0; i--) {
      v = generateNextValue(v, 10, 90, 0.15);
      history.push({ timestamp: new Date(now - i * 1000).toISOString(), cpu_usage: v });
    }
    valueRef.current = v;
    handleRef.current?.append(history);

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
    <VistralChart
      spec={spec}
      height={400}
      onReady={(handle) => { handleRef.current = handle; }}
    />
  );
}`,

  'Grammar: Rose Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

// Nightingale Rose Chart — interval mark + polar coordinate
// The same "interval" mark that makes a bar chart becomes a rose chart
// simply by changing the coordinate system to "polar".

function GrammarRoseChart() {
  const handleRef = useRef<ChartHandle | null>(null);
  const currentValues = useRef<Record<string, number>>({
    'API': 80, 'Auth': 45, 'Database': 95,
    'Cache': 60, 'Worker': 70, 'Gateway': 55,
  });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',                    // Same mark as a bar chart
        encode: { x: 'service', y: 'requests', color: 'service' },
        style: { lineWidth: 1 },
      },
    ],
    scales: {
      x: { padding: 0.1 },
      y: { type: 'linear', nice: true },
    },
    coordinate: { type: 'polar' },           // This makes it a rose chart!
    temporal: { mode: 'frame', field: 'snapshot' },
    streaming: { maxItems: 500 },
    axes: {
      x: { title: false },
      y: { title: false, grid: true },
    },
    legend: { position: 'bottom' },
    animate: false,
  };

  useEffect(() => {
    const services = Object.keys(currentValues.current);

    // Initial data
    const snapshot = new Date().toISOString();
    handleRef.current?.replace(
      services.map(service => ({
        snapshot, service, requests: Math.round(currentValues.current[service]),
      }))
    );

    // Stream updates
    const interval = setInterval(() => {
      const snap = new Date().toISOString();
      const rows = services.map(service => {
        currentValues.current[service] =
          generateNextValue(currentValues.current[service], 10, 150, 0.15);
        return { snapshot: snap, service, requests: Math.round(currentValues.current[service]) };
      });
      handleRef.current?.replace(rows);
    }, 1200);
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

  'Grammar: Donut Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';

// Donut Chart — interval mark + theta coordinate + stackY
// Uses "theta" coordinate (maps data to arc angles) with an inner radius
// to create a donut. stackY stacks the values into proportional slices.

function GrammarDonutChart() {
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
        transforms: [{ type: 'stackY' }],     // Stack into proportional slices
        style: { lineWidth: 1 },
        labels: [{ text: 'status', style: { fontSize: 11 } }],
      },
    ],
    coordinate: {
      type: 'theta',                           // Arc/pie coordinate system
      innerRadius: 0.5,                        // Makes it a donut (0 = pie)
    },
    temporal: { mode: 'frame', field: 'snapshot' },
    streaming: { maxItems: 500 },
    legend: { position: 'bottom' },
    animate: false,
  };

  useEffect(() => {
    const statuses = Object.keys(currentValues.current);

    handleRef.current?.replace(
      statuses.map(status => ({
        snapshot: new Date().toISOString(), status,
        count: Math.round(currentValues.current[status]),
      }))
    );

    const interval = setInterval(() => {
      const snap = new Date().toISOString();
      const rows = statuses.map(status => {
        currentValues.current[status] =
          generateNextValue(currentValues.current[status], 5, 800, 0.1);
        return { snapshot: snap, status, count: Math.round(currentValues.current[status]) };
      });
      handleRef.current?.replace(rows);
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
