/**
 * Single Value Chart Component
 * Displays a single metric with optional sparkline and delta indicator
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { SingleValueConfig, StreamDataSource } from '../types';
import { singleColorPalettes } from '../themes';
import { useDataSource, useSparklineData, useChart } from '../hooks';
import { clamp } from '../utils';

export interface SingleValueChartProps {
  /** Chart configuration */
  config: SingleValueConfig;
  /** Data source */
  data: StreamDataSource;
  /** Theme */
  theme?: 'dark' | 'light';
  /** Container className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
}

/**
 * Find color palette by name
 */
function findColorByName(name: string): { keyColorValue: string } | undefined {
  return singleColorPalettes.find((c) => c.label === name);
}

/**
 * Get default configuration for single value chart
 */
export function getSingleValueDefaults(
  columns: { name: string; type: string }[]
): Partial<SingleValueConfig> | null {
  const numericCol = columns.find(({ type }) =>
    ['int', 'float', 'double', 'decimal', 'number'].some((t) =>
      type.toLowerCase().includes(t)
    )
  );

  if (!numericCol) return null;

  return {
    chartType: 'singleValue',
    yAxis: numericCol.name,
    fontSize: 64,
    color: 'blue',
    fractionDigits: 2,
    sparkline: false,
    sparklineColor: 'purple',
    delta: false,
    increaseColor: 'green',
    decreaseColor: 'red',
    unit: { position: 'left', value: '' },
  };
}

/**
 * Animated number display component
 */
const AnimatedNumber: React.FC<{
  value: number;
  decimals: number;
  duration?: number;
}> = ({ value, decimals, duration = 500 }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    if (isNaN(value)) return;

    const startValue = previousValue.current;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {isNaN(displayValue) ? '-' : displayValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
};

/**
 * Mini Sparkline Component
 */
const MiniSparkline: React.FC<{
  data: { value: number }[];
  color: string;
  width?: number;
  height?: number;
}> = ({ data, color, width = 200, height = 60 }) => {
  const { chart, chartRef } = useChart({ height });

  useEffect(() => {
    if (!chart || data.length === 0) return;

    chart.clear();

    const indexedData = data.map((d, i) => ({ index: i, value: d.value }));

    chart
      .line()
      .data(indexedData)
      .animate(false)
      .encode('x', 'index')
      .encode('y', 'value')
      .style('stroke', color)
      .style('lineWidth', 2)
      .style('shape', 'smooth')
      .scale({
        x: { type: 'linear', range: [0, 1] },
        y: { type: 'linear', nice: true },
      })
      .axis(false)
      .tooltip(false);

    chart.render();
  }, [chart, data, color]);

  return (
    <div
      ref={chartRef}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

/**
 * Single Value Chart Component
 */
export const SingleValueChart: React.FC<SingleValueChartProps> = ({
  config: configRaw,
  data: dataSource,
  theme = 'dark',
  className,
  style,
}) => {
  // Merge with defaults
  const defaults = getSingleValueDefaults(dataSource.columns);
  const config = useMemo(
    () => ({
      ...defaults,
      ...configRaw,
    } as SingleValueConfig),
    [configRaw, defaults]
  );

  // Get colors
  const mainColor = findColorByName(config.color || 'blue')?.keyColorValue || '#3B82F6';
  const sparklineColor = findColorByName(config.sparklineColor || 'purple')?.keyColorValue || '#8B5CF6';
  const increaseColor = findColorByName(config.increaseColor || 'green')?.keyColorValue || '#22C55E';
  const decreaseColor = findColorByName(config.decreaseColor || 'red')?.keyColorValue || '#EF4444';

  // Process data source
  const source = useDataSource(dataSource, '', config.yAxis, '');

  // Get current value
  const currentValue = useMemo(() => {
    if (!source || source.y.index < 0 || source.data.length === 0) return NaN;
    const lastRow = source.data[source.data.length - 1] as unknown[];
    return Number(lastRow[source.y.index]);
  }, [source]);

  // Track sparkline data and previous value for delta
  const { data: sparklineData } = useSparklineData(currentValue, 20);
  const [previousValue, setPreviousValue] = useState<number>(NaN);

  useEffect(() => {
    if (!isNaN(currentValue)) {
      const timer = setTimeout(() => {
        setPreviousValue(currentValue);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentValue]);

  // Calculate delta and keep last non-zero value
  const [displayedDelta, setDisplayedDelta] = useState<number>(0);

  useEffect(() => {
    if (isNaN(currentValue) || isNaN(previousValue)) return;
    const newDelta = currentValue - previousValue;
    // Only update displayed delta if it's non-zero
    if (newDelta !== 0) {
      setDisplayedDelta(newDelta);
    }
  }, [currentValue, previousValue]);

  // Decimal places
  const decimals = clamp(config.fractionDigits || 0, 0, 10);
  const fontSize = config.fontSize || 64;

  // Loading state
  if (isNaN(currentValue)) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          ...style,
        }}
        data-testid="single-value-chart"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ animation: 'spin 1s linear infinite' }}
        >
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
        <style>
          {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
        </style>
      </div>
    );
  }

  // Unit rendering
  const renderUnit = (position: 'left' | 'right') => {
    const unit = config.unit;
    if (!unit?.value || unit.position !== position) return null;

    return (
      <span
        style={{
          fontSize: position === 'left' ? fontSize : fontSize / 2,
          fontWeight: 'bold',
          fontFamily: 'Menlo, Monaco, monospace',
          color: mainColor,
          paddingRight: position === 'left' ? '4px' : 0,
          paddingLeft: position === 'right' ? '4px' : 0,
        }}
      >
        {unit.value}
      </span>
    );
  };

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        ...style,
      }}
      data-testid="single-value-chart"
    >
      {/* Main Value */}
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        {renderUnit('left')}
        <span
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 'bold',
            fontFamily: 'Menlo, Monaco, monospace',
            color: mainColor,
          }}
        >
          <AnimatedNumber value={currentValue} decimals={decimals} />
        </span>
        {renderUnit('right')}
      </div>

      {/* Delta Indicator - always shows last non-zero delta to prevent layout shift */}
      {config.delta && (
        <div
          style={{
            fontSize: `${Math.ceil(fontSize / 3)}px`,
            fontWeight: 'bold',
            fontFamily: 'Menlo, Monaco, monospace',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            color: displayedDelta > 0 ? increaseColor : displayedDelta < 0 ? decreaseColor : theme === 'dark' ? '#6B7280' : '#9CA3AF',
            marginTop: '8px',
            minHeight: `${Math.ceil(fontSize / 3) + 4}px`,
          }}
        >
          <span
            style={{
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: displayedDelta >= 0 ? '0 4px 8px 4px' : '8px 4px 0 4px',
              borderColor: displayedDelta >= 0
                ? `transparent transparent ${displayedDelta > 0 ? increaseColor : (theme === 'dark' ? '#6B7280' : '#9CA3AF')} transparent`
                : `${decreaseColor} transparent transparent transparent`,
            }}
          />
          <span>
            {displayedDelta >= 0 ? '+' : ''}
            {displayedDelta.toLocaleString('en-US', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
          </span>
        </div>
      )}

      {/* Sparkline */}
      {config.sparkline && sparklineData.length > 1 && (
        <div style={{ marginTop: '16px', width: '80%', maxWidth: '300px' }}>
          <MiniSparkline
            data={sparklineData}
            color={sparklineColor}
            height={60}
          />
        </div>
      )}
    </div>
  );
};

export default SingleValueChart;
