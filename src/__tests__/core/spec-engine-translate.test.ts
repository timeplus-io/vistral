import { describe, it, expect } from 'vitest';
import { translateToG2Spec } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('translateToG2Spec', () => {
  it('should translate a simple line spec into a view with 1 child', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.type).toBe('view');
    expect(g2.children).toHaveLength(1);
    expect(g2.children[0].type).toBe('line');
    expect(g2.children[0].encode).toEqual({ x: 'time', y: 'value' });
  });

  it('should merge top-level scales into marks', () => {
    const spec: VistralSpec = {
      scales: {
        x: { type: 'time' },
        y: { type: 'linear', nice: true },
      },
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.children[0].scale).toEqual({
      x: { type: 'time' },
      y: { type: 'linear', nice: true },
    });
  });

  it('should let per-mark scales override top-level scales', () => {
    const spec: VistralSpec = {
      scales: {
        x: { type: 'time' },
        y: { type: 'linear', nice: true },
      },
      marks: [
        {
          type: 'line',
          encode: { x: 'time', y: 'value' },
          scales: { y: { type: 'log' } },
        },
      ],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.children[0].scale).toEqual({
      x: { type: 'time' },
      y: { type: 'log' },
    });
  });

  it('should prepend top-level transforms before mark transforms', () => {
    const spec: VistralSpec = {
      transforms: [{ type: 'sortX' }],
      marks: [
        {
          type: 'line',
          transforms: [{ type: 'stackY' }],
        },
      ],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.children[0].transform).toEqual([
      { type: 'sortX' },
      { type: 'stackY' },
    ]);
  });

  it('should translate coordinate with transforms renamed to transform', () => {
    const spec: VistralSpec = {
      coordinate: {
        type: 'polar',
        transforms: [{ type: 'transpose' }],
      },
      marks: [{ type: 'interval' }],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.coordinate).toEqual({
      type: 'polar',
      transform: [{ type: 'transpose' }],
    });
    // Ensure the original `transforms` key is not present
    expect(g2.coordinate.transforms).toBeUndefined();
  });

  it('should translate axes to G2 axis format', () => {
    const spec: VistralSpec = {
      axes: {
        x: {
          title: 'Time',
          grid: true,
          line: true,
          labels: {
            format: '%Y-%m-%d',
            rotate: -45,
          },
        },
        y: {
          title: 'Value',
          grid: false,
        },
      },
      marks: [{ type: 'line' }],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.axis).toEqual({
      x: {
        title: 'Time',
        grid: true,
        line: true,
        labelFormatter: '%Y-%m-%d',
        labelTransform: [{ type: 'rotate', angle: -45 }],
      },
      y: {
        title: 'Value',
        grid: false,
      },
    });
  });

  it('should translate legend false', () => {
    const spec: VistralSpec = {
      legend: false,
      marks: [{ type: 'line' }],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.legend).toBe(false);
  });

  it('should translate legend spec to { color: { position } }', () => {
    const spec: VistralSpec = {
      legend: { position: 'bottom' },
      marks: [{ type: 'line' }],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.legend).toEqual({ color: { position: 'bottom' } });
  });

  it('should translate interactions array to object map', () => {
    const spec: VistralSpec = {
      interactions: [
        { type: 'tooltip' },
        { type: 'brushXFilter', reverse: true },
      ],
      marks: [{ type: 'line' }],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.interaction).toEqual({
      tooltip: {},
      brushXFilter: { reverse: true },
    });
  });

  it('should translate annotations to additional children', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      annotations: [
        {
          type: 'lineY',
          value: 100,
          style: { stroke: 'red' },
          label: 'Threshold',
        },
      ],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.children).toHaveLength(2);
    // First child is the mark
    expect(g2.children[0].type).toBe('line');
    // Second child is the annotation
    expect(g2.children[1].type).toBe('lineY');
    expect(g2.children[1].data).toEqual([100]);
    expect(g2.children[1].style).toEqual({ stroke: 'red' });
    expect(g2.children[1].labels).toEqual([{ text: 'Threshold' }]);
  });

  it('should translate mark labels with overlapHide', () => {
    const spec: VistralSpec = {
      marks: [
        {
          type: 'interval',
          labels: [
            {
              text: 'value',
              overlapHide: true,
              style: { fontSize: 12 },
            },
          ],
        },
      ],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.children[0].labels).toEqual([
      {
        text: 'value',
        style: { fontSize: 12 },
        transform: [{ type: 'overlapHide' }],
      },
    ]);
  });

  it('should translate mark tooltip false', () => {
    const spec: VistralSpec = {
      marks: [
        {
          type: 'line',
          tooltip: false,
        },
      ],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.children[0].tooltip).toBe(false);
  });

  it('should produce multiple children for multiple marks', () => {
    const spec: VistralSpec = {
      marks: [
        { type: 'line', encode: { x: 'time', y: 'value' } },
        { type: 'point', encode: { x: 'time', y: 'value' } },
      ],
    };

    const g2 = translateToG2Spec(spec);

    expect(g2.children).toHaveLength(2);
    expect(g2.children[0].type).toBe('line');
    expect(g2.children[1].type).toBe('point');
  });
});
