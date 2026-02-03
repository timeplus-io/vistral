# VistralSpec Grammar Abstraction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the VistralSpec grammar abstraction layer that makes all G2 grammar concepts expressible through a Vistral-native spec format, with temporal bounding and streaming as first-class concepts.

**Architecture:** A `VistralSpec` type defines the grammar. A Spec Engine translates it to G2. High-level configs (`TimeSeriesConfig`, etc.) compile to `VistralSpec`. A new `VistralChart` React component renders any spec. Existing `StreamChart` is refactored to use the new pipeline internally.

**Tech Stack:** TypeScript, React 18, AntV G2 5.1.0, Vitest for testing.

---

## Phase 1: Foundation

### Task 1: Define VistralSpec Types

**Files:**
- Create: `src/types/spec.ts`
- Modify: `src/types/index.ts` (add re-export)
- Modify: `src/index.ts` (add public export)
- Test: `src/__tests__/types/spec.test.ts`

**Step 1: Write the failing test**

Create test file `src/__tests__/types/spec.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  VistralSpec,
  MarkSpec,
  EncodeSpec,
  ScaleSpec,
  TransformSpec,
  CoordinateSpec,
  StreamingSpec,
  TemporalSpec,
  AxesSpec,
  LegendSpec,
  TooltipSpec,
  AnnotationSpec,
  InteractionSpec,
  StyleSpec,
  LabelSpec,
  EncodeFn,
} from '../../types/spec';

describe('VistralSpec types', () => {
  it('should allow a minimal spec with just marks', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
    };
    expect(spec.marks).toHaveLength(1);
    expect(spec.marks[0].type).toBe('line');
  });

  it('should allow a full spec with all sections', () => {
    const spec: VistralSpec = {
      streaming: { maxItems: 500, mode: 'append', throttle: 100 },
      temporal: { mode: 'axis', field: 'timestamp', range: 5 },
      marks: [
        {
          type: 'area',
          encode: { x: 'time', y: 'value', color: 'series' },
          scales: { y: { type: 'log' } },
          transforms: [{ type: 'stackY' }],
          style: { opacity: 0.5 },
          labels: [{ text: 'value', overlapHide: true }],
          tooltip: { title: 'time', items: [{ field: 'value' }] },
          animate: false,
        },
      ],
      scales: { x: { type: 'time' }, y: { type: 'linear', nice: true } },
      transforms: [{ type: 'filter', callback: () => true }],
      coordinate: { type: 'polar' },
      axes: {
        x: { title: 'Time', grid: false },
        y: { title: 'Value', grid: true, labels: { format: (v: unknown) => String(v) } },
      },
      legend: { position: 'bottom', interactive: true },
      tooltip: { title: 'time' },
      theme: 'dark',
      annotations: [{ type: 'lineY', value: 80, style: { stroke: 'red' } }],
      interactions: [{ type: 'tooltip' }, { type: 'brushXHighlight' }],
      animate: false,
    };
    expect(spec.marks).toHaveLength(1);
    expect(spec.streaming?.maxItems).toBe(500);
    expect(spec.temporal?.mode).toBe('axis');
  });

  it('should allow EncodeFn accessors', () => {
    const fn: EncodeFn = (d) => d.value;
    const spec: VistralSpec = {
      marks: [{ type: 'point', encode: { x: fn, y: 'value' } }],
    };
    expect(typeof spec.marks[0].encode?.x).toBe('function');
  });

  it('should allow legend and tooltip to be false', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'x', y: 'y' } }],
      legend: false,
      tooltip: false,
    };
    expect(spec.legend).toBe(false);
    expect(spec.tooltip).toBe(false);
  });

  it('should allow temporal key mode with keyField', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval', encode: { x: 'category', y: 'count' } }],
      temporal: { mode: 'key', field: 'timestamp', keyField: 'device_id' },
    };
    expect(spec.temporal?.keyField).toBe('device_id');
  });

  it('should allow all coordinate types', () => {
    const coordTypes = ['cartesian', 'polar', 'theta', 'radial', 'parallel', 'radar', 'helix', 'fisheye'];
    for (const type of coordTypes) {
      const spec: VistralSpec = {
        marks: [{ type: 'line', encode: { x: 'x', y: 'y' } }],
        coordinate: { type },
      };
      expect(spec.coordinate?.type).toBe(type);
    }
  });

  it('should allow coordinate transforms', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval', encode: { x: 'x', y: 'y' } }],
      coordinate: { transforms: [{ type: 'transpose' }] },
    };
    expect(spec.coordinate?.transforms).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/types/spec.test.ts`
Expected: FAIL — module `../../types/spec` not found.

**Step 3: Write the type definitions**

Create `src/types/spec.ts`:

