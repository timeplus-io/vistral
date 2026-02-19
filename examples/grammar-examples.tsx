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
  type TimeSeriesConfig,
} from '@timeplus/vistral';
import { ThemeContext } from './App';
import { dataGenerators } from './data-utils';

// Hook to get current theme
function useTheme() {
  const context = useContext(ThemeContext);
  return context?.theme || 'dark';
}

// =============================================================================
// Example 1: GrammarLineChart - Streaming line chart using VistralSpec directly
// =============================================================================

export function GrammarLineChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
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
  const loadedRef = useRef(false);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'line',
        encode: {
          x: 'time',
          y: 'value',
          color: 'metric',
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
          color: 'metric',
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

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',
        encode: {
          x: 'product',
          y: 'sales',
          color: 'product',
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
  const loadedRef = useRef(false);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'area',
        encode: {
          x: 'time',
          y: 'value',
          color: 'metric',
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
  const loadedRef = useRef(false);

  // Start with a high-level TimeSeriesConfig (same API as StreamChart)
  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'time',
    yAxis: 'value',
    lineStyle: 'curve',
    gridlines: true,
    yTitle: 'CPU Usage (%)',
    yRange: { min: 0, max: 100 },
    temporal: {
      mode: 'axis',
      field: 'time',
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
}

// =============================================================================
// Example 7: GrammarDonutChart - Donut/Pie (interval + theta + stackY)
// =============================================================================

export function GrammarDonutChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);

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
}

// =============================================================================
// Example 8: GrammarRadarChart - Radar (line + area + polar)
// =============================================================================

export function GrammarRadarChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);

  const spec: VistralSpec = {
    marks: [
      {
        type: 'line',
        encode: {
          x: 'dimension',
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
          x: 'dimension',
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
          x: 'dimension',
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

  const spec: VistralSpec = {
    marks: [
      {
        type: 'interval',
        encode: {
          x: 'region',
          y: 'latency',
          color: 'region',
        },
        style: {
          lineWidth: 1,
        },
      },
    ],
    scales: {
      x: { padding: 0.3 },
      y: { type: 'linear', domain: [0, 200] },
    },
    coordinate: {
      type: 'radial',
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
  const loadedRef = useRef(false);

  const BAR_INTERVAL_MS = 2000;          // One bar every 2 seconds (visual width)
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
    if (!loadedRef.current) {
      loadedRef.current = true;
      if (handleRef.current) {
        handleRef.current.append(dataGenerators.cpuLoad.generate(40));
      }
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
}

// =============================================================================
// Example 13: GrammarCandlestickChart - OHLC Candlestick (two interval marks)
// =============================================================================

export function GrammarCandlestickChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const loadedRef = useRef(false);

  // Candle timing — controls interval and rect widths
  const CANDLE_MS = dataGenerators.stockCandles.interval;
  const BODY_HALF = CANDLE_MS * 0.35;
  const WICK_HALF = CANDLE_MS * 0.03;

  // Add direction field (bullish/bearish) based on open vs close
  const addDirection = (candles: Record<string, unknown>[]) =>
    candles.map(c => ({
      ...c,
      direction: (c.close as number) >= (c.open as number) ? 'bullish' : 'bearish',
    }));

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
