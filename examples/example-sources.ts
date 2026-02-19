/**
 * Example source code for display in the Code tab
 * Each key matches the example name in App.tsx
 */

export const exampleSources: Record<string, string> = {
  'Line Chart': `import { StreamChart, useStreamingData, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function BasicLineChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData([], 300);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      append(dataGenerators.cpuLoad.generate(30));
    }
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
}`,

  'Area Chart': `import { StreamChart, useStreamingData, findPaletteByLabel, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function MultiSeriesAreaChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData([], 240);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      append(dataGenerators.sensors.generate(30));
    }
    const id = setInterval(() => {
      append(dataGenerators.sensors.generate());
    }, dataGenerators.sensors.interval);
    return () => clearInterval(id);
  }, []);

  const source: StreamDataSource = {
    columns: dataGenerators.sensors.columns,
    data,
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
  const { data, append } = useStreamingData([], 20);

  useEffect(() => {
    const id = setInterval(() => {
      append(dataGenerators.revenue.generate());
    }, dataGenerators.revenue.interval);
    return () => clearInterval(id);
  }, []);

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
  const { data, append } = useStreamingData([], 12);

  useEffect(() => {
    const id = setInterval(() => {
      append(dataGenerators.sales.generate());
    }, dataGenerators.sales.interval);
    return () => clearInterval(id);
  }, []);

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
import { dataGenerators } from './data-utils';

function SingleValue() {
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
      <StreamChart config={config} data={data} theme="dark" />
    </div>
  );
}`,

  'Data Table': `import { StreamChart, useStreamingData, type StreamDataSource, type TableConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function StreamingDataTable() {
  const theme = useTheme();
  const { data, append } = useStreamingData([], 50);

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
}`,

  'Metrics Dashboard': `import { SingleValueChart, type StreamDataSource } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
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
}`,

  'Chart/Table Toggle': `import { StreamChart, useStreamingData, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function ChartWithTableToggle() {
  const theme = useTheme();
  const [showTable, setShowTable] = useState(false);
  const { data: streamData, append } = useStreamingData([], 30);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      const history = dataGenerators.sensors.generate(20)
        .filter(r => r.location === 'Warehouse A')
        .map(r => [r.timestamp, r.temperature, r.humidity]);
      append(history);
    }
    const id = setInterval(() => {
      const row = dataGenerators.sensors.generate().find(r => r.location === 'Warehouse A');
      if (row) append([[row.timestamp, row.temperature, row.humidity]]);
    }, dataGenerators.sensors.interval);
    return () => clearInterval(id);
  }, []);

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
      <button onClick={() => setShowTable(!showTable)}>
        {showTable ? 'Show Chart' : 'Show Table'}
      </button>
      <div style={{ width: '100%', height: '400px' }}>
        <StreamChart config={config} data={data} theme={theme} showTable={showTable} />
      </div>
    </div>
  );
}`,

  'Geo Chart': `import { StreamChart, useStreamingData, type StreamDataSource, type GeoChartConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function StreamingGeoChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData([], 300);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      append(dataGenerators.globalEvents.generate(40));
    }
    const id = setInterval(() => {
      append(dataGenerators.globalEvents.generate());
    }, dataGenerators.globalEvents.interval);
    return () => clearInterval(id);
  }, []);

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
    size: { key: 'value', min: 4, max: 16 },
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
}`,

  'Table (Frame-Bound)': `import { StreamChart, useStreamingData, type StreamDataSource, type TableConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function FrameBoundTable() {
  const theme = useTheme();
  const { data, append } = useStreamingData([], 200);

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
}`,

  'Table (Key-Bound)': `import { StreamChart, useStreamingData, type StreamDataSource, type TableConfig } from '@timeplus/vistral';
import { useTheme } from './App';

function KeyBoundTable() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 500);

  useEffect(() => {
    const services = ['auth-service', 'api-gateway', 'user-service', 'payment-service', 'notification-service'];
    const statuses = ['healthy', 'healthy', 'healthy', 'degraded', 'down'];

    const interval = setInterval(() => {
      const service = services[Math.floor(Math.random() * services.length)];
      append([[
        new Date().toISOString(),
        service,
        statuses[Math.floor(Math.random() * statuses.length)],
        Math.floor(Math.random() * 200) + 10,
        99 + (Math.random() - 0.5) * 2,
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

  'Geo Chart (Key-Bound)': `import { StreamChart, useStreamingData, type StreamDataSource, type GeoChartConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function KeyBoundGeoChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData([], 500);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      append(dataGenerators.vehicles.generate(10));
    }
    const id = setInterval(() => {
      append(dataGenerators.vehicles.generate());
    }, dataGenerators.vehicles.interval);
    return () => clearInterval(id);
  }, []);

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
    size: { key: 'speed', min: 6, max: 14 },
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
}`,

  'Bar Chart (Frame-Bound)': `import { StreamChart, useStreamingData, findPaletteByLabel, type StreamDataSource, type BarColumnConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function FrameBoundBarChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData([], 100);

  useEffect(() => {
    append(dataGenerators.productInventory.generate());
    const id = setInterval(() => {
      append(dataGenerators.productInventory.generate());
    }, dataGenerators.productInventory.interval);
    return () => clearInterval(id);
  }, []);

  const source: StreamDataSource = {
    columns: dataGenerators.productInventory.columns,
    data,
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
        <StreamChart config={config} data={source} theme={theme} />
      </div>
    </div>
  );
}`,

  'Line Chart (Axis-Bound)': `import { StreamChart, useStreamingData, type StreamDataSource, type TimeSeriesConfig } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';
