/**
 * Multiple Value Chart Component
 * Displays multiple metrics side by side mapped by a key, with optional sparkline and delta indicator for each.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MultipleValueConfig, StreamDataSource } from '../types';
import type { VistralTheme } from '../types/theme';
import { singleColorPalettes } from '../themes';
import { useChart } from '../hooks';
import { isDarkTheme } from '../core/theme-registry';
import { clamp } from '../utils';

export interface MultipleValueChartProps {
    /** Chart configuration */
    config: MultipleValueConfig;
    /** Data source */
    data: StreamDataSource;
    /** Theme */
    theme?: string | VistralTheme;
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
 * Get default configuration for multiple value chart
 */
export function getMultipleValueDefaults(
    columns: { name: string; type: string }[]
): Partial<MultipleValueConfig> | null {
    const numericCol = columns.find(({ type }) =>
        ['int', 'float', 'double', 'decimal', 'number'].some((t) =>
            type.toLowerCase().includes(t)
        )
    );

    const stringCol = columns.find(({ type }) => type.toLowerCase() === 'string');

    if (!numericCol) return null;

    return {
        chartType: 'multipleValue',
        yAxis: numericCol.name,
        key: stringCol?.name,
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
        if (isNaN(startValue)) {
            setDisplayValue(value);
            previousValue.current = value;
            return;
        }

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
    data: number[];
    color: string;
    width?: number;
    height?: number;
}> = ({ data, color, width = 200, height = 60 }) => {
    const { chart, chartRef } = useChart({ height });

    useEffect(() => {
        if (!chart || data.length === 0) return;

        chart.clear();

        const indexedData = data.map((d, i) => ({ index: i, value: d }));

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

interface KeyedValueState {
    currentValue: number;
    previousValue: number;
    displayedDelta: number;
    sparklineData: number[];
}

/**
 * Multiple Value Chart Component
 */
export const MultipleValueChart: React.FC<MultipleValueChartProps> = ({
    config: configRaw,
    data: dataSource,
    theme = 'dark',
    className,
    style,
}) => {
    // Merge with defaults
    const defaults = getMultipleValueDefaults(dataSource.columns);
    const config = useMemo(
        () => ({
            ...defaults,
            ...configRaw,
        } as MultipleValueConfig),
        [configRaw, defaults]
    );

    // Get colors
    const mainColor = findColorByName(config.color || 'blue')?.keyColorValue || '#3B82F6';
    const sparklineColor = findColorByName(config.sparklineColor || 'purple')?.keyColorValue || '#8B5CF6';
    const increaseColor = findColorByName(config.increaseColor || 'green')?.keyColorValue || '#22C55E';
    const decreaseColor = findColorByName(config.decreaseColor || 'red')?.keyColorValue || '#EF4444';

    const decimals = clamp(config.fractionDigits || 0, 0, 10);
    const fontSize = config.fontSize || 64;

    const yType = dataSource.columns.find(c => c.name === config.yAxis)?.type;
    const isNumeric = yType && ['int', 'float', 'double', 'decimal', 'number'].some(t => yType.toLowerCase().includes(t));

    const [keys, setKeys] = useState<string[]>([]);
    const stateMapRef = useRef<Map<string, KeyedValueState>>(new Map());

    // Use temporal binding field if key is missing and mode is 'key'
    const keyField = config.key || (config.temporal?.mode === 'key' ? (Array.isArray(config.temporal.field) ? config.temporal.field[0] : config.temporal.field) : undefined);

    // Process data source grouping by key
    useEffect(() => {
        if (!keyField || !config.yAxis || !isNumeric) return;

        const keyIndex = dataSource.columns.findIndex(c => c.name === keyField);
        const yIndex = dataSource.columns.findIndex(c => c.name === config.yAxis);
        if (keyIndex < 0 || yIndex < 0) return;

        const currentKeys = new Set(keys);
        const newKeys: string[] = [];

        // Maintain a maximum sparkline length
        const MAX_SPARKLINE_LEN = 20;

        dataSource.data.forEach((row: any) => {
            const kv = String(row[keyIndex] ?? 'Unknown');
            const valRaw = row[yIndex];
            const val = Number(valRaw);

            if (!currentKeys.has(kv)) {
                currentKeys.add(kv);
                newKeys.push(kv);
            }

            const existingState = stateMapRef.current.get(kv);
            if (!existingState) {
                stateMapRef.current.set(kv, {
                    currentValue: val,
                    previousValue: NaN,
                    displayedDelta: 0,
                    sparklineData: isNaN(val) ? [] : [val]
                });
            } else {
                // if value actually changed, record previous
                if (!isNaN(val) && val !== existingState.currentValue) {
                    const newDelta = val - existingState.currentValue;
                    existingState.previousValue = existingState.currentValue;
                    existingState.currentValue = val;
                    if (newDelta !== 0) {
                        existingState.displayedDelta = newDelta;
                    }
                    existingState.sparklineData.push(val);
                    if (existingState.sparklineData.length > MAX_SPARKLINE_LEN) {
                        existingState.sparklineData.shift();
                    }
                }
            }
        });

        if (newKeys.length > 0) {
            setKeys(prev => [...prev, ...newKeys]);
        }
    }, [dataSource.data, keyField, config.yAxis, keys, isNumeric]);


    // Loading state
    if (!keyField || keys.length === 0) {
        return (
            <div
                className={className}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDarkTheme(theme) ? '#9CA3AF' : '#6B7280',
                    ...style,
                }}
                data-testid="multiple-value-chart"
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
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '16px',
                overflowX: 'auto',
                ...style,
            }}
            data-testid="multiple-value-chart"
        >
            {keys.map(k => {
                const state = stateMapRef.current.get(k);
                if (!state) return null;

                return (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 16px' }}>
                        {/* Title / Key */}
                        <div style={{
                            color: isDarkTheme(theme) ? '#D1D5DB' : '#4B5563',
                            fontSize: `${Math.max(12, fontSize / 4)}px`,
                            fontWeight: 600,
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {k}
                        </div>

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
                                <AnimatedNumber value={state.currentValue} decimals={decimals} />
                            </span>
                            {renderUnit('right')}
                        </div>

                        {/* Delta Indicator - always shows last non-zero delta to prevent layout shift */}
                        {
                            config.delta && (
                                <div
                                    style={{
                                        fontSize: `${Math.ceil(fontSize / 3)}px`,
                                        fontWeight: 'bold',
                                        fontFamily: 'Menlo, Monaco, monospace',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        color: state.displayedDelta > 0 ? increaseColor : state.displayedDelta < 0 ? decreaseColor : isDarkTheme(theme) ? '#6B7280' : '#9CA3AF',
                                        marginTop: '8px',
                                        minHeight: `${Math.ceil(fontSize / 3) + 4}px`,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 0,
                                            height: 0,
                                            borderStyle: 'solid',
                                            borderWidth: state.displayedDelta >= 0 ? '0 4px 8px 4px' : '8px 4px 0 4px',
                                            borderColor: state.displayedDelta >= 0
                                                ? `transparent transparent ${state.displayedDelta > 0 ? increaseColor : (isDarkTheme(theme) ? '#6B7280' : '#9CA3AF')} transparent`
                                                : `${decreaseColor} transparent transparent transparent`,
                                        }}
                                    />
                                    <span>
                                        {state.displayedDelta >= 0 ? '+' : ''}
                                        {state.displayedDelta.toLocaleString('en-US', {
                                            minimumFractionDigits: decimals,
                                            maximumFractionDigits: decimals,
                                        })}
                                    </span>
                                </div>
                            )}

                        {/* Sparkline */}
                        {config.sparkline && state.sparklineData.length > 1 && (
                            <div style={{ marginTop: '16px', width: '80%', maxWidth: '300px' }}>
                                <MiniSparkline
                                    data={state.sparklineData}
                                    color={sparklineColor}
                                    height={60}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default MultipleValueChart;