```typescript
/**
 * VistralSpec — Grammar-level visualization specification.
 *
 * This is the core type that describes any visualization in Vistral.
 * High-level configs (TimeSeriesConfig, etc.) compile down to this format.
 * Power users can write VistralSpec directly for full grammar access.
 */

// ─── Accessor Function ────────────────────────────────────────────

/** Accessor function for computed encodings. */
export type EncodeFn = (datum: Record<string, unknown>) => unknown;

// ─── Data Layer ───────────────────────────────────────────────────

export interface StreamingSpec {
  /** Maximum number of data items to retain in memory. Default: 1000. */
  maxItems?: number;
  /** How new data is incorporated. Default: 'append'. */
  mode?: 'append' | 'replace';
  /** Throttle rendering updates to at most once per interval (ms). Default: 0. */
  throttle?: number;
}

export interface TemporalSpec {
  /** Temporal bounding mode. */
  mode: 'axis' | 'frame' | 'key';
  /** The data field containing the temporal value. */
  field: string;
  /** Axis-mode only. Visible time window in minutes. Default: 'Infinity'. */
  range?: number | 'Infinity';
  /** Key-mode only. The data field that identifies unique entities. */
  keyField?: string;
}

// ─── Encoding ─────────────────────────────────────────────────────

export interface EncodeSpec {
  x?: string | EncodeFn;
  y?: string | EncodeFn;
  color?: string | EncodeFn;
  size?: string | EncodeFn;
  shape?: string | EncodeFn;
  opacity?: string | EncodeFn;
  series?: string | EncodeFn;
  [channel: string]: string | EncodeFn | undefined;
}

// ─── Scale ────────────────────────────────────────────────────────

export interface ScaleSpec {
  type?: string;
  domain?: unknown[];
  range?: unknown[];
  nice?: boolean;
  clamp?: boolean;
  padding?: number;
  mask?: string;
  [option: string]: unknown;
}

// ─── Transform ────────────────────────────────────────────────────

export interface TransformSpec {
  type: string;
  [option: string]: unknown;
}

// ─── Coordinate ───────────────────────────────────────────────────

export interface CoordinateSpec {
  type?: string;
  transforms?: Array<{ type: string; [option: string]: unknown }>;
  [option: string]: unknown;
}

// ─── Style ────────────────────────────────────────────────────────

export interface StyleSpec {
  fill?: string;
  stroke?: string;
  lineWidth?: number;
  opacity?: number;
  shape?: string;
  [property: string]: unknown;
}

// ─── Label ────────────────────────────────────────────────────────

export interface LabelSpec {
  text?: string | EncodeFn;
  format?: string | ((value: unknown) => string);
  overlapHide?: boolean;
  selector?: string;
  style?: StyleSpec;
  [option: string]: unknown;
}

// ─── Mark ─────────────────────────────────────────────────────────

export interface MarkTooltipSpec {
  title?: string | ((datum: Record<string, unknown>) => string);
  items?: TooltipItemSpec[];
}

export interface MarkSpec {
  type: string;
  encode?: EncodeSpec;
  scales?: Record<string, ScaleSpec>;
  transforms?: TransformSpec[];
  style?: StyleSpec;
  labels?: LabelSpec[];
  tooltip?: MarkTooltipSpec | false;
  animate?: boolean;
}

// ─── Axes ─────────────────────────────────────────────────────────

export interface AxisLabelSpec {
  format?: string | ((value: unknown) => string);
  maxLength?: number;
  rotate?: number;
}

export interface AxisChannelSpec {
  title?: string | false;
  grid?: boolean;
  line?: boolean;
  labels?: AxisLabelSpec;
}

export interface AxesSpec {
  x?: AxisChannelSpec | false;
  y?: AxisChannelSpec | false;
}

// ─── Legend ────────────────────────────────────────────────────────

export interface LegendSpec {
  position?: 'top' | 'bottom' | 'left' | 'right';
  interactive?: boolean;
}

// ─── Tooltip ──────────────────────────────────────────────────────

export interface TooltipItemSpec {
  field: string;
  name?: string;
  format?: (value: unknown) => string;
}

export interface TooltipSpec {
  title?: string | ((datum: Record<string, unknown>) => string);
  items?: TooltipItemSpec[];
}

// ─── Annotation ───────────────────────────────────────────────────

export interface AnnotationSpec {
  type: string;
  value?: unknown;
  style?: StyleSpec;
  label?: string;
  encode?: EncodeSpec;
}

// ─── Interaction ──────────────────────────────────────────────────

export interface InteractionSpec {
  type: string;
  [option: string]: unknown;
}

// ─── Top-Level Spec ───────────────────────────────────────────────

export interface VistralSpec {
  // Data layer
  streaming?: StreamingSpec;
  temporal?: TemporalSpec;

  // Visual grammar
  marks: MarkSpec[];
  scales?: Record<string, ScaleSpec>;
  transforms?: TransformSpec[];
  coordinate?: CoordinateSpec;

  // Presentation
  axes?: AxesSpec;
  legend?: LegendSpec | false;
  tooltip?: TooltipSpec | false;
  theme?: 'dark' | 'light';
  annotations?: AnnotationSpec[];

  // Behavior
  interactions?: InteractionSpec[];
  animate?: boolean;
}
```

**Step 4: Add re-exports**

Add to `src/types/index.ts` at the end:

```typescript
// VistralSpec grammar types
export type {
  VistralSpec,
  MarkSpec,
  EncodeSpec,
  EncodeFn,
  ScaleSpec,
  TransformSpec,
  CoordinateSpec,
  StreamingSpec,
  TemporalSpec,
  StyleSpec,
  LabelSpec,
  MarkTooltipSpec,
  AxesSpec,
  AxisChannelSpec,
  AxisLabelSpec,
  LegendSpec,
  TooltipSpec,
  TooltipItemSpec,
  AnnotationSpec,
  InteractionSpec,
} from './spec';
```

Add to `src/index.ts` in the Types export section:

```typescript
// VistralSpec types
export type {
  VistralSpec,
  MarkSpec,
  EncodeSpec,
  EncodeFn,
  ScaleSpec,
  TransformSpec,
  CoordinateSpec,
  StreamingSpec,
  TemporalSpec,
  AxesSpec,
  LegendSpec,
  TooltipSpec,
  AnnotationSpec,
  InteractionSpec,
} from './types';
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/types/spec.test.ts`
Expected: PASS — all 7 tests green.

**Step 6: Commit**

```bash
git add src/types/spec.ts src/types/index.ts src/index.ts src/__tests__/types/spec.test.ts
git commit -m "feat: define VistralSpec grammar types"
```

---

### Task 2: Implement Spec Engine — Temporal Transform Injection

**Files:**
- Create: `src/core/spec-engine.ts`
- Test: `src/__tests__/core/spec-engine.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/core/spec-engine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { applyTemporalTransforms } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('applyTemporalTransforms', () => {
  it('should return spec unchanged when no temporal config', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
    };
    const result = applyTemporalTransforms(spec, []);
    expect(result.transforms).toBeUndefined();
  });

  it('should inject filter + sort for axis mode', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      temporal: { mode: 'axis', field: 'time', range: 5 },
    };
    const data = [
      { time: 1000, value: 10 },
      { time: 2000, value: 20 },
      { time: 3000, value: 30 },
    ];
    const result = applyTemporalTransforms(spec, data);
    expect(result.transforms).toBeDefined();
    expect(result.transforms!.length).toBe(2);
    expect(result.transforms![0].type).toBe('filter');
    expect(result.transforms![1].type).toBe('sortBy');
  });

  it('should inject frame filter for frame mode', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval', encode: { x: 'cat', y: 'count' } }],
      temporal: { mode: 'frame', field: 'ts' },
    };
    const data = [
      { ts: 1000, cat: 'a', count: 10 },
      { ts: 2000, cat: 'a', count: 20 },
      { ts: 2000, cat: 'b', count: 30 },
    ];
    const result = applyTemporalTransforms(spec, data);
    expect(result.transforms).toBeDefined();
    expect(result.transforms!.length).toBe(1);
    expect(result.transforms![0].type).toBe('filter');
    // Verify the filter callback keeps only latest timestamp rows
    const filterFn = result.transforms![0].callback as (d: Record<string, unknown>) => boolean;
    expect(filterFn({ ts: 1000 })).toBe(false);
    expect(filterFn({ ts: 2000 })).toBe(true);
  });

  it('should inject key deduplication for key mode', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval', encode: { x: 'device', y: 'temp' } }],
      temporal: { mode: 'key', field: 'ts', keyField: 'device' },
    };
    const data = [
      { ts: 1000, device: 'A', temp: 20 },
      { ts: 2000, device: 'A', temp: 25 },
      { ts: 1500, device: 'B', temp: 30 },
    ];
    const result = applyTemporalTransforms(spec, data);
    expect(result.transforms).toBeDefined();
    expect(result.transforms!.length).toBe(1);
    expect(result.transforms![0].type).toBe('filter');
    // The filter should keep only latest per key
    const filterFn = result.transforms![0].callback as (d: Record<string, unknown>) => boolean;
    // device A: latest is ts=2000
    expect(filterFn({ ts: 2000, device: 'A', temp: 25 })).toBe(true);
    expect(filterFn({ ts: 1000, device: 'A', temp: 20 })).toBe(false);
    // device B: latest is ts=1500
    expect(filterFn({ ts: 1500, device: 'B', temp: 30 })).toBe(true);
  });

  it('should prepend temporal transforms before existing transforms', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'area', encode: { x: 'time', y: 'value' } }],
      temporal: { mode: 'axis', field: 'time', range: 5 },
      transforms: [{ type: 'stackY' }],
    };
    const result = applyTemporalTransforms(spec, []);
    expect(result.transforms!.length).toBe(3);
    expect(result.transforms![0].type).toBe('filter');
    expect(result.transforms![1].type).toBe('sortBy');
    expect(result.transforms![2].type).toBe('stackY');
  });

  it('axis mode with Infinity range should not inject filter', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      temporal: { mode: 'axis', field: 'time', range: 'Infinity' },
    };
    const result = applyTemporalTransforms(spec, []);
    // Should only inject sort, not filter
    expect(result.transforms!.length).toBe(1);
    expect(result.transforms![0].type).toBe('sortBy');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/core/spec-engine.test.ts`
