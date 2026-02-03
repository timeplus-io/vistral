/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * VistralChart — a React component that renders any VistralSpec using the
 * Spec Engine and AntV G2.
 *
 * It accepts a declarative `VistralSpec` and an optional `StreamDataSource`,
 * normalises the data, translates the spec to G2 options via `buildG2Options`,
 * and manages the full G2 chart lifecycle (create / update / destroy).
 *
 * Streaming is supported through the imperative `ChartHandle` exposed via
 * `React.forwardRef` — callers can `append`, `replace`, or `clear` data at
 * any time.
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { Chart } from '@antv/g2';
import type { VistralSpec } from '../types/spec';
import type { StreamDataSource, ColumnDefinition } from '../types';
import { buildG2Options } from '../core/spec-engine';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Imperative handle exposed via `ref` on `<VistralChart>`. */
export interface ChartHandle {
  /** Append rows to the internal data buffer and re-render. */
  append: (rows: unknown[][] | Record<string, unknown>[]) => void;
  /** Replace the entire data buffer and re-render. */
  replace: (rows: unknown[][] | Record<string, unknown>[]) => void;
  /** Clear the data buffer and re-render. */
  clear: () => void;
  /** Direct access to the underlying G2 Chart instance (or null). */
  g2: Chart | null;
}

