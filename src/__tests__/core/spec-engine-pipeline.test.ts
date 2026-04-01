import { describe, it, expect } from 'vitest';
import { buildG2Options, filterDataByTemporal } from '../../core/spec-engine';
import { registerTheme } from '../../core/theme-registry';
import type { VistralSpec } from '../../types/spec';
import type { VistralTheme } from '../../types/theme';

describe('buildG2Options — theme integration', () => {
  const baseSpec: VistralSpec = {
    marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
  };

  it('uses dark theme colors by default', () => {
    const g2 = buildG2Options(baseSpec, []);
    expect((g2.theme as any).axis.x.label.fill).toBe('#E5E5E5');
  });

  it('uses light theme colors when spec.theme is "light"', () => {
    const spec: VistralSpec = { ...baseSpec, theme: 'light' };
    const g2 = buildG2Options(spec, []);
    expect((g2.theme as any).axis.x.label.fill).toBe('#000000');
  });

  it('applies a custom VistralTheme object passed via spec.theme', () => {
    const customTheme: VistralTheme = { axis: { label: { color: '#AABBCC' } } };
    const spec: VistralSpec = { ...baseSpec, theme: customTheme };
    const g2 = buildG2Options(spec, []);
    expect((g2.theme as any).axis.x.label.fill).toBe('#AABBCC');
  });

  it('applies a registered custom theme by name', () => {
    registerTheme('test-corporate', {
      extends: 'light',
      axis: { grid: { color: '#FEDCBA' } },
    });
    const spec: VistralSpec = { ...baseSpec, theme: 'test-corporate' };
    const g2 = buildG2Options(spec, []);
    expect((g2.theme as any).axis.x.grid.stroke).toBe('#FEDCBA');
    // Light base preserved for label
    expect((g2.theme as any).axis.x.label.fill).toBe('#000000');
  });

  it('injects tooltip CSS into interaction config', () => {
    const spec: VistralSpec = { ...baseSpec, theme: 'dark' };
    const g2 = buildG2Options(spec, []);
    const tooltipCss = (g2.interaction as any)?.tooltip?.css?.['.g2-tooltip'];
    expect(tooltipCss).toBeDefined();
    expect(tooltipCss['background-color']).toBe('rgba(0,0,0,0.8)');
    expect(tooltipCss['color']).toBe('#FFFFFF');
  });

  it('tooltip CSS uses custom theme colors', () => {
    const spec: VistralSpec = {
      ...baseSpec,
      theme: { tooltip: { background: '#FF0000', text: { color: '#00FF00' } } },
    };
    const g2 = buildG2Options(spec, []);
    const tooltipCss = (g2.interaction as any)?.tooltip?.css?.['.g2-tooltip'];
    expect(tooltipCss['background-color']).toBe('#FF0000');
    expect(tooltipCss['color']).toBe('#00FF00');
  });

  it('spec.g2Overrides still wins over theme', () => {
    const spec: VistralSpec = {
      ...baseSpec,
      g2Overrides: { type: 'cell' },
    };
    const g2 = buildG2Options(spec, []);
    expect(g2.type).toBe('cell');
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
    // domainMax is anchored to Date.now() (>= data max) for live sliding window
    const domainMax = xScale.domainMax.getTime();
    expect(domainMax).toBeGreaterThanOrEqual(now);
    // domainMin should be exactly range minutes before domainMax
    expect(xScale.domainMin.getTime()).toBe(domainMax - 5 * 60_000);
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

describe('buildG2Options — g2Overrides', () => {
  it('should deep-merge g2Overrides on top of compiled G2 spec (override wins at leaf)', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      axes: { y: { grid: true } },
      g2Overrides: {
        axis: { y: { tickCount: 5 } },
      },
    };

    const g2 = buildG2Options(spec, []);

    // Compiled axis.y props still present
    expect(g2.axis.y.grid).toBe(true);
    // g2Overrides value merged in
    expect(g2.axis.y.tickCount).toBe(5);
  });

  it('should replace arrays in g2Overrides rather than merging them', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      g2Overrides: {
        customArray: [10, 20, 30],
      },
    };

    const g2 = buildG2Options(spec, []);

    expect(g2.customArray).toEqual([10, 20, 30]);
  });

  it('should let g2Overrides override a scalar value set by compilation', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      g2Overrides: {
        type: 'cell', // overrides the compiled 'view'
      },
    };

    const g2 = buildG2Options(spec, []);

    expect(g2.type).toBe('cell');
  });

  it('should not mutate the spec.g2Overrides object', () => {
    const overrides = { axis: { y: { tickCount: 5 } } };
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      g2Overrides: overrides,
    };

    buildG2Options(spec, []);

    expect(overrides).toEqual({ axis: { y: { tickCount: 5 } } });
  });

  it('should return unchanged output when g2Overrides is undefined', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
    };

    const g2 = buildG2Options(spec, []);

    expect(g2.type).toBe('view');
    expect(g2.children).toHaveLength(1);
  });
});
