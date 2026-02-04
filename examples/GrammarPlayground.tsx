/**
 * Grammar API Playground
 * 
 * Interactive playground for the VistralSpec + VistralChart grammar API.
 * Shows the spec configuration alongside the live chart visualization.
 */

import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import {
    VistralChart,
    useStreamingData,
    type VistralSpec,
    type ChartHandle,
    type MarkSpec,
} from '@timeplus/vistral';
import { ThemeContext } from './App';

// ============================================================================
// Data Generators (simplified from Playground)
// ============================================================================

interface Column {
    name: string;
    type: string;
}

interface DataGenerator {
    name: string;
    columns: Column[];
    generate: () => Record<string, unknown>[];
    interval: number;
}

const createMetricsGenerator = (): DataGenerator => ({
    name: 'Server Metrics',
    columns: [
        { name: 'timestamp', type: 'datetime64' },
        { name: 'server', type: 'string' },
        { name: 'cpu', type: 'float64' },
        { name: 'memory', type: 'float64' },
    ],
    generate: () => {
        const servers = ['server-01', 'server-02', 'server-03', 'server-04'];
        const now = new Date().toISOString();
        // Return objects with named fields (required by VistralChart)
        return servers.map(server => ({
            timestamp: now,
            server,
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
        }));
    },
    interval: 1000,
});

// ============================================================================
// Spec Templates
// ============================================================================

type SpecTemplate = {
    name: string;
    description: string;
    spec: VistralSpec;
};

const specTemplates: SpecTemplate[] = [
    {
        name: 'Line Chart',
        description: 'Basic streaming line chart with time axis',
        spec: {
            marks: [
                {
                    type: 'line',
                    encode: { x: 'timestamp', y: 'cpu', color: 'server' },
                    style: { connect: true, shape: 'smooth' },
                },
            ],
            scales: {
                x: { type: 'time' },
                y: { type: 'linear', nice: true },
            },
            temporal: { mode: 'axis', field: 'timestamp', range: 2 },
            streaming: { maxItems: 500 },
            axes: {
                x: { title: false, grid: false },
                y: { title: 'CPU %', grid: true },
            },
            legend: { position: 'bottom', interactive: true },
            theme: 'dark',
            animate: false,
        },
    },
    {
        name: 'Area Chart (Stacked)',
        description: 'Stacked area chart with colors',
        spec: {
            marks: [
                {
                    type: 'area',
                    encode: { x: 'timestamp', y: 'cpu', color: 'server' },
                    style: { connect: true },
                },
            ],
            scales: {
                x: { type: 'time' },
                y: { type: 'linear', nice: true },
            },
            transforms: [{ type: 'stackY' }],
            temporal: { mode: 'axis', field: 'timestamp', range: 2 },
            streaming: { maxItems: 500 },
            axes: {
                x: { title: false, grid: false },
                y: { title: 'CPU %', grid: true },
            },
            legend: { position: 'bottom', interactive: true },
            theme: 'dark',
            animate: false,
        },
    },
    {
        name: 'Bar Chart (Horizontal)',
        description: 'Horizontal bar chart with transpose',
        spec: {
            marks: [
                {
                    type: 'interval',
                    encode: { x: 'server', y: 'cpu', color: 'server' },
                },
            ],
            scales: {
                x: { type: 'band', padding: 0.5 },
                y: { type: 'linear', nice: true },
            },
            coordinate: { transforms: [{ type: 'transpose' }] },
            temporal: { mode: 'frame', field: 'timestamp' },
            streaming: { maxItems: 100 },
            axes: {
                x: { title: false, grid: false },
                y: { title: 'CPU %', grid: true },
            },
            legend: false,
            theme: 'dark',
            animate: false,
        },
    },
    {
        name: 'Multi-Mark (Line + Point)',
        description: 'Line chart with data points overlay',
        spec: {
            marks: [
                {
                    type: 'line',
                    encode: { x: 'timestamp', y: 'cpu', color: 'server' },
                    style: { connect: true, shape: 'smooth' },
                },
                {
                    type: 'point',
                    encode: { x: 'timestamp', y: 'cpu', color: 'server' },
                    tooltip: false,
                },
            ],
            scales: {
                x: { type: 'time' },
                y: { type: 'linear', nice: true },
            },
            temporal: { mode: 'axis', field: 'timestamp', range: 2 },
            streaming: { maxItems: 500 },
            axes: {
                x: { title: false, grid: false },
                y: { title: 'CPU %', grid: true },
            },
            legend: { position: 'bottom', interactive: true },
            theme: 'dark',
            animate: false,
        },
    },
];

// ============================================================================
// Grammar Playground Component
// ============================================================================