/** Props accepted by `<VistralChart>`. */
export interface VistralChartProps {
  /** The declarative spec describing what to render. */
  spec: VistralSpec;
  /** Optional initial / declarative data source. */
  source?: StreamDataSource;
  /** Explicit pixel width (defaults to 100 % of container). */
  width?: number;
  /** Explicit pixel height (defaults to 100 % of container). */
  height?: number;
  /** Additional CSS class for the wrapper div. */
  className?: string;
  /** Additional inline styles for the wrapper div. */
  style?: React.CSSProperties;
  /** Called once the chart is ready with its imperative handle. */
  onReady?: (handle: ChartHandle) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a `StreamDataSource` into an array of `Record<string, unknown>`.
 *
 * Rows that are already objects are kept as-is. Array rows are mapped using
 * the column definitions so that `row[i]` becomes `{ [columns[i].name]: v }`.
 */
function normaliseData(
  source: StreamDataSource | undefined,
): Record<string, unknown>[] {
  if (!source || !source.data || source.data.length === 0) return [];

  const { columns, data } = source;

  return data.map((row) => {
    if (Array.isArray(row)) {
      return arrayRowToObject(row, columns);
    }
    return row as Record<string, unknown>;
  });
}

/**
 * Convert a single array-style row to an object using column definitions.
 */
function arrayRowToObject(
  row: unknown[],
  columns: ColumnDefinition[],
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (let i = 0; i < columns.length; i++) {
    obj[columns[i].name] = row[i];
  }
  return obj;
}

/**
 * Normalise raw rows (which may be arrays or objects) into objects.
 * When array rows are encountered without column info we fall back to
 * positional keys ("col_0", "col_1", ...).
 */
function normaliseRows(
  rows: unknown[][] | Record<string, unknown>[],
  columns?: ColumnDefinition[],
): Record<string, unknown>[] {
  return (rows as unknown[]).map((row) => {
    if (Array.isArray(row)) {
      if (columns && columns.length > 0) {
        return arrayRowToObject(row, columns);
      }
      // Fallback: positional keys
      const obj: Record<string, unknown> = {};
      for (let i = 0; i < row.length; i++) {
        obj[`col_${i}`] = row[i];
      }
      return obj;
    }
    return row as Record<string, unknown>;
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `VistralChart` renders a VistralSpec declaratively. It manages the G2
 * chart lifecycle and exposes an imperative `ChartHandle` via ref for
 * streaming updates.
 */
export const VistralChart = forwardRef<ChartHandle, VistralChartProps>(
  function VistralChart(props, ref) {
    const { spec, source, width, height, className, style, onReady } = props;

    // DOM container
    const containerRef = useRef<HTMLDivElement>(null);

    // G2 chart instance
    const chartRef = useRef<Chart | null>(null);

    // Internal data buffer
    const dataRef = useRef<Record<string, unknown>[]>([]);

    // Column definitions (kept from source for array-row normalisation)
    const columnsRef = useRef<ColumnDefinition[]>([]);

    // Throttle timer
    const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRenderRef = useRef(false);

    // Track whether onReady has been called
    const [readyFired, setReadyFired] = useState(false);

    // ----- Render helper -----

    const renderChart = useCallback(() => {
      const chart = chartRef.current;
      if (!chart) return;

      const data = dataRef.current;
      const g2Options = buildG2Options(spec, data);

      // Attach data to each child mark
      if (g2Options.children) {
        for (const child of g2Options.children) {
          child.data = data;
        }
      }

      // Apply explicit dimensions if provided
      if (width !== undefined) g2Options.width = width;
      if (height !== undefined) g2Options.height = height;

      chart.options(g2Options);
      chart.render();
    }, [spec, width, height]);

    /**
     * Schedule a render, respecting the optional throttle interval.
     */
    const scheduleRender = useCallback(() => {
      const throttle = spec.streaming?.throttle ?? 0;

      if (throttle <= 0) {
        renderChart();
        return;
      }

      // If a timer is already running, mark as pending
      if (throttleTimerRef.current !== null) {
        pendingRenderRef.current = true;
        return;
      }

      renderChart();
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;
        if (pendingRenderRef.current) {
          pendingRenderRef.current = false;
          renderChart();
        }
      }, throttle);
    }, [renderChart, spec.streaming?.throttle]);

    // ----- Imperative handle -----

    const maxItems = spec.streaming?.maxItems ?? 1000;

    const handleRef = useRef<ChartHandle>({
      append: () => {},
      replace: () => {},
      clear: () => {},
      g2: null,
    });

    // Keep handle methods up-to-date
    handleRef.current.append = (
      rows: unknown[][] | Record<string, unknown>[],
    ) => {
      const normalised = normaliseRows(rows, columnsRef.current);
      const buffer = dataRef.current;
      buffer.push(...normalised);

      // Trim to maxItems
      if (buffer.length > maxItems) {
        dataRef.current = buffer.slice(buffer.length - maxItems);
      }

      scheduleRender();
    };

    handleRef.current.replace = (
      rows: unknown[][] | Record<string, unknown>[],
    ) => {
      const normalised = normaliseRows(rows, columnsRef.current);
      dataRef.current = normalised.slice(-maxItems);
      scheduleRender();
    };

    handleRef.current.clear = () => {
      dataRef.current = [];
      scheduleRender();
    };

    handleRef.current.g2 = chartRef.current;

    useImperativeHandle(ref, () => handleRef.current, []);

    // ----- Chart lifecycle: create / destroy -----

    useEffect(() => {
      if (!containerRef.current) return;

      const chart = new Chart({
        container: containerRef.current,
        autoFit: true,
      });

      chartRef.current = chart;
      handleRef.current.g2 = chart;

      return () => {
        // Cleanup throttle timer
        if (throttleTimerRef.current !== null) {
          clearTimeout(throttleTimerRef.current);
          throttleTimerRef.current = null;
        }
        chart.destroy();
        chartRef.current = null;
        handleRef.current.g2 = null;
      };
    }, []);

    // ----- React to source / spec changes -----

    useEffect(() => {
      if (source) {
        columnsRef.current = source.columns;
        dataRef.current = normaliseData(source);
      }

      scheduleRender();
    }, [source, scheduleRender]);

    // ----- onReady callback -----

    useEffect(() => {
      if (!readyFired && chartRef.current && onReady) {
        onReady(handleRef.current);
        setReadyFired(true);
      }
    }, [readyFired, onReady]);

    // ----- Render -----

    const containerStyle: React.CSSProperties = {
      width: width !== undefined ? width : '100%',
      height: height !== undefined ? height : '100%',
      ...style,
    };

    return (
      <div
        ref={containerRef}
        className={className}
        style={containerStyle}
      />
    );
  },
);