Expected: FAIL — module `../../core/spec-engine` not found.

**Step 3: Implement `applyTemporalTransforms`**

Create `src/core/spec-engine.ts`:

```typescript
/**
 * Spec Engine — Translates VistralSpec to G2 and manages chart lifecycle.
 */

import type { VistralSpec, TransformSpec } from '../types/spec';
import { parseDateTime } from '../utils';

/**
 * Inject temporal transforms into the spec based on temporal config.
 * Returns a new spec with transforms prepended.
 */
export function applyTemporalTransforms(
  spec: VistralSpec,
  data: Record<string, unknown>[]
): VistralSpec {
  if (!spec.temporal) return spec;

  const { mode, field, range, keyField } = spec.temporal;
  const temporalTransforms: TransformSpec[] = [];

  switch (mode) {
    case 'axis': {
      // Filter by time window (skip if Infinity)
      if (range !== 'Infinity' && range !== undefined) {
        const rangeMs = Number(range) * 60 * 1000;
        const now = getMaxTimestamp(data, field);
        const minTime = now - rangeMs;
        temporalTransforms.push({
          type: 'filter',
          callback: (d: Record<string, unknown>) => {
            const t = parseDateTime(d[field]);
            return t >= minTime && t <= now;
          },
        });
      }
      // Always sort by time field
      temporalTransforms.push({ type: 'sortBy', fields: [field] });
      break;
    }
    case 'frame': {
      const maxTs = getMaxTimestamp(data, field);
      temporalTransforms.push({
        type: 'filter',
        callback: (d: Record<string, unknown>) => {
          return parseDateTime(d[field]) === maxTs;
        },
      });
      break;
    }
    case 'key': {
      if (keyField) {
        // Build a set of rows to keep (latest per key)
        const latestPerKey = new Map<string, number>();
        for (const row of data) {
          const key = String(row[keyField] ?? '');
          const ts = parseDateTime(row[field]);
          const existing = latestPerKey.get(key);
          if (existing === undefined || ts > existing) {
            latestPerKey.set(key, ts);
          }
        }
        temporalTransforms.push({
          type: 'filter',
          callback: (d: Record<string, unknown>) => {
            const key = String(d[keyField] ?? '');
            const ts = parseDateTime(d[field]);
            return latestPerKey.get(key) === ts;
          },
        });
      }
      break;
    }
  }

  if (temporalTransforms.length === 0) return spec;

  return {
    ...spec,
    transforms: [...temporalTransforms, ...(spec.transforms ?? [])],
  };
}

/** Get the maximum timestamp from a dataset for a given field. */
function getMaxTimestamp(data: Record<string, unknown>[], field: string): number {
  let max = -Infinity;
  for (const row of data) {
    const ts = parseDateTime(row[field]);
    if (ts > max) max = ts;
  }
  return max === -Infinity ? Date.now() : max;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/core/spec-engine.test.ts`
Expected: PASS — all 6 tests green.

**Step 5: Commit**

```bash
git add src/core/spec-engine.ts src/__tests__/core/spec-engine.test.ts
git commit -m "feat: implement temporal transform injection in spec engine"
```

---

### Task 3: Implement Spec Engine — G2 Spec Translation

