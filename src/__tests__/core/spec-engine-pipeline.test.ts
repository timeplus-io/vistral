import { describe, it, expect } from 'vitest';
import { applySpecTheme, buildG2Options } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('applySpecTheme', () => {
  it('should return dark theme colors when theme is "dark"', () => {
    const theme = applySpecTheme('dark');

    expect(theme.view.viewFill).toBe('transparent');
    expect(theme.axis.x.label.fill).toBe('#E5E7EB');
    expect(theme.axis.y.label.fill).toBe('#E5E7EB');
    expect(theme.axis.x.grid.stroke).toBe('#374151');
    expect(theme.legend.label.fill).toBe('#E5E7EB');
    expect(theme.legend.itemValue.fill).toBe('#9CA3AF');
    expect(theme.label.fill).toBe('#E5E7EB');
    expect(theme.label.fontSize).toBe(11);
  });

  it('should return light theme colors when theme is "light"', () => {
    const theme = applySpecTheme('light');

    expect(theme.view.viewFill).toBe('transparent');
    expect(theme.axis.x.label.fill).toBe('#1F2937');
    expect(theme.axis.y.label.fill).toBe('#1F2937');
    expect(theme.axis.x.grid.stroke).toBe('#E5E7EB');
    expect(theme.legend.label.fill).toBe('#1F2937');
    expect(theme.legend.itemValue.fill).toBe('#6B7280');
  });

  it('should default to dark theme when theme is undefined', () => {
    const theme = applySpecTheme(undefined);

    expect(theme.view.viewFill).toBe('transparent');
    expect(theme.axis.x.label.fill).toBe('#E5E7EB');
    expect(theme.legend.label.fill).toBe('#E5E7EB');
  });
});

describe('buildG2Options', () => {
  it('should produce complete G2 options from a line spec with temporal', () => {
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

    // Temporal transforms should be injected into children's transforms
    // axis mode injects filter + sortBy
    const transforms = g2.children[0].transform;
    expect(transforms).toBeDefined();
    expect(transforms.length).toBeGreaterThanOrEqual(2);
    expect(transforms[0].type).toBe('filter');
    expect(transforms[1].type).toBe('sortBy');

    // Theme should be applied
    expect(g2.theme).toBeDefined();
    expect(g2.theme.view.viewFill).toBe('transparent');
    expect(g2.theme.axis.x.label.fill).toBe('#E5E7EB');
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

    // No theme specified → defaults to dark
    expect(g2.theme).toBeDefined();
    expect(g2.theme.axis.x.label.fill).toBe('#E5E7EB');
  });

  it('should apply frame temporal mode correctly (filter injected in children transforms)', () => {
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

    // Frame mode injects a filter transform
    const transforms = g2.children[0].transform;
    expect(transforms).toBeDefined();
    expect(transforms.length).toBeGreaterThanOrEqual(1);
    expect(transforms[0].type).toBe('filter');

    // The filter callback should keep only the latest timestamp rows
    const filterFn = transforms[0].callback;
    expect(filterFn({ time: ts2, category: 'B', value: 20 })).toBe(true);
    expect(filterFn({ time: ts1, category: 'A', value: 10 })).toBe(false);

    // Theme should be light
    expect(g2.theme.axis.x.label.fill).toBe('#1F2937');
  });
});
