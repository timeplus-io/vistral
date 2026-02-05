import { describe, it, expect } from 'vitest';
import { applySpecTheme, buildG2Options, filterDataByTemporal } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('applySpecTheme', () => {
  it('should return dark theme colors when theme is "dark"', () => {
    const theme = applySpecTheme('dark');

    expect(theme.view.viewFill).toBe('transparent');
    expect(theme.axis.x.label.fill).toBe('#E5E5E5');
    expect(theme.axis.y.label.fill).toBe('#E5E5E5');
    expect(theme.axis.x.grid.stroke).toBe('#374151');
    expect(theme.legend.label.fill).toBe('#E5E5E5');
    expect(theme.legend.itemValue.fill).toBe('#9CA3AF');
    expect(theme.label.fill).toBe('#E5E5E5');
    expect(theme.label.fontSize).toBe(11);
  });

  it('should return light theme colors when theme is "light"', () => {
    const theme = applySpecTheme('light');

    expect(theme.view.viewFill).toBe('transparent');
    expect(theme.axis.x.label.fill).toBe('#000000');
    expect(theme.axis.y.label.fill).toBe('#000000');
    expect(theme.axis.x.grid.stroke).toBe('#9CA3AF');
    expect(theme.legend.label.fill).toBe('#000000');
    expect(theme.legend.itemValue.fill).toBe('#374151');
  });

  it('should default to dark theme when theme is undefined', () => {
    const theme = applySpecTheme(undefined);

    expect(theme.view.viewFill).toBe('transparent');
    expect(theme.axis.x.label.fill).toBe('#E5E5E5');
    expect(theme.legend.label.fill).toBe('#E5E5E5');
  });
});

describe('filterDataByTemporal', () => {
  it('should filter data by axis mode with time window', () => {
    const now = Date.now();
    const spec: VistralSpec = {
      temporal: { mode: 'axis', field: 'time', range: 1 },
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
    };
    const data = [
      { time: new Date(now - 120_000).toISOString(), value: 1 }, // 2 min ago — outside
      { time: new Date(now - 30_000).toISOString(), value: 2 },  // 30 sec ago — inside
      { time: new Date(now).toISOString(), value: 3 },            // now — inside
    ];

    const result = filterDataByTemporal(spec, data);
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(2);
    expect(result[1].value).toBe(3);
  });

  it('should sort data by temporal field in axis mode', () => {
    const now = Date.now();
    const spec: VistralSpec = {
      temporal: { mode: 'axis', field: 'time' },
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
    };
    const data = [
      { time: new Date(now).toISOString(), value: 3 },
      { time: new Date(now - 60_000).toISOString(), value: 1 },
      { time: new Date(now - 30_000).toISOString(), value: 2 },
    ];

    const result = filterDataByTemporal(spec, data);
    expect(result[0].value).toBe(1);
    expect(result[1].value).toBe(2);
    expect(result[2].value).toBe(3);
  });

  it('should filter data by frame mode (latest timestamp only)', () => {
    const now = Date.now();
    const ts1 = new Date(now - 60_000).toISOString();
    const ts2 = new Date(now).toISOString();
    const spec: VistralSpec = {
      temporal: { mode: 'frame', field: 'time' },
      marks: [{ type: 'interval', encode: { x: 'cat', y: 'val' } }],
    };
    const data = [
      { time: ts1, cat: 'A', val: 10 },
      { time: ts2, cat: 'B', val: 20 },
      { time: ts1, cat: 'C', val: 30 },
    ];

    const result = filterDataByTemporal(spec, data);
    expect(result).toHaveLength(1);
    expect(result[0].cat).toBe('B');
  });

  it('should return data as-is when no temporal config', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'x', y: 'y' } }],
    };
    const data = [{ x: 1, y: 2 }];
    expect(filterDataByTemporal(spec, data)).toBe(data);
  });
});

describe('buildG2Options', () => {
  it('should produce complete G2 options with pre-filtered data (axis temporal)', () => {
    const spec: VistralSpec = {
      theme: 'dark',
      temporal: { mode: 'axis', field: 'time', range: 5 },
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
    };

    const now = Date.now();
    const data = [
      { time: new Date(now - 60_000).toISOString(), value: 10 },
      { time: new Date(now).toISOString(), value: 20 },
    ];

    const g2 = buildG2Options(spec, data);

    // Should be a view with children
    expect(g2.type).toBe('view');
    expect(g2.children).toHaveLength(1);
    expect(g2.children[0].type).toBe('line');

    // Temporal transforms are NOT injected into child.transform — data is
    // pre-filtered in JavaScript. No spec-level transforms → no child.transform.
    expect(g2.children[0].transform).toBeUndefined();

    // Data should be pre-filtered and attached at the view level
    expect(g2.data).toBeDefined();
    expect(g2.data.length).toBe(2); // both within 5 min window

    // Axis temporal mode: x scale should have domainMin/domainMax for scrolling
    const xScale = g2.children[0].scale?.x;
    expect(xScale).toBeDefined();
    expect(xScale.type).toBe('time');
    expect(xScale.domainMin).toBeInstanceOf(Date);
    expect(xScale.domainMax).toBeInstanceOf(Date);
    // domainMax should be close to the latest data point
    expect(xScale.domainMax.getTime()).toBe(now);
    // domainMin should be range minutes before domainMax
    expect(xScale.domainMin.getTime()).toBe(now - 5 * 60_000);
    // mask should be auto-detected
    expect(xScale.mask).toBeDefined();

    // Theme should be applied
    expect(g2.theme).toBeDefined();
    expect(g2.theme.view.viewFill).toBe('transparent');
    expect(g2.theme.axis.x.label.fill).toBe('#E5E5E5');
  });

  it('should handle spec with no temporal and no theme', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval', encode: { x: 'category', y: 'count' } }],
    };

    const data = [
      { category: 'A', count: 10 },
      { category: 'B', count: 20 },
    ];

    const g2 = buildG2Options(spec, data);

    expect(g2.type).toBe('view');
    expect(g2.children).toHaveLength(1);
    expect(g2.children[0].type).toBe('interval');
    expect(g2.children[0].encode).toEqual({ x: 'category', y: 'count' });

    // No temporal → no transforms injected
    expect(g2.children[0].transform).toBeUndefined();

    // Data should be attached at the view level
    expect(g2.data).toEqual(data);

    // No theme specified → defaults to dark
    expect(g2.theme).toBeDefined();
    expect(g2.theme.axis.x.label.fill).toBe('#E5E5E5');
  });

  it('should apply frame temporal mode — data pre-filtered, no transform on children', () => {
    const now = Date.now();
    const ts1 = new Date(now - 60_000).toISOString();
    const ts2 = new Date(now).toISOString();

    const spec: VistralSpec = {
      theme: 'light',
      temporal: { mode: 'frame', field: 'time' },
      marks: [{ type: 'interval', encode: { x: 'category', y: 'value' } }],
    };

    const data = [
      { time: ts1, category: 'A', value: 10 },
      { time: ts2, category: 'B', value: 20 },
      { time: ts1, category: 'C', value: 30 },
    ];

    const g2 = buildG2Options(spec, data);

    // Frame mode: data pre-filtered to latest timestamp only
    expect(g2.data).toHaveLength(1);
    expect(g2.data[0].category).toBe('B');

    // No temporal transforms on child — data filtering done in JS
    expect(g2.children[0].transform).toBeUndefined();

    // Theme should be light
    expect(g2.theme.axis.x.label.fill).toBe('#000000');
  });
});