**Files:**
- Modify: `src/core/spec-engine.ts`
- Test: `src/__tests__/core/spec-engine-translate.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/core/spec-engine-translate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { translateToG2Spec } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('translateToG2Spec', () => {
  it('should translate a simple line spec', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      animate: false,
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.type).toBe('view');
    expect(g2.children).toHaveLength(1);
    expect(g2.children[0].type).toBe('line');
    expect(g2.children[0].encode).toEqual({ x: 'time', y: 'value' });
    expect(g2.children[0].animate).toBe(false);
  });

  it('should merge top-level scales into marks', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      scales: { x: { type: 'time' }, y: { type: 'linear', nice: true } },
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.children[0].scale).toEqual({
      x: { type: 'time' },
      y: { type: 'linear', nice: true },
    });
  });

  it('should allow per-mark scales to override top-level', () => {
    const spec: VistralSpec = {
      marks: [{
        type: 'line',
        encode: { x: 'time', y: 'value' },
        scales: { y: { type: 'log' } },
      }],
      scales: { x: { type: 'time' }, y: { type: 'linear' } },
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.children[0].scale.x).toEqual({ type: 'time' });
    expect(g2.children[0].scale.y).toEqual({ type: 'log' });
  });

  it('should merge top-level transforms with mark transforms', () => {
    const spec: VistralSpec = {
      marks: [{
        type: 'area',
        encode: { x: 'time', y: 'value' },
        transforms: [{ type: 'stackY' }],
      }],
      transforms: [{ type: 'filter', callback: () => true }],
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.children[0].transform).toHaveLength(2);
    expect(g2.children[0].transform[0].type).toBe('filter');
    expect(g2.children[0].transform[1].type).toBe('stackY');
  });

  it('should translate coordinate', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval', encode: { x: 'cat', y: 'val' } }],
      coordinate: { transforms: [{ type: 'transpose' }] },
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.coordinate).toEqual({ transform: [{ type: 'transpose' }] });
  });

  it('should translate axes', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'x', y: 'y' } }],
      axes: {
        x: { title: 'Time', grid: false },
        y: { title: 'Value', grid: true },
      },
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.axis.x.title).toBe('Time');
    expect(g2.axis.x.grid).toBe(false);
    expect(g2.axis.y.title).toBe('Value');
    expect(g2.axis.y.grid).toBe(true);
  });

  it('should translate legend false', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'x', y: 'y' } }],
      legend: false,
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.legend).toBe(false);
  });

  it('should translate legend spec', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'x', y: 'y' } }],
      legend: { position: 'bottom' },
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.legend).toEqual({ color: { position: 'bottom' } });
  });

  it('should translate interactions', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'x', y: 'y' } }],
      interactions: [{ type: 'tooltip' }, { type: 'brushXHighlight' }],
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.interaction).toEqual({ tooltip: {}, brushXHighlight: {} });
  });

  it('should translate annotations as additional children', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'x', y: 'y' } }],
      annotations: [
        { type: 'lineY', value: 80, style: { stroke: 'red' } },
      ],
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.children).toHaveLength(2);
    expect(g2.children[1].type).toBe('lineY');
  });

  it('should translate mark labels', () => {
    const spec: VistralSpec = {
      marks: [{
        type: 'line',
        encode: { x: 'x', y: 'y' },
        labels: [{ text: 'y', overlapHide: true, selector: 'last' }],
      }],
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.children[0].labels).toHaveLength(1);
    expect(g2.children[0].labels[0].text).toBe('y');
    expect(g2.children[0].labels[0].transform).toEqual([{ type: 'overlapHide' }]);
  });

  it('should translate tooltip false on marks', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'point', encode: { x: 'x', y: 'y' }, tooltip: false }],
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.children[0].tooltip).toBe(false);
  });

  it('should translate multiple marks', () => {
    const spec: VistralSpec = {
      marks: [
        { type: 'line', encode: { x: 'time', y: 'value' } },
        { type: 'point', encode: { x: 'time', y: 'value' }, tooltip: false },
      ],
    };
    const g2 = translateToG2Spec(spec);
    expect(g2.children).toHaveLength(2);
    expect(g2.children[0].type).toBe('line');
    expect(g2.children[1].type).toBe('point');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/core/spec-engine-translate.test.ts`
Expected: FAIL — `translateToG2Spec` not exported.

**Step 3: Implement `translateToG2Spec`**

Add to `src/core/spec-engine.ts`:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  VistralSpec,
  TransformSpec,
  MarkSpec,
  LabelSpec,
  AnnotationSpec,
} from '../types/spec';

/**
 * Translate a VistralSpec into a G2-compatible options object.
 * This is a pure function — no side effects, no G2 instance required.
 */
export function translateToG2Spec(spec: VistralSpec): Record<string, any> {
  const g2Spec: Record<string, any> = {
    type: 'view',
    children: [],
  };

  // Coordinate
  if (spec.coordinate) {
    g2Spec.coordinate = translateCoordinate(spec.coordinate);
  }

  // Axes
  if (spec.axes) {
    g2Spec.axis = translateAxes(spec.axes);
  }

  // Legend
  if (spec.legend === false) {
    g2Spec.legend = false;
  } else if (spec.legend) {
    g2Spec.legend = { color: { position: spec.legend.position } };
  }

  // Interactions
  if (spec.interactions) {
    g2Spec.interaction = {};
    for (const interaction of spec.interactions) {
      const { type, ...options } = interaction;
      g2Spec.interaction[type] = options;
    }
  }

  // Marks → children
  for (const mark of spec.marks) {
    g2Spec.children.push(translateMark(mark, spec));
  }

  // Annotations → additional children
  if (spec.annotations) {
    for (const annotation of spec.annotations) {
      g2Spec.children.push(translateAnnotation(annotation));
    }
  }

  return g2Spec;
}

function translateMark(mark: MarkSpec, spec: VistralSpec): Record<string, any> {
  const g2Mark: Record<string, any> = {
    type: mark.type,
  };

  // Encode
  if (mark.encode) {
    g2Mark.encode = { ...mark.encode };
  }

  // Scales: merge top-level with per-mark (per-mark wins)
  const mergedScales = { ...(spec.scales ?? {}), ...(mark.scales ?? {}) };
  if (Object.keys(mergedScales).length > 0) {
    g2Mark.scale = mergedScales;
  }

  // Transforms: top-level first, then per-mark
  const mergedTransforms = [
    ...(spec.transforms ?? []),
    ...(mark.transforms ?? []),
  ];
  if (mergedTransforms.length > 0) {
    g2Mark.transform = mergedTransforms;
  }

  // Style
  if (mark.style) {
    g2Mark.style = { ...mark.style };
  }

  // Labels
  if (mark.labels && mark.labels.length > 0) {
    g2Mark.labels = mark.labels.map(translateLabel);
  }

  // Tooltip
  if (mark.tooltip === false) {
    g2Mark.tooltip = false;
  } else if (mark.tooltip) {
    g2Mark.tooltip = { ...mark.tooltip };
  }

  // Animate
  if (mark.animate !== undefined) {
    g2Mark.animate = mark.animate;
  } else if (spec.animate !== undefined) {
    g2Mark.animate = spec.animate;
  }

  return g2Mark;
}

function translateLabel(label: LabelSpec): Record<string, any> {
  const g2Label: Record<string, any> = {};

  if (label.text !== undefined) g2Label.text = label.text;
  if (label.selector !== undefined) g2Label.selector = label.selector;
  if (label.style) g2Label.style = label.style;
  if (label.format) g2Label.formatter = label.format;

  if (label.overlapHide) {
    g2Label.transform = [{ type: 'overlapHide' }];
  }

  // Pass through extra options
  for (const [key, value] of Object.entries(label)) {
    if (!['text', 'format', 'overlapHide', 'selector', 'style'].includes(key)) {
      g2Label[key] = value;
    }
  }

  return g2Label;
}

function translateAnnotation(annotation: AnnotationSpec): Record<string, any> {
  const g2Mark: Record<string, any> = {
    type: annotation.type,
  };

  if (annotation.encode) {
    g2Mark.encode = { ...annotation.encode };
  }
  if (annotation.style) {
    g2Mark.style = { ...annotation.style };
  }
  if (annotation.value !== undefined) {
    // For lineY/lineX, value maps to data
    g2Mark.data = [annotation.value];
  }
  if (annotation.label) {
    g2Mark.labels = [{ text: annotation.label }];
  }

  return g2Mark;
}

