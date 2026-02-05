import { describe, it, expect } from 'vitest';
import { buildG2Options } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('VistralChart spec integration', () => {
  it('produces valid G2 options for a line chart spec', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      scales: { x: { type: 'time' }, y: { type: 'linear', nice: true } },
      theme: 'dark',
      animate: false,
    };
    const data = [
      { time: 1000, value: 10 },
      { time: 2000, value: 20 },
    ];
    const g2Options = buildG2Options(spec, data);
    expect(g2Options.type).toBe('view');
    expect(g2Options.children).toHaveLength(1);
    expect(g2Options.children[0].type).toBe('line');
    expect(g2Options.children[0].encode.x).toBe('time');
    expect(g2Options.theme.view.viewFill).toBe('transparent');
    // Data should be attached at the view level; time fields converted to Date
    expect(g2Options.data).toHaveLength(2);
    expect(g2Options.data[0].time).toEqual(new Date(1000));
    expect(g2Options.data[0].value).toBe(10);
    expect(g2Options.data[1].time).toEqual(new Date(2000));
    expect(g2Options.data[1].value).toBe(20);
  });

  it('produces valid G2 options for multi-mark spec with temporal and visual transforms', () => {
    const spec: VistralSpec = {
      marks: [
        {
          type: 'area',
          encode: { x: 'time', y: 'value', color: 'series' },
          style: { opacity: 0.5 },
        },
        {
          type: 'line',
          encode: { x: 'time', y: 'value', color: 'series' },
        },
      ],
      transforms: [{ type: 'stackY' }],
      scales: { x: { type: 'time' } },
      temporal: { mode: 'axis', field: 'time', range: 5 },
      animate: false,
    };
    const data = [
      { time: 1000, value: 10, series: 'A' },
      { time: 2000, value: 20, series: 'B' },
    ];
    const g2Options = buildG2Options(spec, data);
    expect(g2Options.children).toHaveLength(2);
    expect(g2Options.children[0].type).toBe('area');
    expect(g2Options.children[0].style.opacity).toBe(0.5);
    // Only visual transforms (stackY) should be on children — temporal
    // filtering is done in JavaScript, not via G2 transforms.
    expect(g2Options.children[0].transform).toEqual([{ type: 'stackY' }]);
    expect(g2Options.children[1].transform).toEqual([{ type: 'stackY' }]);
    // Data should be attached at the view level
    expect(g2Options.data).toBeDefined();
  });

  it('handles bar chart with transpose coordinate', () => {
    const spec: VistralSpec = {
      marks: [
        { type: 'interval', encode: { x: 'category', y: 'value' } },
      ],
      coordinate: { transforms: [{ type: 'transpose' }] },
      animate: false,
    };
    const g2Options = buildG2Options(spec, []);
    expect(g2Options.coordinate.transform).toEqual([{ type: 'transpose' }]);
    expect(g2Options.children[0].type).toBe('interval');
  });
});
