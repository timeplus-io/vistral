/**
 * @timeplus/vistral - Grammar API Examples
 *
 * This file demonstrates the VistralSpec + VistralChart grammar-level API
 * for building streaming data visualizations declaratively.
 *
 * All examples pre-populate with historical data so the chart looks complete
 * from the start, then stream new data points via handle.append().
 */

import React, { useEffect, useRef, useContext } from 'react';
import {
  VistralChart,
  compileTimeSeriesConfig,
  type VistralSpec,
  type ChartHandle,
  type StreamDataSource,
  type TimeSeriesConfig,
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
// Example 1: GrammarLineChart - Streaming line chart using VistralSpec directly
// =============================================================================

export function GrammarLineChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const valueRef = useRef(50);
  const loadedRef = useRef(false);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'line',
        encode: {
          x: 'time',
          y: 'value',
        },
        style: {
          connect: true,
          shape: 'smooth',
        },
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
    // Pre-populate with 30 historical data points
    const now = Date.now();
    const history: Record<string, unknown>[] = [];
    let v = 50;
    for (let i = 30; i >= 0; i--) {
      v = generateNextValue(v, 10, 90, 0.15);
      history.push({ time: new Date(now - i * 1000).toISOString(), value: v });
    }
    valueRef.current = v;

    if (!loadedRef.current && handleRef.current) {
      loadedRef.current = true;
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
}

// =============================================================================
// Example 2: GrammarMultiMark - Multi-mark composition (line + point)
// =============================================================================

export function GrammarMultiMark() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const valuesRef = useRef({ cpu: 55, memory: 65 });
  const loadedRef = useRef(false);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'line',
        encode: {
          x: 'time',
          y: 'value',
          color: 'series',
        },
        style: {
          connect: true,
          shape: 'smooth',
        },
      },
      {
        type: 'point',
        encode: {
          x: 'time',
          y: 'value',
          color: 'series',
        },
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

    if (!loadedRef.current && handleRef.current) {
      loadedRef.current = true;
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
}

// =============================================================================
// Example 3: GrammarBarChart - Bar chart with transpose coordinate
// =============================================================================

export function GrammarBarChart() {
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
        encode: {
          x: 'category',
          y: 'value',
          color: 'category',
        },
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
}

// =============================================================================
// Example 4: GrammarStackedArea - Stacked area chart
// =============================================================================

export function GrammarStackedArea() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const valuesRef = useRef({ requests: 200, errors: 30, timeouts: 15 });
  const loadedRef = useRef(false);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'area',
        encode: {
          x: 'time',
          y: 'value',
          color: 'series',
        },
        style: {
          connect: true,
        },
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

    if (!loadedRef.current && handleRef.current) {
      loadedRef.current = true;
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
    }, 2000);
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
}

// =============================================================================
// Example 5: GrammarCompiledChart - Demonstrates config compiler usage
// =============================================================================

export function GrammarCompiledChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const valueRef = useRef(50);
  const loadedRef = useRef(false);

  // Start with a high-level TimeSeriesConfig (same API as StreamChart)
  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'timestamp',
    yAxis: 'cpu_usage',
    lineStyle: 'curve',
    gridlines: true,
    yTitle: 'CPU Usage (%)',
    yRange: { min: 0, max: 100 },
    temporal: {
      mode: 'axis',
      field: 'timestamp',
      range: 1,
    },
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

    if (!loadedRef.current && handleRef.current) {
      loadedRef.current = true;
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
}

// =============================================================================
// Example 6: GrammarRoseChart - Nightingale Rose (interval + polar)
// =============================================================================

export function GrammarRoseChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const currentValues = useRef<Record<string, number>>({
    'API': 80,
    'Auth': 45,
    'Database': 95,
    'Cache': 60,
    'Worker': 70,
    'Gateway': 55,
  });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',
        encode: {
          x: 'service',
          y: 'requests',
          color: 'service',
        },
        style: {
          lineWidth: 1,
        },
      },
    ],
    scales: {
      x: { padding: 0.1 },
      y: { type: 'linear', nice: true },
    },
    coordinate: {
      type: 'polar',
    },
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
}

// =============================================================================
// Example 7: GrammarDonutChart - Donut/Pie (interval + theta + stackY)
// =============================================================================