function translateCoordinate(coord: Record<string, any>): Record<string, any> {
  const g2Coord: Record<string, any> = {};

  if (coord.type) {
    g2Coord.type = coord.type;
  }
  if (coord.transforms) {
    g2Coord.transform = coord.transforms;
  }

  // Pass through extra options
  for (const [key, value] of Object.entries(coord)) {
    if (!['type', 'transforms'].includes(key)) {
      g2Coord[key] = value;
    }
  }

  return g2Coord;
}

function translateAxes(axes: Record<string, any>): Record<string, any> {
  const g2Axis: Record<string, any> = {};

  for (const [channel, axisSpec] of Object.entries(axes)) {
    if (axisSpec === false) {
      g2Axis[channel] = false;
      continue;
    }
    if (!axisSpec) continue;

    const g2Channel: Record<string, any> = {};
    if (axisSpec.title !== undefined) g2Channel.title = axisSpec.title;
    if (axisSpec.grid !== undefined) g2Channel.grid = axisSpec.grid;
    if (axisSpec.line !== undefined) g2Channel.line = axisSpec.line;
    if (axisSpec.labels?.format) g2Channel.labelFormatter = axisSpec.labels.format;
    if (axisSpec.labels?.rotate) g2Channel.labelTransform = [{ type: 'rotate', angle: axisSpec.labels.rotate }];
    g2Axis[channel] = g2Channel;
  }

  return g2Axis;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/core/spec-engine-translate.test.ts`
Expected: PASS — all 12 tests green.

**Step 5: Commit**

```bash
git add src/core/spec-engine.ts src/__tests__/core/spec-engine-translate.test.ts
git commit -m "feat: implement G2 spec translation in spec engine"
```

---

### Task 4: Implement Spec Engine — Theme Integration

**Files:**
- Modify: `src/core/spec-engine.ts`
- Test: `src/__tests__/core/spec-engine-theme.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/core/spec-engine-theme.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { applySpecTheme } from '../../core/spec-engine';

describe('applySpecTheme', () => {
  it('should return dark theme config by default', () => {
    const theme = applySpecTheme('dark');
    expect(theme.view.viewFill).toBe('transparent');
    expect(theme.axis.x.label.fill).toBe('#E5E7EB');
  });

  it('should return light theme config', () => {
    const theme = applySpecTheme('light');
    expect(theme.axis.x.label.fill).toBe('#1F2937');
  });

  it('should default to dark when undefined', () => {
    const theme = applySpecTheme(undefined);
    expect(theme.axis.x.label.fill).toBe('#E5E7EB');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/core/spec-engine-theme.test.ts`
Expected: FAIL — `applySpecTheme` not exported.

**Step 3: Implement `applySpecTheme`**

Add to `src/core/spec-engine.ts`:

```typescript
/**
 * Build G2 theme config from Vistral theme name.
 * Reuses the existing theme color system from chart-utils.
 */
export function applySpecTheme(theme: 'dark' | 'light' | undefined): Record<string, any> {
  const colors = getChartThemeColors(theme ?? 'dark');

  return {
    view: { viewFill: colors.background },
    label: { fill: colors.text, fontSize: 11 },
    axis: {
      x: {
        line: { stroke: colors.line },
        tick: { stroke: colors.line },
        label: { fill: colors.text, fontSize: 11 },
        title: { fill: colors.text, fontSize: 12, fontWeight: 500 },
        grid: { stroke: colors.gridline },
      },
      y: {
        line: { stroke: colors.line },
        tick: { stroke: colors.line },
        label: { fill: colors.text, fontSize: 11 },
        title: { fill: colors.text, fontSize: 12, fontWeight: 500 },
        grid: { stroke: colors.gridline },
      },
    },
    legend: {
      label: { fill: colors.text, fontSize: 12 },
      title: { fill: colors.text, fontSize: 12 },
      itemLabel: { fill: colors.text, fontSize: 12 },
      itemName: { fill: colors.text, fontSize: 12 },
      itemValue: { fill: colors.textSecondary, fontSize: 12 },
    },
    legendCategory: {
      itemLabel: { fill: colors.text },
      itemName: { fill: colors.text },
    },
  };
}
```

And add the import at the top of `spec-engine.ts`:

```typescript
import { getChartThemeColors } from './chart-utils';
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/core/spec-engine-theme.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/core/spec-engine.ts src/__tests__/core/spec-engine-theme.test.ts
git commit -m "feat: implement theme integration in spec engine"
```

---

### Task 5: Implement Spec Engine — Full Render Pipeline

**Files:**
- Modify: `src/core/spec-engine.ts`
- Modify: `src/core/index.ts` (add export)
- Test: `src/__tests__/core/spec-engine-render.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/core/spec-engine-render.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildG2Options } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('buildG2Options', () => {
  it('should produce a complete G2 options object from a VistralSpec', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      scales: { x: { type: 'time' }, y: { type: 'linear', nice: true } },
      temporal: { mode: 'axis', field: 'time', range: 5 },
      axes: { x: { title: 'Time' }, y: { title: 'Value', grid: true } },
      legend: false,
      theme: 'dark',
      animate: false,
    };

    const data = [
      { time: 1000, value: 10 },
      { time: 2000, value: 20 },
    ];

    const g2Options = buildG2Options(spec, data);

    expect(g2Options.type).toBe('view');
    expect(g2Options.children).toBeDefined();
    expect(g2Options.children.length).toBeGreaterThanOrEqual(1);
    expect(g2Options.theme).toBeDefined();
    expect(g2Options.theme.view.viewFill).toBe('transparent');
    expect(g2Options.legend).toBe(false);
    expect(g2Options.axis.x.title).toBe('Time');
  });

  it('should handle spec with no temporal and no theme', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'point', encode: { x: 'a', y: 'b' } }],
    };
    const g2Options = buildG2Options(spec, []);
    expect(g2Options.type).toBe('view');
    expect(g2Options.children).toHaveLength(1);
    expect(g2Options.theme).toBeDefined(); // defaults to dark
  });

  it('should apply frame temporal mode correctly', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval', encode: { x: 'cat', y: 'val' } }],
      temporal: { mode: 'frame', field: 'ts' },
    };
    const data = [
      { ts: 1000, cat: 'a', val: 10 },
      { ts: 2000, cat: 'b', val: 20 },
    ];
    const g2Options = buildG2Options(spec, data);
    // Should have filter transform injected into children
    const firstChild = g2Options.children[0];
    expect(firstChild.transform).toBeDefined();
    expect(firstChild.transform[0].type).toBe('filter');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/core/spec-engine-render.test.ts`
Expected: FAIL — `buildG2Options` not exported.

**Step 3: Implement `buildG2Options`**

Add to `src/core/spec-engine.ts`:

```typescript
/**
 * Build the complete G2 options object from a VistralSpec and data.
 * This is the main entry point for the spec engine pipeline:
 *   VistralSpec + data → temporal transforms → G2 translation → theme
 */
