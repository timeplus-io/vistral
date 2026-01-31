/**
 * React hooks for stream visualization
 */

import { Chart } from '@antv/g2';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProcessedDataSource, StreamDataSource } from '../types';
import { processDataSource } from '../utils';

/**
 * Hook to manage AntV G2 chart instance
 */
export function useChart(options?: { height?: number; padding?: number }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<Chart | null>(null);
  const [isMouseOver, setIsMouseOver] = useState(false);
  const [activeColor, setActiveColor] = useState(-1);

  useEffect(() => {
    if (!chartRef.current) return;

    const chartInstance = new Chart({
      container: chartRef.current,
      autoFit: true,
      height: options?.height,
      padding: options?.padding,
      marginBottom: 0,
    });

    // Set up mouse tracking
    const container = chartInstance.getContainer();

    const handleMouseOver = () => setIsMouseOver(true);
    const handleMouseLeave = () => setIsMouseOver(false);

    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Initialize with empty data
    chartInstance.data([]);

    setChart(chartInstance);

    return () => {
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseleave', handleMouseLeave);
      chartInstance.destroy();
      setChart(null);
    };
  }, [options?.height, options?.padding]);

  return {
    chart,
    chartRef,
    isMouseOver,
    activeColor,
    setActiveColor,
  };
}

/**
 * Hook to process streaming data source
 */
export function useDataSource(
  source: StreamDataSource | null,
  xKey: string,
  yKey: string,
  zKey?: string
): ProcessedDataSource | null {
  const [processedData, setProcessedData] = useState<ProcessedDataSource | null>(null);

  useEffect(() => {
    if (!source || !yKey) {
      setProcessedData(null);
      return;
    }

    const processed = processDataSource(source, xKey, yKey, zKey);
    setProcessedData(processed);
  }, [source, xKey, yKey, zKey]);

  return processedData;
}

/**
 * Hook to track streaming data updates
 */
export function useStreamingData<T>(
  initialData: T[],
  maxItems = 1000
): {
  data: T[];
  append: (items: T | T[]) => void;
  replace: (items: T[]) => void;
  clear: () => void;
} {
  const [data, setData] = useState<T[]>(initialData);

  const append = useCallback(
    (items: T | T[]) => {
      setData((prev) => {
        const newItems = Array.isArray(items) ? items : [items];
        const combined = [...prev, ...newItems];
        // Keep only the last maxItems
        return combined.slice(-maxItems);
      });
    },
    [maxItems]
  );

  const replace = useCallback((items: T[]) => {
    setData(items.slice(-maxItems));
  }, [maxItems]);

  const clear = useCallback(() => {
    setData([]);
  }, []);

  return { data, append, replace, clear };
}

/**
 * Hook to handle resize detection
 */
export function useResizeObserver(callback: (entry: ResizeObserverEntry) => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedCallback = (entry: ResizeObserverEntry) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => callback(entry), 200);
    };

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => debouncedCallback(entry));
    });

    observer.observe(ref.current);

    return () => {
      if (timeout) clearTimeout(timeout);
      observer.disconnect();
    };
  }, [callback]);

  return ref;
}

/**
 * Hook to manage chart theme
 */
export function useChartTheme(theme: 'dark' | 'light' = 'dark') {
  const [currentTheme, setCurrentTheme] = useState(theme);

  const toggleTheme = useCallback(() => {
    setCurrentTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme: currentTheme,
    setTheme: setCurrentTheme,
    toggleTheme,
    isDark: currentTheme === 'dark',
  };
}

/**
 * Hook to track last update time
 */
export function useLastUpdated(data: unknown[]) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (data.length > 0) {
      setLastUpdated(new Date());
    }
  }, [data]);

  return lastUpdated;
}

/**
 * Hook for sparkline data management
 */
export function useSparklineData(
  value: number | null,
  limit = 20
): { data: { value: number }[]; trend: 'up' | 'down' | 'stable' } {
  const [data, setData] = useState<{ value: number }[]>([]);

  useEffect(() => {
    if (value === null || isNaN(value)) return;

    setData((prev) => {
      const next = [...prev, { value }];
      return next.slice(-limit);
    });
  }, [value, limit]);

  const trend = data.length >= 2 
    ? data[data.length - 1].value > data[data.length - 2].value 
      ? 'up' 
      : data[data.length - 1].value < data[data.length - 2].value 
        ? 'down' 
        : 'stable'
    : 'stable';

  return { data, trend };
}

/**
 * Hook to manage chart animation state
 */
export function useChartAnimation(enabled = true) {
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = useCallback(() => {
    if (enabled) setIsAnimating(true);
  }, [enabled]);

  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
  }, []);

  return {
    isAnimating,
    startAnimation,
    stopAnimation,
    animationEnabled: enabled,
  };
}

/**
 * Hook to debounce a value
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to track previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook to determine default chart configuration based on data schema
 */
export function useAutoConfig(columns: { name: string; type: string }[]) {
  return useCallback(() => {
    const dateCol = columns.find((c) => 
      ['datetime', 'datetime64', 'date', 'timestamp'].some((t) => 
        c.type.toLowerCase().includes(t)
      )
    );
    const numericCols = columns.filter((c) =>
      ['int', 'float', 'double', 'decimal', 'number'].some((t) =>
        c.type.toLowerCase().includes(t)
      )
    );
    const stringCols = columns.filter((c) =>
      ['string', 'varchar', 'text', 'char'].some((t) =>
        c.type.toLowerCase().includes(t)
      )
    );

    return {
      suggestedXAxis: dateCol?.name || stringCols[0]?.name || columns[0]?.name,
      suggestedYAxis: numericCols[0]?.name || columns[1]?.name,
      suggestedColor: stringCols[0]?.name,
      hasTimeSeries: !!dateCol && numericCols.length > 0,
      hasCategorical: stringCols.length > 0 && numericCols.length > 0,
    };
  }, [columns]);
}
