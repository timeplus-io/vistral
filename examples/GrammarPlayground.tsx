/**
 * Grammar API Playground
 * 
 * Interactive spec builder using VistralSpec + VistralChart grammar API.
 * Uses UI controls to build spec configuration with live preview.
 */

import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import {
    VistralChart,
    useStreamingData,
} from '@timeplus/vistral';
import { ThemeContext } from './App';

// ============================================================================
// Types (avoid importing from @timeplus/vistral for examples compatibility)
// ============================================================================

interface VistralSpec {
    marks: MarkSpec[];
    scales?: Record<string, ScaleSpec>;
    transforms?: TransformSpec[];
    coordinate?: CoordinateSpec;
    streaming?: StreamingSpec;
    temporal?: TemporalSpec;
    axes?: AxesSpec;
    legend?: LegendSpec | false;
    theme?: 'dark' | 'light';
    animate?: boolean;
}

interface MarkSpec {
    type: string;
    encode?: Record<string, string>;
    style?: Record<string, unknown>;
    tooltip?: boolean | Record<string, unknown>;
    labels?: LabelSpec[];
    scales?: Record<string, ScaleSpec>;
    transforms?: TransformSpec[];
}

interface ScaleSpec {
    type?: string;
    domain?: unknown[];
    range?: unknown[];
    nice?: boolean;
    padding?: number;
}

interface TransformSpec {
    type: string;
    [key: string]: unknown;
}

interface CoordinateSpec {
    type?: string;
    transforms?: { type: string }[];
}

interface StreamingSpec {
    maxItems?: number;
    mode?: 'append' | 'replace';
    throttle?: number;
}

interface TemporalSpec {
    mode: 'axis' | 'frame' | 'key';
    field: string | string[];
    range?: number;
}

interface AxesSpec {
    x?: AxisChannelSpec | false;
    y?: AxisChannelSpec | false;
}

interface AxisChannelSpec {
    title?: string | false;
    grid?: boolean;
    line?: boolean;
    labels?: { format?: string; rotate?: number };
}

interface LegendSpec {
    position?: 'top' | 'bottom' | 'left' | 'right';
    interactive?: boolean;
}

interface LabelSpec {
    text: string;
    overlapHide?: boolean;
    selector?: string;
    style?: Record<string, unknown>;
}

import { dataGenerators, type DataGenerator, type Column } from './data-utils';

// ... (other imports)

// ============================================================================
// Mark Types
// ============================================================================

const markTypes = [
    { value: 'line', label: 'Line' },
    { value: 'area', label: 'Area' },
    { value: 'interval', label: 'Interval' },
    { value: 'rect', label: 'Rect' },
    { value: 'point', label: 'Point' },
];

const scaleTypes = [
    { value: 'time', label: 'Time' },
    { value: 'linear', label: 'Linear' },
    { value: 'band', label: 'Band' },
    { value: 'ordinal', label: 'Ordinal' },
    { value: 'log', label: 'Log' },
];

const temporalModes = [
    { value: '', label: 'None' },
    { value: 'axis', label: 'Axis (Sliding Window)' },
    { value: 'frame', label: 'Frame (Latest Timestamp)' },
    { value: 'key', label: 'Key (Deduplicate)' },
];

const coordinateTransforms = [
    { value: '', label: 'None (Cartesian)' },
    { value: 'transpose', label: 'Transpose (Horizontal Bars)' },
    { value: 'polar', label: 'Polar (Radial)' },
];

// ... (GrammarPlayground component start)