export function buildG2Options(
  spec: VistralSpec,
  data: Record<string, unknown>[]
): Record<string, any> {
  // Step 1: Apply temporal transforms
  const specWithTemporal = applyTemporalTransforms(spec, data);

  // Step 2: Translate to G2 spec
  const g2Spec = translateToG2Spec(specWithTemporal);

  // Step 3: Apply theme
  g2Spec.theme = applySpecTheme(spec.theme);

  return g2Spec;
}
```

Add export in `src/core/index.ts`:

```typescript
export {
  applyTemporalTransforms,
  translateToG2Spec,
  applySpecTheme,
  buildG2Options,
} from './spec-engine';
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/core/spec-engine-render.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/core/spec-engine.ts src/core/index.ts src/__tests__/core/spec-engine-render.test.ts
git commit -m "feat: implement full buildG2Options pipeline in spec engine"
```

---

### Task 6: Implement VistralChart React Component

**Files:**
- Create: `src/charts/VistralChart.tsx`
- Modify: `src/charts/index.ts` (add export)
- Modify: `src/index.ts` (add public export)
- Test: `src/__tests__/charts/VistralChart.test.tsx`

**Step 1: Write the failing test**

Create `src/__tests__/charts/VistralChart.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock G2 Chart before importing the component
vi.mock('@antv/g2', () => ({
  Chart: vi.fn().mockImplementation(() => ({
    options: vi.fn().mockReturnThis(),
    render: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
    destroy: vi.fn(),
    getContainer: vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      querySelectorAll: vi.fn().mockReturnValue([]),
      querySelector: vi.fn().mockReturnValue(null),
      appendChild: vi.fn(),
    }),
    data: vi.fn(),
    interaction: vi.fn(),
  })),
}));

import type { VistralSpec } from '../../types/spec';
import { buildG2Options } from '../../core/spec-engine';

describe('VistralChart integration', () => {
  it('buildG2Options produces valid output for a line chart spec', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
      scales: { x: { type: 'time' }, y: { type: 'linear', nice: true } },
      theme: 'dark',
      animate: false,
    };
    const data = [{ time: 1000, value: 10 }, { time: 2000, value: 20 }];
    const g2Options = buildG2Options(spec, data);

    expect(g2Options.type).toBe('view');
    expect(g2Options.children).toHaveLength(1);
    expect(g2Options.children[0].type).toBe('line');
    expect(g2Options.children[0].encode.x).toBe('time');
    expect(g2Options.theme.view.viewFill).toBe('transparent');
  });

  it('buildG2Options produces valid output for multi-mark spec', () => {
    const spec: VistralSpec = {
      marks: [
        { type: 'area', encode: { x: 'time', y: 'value', color: 'series' }, style: { opacity: 0.5 } },
        { type: 'line', encode: { x: 'time', y: 'value', color: 'series' } },
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
    expect(g2Options.children[1].type).toBe('line');
    // Both should have temporal + stackY transforms
    expect(g2Options.children[0].transform.length).toBeGreaterThanOrEqual(2);
  });

  it('buildG2Options handles bar chart with transpose', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval', encode: { x: 'category', y: 'value' } }],
      coordinate: { transforms: [{ type: 'transpose' }] },
      animate: false,
    };
    const g2Options = buildG2Options(spec, []);

    expect(g2Options.coordinate.transform).toEqual([{ type: 'transpose' }]);
    expect(g2Options.children[0].type).toBe('interval');
  });
});
```

**Step 2: Run test to verify it passes** (uses only spec engine, no DOM)

Run: `npx vitest run src/__tests__/charts/VistralChart.test.tsx`
Expected: PASS.

**Step 3: Implement VistralChart component**

Create `src/charts/VistralChart.tsx`:

```tsx
/**
 * VistralChart — Renders any VistralSpec using the Spec Engine + G2.
 */

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Chart } from '@antv/g2';
import type { VistralSpec } from '../types/spec';
import type { StreamDataSource } from '../types';
import { buildG2Options } from '../core/spec-engine';
import { rowToArray } from '../utils';

export interface ChartHandle {
  append: (rows: unknown[][] | Record<string, unknown>[]) => void;
  replace: (rows: unknown[][] | Record<string, unknown>[]) => void;
  clear: () => void;
  g2: Chart | null;
}

export interface VistralChartProps {
  spec: VistralSpec;
  source?: StreamDataSource;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (chart: ChartHandle) => void;
}