export function GrammarDonutChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const currentValues = useRef<Record<string, number>>({
    'HTTP 200': 600,
    'HTTP 301': 80,
    'HTTP 404': 45,
    'HTTP 500': 20,
    'HTTP 503': 12,
  });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',
        encode: {
          y: 'count',
          color: 'status',
        },
        transforms: [{ type: 'stackY' }],
        style: {
          lineWidth: 1,
        },
        labels: [
          {
            text: 'status',
            style: { fontSize: 11 },
          },
        ],
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
      snapshot, status, count: Math.round(currentValues.current[status]),
    }));
    if (handleRef.current) {
      handleRef.current.replace(initialRows);
    }

    const interval = setInterval(() => {
      if (handleRef.current) {
        const snap = new Date().toISOString();
        const rows = statuses.map((status) => {
          currentValues.current[status] = generateNextValue(currentValues.current[status], 5, 800, 0.1);
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
}

// =============================================================================
// Example 8: GrammarRadarChart - Radar (line + area + polar)
// =============================================================================

export function GrammarRadarChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const currentValues = useRef({
    'server-a': { CPU: 70, Memory: 55, Disk: 40, Network: 80, Latency: 30 },
    'server-b': { CPU: 50, Memory: 75, Disk: 60, Network: 45, Latency: 65 },
  });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'line',
        encode: {
          x: 'metric',
          y: 'value',
          color: 'server',
        },
        style: {
          connect: true,
        },
      },
      {
        type: 'area',
        encode: {
          x: 'metric',
          y: 'value',
          color: 'server',
        },
        style: {
          fillOpacity: 0.15,
        },
      },
      {
        type: 'point',
        encode: {
          x: 'metric',
          y: 'value',
          color: 'server',
        },
        tooltip: false,
      },
    ],
    scales: {
      x: { padding: 0.5 },
      y: { type: 'linear', domain: [0, 100], nice: true },
    },
    coordinate: {
      type: 'polar',
    },
    temporal: { mode: 'frame', field: 'snapshot' },
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
    const servers = Object.keys(currentValues.current) as Array<keyof typeof currentValues.current>;
    const metrics = ['CPU', 'Memory', 'Disk', 'Network', 'Latency'];
    const snapshot = new Date().toISOString();
    const initialRows: Record<string, unknown>[] = [];
    servers.forEach((server) => {
      metrics.forEach((metric) => {
        initialRows.push({
          snapshot,
          server,
          metric,
          value: currentValues.current[server][metric as keyof typeof currentValues.current[typeof server]],
        });
      });
    });
    if (handleRef.current) {
      handleRef.current.replace(initialRows);
    }

    const interval = setInterval(() => {
      if (handleRef.current) {
        const snap = new Date().toISOString();
        const rows: Record<string, unknown>[] = [];
        servers.forEach((server) => {
          metrics.forEach((metric) => {
            const key = metric as keyof typeof currentValues.current[typeof server];
            currentValues.current[server][key] = generateNextValue(
              currentValues.current[server][key], 10, 95, 0.12
            );
            rows.push({ snapshot: snap, server, metric, value: Math.round(currentValues.current[server][key]) });
          });
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
}

// =============================================================================
// Example 9: GrammarRadialBar - Radial bar chart (interval + radial)
// =============================================================================

export function GrammarRadialBar() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const currentValues = useRef<Record<string, number>>({
    'us-east': 72,
    'us-west': 58,
    'eu-west': 85,
    'ap-south': 43,
    'ap-east': 66,
  });

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',
        encode: {
          x: 'region',
          y: 'throughput',
          color: 'region',
        },
        style: {
          lineWidth: 1,
        },
      },
    ],
    scales: {
      x: { padding: 0.3 },
      y: { type: 'linear', domain: [0, 100] },
    },
    coordinate: {
      type: 'radial',
      innerRadius: 0.3,
    },
    temporal: { mode: 'frame', field: 'snapshot' },
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
    const regions = Object.keys(currentValues.current);
    const snapshot = new Date().toISOString();
    const initialRows = regions.map((region) => ({
      snapshot, region, throughput: Math.round(currentValues.current[region]),
    }));
    if (handleRef.current) {
      handleRef.current.replace(initialRows);
    }

    const interval = setInterval(() => {
      if (handleRef.current) {
        const snap = new Date().toISOString();
        const rows = regions.map((region) => {
          currentValues.current[region] = generateNextValue(currentValues.current[region], 15, 98, 0.1);
          return { snapshot: snap, region, throughput: Math.round(currentValues.current[region]) };
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
        onReady={(handle) => { handleRef.current = handle; }}
      />
    </div>
  );
}

// =============================================================================
// Example 10: GrammarScatterChart - Streaming scatter/bubble (point mark)
// =============================================================================

export function GrammarScatterChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'point',
        encode: {
          x: 'latency',
          y: 'throughput',
          color: 'region',
          size: 'connections',
        },
        style: {
          fillOpacity: 0.7,
        },
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
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  const regionsRef = useRef([
    { name: 'us-east', latency: 45, throughput: 850, connections: 120 },
    { name: 'us-west', latency: 65, throughput: 720, connections: 90 },
    { name: 'eu-west', latency: 30, throughput: 950, connections: 150 },
    { name: 'ap-south', latency: 120, throughput: 450, connections: 60 },
    { name: 'ap-east', latency: 95, throughput: 580, connections: 80 },
  ]);

  useEffect(() => {
    const snapshot = new Date().toISOString();
    const initialRows = regionsRef.current.map((r) => ({
      snapshot, region: r.name, latency: r.latency, throughput: r.throughput, connections: r.connections,
    }));
    if (handleRef.current) {
      handleRef.current.replace(initialRows);
    }

    const interval = setInterval(() => {
      if (handleRef.current) {
        const snap = new Date().toISOString();
        const rows = regionsRef.current.map((r) => {
          r.latency = generateNextValue(r.latency, 10, 200, 0.12);
          r.throughput = generateNextValue(r.throughput, 200, 1200, 0.1);
          r.connections = generateNextValue(r.connections, 20, 200, 0.08);
          return {
            snapshot: snap,
            region: r.name,
            latency: Math.round(r.latency),
            throughput: Math.round(r.throughput),
            connections: Math.round(r.connections),
          };
        });
        handleRef.current.replace(rows);
      }
    }, 800);
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
}

// =============================================================================
// Example 11: GrammarHeatmap - Streaming heatmap grid (cell mark)
// =============================================================================

export function GrammarHeatmap() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const hours = ['00', '04', '08', '12', '16', '20'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const gridValues = useRef<Record<string, number>>({});

  const spec: VistralSpec = {
    marks: [
      {
        type: 'cell',
        encode: {
          x: 'hour',
          y: 'day',
          color: 'load',
        },
        style: {
          lineWidth: 1,
        },
      },
    ],
    scales: {
      color: { type: 'sequential', range: ['#0d47a1', '#2196f3', '#64b5f6', '#fff176', '#ff9800', '#f44336'] },
    },
    temporal: { mode: 'frame', field: 'snapshot' },
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
    // Initialize grid values
    days.forEach((day) => {
      hours.forEach((hour) => {
        const key = `${day}_${hour}`;
        const hourNum = parseInt(hour);
        // Base load pattern: higher during business hours
        const base = (hourNum >= 8 && hourNum <= 16) ? 70 : 30;
        // Weekends are lower
        const weekendFactor = (day === 'Sat' || day === 'Sun') ? 0.5 : 1;
        gridValues.current[key] = base * weekendFactor + Math.random() * 20;
      });
    });

    const snapshot = new Date().toISOString();
    const initialRows: Record<string, unknown>[] = [];
    days.forEach((day) => {
      hours.forEach((hour) => {
        initialRows.push({
          snapshot, day, hour, load: Math.round(gridValues.current[`${day}_${hour}`]),
        });
      });
    });
    if (handleRef.current) {
      handleRef.current.replace(initialRows);
    }

    const interval = setInterval(() => {
      if (handleRef.current) {
        const snap = new Date().toISOString();
        const rows: Record<string, unknown>[] = [];
        days.forEach((day) => {
          hours.forEach((hour) => {
            const key = `${day}_${hour}`;
            gridValues.current[key] = generateNextValue(gridValues.current[key], 5, 100, 0.08);
            rows.push({ snapshot: snap, day, hour, load: Math.round(gridValues.current[key]) });
          });
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
        onReady={(handle) => { handleRef.current = handle; }}
      />
    </div>
  );
}

// =============================================================================
// Example 12: GrammarTimeSeriesBar - Rect marks on a continuous time axis
// =============================================================================

export function GrammarTimeSeriesBar() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const valueRef = useRef(50);
  const loadedRef = useRef(false);

  const BAR_INTERVAL_MS = 2000;          // One bar every 2 seconds
  const BAR_HALF = BAR_INTERVAL_MS * 0.35; // Bar width = 70% of interval

  const spec: VistralSpec = {
    marks: [
      // Invisible anchor point — gives the time scale its sliding-window domain
      {
        type: 'point',
        encode: { x: 'time', y: 'value' },
        style: { r: 0, fillOpacity: 0, strokeOpacity: 0, strokeWidth: 0 },
        tooltip: false,
      },
      // Bar body — rect from 0 to value, width computed via EncodeFn
      {
        type: 'rect',
        encode: {
          x: ((d: Record<string, unknown>) => {
            const t = new Date(d.time as string).getTime();
            return [new Date(t - BAR_HALF), new Date(t + BAR_HALF)];
          }) as unknown as string,
          y: ((d: Record<string, unknown>) => [0, d.value]) as unknown as string,
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
    // Pre-populate with historical bars (guard against React 18 Strict Mode)
    if (!loadedRef.current) {
      loadedRef.current = true;
      const now = Date.now();
      const history: Record<string, unknown>[] = [];
      let v = 50;
      for (let i = 40; i >= 0; i--) {
        v = generateNextValue(v, 10, 100, 0.15);
        history.push({
          time: new Date(now - i * BAR_INTERVAL_MS).toISOString(),
          value: +v.toFixed(1),
        });
      }
      valueRef.current = v;

      if (handleRef.current) {
        handleRef.current.append(history);
      }
    }

    // Stream new bars
    const interval = setInterval(() => {
      if (handleRef.current) {
        valueRef.current = generateNextValue(valueRef.current, 10, 100, 0.15);
        handleRef.current.append([{
          time: new Date().toISOString(),
          value: +valueRef.current.toFixed(1),
        }]);
      }
    }, BAR_INTERVAL_MS);
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
}

// =============================================================================
// Example 13: GrammarCandlestickChart - OHLC Candlestick (two interval marks)
// =============================================================================

export function GrammarCandlestickChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const priceRef = useRef(100);
  const loadedRef = useRef(false);

  // Candle timing — controls interval and rect widths
  const CANDLE_MS = 3000;
  const BODY_HALF = CANDLE_MS * 0.35;
  const WICK_HALF = CANDLE_MS * 0.03;

  // EncodeFn: map direction to color directly (identity scale avoids grouping/dodging)
  const dirColor = ((d: Record<string, unknown>) =>
    d.direction === 'bullish' ? '#22C55E' : '#EF4444'
  ) as unknown as string;

  const spec: VistralSpec = {
    marks: [
      // Invisible anchor point — establishes the time scale domain
      // so temporal axis-bound sliding window works correctly.
      {
        type: 'point',
        encode: { x: 'time', y: 'close' },
        style: { r: 0, fillOpacity: 0, strokeOpacity: 0, strokeWidth: 0 },
        tooltip: false,
      },
      // Wick (thin rect from low to high)
      {
        type: 'rect',
        encode: {
          x: ((d: Record<string, unknown>) => {
            const t = new Date(d.time as string).getTime();
            return [new Date(t - WICK_HALF), new Date(t + WICK_HALF)];
          }) as unknown as string,
          y: ((d: Record<string, unknown>) => [d.low, d.high]) as unknown as string,
          color: dirColor,
        },
        scales: { color: { type: 'identity' } },
        tooltip: false,
      },
      // Body (wider rect from open to close)
      {
        type: 'rect',
        encode: {
          x: ((d: Record<string, unknown>) => {
            const t = new Date(d.time as string).getTime();
            return [new Date(t - BODY_HALF), new Date(t + BODY_HALF)];
          }) as unknown as string,
          y: ((d: Record<string, unknown>) => [d.open, d.close]) as unknown as string,
          color: dirColor,
        },
        scales: { color: { type: 'identity' } },
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
      y: { title: 'Price ($)', grid: true },
    },
    legend: false,
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
    // Generate one OHLC candle from a random walk
    function generateCandle(basePrice: number, time: string) {
      const volatility = basePrice * 0.02;
      const open = basePrice;
      const moves = Array.from({ length: 4 }, () => (Math.random() - 0.48) * volatility);
      const close = open + moves.reduce((a, b) => a + b, 0);
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const direction = close >= open ? 'bullish' : 'bearish';
      return {
        time,
        open: +open.toFixed(2),
        high: +high.toFixed(2),
        low: +low.toFixed(2),
        close: +close.toFixed(2),
        direction,
      };
    }

    // Pre-populate with 30 historical candles (guard against React 18 Strict Mode double-run)
    if (!loadedRef.current) {
      loadedRef.current = true;
      const now = Date.now();
      const history: Record<string, unknown>[] = [];
      let price = 100;
      for (let i = 30; i >= 0; i--) {
        const candle = generateCandle(price, new Date(now - i * CANDLE_MS).toISOString());
        history.push(candle);
        price = candle.close as number;
      }
      priceRef.current = price;

      if (handleRef.current) {
        handleRef.current.append(history);
      }
    }

    // Stream new candles
    const interval = setInterval(() => {
      if (handleRef.current) {
        const candle = generateCandle(priceRef.current, new Date().toISOString());
        priceRef.current = candle.close as number;
        handleRef.current.append([candle]);
      }
    }, CANDLE_MS);
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
}

// =============================================================================
// Default Export - All Grammar Examples
// =============================================================================

export default {
  GrammarLineChart,
  GrammarMultiMark,
  GrammarBarChart,
  GrammarStackedArea,
  GrammarCompiledChart,
  GrammarRoseChart,
  GrammarDonutChart,
  GrammarRadarChart,
  GrammarRadialBar,
  GrammarScatterChart,
  GrammarHeatmap,
  GrammarTimeSeriesBar,
  GrammarCandlestickChart,
};
