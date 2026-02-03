/**
 * @timeplus/vistral - Grammar API Examples
 *
 * This file demonstrates the VistralSpec + VistralChart grammar-level API
 * for building streaming data visualizations declaratively.
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
    const categories = ['Widgets', 'Gadgets', 'Gizmos', 'Doodads', 'Thingamajigs'];
    const currentValues: Record<string, number> = {
      Widgets: 120,
      Gadgets: 85,
      Gizmos: 95,
      Doodads: 65,
      Thingamajigs: 110,
    };

    const interval = setInterval(() => {
      if (handleRef.current) {
        const snapshot = new Date().toISOString();
        const rows = categories.map((category) => {
          currentValues[category] = generateNextValue(currentValues[category], 30, 160, 0.1);
          return { snapshot, category, value: Math.round(currentValues[category]) };
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
        labels: [
          {
            text: 'value',
            selector: 'last',
            overlapHide: true,
          },
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
    axes: {
      x: { title: false, grid: false },
      y: { title: 'Count', grid: true },
    },
    legend: { position: 'bottom', interactive: true },
    theme: theme as 'dark' | 'light',
    animate: false,
  };

  useEffect(() => {
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
}

// =============================================================================
// Example 5: GrammarCompiledChart - Demonstrates config compiler usage
// =============================================================================

export function GrammarCompiledChart() {
  const theme = useTheme();
  const handleRef = useRef<ChartHandle | null>(null);
  const valueRef = useRef(50);

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
  // This bridges the high-level config API with the grammar API.
  //
  // The compiled spec will look like:
  // {
  //   marks: [{ type: 'line', encode: { x: 'timestamp', y: 'cpu_usage' }, style: { connect: true, shape: 'smooth' } }],
  //   scales: { x: { type: 'time' }, y: { type: 'linear', nice: true, domain: [0, 100] } },
  //   temporal: { mode: 'axis', field: 'timestamp', range: 1 },
  //   streaming: { maxItems: 1000 },
  //   axes: { x: { title: false, grid: false }, y: { title: 'CPU Usage (%)', grid: true } },
  //   legend: { position: 'bottom', interactive: true },
  //   theme: 'dark',
  //   animate: false,
  // }
  const compiledSpec = compileTimeSeriesConfig(config);

  // Override the theme to match the current context
  const spec: VistralSpec = {
    ...compiledSpec,
    theme: theme as 'dark' | 'light',
  };

  useEffect(() => {
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
// Default Export - All Grammar Examples
// =============================================================================

export default {
  GrammarLineChart,
  GrammarMultiMark,
  GrammarBarChart,
  GrammarStackedArea,
  GrammarCompiledChart,
};