export const VistralChart = forwardRef<ChartHandle, VistralChartProps>(
  function VistralChart({ spec, source, width, height, className, style, onReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<Chart | null>(null);
    const dataRef = useRef<Record<string, unknown>[]>([]);
    const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [, setRenderTick] = useState(0);

    // Convert data rows to object format for the spec engine
    const normalizeData = useCallback((source?: StreamDataSource): Record<string, unknown>[] => {
      if (!source?.data?.length) return [];
      const { columns, data } = source;
      return data.map(row => {
        if (Array.isArray(row)) {
          const obj: Record<string, unknown> = {};
          columns.forEach((col, i) => { obj[col.name] = row[i]; });
          return obj;
        }
        return row as Record<string, unknown>;
      });
    }, []);

    // Streaming data management
    const maxItems = spec.streaming?.maxItems ?? 1000;

    const append = useCallback((rows: unknown[][] | Record<string, unknown>[]) => {
      const normalized = rows.map(row => {
        if (Array.isArray(row) && source?.columns) {
          const obj: Record<string, unknown> = {};
          source.columns.forEach((col, i) => { obj[col.name] = (row as unknown[])[i]; });
          return obj;
        }
        return row as Record<string, unknown>;
      });
      dataRef.current = [...dataRef.current, ...normalized].slice(-maxItems);
      scheduleRender();
    }, [maxItems, source?.columns]);

    const replace = useCallback((rows: unknown[][] | Record<string, unknown>[]) => {
      dataRef.current = rows.map(row => {
        if (Array.isArray(row) && source?.columns) {
          const obj: Record<string, unknown> = {};
          source.columns.forEach((col, i) => { obj[col.name] = (row as unknown[])[i]; });
          return obj;
        }
        return row as Record<string, unknown>;
      }).slice(-maxItems);
      scheduleRender();
    }, [maxItems, source?.columns]);

    const clear = useCallback(() => {
      dataRef.current = [];
      scheduleRender();
    }, []);

    const scheduleRender = useCallback(() => {
      const throttle = spec.streaming?.throttle ?? 0;
      if (throttle > 0) {
        if (throttleRef.current) return; // Already scheduled
        throttleRef.current = setTimeout(() => {
          throttleRef.current = null;
          setRenderTick(t => t + 1);
        }, throttle);
      } else {
        setRenderTick(t => t + 1);
      }
    }, [spec.streaming?.throttle]);

    // Chart handle
    const handle: ChartHandle = { append, replace, clear, g2: chartRef.current };

    useImperativeHandle(ref, () => handle, [append, replace, clear]);

    // Initialize G2 chart
    useEffect(() => {
      if (!containerRef.current) return;

      const chart = new Chart({
        container: containerRef.current,
        autoFit: true,
        height,
        width,
      });
      chartRef.current = chart;

      onReady?.({ append, replace, clear, g2: chart });

      return () => {
        if (throttleRef.current) clearTimeout(throttleRef.current);
        chart.destroy();
        chartRef.current = null;
      };
    }, [height, width]);

    // Render chart when spec or data changes
    useEffect(() => {
      const chart = chartRef.current;
      if (!chart) return;

      // Use source data if available, otherwise use internal data buffer
      const data = source ? normalizeData(source) : dataRef.current;
      const g2Options = buildG2Options(spec, data);

      // Set data on children
      g2Options.data = data;

      chart.clear();
      chart.options(g2Options);
      chart.render();
    }, [spec, source, normalizeData]);

    return (
      <div
        ref={containerRef}
        className={className}
        style={{ width: '100%', height: '100%', ...style }}
      />
    );
  }
);
```

**Step 4: Add exports**

Add to `src/charts/index.ts`:

```typescript
export { VistralChart } from './VistralChart';
export type { VistralChartProps, ChartHandle } from './VistralChart';
```

Add to `src/index.ts`:

```typescript
export { VistralChart } from './charts';
export type { VistralChartProps, ChartHandle } from './charts';
```

**Step 5: Run all tests to verify**

Run: `npx vitest run`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/charts/VistralChart.tsx src/charts/index.ts src/index.ts src/__tests__/charts/VistralChart.test.tsx
git commit -m "feat: implement VistralChart React component"
```

---

## Phase 2: Config Compilers

### Task 7: Implement TimeSeriesConfig Compiler

**Files:**
- Create: `src/core/compilers.ts`
- Test: `src/__tests__/core/compilers.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/core/compilers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { compileTimeSeriesConfig } from '../../core/compilers';
import type { TimeSeriesConfig } from '../../types';

describe('compileTimeSeriesConfig', () => {
  const baseConfig: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'timestamp',
    yAxis: 'value',
  };

  it('should produce a VistralSpec with a line mark', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect(spec.marks).toHaveLength(1);
    expect(spec.marks[0].type).toBe('line');
    expect(spec.marks[0].encode?.x).toBe('timestamp');
    expect(spec.marks[0].encode?.y).toBe('value');
  });

  it('should produce area mark for area chartType', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, chartType: 'area' });
    expect(spec.marks[0].type).toBe('area');
  });

  it('should add color encoding when color field specified', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, color: 'series' });
    expect(spec.marks[0].encode?.color).toBe('series');
  });

  it('should add point mark when points enabled', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, points: true });
    expect(spec.marks).toHaveLength(2);
    expect(spec.marks[1].type).toBe('point');
    expect(spec.marks[1].tooltip).toBe(false);
  });

  it('should add stackY transform for area with color', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, chartType: 'area', color: 'series' });
    expect(spec.transforms).toContainEqual({ type: 'stackY' });
  });

  it('should set time scale for x', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect(spec.scales?.x?.type).toBe('time');
  });

  it('should map temporal config', () => {
    const config: TimeSeriesConfig = {
      ...baseConfig,
      temporal: { mode: 'axis', field: 'timestamp', range: 5 },
    };
    const spec = compileTimeSeriesConfig(config);
    expect(spec.temporal?.mode).toBe('axis');
    expect(spec.temporal?.field).toBe('timestamp');
    expect(spec.temporal?.range).toBe(5);
  });

  it('should set curve style when lineStyle is curve', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, lineStyle: 'curve' });
    expect(spec.marks[0].style?.shape).toBe('smooth');
  });

  it('should set legend false when legend is false', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, legend: false });
    expect(spec.legend).toBe(false);
  });

  it('should set y domain from yRange', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, yRange: { min: 0, max: 100 } });
    expect(spec.scales?.y?.domain).toEqual([0, 100]);
  });

  it('should add label when dataLabel is true', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, dataLabel: true });
    expect(spec.marks[0].labels).toBeDefined();
    expect(spec.marks[0].labels!.length).toBeGreaterThan(0);
  });

  it('should disable animate', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect(spec.animate).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/core/compilers.test.ts`
Expected: FAIL — `compileTimeSeriesConfig` not found.

**Step 3: Implement compiler**

Create `src/core/compilers.ts`:

```typescript
/**
 * Config Compilers — Convert high-level chart configs to VistralSpec.
 */

import type { TimeSeriesConfig, BarColumnConfig } from '../types';
import type { VistralSpec, MarkSpec, TransformSpec } from '../types/spec';

/**
 * Compile a TimeSeriesConfig into a VistralSpec.
 */
export function compileTimeSeriesConfig(config: TimeSeriesConfig): VistralSpec {
  const marks: MarkSpec[] = [];

  // Main mark
  const mainMark: MarkSpec = {
    type: config.chartType, // 'line' or 'area'
    encode: {
      x: config.xAxis,
      y: config.yAxis,
      ...(config.color ? { color: config.color } : {}),
    },
    style: {
      shape: config.lineStyle === 'curve' ? 'smooth' : 'line',
      connect: true,
    },
  };

  // Labels
  if (config.dataLabel) {
    mainMark.labels = [{
      text: config.yAxis,
      overlapHide: true,
      ...(config.showAll ? {} : { selector: 'last' }),
    }];
  }

  marks.push(mainMark);

  // Optional point overlay
  if (config.points) {
    marks.push({
      type: 'point',
      encode: { x: config.xAxis, y: config.yAxis },
      tooltip: false,
    });
  }

  // Transforms
  const transforms: TransformSpec[] = [];
  if (config.chartType === 'area' && config.color) {
    transforms.push({ type: 'stackY' });
  }

  // Y scale domain
  const yDomain = config.yRange?.min != null && config.yRange?.max != null
    ? [config.yRange.min, config.yRange.max]
    : undefined;

  return {
    marks,
    transforms: transforms.length > 0 ? transforms : undefined,
    scales: {
      x: { type: 'time', ...(config.xFormat ? { mask: config.xFormat } : {}) },
      y: {
        type: 'linear',
        nice: true,
        ...(yDomain ? { domain: yDomain } : {}),
      },
    },
    temporal: config.temporal ? {
      mode: config.temporal.mode,
      field: config.temporal.field || config.xAxis,
      range: config.temporal.range,
    } : undefined,
    streaming: { maxItems: 1000 },
    axes: {
      x: { title: config.xTitle || false, grid: false },
      y: { title: config.yTitle || false, grid: config.gridlines ?? true },
    },
    legend: config.legend !== false ? { position: 'bottom', interactive: true } : false,
    theme: 'dark',
    animate: false,
  };
}

/**
 * Compile a BarColumnConfig into a VistralSpec.
 */
export function compileBarColumnConfig(config: BarColumnConfig): VistralSpec {
  const isBar = config.chartType === 'bar';

  const mainMark: MarkSpec = {
    type: 'interval',
    encode: {
      x: config.xAxis,
      y: config.yAxis,
      ...(config.color ? { color: config.color } : {}),
    },
  };

  if (config.dataLabel) {
    mainMark.labels = [{
      text: config.yAxis,
      overlapHide: true,
    }];
  }

  const transforms: TransformSpec[] = [];
  if (config.color) {
    transforms.push({
      type: config.groupType === 'stack' ? 'stackY' : 'dodgeX',
    });
  }

  return {
    marks: [mainMark],
    transforms: transforms.length > 0 ? transforms : undefined,
    coordinate: isBar ? { transforms: [{ type: 'transpose' }] } : undefined,
    scales: {
      x: { padding: 0.5 },
      y: {
        type: 'linear',
        nice: true,
      },
    },
    temporal: config.temporal ? {
      mode: config.temporal.mode,
      field: config.temporal.field,
      range: config.temporal.range,
    } : undefined,
    streaming: { maxItems: 1000 },
    axes: {
      x: { title: config.xTitle || false },
      y: { title: config.yTitle || false, grid: config.gridlines ?? true },
    },
    legend: config.legend !== false ? { position: 'bottom', interactive: true } : false,
    theme: 'dark',
    animate: false,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/core/compilers.test.ts`
Expected: PASS — all 12 tests green.

**Step 5: Commit**

```bash
git add src/core/compilers.ts src/__tests__/core/compilers.test.ts
git commit -m "feat: implement TimeSeriesConfig and BarColumnConfig compilers"
```

---

### Task 8: Implement BarColumnConfig Compiler Tests

**Files:**
- Modify: `src/__tests__/core/compilers.test.ts`

**Step 1: Add BarColumnConfig tests to the existing test file**

Append to `src/__tests__/core/compilers.test.ts`:

```typescript
import { compileBarColumnConfig } from '../../core/compilers';
import type { BarColumnConfig } from '../../types';

describe('compileBarColumnConfig', () => {
  const baseConfig: BarColumnConfig = {
    chartType: 'column',
    xAxis: 'category',
    yAxis: 'value',
  };

  it('should produce interval mark', () => {
    const spec = compileBarColumnConfig(baseConfig);
    expect(spec.marks[0].type).toBe('interval');
  });

  it('should add transpose for bar chart', () => {
    const spec = compileBarColumnConfig({ ...baseConfig, chartType: 'bar' });
    expect(spec.coordinate?.transforms).toContainEqual({ type: 'transpose' });
  });

  it('should not add transpose for column chart', () => {
    const spec = compileBarColumnConfig(baseConfig);
    expect(spec.coordinate).toBeUndefined();
  });

  it('should add stackY for stacked multi-series', () => {
    const spec = compileBarColumnConfig({ ...baseConfig, color: 'series', groupType: 'stack' });
    expect(spec.transforms).toContainEqual({ type: 'stackY' });
  });

  it('should add dodgeX for dodged multi-series', () => {
    const spec = compileBarColumnConfig({ ...baseConfig, color: 'series', groupType: 'dodge' });
    expect(spec.transforms).toContainEqual({ type: 'dodgeX' });
  });

  it('should map temporal config', () => {
    const config: BarColumnConfig = {
      ...baseConfig,
      temporal: { mode: 'key', field: 'ts' },
    };
    const spec = compileBarColumnConfig(config);
    expect(spec.temporal?.mode).toBe('key');
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/__tests__/core/compilers.test.ts`
Expected: PASS — all 18 tests green.

**Step 3: Commit**

```bash
git add src/__tests__/core/compilers.test.ts
git commit -m "test: add BarColumnConfig compiler tests"
```

---

### Task 9: Add Compiler Exports and Integration

**Files:**
- Modify: `src/core/index.ts`
- Modify: `src/index.ts`

**Step 1: Add exports**

Add to `src/core/index.ts`:

```typescript
export { compileTimeSeriesConfig, compileBarColumnConfig } from './compilers';
```

Add to `src/index.ts` in the core utilities section:

```typescript
// Spec Engine
export { buildG2Options, translateToG2Spec, applyTemporalTransforms } from './core';
export { compileTimeSeriesConfig, compileBarColumnConfig } from './core';
```

**Step 2: Run typecheck to verify**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add src/core/index.ts src/index.ts
git commit -m "feat: export spec engine and compilers from public API"
```

---

### Task 10: Build Verification

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds, `dist/` contains `index.js`, `index.esm.js`, `index.d.ts`.

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No TypeScript errors.

**Step 3: Run all tests**

Run: `npm test -- --run`
Expected: All tests pass.

**Step 4: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build and typecheck issues"
```

---

## Summary

This plan covers **Phase 1** (Foundation) and **Phase 2** (Config Compilers) of the design:

| Task | What it builds | Files created/modified |
|------|---------------|----------------------|
| 1 | VistralSpec type definitions | `src/types/spec.ts`, tests |
| 2 | Temporal transform injection | `src/core/spec-engine.ts`, tests |
| 3 | G2 spec translation | `src/core/spec-engine.ts`, tests |
| 4 | Theme integration | `src/core/spec-engine.ts`, tests |
| 5 | Full render pipeline (`buildG2Options`) | `src/core/spec-engine.ts`, tests |
| 6 | VistralChart React component | `src/charts/VistralChart.tsx`, tests |
| 7 | TimeSeriesConfig compiler | `src/core/compilers.ts`, tests |
| 8 | BarColumnConfig compiler tests | tests |
| 9 | Public API exports | `src/core/index.ts`, `src/index.ts` |
| 10 | Build verification | — |

Phase 3 (Extended Grammar) and Phase 4 (Composition) are deferred — they require no new architecture, only enabling more G2 mark/transform/coordinate/interaction types which the spec engine already supports via passthrough.