export function GrammarPlayground() {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext?.theme || 'dark';
    const isDark = theme === 'dark';

    // State
    const [selectedTemplate, setSelectedTemplate] = useState(0);
    const [spec, setSpec] = useState<VistralSpec>(specTemplates[0].spec);
    const [specJson, setSpecJson] = useState(JSON.stringify(specTemplates[0].spec, null, 2));
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [generator] = useState(createMetricsGenerator);

    // Streaming data
    const { data, append, clear } = useStreamingData<Record<string, unknown>>([], 1000);
    const handleRef = useRef<ChartHandle | null>(null);

    // Update spec theme when theme changes
    useEffect(() => {
        setSpec(prev => ({ ...prev, theme }));
        setSpecJson(JSON.stringify({ ...spec, theme }, null, 2));
    }, [theme]);

    // Generate streaming data and push to chart
    useEffect(() => {
        const interval = setInterval(() => {
            const newRows = generator.generate();
            // Push data to the chart via handle
            if (handleRef.current) {
                handleRef.current.append(newRows);
            }
            // Also track for UI display
            append(newRows);
        }, generator.interval);
        return () => clearInterval(interval);
    }, [generator, append]);

    // Handle template change
    const handleTemplateChange = (index: number) => {
        setSelectedTemplate(index);
        const newSpec = { ...specTemplates[index].spec, theme };
        setSpec(newSpec);
        setSpecJson(JSON.stringify(newSpec, null, 2));
        setJsonError(null);
        clear();
    };

    // Handle JSON edit
    const handleJsonChange = (value: string) => {
        setSpecJson(value);
        try {
            const parsed = JSON.parse(value);
            setSpec(parsed);
            setJsonError(null);
        } catch (e) {
            setJsonError((e as Error).message);
        }
    };

    // Format JSON
    const formatJson = () => {
        try {
            const parsed = JSON.parse(specJson);
            setSpecJson(JSON.stringify(parsed, null, 2));
            setJsonError(null);
        } catch (e) {
            setJsonError((e as Error).message);
        }
    };

    // Styles
    const panelStyle: React.CSSProperties = {
        backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
        border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '12px',
        fontWeight: 500,
        color: isDark ? '#9CA3AF' : '#6B7280',
        marginBottom: '6px',
    };

    const selectStyle: React.CSSProperties = {
        width: '100%',
        padding: '8px 12px',
        backgroundColor: isDark ? '#374151' : '#FFFFFF',
        color: isDark ? '#F3F4F6' : '#1F2937',
        border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
        borderRadius: '6px',
        fontSize: '13px',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '8px 16px',
        backgroundColor: isDark ? '#374151' : '#E5E7EB',
        color: isDark ? '#D1D5DB' : '#4B5563',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        cursor: 'pointer',
        marginRight: '8px',
    };

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            gap: '16px',
            padding: '16px',
            backgroundColor: isDark ? '#111827' : '#F3F4F6',
        }}>
            {/* Left Panel - Spec Editor */}
            <div style={{
                width: '400px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Template Selector */}
                <div style={panelStyle}>
                    <label style={labelStyle}>Spec Template</label>
                    <select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateChange(Number(e.target.value))}
                        style={selectStyle}
                    >
                        {specTemplates.map((t, i) => (
                            <option key={i} value={i}>{t.name}</option>
                        ))}
                    </select>
                    <p style={{
                        fontSize: '11px',
                        color: isDark ? '#6B7280' : '#9CA3AF',
                        marginTop: '8px',
                        marginBottom: 0,
                    }}>
                        {specTemplates[selectedTemplate].description}
                    </p>
                </div>

                {/* JSON Editor */}
                <div style={{ ...panelStyle, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>VistralSpec JSON</label>
                        <div>
                            <button onClick={formatJson} style={buttonStyle}>Format</button>
                            <button onClick={clear} style={buttonStyle}>Clear Data</button>
                        </div>
                    </div>

                    {jsonError && (
                        <div style={{
                            padding: '8px 12px',
                            backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
                            color: isDark ? '#FCA5A5' : '#DC2626',
                            borderRadius: '4px',
                            fontSize: '11px',
                            marginBottom: '8px',
                        }}>
                            {jsonError}
                        </div>
                    )}

                    <textarea
                        value={specJson}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        style={{
                            flex: 1,
                            width: '100%',
                            padding: '12px',
                            backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                            color: isDark ? '#E6EDF3' : '#1F2937',
                            border: `1px solid ${jsonError ? '#DC2626' : isDark ? '#30363D' : '#D1D5DB'}`,
                            borderRadius: '6px',
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                            fontSize: '12px',
                            lineHeight: 1.5,
                            resize: 'none',
                        }}
                        spellCheck={false}
                    />
                </div>

                {/* Data Info */}
                <div style={panelStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: isDark ? '#9CA3AF' : '#6B7280' }}>
                            Data: {generator.name}
                        </span>
                        <span style={{ fontSize: '12px', color: isDark ? '#6B7280' : '#9CA3AF' }}>
                            {data.length} rows
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Panel - Chart Preview */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
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
                            {specTemplates[selectedTemplate].name}
                        </span>
                    </div>
                </div>

                {/* Chart Canvas */}
                <div style={{
                    flex: 1,
                    minHeight: 0,
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <div style={{ flex: 1, minHeight: 0, width: '100%', height: '100%', padding: '16px' }}>
                        {!jsonError && (
                            <VistralChart
                                spec={spec}
                                height={400}
                                onReady={(handle) => {
                                    handleRef.current = handle;
                                    // Pre-populate with some data
                                    const initialData = generator.generate();
                                    handle.append(initialData);
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GrammarPlayground;