import { useTheme } from './App';

function AxisBoundLineChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData([], 300);

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
    temporal: {
      mode: 'axis',
      field: 'time',
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
        <StreamChart config={config} data={source} theme={theme} />
      </div>
    </div>
  );
}`,

  // =========================================================================
  // Grammar API Examples
  // =========================================================================

  'Grammar: Line Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';

function GrammarLineChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const loadedRef = useRef(false);

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
    if (!loadedRef.current && handleRef.current) {
      loadedRef.current = true;
      handleRef.current.append(dataGenerators.cpuLoad.generate(30));
    }
    const interval = setInterval(() => {
      handleRef.current?.append(dataGenerators.cpuLoad.generate());
    }, dataGenerators.cpuLoad.interval);
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

  'Grammar: Multi-Mark': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';

function GrammarMultiMark() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const loadedRef = useRef(false);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'line',
        encode: { x: 'time', y: 'value', color: 'metric' },
        style: { connect: true, shape: 'smooth' },
      },
      {
        type: 'point',
        encode: { x: 'time', y: 'value', color: 'metric' },
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
      y: { title: 'Count / sec', grid: true },
    },
    legend: { position: 'bottom', interactive: true },
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    if (!loadedRef.current && handleRef.current) {
      loadedRef.current = true;
      handleRef.current.append(dataGenerators.apiTraffic.generate(20));
    }
    const interval = setInterval(() => {
      handleRef.current?.append(dataGenerators.apiTraffic.generate());
    }, dataGenerators.apiTraffic.interval);
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

  'Grammar: Bar Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';

function GrammarBarChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',
        encode: { x: 'product', y: 'sales', color: 'product' },
      },
    ],
    scales: {
      x: { padding: 0.5 },
      y: { type: 'linear', nice: true },
    },
    coordinate: {
      transforms: [{ type: 'transpose' }],
    },
    temporal: { mode: 'frame', field: 'timestamp' },
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
    handleRef.current?.replace(dataGenerators.productInventory.generate());
    const interval = setInterval(() => {
      handleRef.current?.replace(dataGenerators.productInventory.generate());
    }, dataGenerators.productInventory.interval);
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

  'Grammar: Stacked Area': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';

function GrammarStackedArea() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const loadedRef = useRef(false);           // Guard against Strict Mode double-run

  const spec: VistralSpec = {
    marks: [
      {
        type: 'area',
        encode: { x: 'time', y: 'value', color: 'metric' },
        style: { connect: true },
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
    // Guard against React 18 Strict Mode double-run
    if (!loadedRef.current && handleRef.current) {
      loadedRef.current = true;
      handleRef.current.append(dataGenerators.apiTraffic.generate(40));
    }
    const interval = setInterval(() => {
      handleRef.current?.append(dataGenerators.apiTraffic.generate());
    }, dataGenerators.apiTraffic.interval);
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

  'Grammar: Compiled Config': `import {
  VistralChart, compileTimeSeriesConfig,
  type VistralSpec, type ChartHandle, type TimeSeriesConfig,
} from '@timeplus/vistral';
import { dataGenerators } from './data-utils';

function GrammarCompiledChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const loadedRef = useRef(false);

  // Start with a high-level TimeSeriesConfig
  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'time',
    yAxis: 'value',
    lineStyle: 'curve',
    gridlines: true,
    yTitle: 'CPU Usage (%)',
    yRange: { min: 0, max: 100 },
    temporal: { mode: 'axis', field: 'time', range: 1 },
  };

  // Compile it into a VistralSpec using the config compiler
  const compiledSpec = compileTimeSeriesConfig(config);

  // Override the theme to match the current context
  const spec: VistralSpec = {
    ...compiledSpec,
    theme: theme as 'dark' | 'light',
  };

  useEffect(() => {
    if (!loadedRef.current && handleRef.current) {
      loadedRef.current = true;
      handleRef.current.append(dataGenerators.cpuLoad.generate(30));
    }
    const interval = setInterval(() => {
      handleRef.current?.append(dataGenerators.cpuLoad.generate());
    }, dataGenerators.cpuLoad.interval);
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
        onReady={(handle) => { handleRef.current = handle; }}
      />
    </div>
  );
}`,

  'Grammar: Rose Chart': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';

function GrammarRoseChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);

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
    handleRef.current?.replace(dataGenerators.serviceLoad.generate());
    const interval = setInterval(() => {
      handleRef.current?.replace(dataGenerators.serviceLoad.generate());
    }, dataGenerators.serviceLoad.interval);
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
import { dataGenerators } from './data-utils';

function GrammarDonutChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);

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
    streaming: { maxItems: 500 },
    legend: { position: 'bottom' },
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    handleRef.current?.replace(dataGenerators.httpResponses.generate());
    const interval = setInterval(() => {
      handleRef.current?.replace(dataGenerators.httpResponses.generate());
    }, dataGenerators.httpResponses.interval);
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
import { dataGenerators } from './data-utils';

// Radar Chart — line + area + point marks in polar coordinate
// Combines three marks (line for outline, area for fill, point for vertices)
// all in polar coordinates to create a multi-series radar comparison.

function GrammarRadarChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'line',                          // Outline
        encode: { x: 'dimension', y: 'value', color: 'server' },
        style: { connect: true },
      },
      {
        type: 'area',                          // Filled region
        encode: { x: 'dimension', y: 'value', color: 'server' },
        style: { fillOpacity: 0.15 },
      },
      {
        type: 'point',                         // Vertices
        encode: { x: 'dimension', y: 'value', color: 'server' },
        tooltip: false,
      },
    ],
    scales: {
      x: { padding: 0.5 },
      y: { type: 'linear', domain: [0, 100], nice: true },
    },
    coordinate: { type: 'polar' },            // Polar makes it a radar
    streaming: { maxItems: 500 },
    axes: {
      x: { title: false, grid: true },
      y: { title: false, grid: true },
    },
    legend: { position: 'bottom', interactive: true },
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    handleRef.current?.replace(dataGenerators.serverProfile.generate());
    const interval = setInterval(() => {
      handleRef.current?.replace(dataGenerators.serverProfile.generate());
    }, dataGenerators.serverProfile.interval);
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
import { dataGenerators } from './data-utils';

// Radial Bar Chart — interval mark + radial coordinate
// Uses "radial" coordinate which maps categories to concentric arcs.

function GrammarRadialBar() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',
        encode: { x: 'region', y: 'latency', color: 'region' },
        style: { lineWidth: 1 },
      },
    ],
    scales: {
      x: { padding: 0.3 },
      y: { type: 'linear', domain: [0, 200] },
    },
    coordinate: {
      type: 'radial',                         // Radial = concentric arc bars
      innerRadius: 0.3,
    },
    streaming: { maxItems: 500 },
    axes: {
      x: { title: false },
      y: { title: false, grid: true },
    },
    legend: false,
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    handleRef.current?.replace(dataGenerators.cloudRegions.generate());
    const interval = setInterval(() => {
      handleRef.current?.replace(dataGenerators.cloudRegions.generate());
    }, dataGenerators.cloudRegions.interval);
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
import { dataGenerators } from './data-utils';

// Scatter / Bubble Chart — point mark with size encoding
// Each point encodes 4 dimensions: x=latency, y=throughput,
// color=region, size=connections.

function GrammarScatterChart() {
  const theme = useTheme();
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
    streaming: { maxItems: 500 },
    axes: {
      x: { title: 'Latency (ms)', grid: true },
      y: { title: 'Throughput (req/s)', grid: true },
    },
    legend: { position: 'bottom', interactive: true },
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    handleRef.current?.replace(dataGenerators.cloudRegions.generate());
    const interval = setInterval(() => {
      handleRef.current?.replace(dataGenerators.cloudRegions.generate());
    }, dataGenerators.cloudRegions.interval);
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
import { dataGenerators } from './data-utils';

// Heatmap — cell mark with color encoding
// The "cell" mark renders a grid where each cell's color intensity
// represents a value. Shows CPU load by hour and day of week.

function GrammarHeatmap() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);

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
    streaming: { maxItems: 500 },
    axes: {
      x: { title: 'Hour of Day', grid: false },
      y: { title: false, grid: false },
    },
    legend: { position: 'bottom' },
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    handleRef.current?.replace(dataGenerators.datacenterLoad.generate());
    const interval = setInterval(() => {
      handleRef.current?.replace(dataGenerators.datacenterLoad.generate());
    }, dataGenerators.datacenterLoad.interval);
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

  'Grammar: Time Series Bar': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';

// Time Series Bar Chart — rect marks on a continuous time axis
// G2's "interval" mark requires a band scale, which is incompatible with
// a continuous time axis. Use "rect" marks with EncodeFn to compute
// bar widths around each timestamp instead.

function GrammarTimeSeriesBar() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const loadedRef = useRef(false);

  const BAR_INTERVAL_MS = 2000;
  const BAR_HALF = BAR_INTERVAL_MS * 0.35;

  const spec: VistralSpec = {
    marks: [
      // Invisible anchor — establishes time scale domain
      {
        type: 'point',
        encode: { x: 'time', y: 'value' },
        style: { r: 0, fillOpacity: 0, strokeOpacity: 0, strokeWidth: 0 },
        tooltip: false,
      },
      // Bar body — rect from 0 to value
      {
        type: 'rect',
        encode: {
          x: (d) => {
            const t = new Date(d.time).getTime();
            return [new Date(t - BAR_HALF), new Date(t + BAR_HALF)];
          },
          y: (d) => [0, d.value],
        },
        style: { fill: '#6366F1' },
      },
    ],
    scales: {
      x: { type: 'time' },
      y: { type: 'linear', nice: true },
    },
    temporal: { mode: 'axis', field: 'time', range: 2 },
    streaming: { maxItems: 500, throttle: 100 },
    axes: {
      x: { title: false, grid: false },
      y: { title: 'Requests / sec', grid: true },
    },
    legend: false,
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    if (!loadedRef.current && handleRef.current) {
      loadedRef.current = true;
      handleRef.current.append(dataGenerators.cpuLoad.generate(40));
    }
    const interval = setInterval(() => {
      handleRef.current?.append(dataGenerators.cpuLoad.generate());
    }, BAR_INTERVAL_MS);
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

  'Grammar: Candlestick': `import { VistralChart, type VistralSpec, type ChartHandle } from '@timeplus/vistral';
