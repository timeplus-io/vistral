import { buildG2Options } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('Interval Mark Crash Reproduction', () => {
  it('should generate valid G2 options for interval mark with ordinal scale and key mode', () => {
    const spec: VistralSpec = {
      marks: [
        {
          type: 'interval',
          encode: {
            x: 'cpu',
            y: 'server',
            color: 'server',
          },
          style: {},
        },
      ],
      scales: {
        x: { type: 'linear' },
        y: { type: 'ordinal', nice: true }, // The problematic scale
      },
      streaming: { maxItems: 500 },
      temporal: { mode: 'key', field: 'server' },
      axes: {
        x: { title: false, grid: false },
        y: { title: false, grid: true },
      },
      legend: { position: 'bottom', interactive: true },
      theme: 'dark',
      animate: false,
    };

    const data = [
      { server: 's1', cpu: 10, timestamp: 1000 },
      { server: 's2', cpu: 20, timestamp: 1000 },
      { server: 's1', cpu: 15, timestamp: 2000 },
    ];

    const g2 = buildG2Options(spec, data);

    const layer0 = g2.children?.[0];
    expect(layer0).toBeDefined();

    // This is a horizontal bar chart: x=continuous (cpu), y=discrete (server).
    // The spec engine detects this (isXContinuous && isYDiscrete) and applies
    // shouldSwapAxes=true, which:
    //   1. Adds a transpose coordinate transform so the chart renders horizontally.
    //   2. Swaps x↔y in both encode and scales before passing to translateMark.
    //
    // After the swap, translateMark receives:
    //   encode: { x: 'server', y: 'cpu' }
    //   scales: { x: { type: 'ordinal' }, y: { type: 'linear' } }
    // The ordinal→band coercion then fires on x (not y), so:
    //   scale.x.type === 'band'  (server, categorical)
    //   scale.y.type === 'linear' (cpu, continuous)

    expect(layer0.encode?.x).toBe('server');
    expect(layer0.encode?.y).toBe('cpu');

    expect(layer0.scale?.x?.type).toBe('band');
    expect(layer0.scale?.y?.type).toBe('linear');

    // The transpose coordinate transform must be present for the horizontal layout.
    expect(g2.coordinate?.transform).toEqual([{ type: 'transpose' }]);
  });
});
