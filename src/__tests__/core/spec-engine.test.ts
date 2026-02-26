import { describe, it, expect } from 'vitest';
import { applyTemporalTransforms } from '../../core/spec-engine';
import type { VistralSpec, TransformSpec } from '../../types/spec';

describe('applyTemporalTransforms', () => {
  it('should return spec unchanged when no temporal config exists', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      transforms: [{ type: 'sortX' }],
    };
    const data = [
      { time: 1000, value: 10 },
      { time: 2000, value: 20 },
    ];

    const result = applyTemporalTransforms(spec, data);
    expect(result).toEqual(spec);
  });

  it('should inject filter + sortBy for axis mode with numeric range', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line' }],
      temporal: {
        mode: 'axis',
        field: 'time',
        range: 5, // 5 minutes
      },
    };
    const data = [
      { time: 1000000, value: 10 },
      { time: 2000000, value: 20 },
      { time: 3000000, value: 30 },
    ];

    const result = applyTemporalTransforms(spec, data);

    // Should have 2 transforms: filter + sortBy
    expect(result.transforms).toHaveLength(2);
    expect(result.transforms![0].type).toBe('filter');
    expect(result.transforms![1].type).toBe('sortBy');
    expect(result.transforms![1].fields).toEqual(['time']);
  });

  it('should inject filter for frame mode that keeps only max timestamp rows', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval' }],
      temporal: {
        mode: 'frame',
        field: 'ts',
      },
    };
    const data = [
      { ts: 1000, category: 'A', value: 10 },
      { ts: 2000, category: 'B', value: 20 },
      { ts: 2000, category: 'C', value: 30 },
      { ts: 1000, category: 'D', value: 40 },
    ];

    const result = applyTemporalTransforms(spec, data);

    expect(result.transforms).toHaveLength(1);
    expect(result.transforms![0].type).toBe('filter');

    // Verify the filter callback works correctly
    const filterCallback = result.transforms![0].callback as (
      d: Record<string, unknown>
    ) => boolean;
    expect(filterCallback({ ts: 2000 })).toBe(true);
    expect(filterCallback({ ts: 1000 })).toBe(false);
  });

  it('should inject filter for key mode that keeps only latest per key', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval' }],
      temporal: {
        mode: 'key',
        field: 'device', // 'device' is the categorical key
      },
    };
    const rowA1 = { ts: 1000, device: 'A', value: 10 };
    const rowA2 = { ts: 2000, device: 'A', value: 20 }; // last A row — wins
    const rowB1 = { ts: 1500, device: 'B', value: 30 };
    const rowB2 = { ts: 3000, device: 'B', value: 40 }; // last B row — wins
    const data = [rowA1, rowA2, rowB1, rowB2];

    const result = applyTemporalTransforms(spec, data);

    expect(result.transforms).toHaveLength(1);
    expect(result.transforms![0].type).toBe('filter');

    // Verify the filter callback uses object identity (last-write-wins)
    const filterCallback = result.transforms![0].callback as (
      d: Record<string, unknown>
    ) => boolean;
    expect(filterCallback(rowA2)).toBe(true);  // last-received A row passes
    expect(filterCallback(rowA1)).toBe(false); // earlier A row rejected
    expect(filterCallback(rowB2)).toBe(true);  // last-received B row passes
    expect(filterCallback(rowB1)).toBe(false); // earlier B row rejected
  });

  it('should keep last-received row per key when multiple rows share the same timestamp', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval' }],
      temporal: { mode: 'key', field: 'device' },
    };
    const row1 = { ts: 1000, device: 'A', value: 10 };
    const row2 = { ts: 1000, device: 'A', value: 20 }; // same ts — last received wins
    const row3 = { ts: 1000, device: 'B', value: 30 };
    const row4 = { ts: 1000, device: 'B', value: 40 }; // same ts — last received wins
    const data = [row1, row2, row3, row4];

    const result = applyTemporalTransforms(spec, data);
    const filterCallback = result.transforms![0].callback as (
      d: Record<string, unknown>
    ) => boolean;

    expect(filterCallback(row2)).toBe(true);  // last-received A row passes
    expect(filterCallback(row1)).toBe(false); // earlier A row rejected
    expect(filterCallback(row4)).toBe(true);  // last-received B row passes
    expect(filterCallback(row3)).toBe(false); // earlier B row rejected
  });

  it('should prepend temporal transforms before existing transforms', () => {
    const existingTransform: TransformSpec = { type: 'stackY' };
    const spec: VistralSpec = {
      marks: [{ type: 'area' }],
      transforms: [existingTransform],
      temporal: {
        mode: 'frame',
        field: 'ts',
      },
    };
    const data = [
      { ts: 1000, value: 10 },
      { ts: 2000, value: 20 },
    ];

    const result = applyTemporalTransforms(spec, data);

    // Temporal filter should come first, then existing transforms
    expect(result.transforms).toHaveLength(2);
    expect(result.transforms![0].type).toBe('filter');
    expect(result.transforms![1].type).toBe('stackY');
  });

  it('should inject only sortBy for axis mode with Infinity range', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line' }],
      temporal: {
        mode: 'axis',
        field: 'time',
        range: 'Infinity',
      },
    };
    const data = [
      { time: 2000, value: 20 },
      { time: 1000, value: 10 },
    ];

    const result = applyTemporalTransforms(spec, data);

    // Only sortBy, no filter
    expect(result.transforms).toHaveLength(1);
    expect(result.transforms![0].type).toBe('sortBy');
    expect(result.transforms![0].fields).toEqual(['time']);
  });
});