import { dataGenerators } from './data-utils';

// Candlestick (OHLC) Chart — rect marks with EncodeFn on a time axis
// Composed from: invisible anchor point, thin wick rect, wider body rect.
// Uses dataGenerators.stockCandles for OHLC data, then adds direction field.

function GrammarCandlestickChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const loadedRef = useRef(false);           // Guard against Strict Mode double-run

  const CANDLE_MS = dataGenerators.stockCandles.interval;
  const BODY_HALF = CANDLE_MS * 0.35;      // Body width (70% of candle spacing)
  const WICK_HALF = CANDLE_MS * 0.03;      // Wick width (thin line)

  // Add direction field based on open vs close
  const addDirection = (candles) =>
    candles.map(c => ({ ...c, direction: c.close >= c.open ? 'bullish' : 'bearish' }));

  // Map direction → color directly (identity scale prevents group dodging)
  const dirColor = (d) => d.direction === 'bullish' ? '#22C55E' : '#EF4444';

  const spec: VistralSpec = {
    marks: [
      // Invisible anchor — gives the time scale its sliding-window domain
      {
        type: 'point',
        encode: { x: 'time', y: 'close' },
        style: { r: 0, fillOpacity: 0, strokeOpacity: 0, strokeWidth: 0 },
        tooltip: false,
      },
      // Wick — thin rect from low to high
      {
        type: 'rect',
        encode: {
          x: (d) => {                        // EncodeFn: time range for width
            const t = new Date(d.time).getTime();
            return [new Date(t - WICK_HALF), new Date(t + WICK_HALF)];
          },
          y: (d) => [d.low, d.high],        // EncodeFn: price range
          color: dirColor,                   // Identity color — no grouping
        },
        scales: { color: { type: 'identity' } },
        tooltip: false,
      },
      // Body — wider rect from open to close
      {
        type: 'rect',
        encode: {
          x: (d) => {
            const t = new Date(d.time).getTime();
            return [new Date(t - BODY_HALF), new Date(t + BODY_HALF)];
          },
          y: (d) => [d.open, d.close],
          color: dirColor,
        },
        scales: { color: { type: 'identity' } },
      },
    ],
    scales: {
      x: { type: 'time' },                  // Continuous time axis
      y: { type: 'linear', nice: true },
    },
    temporal: { mode: 'axis', field: 'time', range: 2 },
    streaming: { maxItems: 500, throttle: 100 },
    axes: {
      x: { title: false, grid: false },
      y: { title: 'Price ($)', grid: true },
    },
    legend: false,
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    // Pre-populate once (guard against React 18 Strict Mode double-run)
    if (!loadedRef.current) {
      loadedRef.current = true;
      if (handleRef.current) {
        handleRef.current.append(addDirection(dataGenerators.stockCandles.generate(30)));
      }
    }
    const interval = setInterval(() => {
      handleRef.current?.append(addDirection(dataGenerators.stockCandles.generate()));
    }, dataGenerators.stockCandles.interval);
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