export function GrammarPlayground() {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext?.theme || 'dark';
    const isDark = theme === 'dark';

    // Data source state
    const [dataSourceKey, setDataSourceKey] = useState<string>('metrics');
    const { data, append, clear } = useStreamingData<Record<string, unknown>>([], 1000);
    const handleRef = useRef<any>(null);

    // Get current generator
    const generator = dataGenerators[dataSourceKey];
    const columns = generator.columns;
    const numericColumns = columns.filter(c => c.type.includes('int') || c.type.includes('float'));
    const stringColumns = columns.filter(c => c.type === 'string');
    const timeColumns = columns.filter(c => c.type.includes('datetime'));

    // === Mark Configuration ===
    const [markType, setMarkType] = useState<string>('line');
    const [xField, setXField] = useState<string>('timestamp');
    const [yField, setYField] = useState<string>('cpu');
    const [colorField, setColorField] = useState<string>('server');
    const [lineShape, setLineShape] = useState<string>('smooth');

    // === Scale Configuration ===
    const [xScaleType, setXScaleType] = useState<string>('time');
    const [yScaleType, setYScaleType] = useState<string>('linear');
    const [yNice, setYNice] = useState<boolean>(true);

    // === Transform Configuration ===
    const [transform, setTransform] = useState<string>('');

    // === Coordinate Configuration ===
    const [coordinateTransform, setCoordinateTransform] = useState<string>('');

    // === Streaming Configuration ===
    const [maxItems, setMaxItems] = useState<number>(500);

    // === Temporal Configuration ===
    const [temporalMode, setTemporalMode] = useState<string>('axis');
    const [temporalField, setTemporalField] = useState<string | string[]>('timestamp');
    const [temporalRange, setTemporalRange] = useState<number>(2);

    // === Axes Configuration ===
    const [xTitle, setXTitle] = useState<string>('');
    const [yTitle, setYTitle] = useState<string>('');
    const [xGrid, setXGrid] = useState<boolean>(false);
    const [yGrid, setYGrid] = useState<boolean>(true);

    // === Legend Configuration ===
    const [showLegend, setShowLegend] = useState<boolean>(true);
    const [legendPosition, setLegendPosition] = useState<string>('bottom');

    // Reset fields when data source changes
    useEffect(() => {
        clear();
        const cols = generator.columns;
        const timeCol = cols.find(c => c.type.includes('datetime'))?.name || cols[0]?.name || '';
        const numCol = cols.find(c => c.type.includes('float') || c.type.includes('int'))?.name || '';
        const strCol = cols.find(c => c.type === 'string')?.name || '';

        setXField(timeCol);
        setYField(numCol);
        setColorField(strCol);
        setTemporalField(timeCol);
    }, [dataSourceKey, generator, clear]);

    // Generate streaming data and push to chart
    useEffect(() => {
        const interval = setInterval(() => {
            const newRows = generator.generate();
            if (handleRef.current) {
                handleRef.current.append(newRows);
            }
            append(newRows);
        }, generator.interval);
        return () => clearInterval(interval);
    }, [generator, append]);

    // Build the VistralSpec from controls
    const spec: VistralSpec = useMemo(() => {
        // Mark
        const mark: MarkSpec = {
            type: markType,
            encode: {
                x: xField,
                y: yField,
                ...(colorField ? { color: colorField } : {}),
            },
            style: markType === 'line' || markType === 'area'
                ? { connect: true, shape: lineShape }
                : {},
        };

        // Scales
        const scales: Record<string, ScaleSpec> = {
            x: { type: xScaleType as any },
            y: { type: yScaleType as any, ...(yNice ? { nice: true } : {}) },
        };

        // Transforms
        const transforms: TransformSpec[] = [];
        if (transform === 'stackY') transforms.push({ type: 'stackY' });
        if (transform === 'dodgeX') transforms.push({ type: 'dodgeX' });

        // Coordinate
        const coordinate: CoordinateSpec | undefined = coordinateTransform
            ? { transforms: [{ type: coordinateTransform }] }
            : undefined;

        // Streaming
        const streaming: StreamingSpec = { maxItems };

        // Temporal
        const temporal: TemporalSpec | undefined = temporalMode
            ? {
                mode: temporalMode as 'axis' | 'frame' | 'key',
                field: temporalField,
                ...(temporalMode === 'axis' ? { range: temporalRange } : {}),
            }
            : undefined;

        // Axes
        const axes: AxesSpec = {
            x: { title: xTitle || false, grid: xGrid },
            y: { title: yTitle || false, grid: yGrid },
        };

        // Legend
        const legend: LegendSpec | false = showLegend
            ? { position: legendPosition as 'top' | 'bottom' | 'left' | 'right', interactive: true }
            : false;

        return {
            marks: [mark],
            scales,
            ...(transforms.length > 0 ? { transforms } : {}),
            ...(coordinate ? { coordinate } : {}),
            streaming,
            ...(temporal ? { temporal } : {}),
            axes,
            legend,
            theme,
            animate: false,
        };
    }, [
        markType, xField, yField, colorField, lineShape,
        xScaleType, yScaleType, yNice,
        transform, coordinateTransform, maxItems,
        temporalMode, temporalField, temporalRange,
        xTitle, yTitle, xGrid, yGrid,
        showLegend, legendPosition, theme,
    ]);

    // Styles
    const panelStyle: React.CSSProperties = {
        backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
        border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: '11px',
        fontWeight: 600,
        color: isDark ? '#9CA3AF' : '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '10px',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '11px',
        color: isDark ? '#9CA3AF' : '#6B7280',
        marginBottom: '4px',
    };

    const selectStyle: React.CSSProperties = {
        width: '100%',
        padding: '6px 8px',
        backgroundColor: isDark ? '#374151' : '#FFFFFF',
        color: isDark ? '#F3F4F6' : '#1F2937',
        border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
        borderRadius: '4px',
        fontSize: '12px',
        marginBottom: '8px',
    };

    const checkboxRowStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '6px',
        fontSize: '12px',
        color: isDark ? '#D1D5DB' : '#374151',
    };

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            gap: '16px',
            backgroundColor: isDark ? '#111827' : '#F3F4F6',
        }}>
            {/* Left Panel - Controls */}
            <div style={{
                width: '280px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '16px 0 16px 16px',
            }}>
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingRight: '8px',
                }}>
                    {/* Data Source */}
                    <div style={panelStyle}>
                        <div style={sectionTitleStyle}>Data Source</div>
                        <select
                            value={dataSourceKey}
                            onChange={(e) => setDataSourceKey(e.target.value)}
                            style={selectStyle}
                        >
                            {Object.entries(dataGenerators).map(([key, gen]) => (
                                <option key={key} value={key}>{gen.name}</option>
                            ))}
                        </select>
                        <p style={{ fontSize: '10px', color: isDark ? '#6B7280' : '#9CA3AF', margin: 0 }}>
                            {columns.map(c => c.name).join(', ')}
                        </p>
                    </div>

                    {/* Mark Configuration */}
                    <div style={panelStyle}>
                        <div style={sectionTitleStyle}>Mark</div>
                        <label style={labelStyle}>Type</label>
                        <select value={markType} onChange={(e) => setMarkType(e.target.value)} style={selectStyle}>
                            {markTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>

                        <label style={labelStyle}>X Field</label>
                        <select value={xField} onChange={(e) => setXField(e.target.value)} style={selectStyle}>
                            {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>

                        <label style={labelStyle}>Y Field</label>
                        <select value={yField} onChange={(e) => setYField(e.target.value)} style={selectStyle}>
                            {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>

                        <label style={labelStyle}>Color Field</label>
                        <select value={colorField} onChange={(e) => setColorField(e.target.value)} style={selectStyle}>
                            <option value="">None</option>
                            {stringColumns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>

                        {(markType === 'line' || markType === 'area') && (
                            <>
                                <label style={labelStyle}>Line Shape</label>
                                <select value={lineShape} onChange={(e) => setLineShape(e.target.value)} style={selectStyle}>
                                    <option value="smooth">Smooth</option>
                                    <option value="line">Straight</option>
                                    <option value="hvh">Step</option>
                                </select>
                            </>
                        )}
                    </div>

                    {/* Scales */}
                    <div style={panelStyle}>
                        <div style={sectionTitleStyle}>Scales</div>
                        <label style={labelStyle}>X Scale Type</label>
                        <select value={xScaleType} onChange={(e) => setXScaleType(e.target.value)} style={selectStyle}>
                            {scaleTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>

                        <label style={labelStyle}>Y Scale Type</label>
                        <select value={yScaleType} onChange={(e) => setYScaleType(e.target.value)} style={selectStyle}>
                            {scaleTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>

                        <label style={checkboxRowStyle}>
                            <input type="checkbox" checked={yNice} onChange={(e) => setYNice(e.target.checked)} />
                            Y Scale Nice (round values)
                        </label>
                    </div>

                    {/* Transforms */}
                    <div style={panelStyle}>
                        <div style={sectionTitleStyle}>Transforms</div>
                        <select value={transform} onChange={(e) => setTransform(e.target.value)} style={selectStyle}>
                            <option value="">None</option>
                            <option value="stackY">Stack Y</option>
                            <option value="dodgeX">Dodge X</option>
                        </select>
                    </div>

                    {/* Coordinate */}
                    <div style={panelStyle}>
                        <div style={sectionTitleStyle}>Coordinate</div>
                        <select value={coordinateTransform} onChange={(e) => setCoordinateTransform(e.target.value)} style={selectStyle}>
                            {coordinateTransforms.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    {/* Streaming */}
                    <div style={panelStyle}>
                        <div style={sectionTitleStyle}>Streaming</div>
                        <label style={labelStyle}>Max Items</label>
                        <input
                            type="number"
                            value={maxItems}
                            onChange={(e) => setMaxItems(Number(e.target.value))}
                            min={100}
                            max={5000}
                            style={selectStyle}
                        />
                    </div>

                    {/* Temporal */}
                    <div style={panelStyle}>
                        <div style={sectionTitleStyle}>Temporal</div>
                        <label style={labelStyle}>Mode</label>
                        <select value={temporalMode} onChange={(e) => setTemporalMode(e.target.value)} style={selectStyle}>
                            {temporalModes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>


                        {temporalMode && (
                            <>
                                <label style={labelStyle}>Field(s)</label>
                                {temporalMode === 'key' ? (
                                    <div style={{
                                        border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
                                        borderRadius: '4px',
                                        padding: '8px',
                                        maxHeight: '120px',
                                        overflowY: 'auto',
                                        backgroundColor: isDark ? '#374151' : '#FFFFFF',
                                    }}>
                                        {columns.map(c => {
                                            const currentFields = Array.isArray(temporalField) ? temporalField : [temporalField];
                                            const isChecked = currentFields.includes(c.name);
                                            return (
                                                <label key={c.name} style={{ ...checkboxRowStyle, marginBottom: '4px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            let newFields;
                                                            if (e.target.checked) {
                                                                newFields = [...currentFields, c.name];
                                                            } else {
                                                                newFields = currentFields.filter(f => f !== c.name);
                                                            }
                                                            setTemporalField(newFields);
                                                        }}
                                                    />
                                                    {c.name}
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <select
                                        value={Array.isArray(temporalField) ? temporalField[0] : temporalField}
                                        onChange={(e) => setTemporalField(e.target.value)}
                                        style={selectStyle}
                                    >
                                        {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                )}
                            </>
                        )}

                        {temporalMode === 'axis' && (
                            <>
                                <label style={labelStyle}>Range (minutes)</label>
                                <input
                                    type="number"
                                    value={temporalRange}
                                    onChange={(e) => setTemporalRange(Number(e.target.value))}
                                    min={1}
                                    max={60}
                                    style={selectStyle}
                                />
                            </>
                        )}
                    </div>

                    {/* Axes */}
                    <div style={panelStyle}>
                        <div style={sectionTitleStyle}>Axes</div>
                        <label style={labelStyle}>X Title</label>
                        <input
                            type="text"
                            value={xTitle}
                            onChange={(e) => setXTitle(e.target.value)}
                            placeholder="(none)"
                            style={selectStyle}
                        />
                        <label style={checkboxRowStyle}>
                            <input type="checkbox" checked={xGrid} onChange={(e) => setXGrid(e.target.checked)} />
                            X Grid
                        </label>

                        <label style={labelStyle}>Y Title</label>
                        <input
                            type="text"
                            value={yTitle}
                            onChange={(e) => setYTitle(e.target.value)}
                            placeholder="(none)"
                            style={selectStyle}
                        />
                        <label style={checkboxRowStyle}>
                            <input type="checkbox" checked={yGrid} onChange={(e) => setYGrid(e.target.checked)} />
                            Y Grid
                        </label>
                    </div>

                    {/* Legend */}
                    <div style={panelStyle}>
                        <div style={sectionTitleStyle}>Legend</div>
                        <label style={checkboxRowStyle}>
                            <input type="checkbox" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} />
                            Show Legend
                        </label>
                        {showLegend && (
                            <>
                                <label style={labelStyle}>Position</label>
                                <select value={legendPosition} onChange={(e) => setLegendPosition(e.target.value)} style={selectStyle}>
                                    <option value="top">Top</option>
                                    <option value="bottom">Bottom</option>
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                </select>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Center Panel - Chart */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '16px 0',
                minWidth: 0,
            }}>
                {/* Header */}
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 600,
                            color: isDark ? '#F3F4F6' : '#1F2937',
                        }}>
                            VistralChart Preview
                        </h2>
                        <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            backgroundColor: isDark ? '#374151' : '#E5E7EB',
                            borderRadius: '4px',
                            color: isDark ? '#9CA3AF' : '#6B7280',
                        }}>
                            {generator.name}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: isDark ? '#6B7280' : '#9CA3AF' }}>
                            {data.length} rows
                        </span>
                        <button
                            onClick={clear}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: isDark ? '#374151' : '#E5E7EB',
                                color: isDark ? '#D1D5DB' : '#4B5563',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Chart Canvas */}
                <div style={{
                    flex: 2,
                    minHeight: '300px',
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '16px',
                }}>
                    <div style={{ flex: 1, minHeight: 0, width: '100%', height: '100%', padding: '16px' }}>
                        <VistralChart
                            key={`${markType}-${xField}-${yField}-${xScaleType}-${yScaleType}-${temporalMode}`}
                            spec={spec as any}
                            height={400}
                            onReady={(handle: any) => {
                                handleRef.current = handle;
                            }}
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div style={{
                    flex: 1,
                    minHeight: '200px',
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '8px 16px',
                        borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                        fontWeight: 600,
                        fontSize: '13px',
                        color: isDark ? '#F3F4F6' : '#1F2937',
                    }}>
                        Latest Data (Showing last 20 rows)
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '12px',
                            color: isDark ? '#D1D5DB' : '#374151',
                        }}>
                            <thead style={{
                                position: 'sticky',
                                top: 0,
                                backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                color: isDark ? '#F3F4F6' : '#1F2937',
                            }}>
                                <tr>
                                    {columns.map(col => (
                                        <th key={col.name} style={{
                                            padding: '8px 12px',
                                            textAlign: 'left',
                                            borderBottom: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`
                                        }}>
                                            {col.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(-20).reverse().map((row: Record<string, any>, i: number) => (
                                    <tr key={i} style={{
                                        borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                                        backgroundColor: i % 2 === 0 ? (isDark ? '#1F2937' : '#FFFFFF') : (isDark ? '#111827' : '#F9FAFB'),
                                    }}>
                                        {columns.map((col: Column) => (
                                            <td key={col.name} style={{ padding: '6px 12px' }}>
                                                {String(row[col.name] ?? '-')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length} style={{ padding: '12px', textAlign: 'center', color: '#6B7280' }}>
                                            No data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Right Panel - Spec JSON */}
            <div style={{
                width: '320px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '16px 16px 16px 0',
            }}>
                <div style={{ ...panelStyle, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={sectionTitleStyle}>VistralSpec JSON</div>
                    <pre style={{
                        flex: 1,
                        overflow: 'auto',
                        margin: 0,
                        padding: '12px',
                        backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                        color: isDark ? '#E6EDF3' : '#1F2937',
                        border: `1px solid ${isDark ? '#30363D' : '#D1D5DB'}`,
                        borderRadius: '6px',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                        fontSize: '11px',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}>
                        {JSON.stringify(spec, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}

export default GrammarPlayground;
