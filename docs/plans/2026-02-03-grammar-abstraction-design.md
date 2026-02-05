# VistralSpec: Grammar Abstraction Layer Design

## Problem Statement

Vistral currently exposes ~20% of AntV G2's Grammar of Graphics through hardcoded chart-type-specific configs (`TimeSeriesConfig`, `BarColumnConfig`, etc.). Each config type has its own component that manually translates config fields to imperative G2 API calls. This creates several problems:

1. **Adding new chart types requires writing new components from scratch** — each with its own G2 translation logic, temporal handling, and theme integration.
2. **G2 grammar concepts are not composable** — users cannot combine marks, transforms, or coordinate systems in ways the predefined configs don't anticipate.
3. **Streaming extensions (temporal bounding, data windowing) are embedded in component logic** — not reusable across chart types.
4. **Only 4 of 28+ G2 mark types are supported** — no path to heatmaps, boxplots, radar charts, gauges, etc. without building each from scratch.

## Design Goals

1. **Define a `VistralSpec`** — a single, composable specification format that can describe any visualization Vistral supports.
2. **Make temporal bounding and streaming data management first-class grammar concepts** — not hooks or component-level concerns.
3. **Support two API levels** — high-level chart configs for common cases, grammar-level specs for power users. High-level configs compile down to `VistralSpec`.
4. **Cover the full G2 grammar** — all marks, scales, transforms, coordinates, compositions, and interactions that G2 supports should be expressible through `VistralSpec`.
5. **Maintain streaming performance** — the spec engine must handle high-frequency data updates without unnecessary re-renders.

## Non-Goals

- Replacing G2 as the rendering engine.
- Supporting non-G2 renderers (Canvas-based GeoChart and HTML DataTable remain separate for now).
- Backward-incompatible changes to existing high-level configs (they become thin wrappers).

---

## Architecture Overview

```
┌──────────────────────────────────────┐
│  High-Level API                      │
│  timeSeriesSpec(), barSpec(), etc.   │
│  (convenience builders)              │
└──────────┬───────────────────────────┘
           │ produces
┌──────────▼───────────────────────────┐
│  VistralSpec                         │
│  (grammar-level specification)       │
│  marks + encode + scale + transform  │
│  + coordinate + temporal + streaming │
└──────────┬───────────────────────────┘
           │ consumed by
┌──────────▼───────────────────────────┐
│  Spec Engine                         │
│  1. Apply streaming policy           │
│  2. Apply temporal filtering         │
│  3. Translate to G2 spec            │
│  4. Manage G2 lifecycle             │
└──────────┬───────────────────────────┘
           │ drives
┌──────────▼───────────────────────────┐
│  AntV G2 Runtime                     │
│  (rendering)                         │
└──────────────────────────────────────┘
```

The **Spec Engine** is the new core. It replaces the per-component G2 translation logic (`TimeSeriesChart.tsx`, `BarColumnChart.tsx`, etc.) with a single, general-purpose compiler from `VistralSpec` to G2.

---

## VistralSpec Definition

### Top-Level Structure

```typescript
interface VistralSpec {
  // --- Data Layer ---
  data?: DataSpec;
  streaming?: StreamingSpec;
  temporal?: TemporalSpec;

  // --- Visual Grammar ---
  marks: MarkSpec[];
  scales?: Record<string, ScaleSpec>;
  transforms?: TransformSpec[];
  coordinate?: CoordinateSpec;

  // --- Presentation ---
  axes?: AxesSpec;
  legend?: LegendSpec | false;
  tooltip?: TooltipSpec | false;
  theme?: 'dark' | 'light' | ThemeSpec;
  annotations?: AnnotationSpec[];

  // --- Behavior ---
  interactions?: InteractionSpec[];
  animate?: boolean;
}
```

Each section is described below.

---

### Data Layer

#### DataSpec

```typescript
interface DataSpec {
  /** Inline data rows. Each row is an array (positional) or object (named). */
  values?: unknown[][] | Record<string, unknown>[];

  /** Column schema. Required when values are arrays. */
  columns?: ColumnDefinition[];
}
```

Data is provided separately from the spec (via the `StreamChart` component's `source` prop, as today). The `DataSpec` in the spec itself is optional — it's useful for static charts or playground/testing scenarios.

#### StreamingSpec — First-Class Streaming

```typescript
interface StreamingSpec {
  /** Maximum number of data items to retain in memory. Default: 1000. */
  maxItems?: number;

  /**
   * How new data is incorporated.
   * - 'append': New rows are added to existing data (default).
   * - 'replace': New rows replace all existing data.
   */
  mode?: 'append' | 'replace';

  /**
   * Throttle rendering updates to at most once per interval (ms).
   * Prevents excessive re-renders during high-frequency ingestion.
   * Default: 0 (every update triggers render).
   */
  throttle?: number;
}
```

**Why first-class?** Currently `useStreamingData` is a hook that each component must wire up manually. By declaring streaming policy in the spec, the Spec Engine handles it uniformly. The component just calls `append(newData)` and the engine applies windowing, throttling, and re-rendering.

#### TemporalSpec — First-Class Temporal Bounding

```typescript
interface TemporalSpec {
  /**
   * Temporal bounding mode (see design-principles.md for full semantics):
   * - 'axis': Time mapped to an axis with sliding window.
   * - 'frame': Only latest timestamp visible (snapshot replacement).
   * - 'key': Latest value per unique key retained.
   */
  mode: 'axis' | 'frame' | 'key';

  /** The data field containing the temporal value. */
  field: string;

  /**
   * Axis-mode only. Visible time window size.
   * Number = minutes. 'Infinity' = show all data.
   * Default: 'Infinity'.
   */
  range?: number | 'Infinity';

  /**
   * Key-mode only. The data field that identifies unique entities.
   * Each unique value of this field retains only its latest row.
   */
  keyField?: string;
}
```

**Why first-class?** Temporal bounding is currently scattered across chart components (`TimeSeriesChart` handles axis mode, `BarColumnChart` handles frame/key modes via `filterByLatestTimestamp`/`filterByKey`). Centralizing it in the spec means:

1. Any chart type automatically gets temporal bounding support.
2. The filtering logic lives in the Spec Engine, not per component.
3. New temporal modes can be added without touching chart components.

**Interaction with StreamingSpec:** Temporal filtering is applied *after* streaming windowing. The pipeline is:

```
Raw data → StreamingSpec (maxItems cap) → TemporalSpec (mode filtering) → G2 render
```

---

### Visual Grammar

#### MarkSpec

A mark is the atomic visual element — the "what to draw" part of the grammar.

```typescript
interface MarkSpec {
  /**
   * The mark type. Supports all G2 5.x marks.
   *
   * Core: 'line' | 'area' | 'interval' | 'point' | 'rect' | 'cell' |
   *       'link' | 'polygon' | 'vector' | 'text' | 'image' | 'shape' |
   *       'box' | 'boxplot' | 'connector'
   *
   * Annotation: 'lineX' | 'lineY' | 'range' | 'rangeX' | 'rangeY'
   *
   * Specialized: 'density' | 'heatmap' | 'chord' | 'gauge' | 'liquid' |
   *              'sunburst' | 'wordCloud'
   *
   * Graph: 'forceGraph' | 'sankey' | 'tree' | 'treemap' | 'pack'
   *
   * Geo: 'geoPath' | 'geoView'
   */
  type: string;

  /** Data-to-visual-channel mappings for this mark. */
  encode?: EncodeSpec;

  /** Per-mark scale overrides (merged with top-level scales). */
  scales?: Record<string, ScaleSpec>;

  /** Per-mark transforms (applied after top-level transforms). */
  transforms?: TransformSpec[];

  /** Visual style properties. */
  style?: StyleSpec;

  /** Data labels on this mark. */
  labels?: LabelSpec[];

  /** Tooltip configuration for this mark. */
  tooltip?: MarkTooltipSpec | false;

  /** Animation override for this mark. */
  animate?: boolean;
}
```

**Key design decisions:**

1. **`type` is a string, not a union.** This allows G2 extensions and custom marks without modifying the type. The Spec Engine validates known types but passes unknown types through to G2.

2. **Each mark has its own encode/scale/transform.** This mirrors G2's per-mark configuration. Multiple marks in one spec can encode different fields differently (e.g., a line mark for trend + point mark for outliers).

3. **Top-level `scales` and `transforms` provide defaults.** Per-mark settings override them. This reduces repetition when multiple marks share the same encoding.

#### EncodeSpec

```typescript
interface EncodeSpec {
  /** X position channel. Field name or accessor. */
  x?: string | EncodeFn;

  /** Y position channel. */
  y?: string | EncodeFn;

  /** Color channel. Maps to fill/stroke depending on mark type. */
  color?: string | EncodeFn;

  /** Size channel (point radius, interval width, etc.). */
  size?: string | EncodeFn;

  /** Shape channel (point shape, line curve type, etc.). */
  shape?: string | EncodeFn;

  /** Opacity channel. */
  opacity?: string | EncodeFn;

  /** Series/group channel for multi-series charts. */
  series?: string | EncodeFn;

  /** Any additional G2 encoding channels. */
  [channel: string]: string | EncodeFn | undefined;
}

/** Accessor function for computed encodings. */
type EncodeFn = (datum: Record<string, unknown>) => unknown;
```

**Design note on field references:** Unlike the current system which uses array indices (`d[source.x.index]`), VistralSpec uses **field names** (`'timestamp'`). The Spec Engine handles the translation to G2's expected format based on whether data is array-based (with columns) or object-based.

#### ScaleSpec

```typescript
interface ScaleSpec {
  /**
   * Scale type. Supports all G2 scale types:
   * 'linear' | 'log' | 'pow' | 'sqrt' | 'time' |
   * 'ordinal' | 'band' | 'point' |
   * 'quantile' | 'quantize' | 'threshold' |
   * 'sequential'
   */
  type?: string;

  /** Explicit domain [min, max] or [category1, category2, ...]. */
  domain?: unknown[];

  /** Explicit range (output values). */
  range?: unknown[];

  /** Round output values to nice numbers. */
  nice?: boolean;

  /** Clamp values to domain. */
  clamp?: boolean;

  /** Padding for band/point scales. */
  padding?: number;

  /** Time format mask (for time scales). */
  mask?: string;

  /** Any additional G2 scale options. */
  [option: string]: unknown;
}
```

#### TransformSpec

```typescript
interface TransformSpec {
  /**
   * Transform type. Supports all G2 transforms:
   *
   * Layout: 'stackY' | 'dodgeX' | 'jitter' | 'jitterX' | 'jitterY' |
   *         'symmetryY' | 'normalizeY' | 'pack'
   *
   * Aggregation: 'bin' | 'binX' | 'group' | 'groupX' | 'groupY' |
   *              'groupColor' | 'groupN'
   *
   * Selection: 'select' | 'selectX' | 'selectY' | 'sample'
   *
   * Sorting: 'sort' | 'sortX' | 'sortY' | 'sortColor'
   *
   * Data: 'filter' | 'diffY' | 'flexX'
   */
  type: string;

  /** Transform-specific options. */
  [option: string]: unknown;
}
```

#### CoordinateSpec

```typescript
interface CoordinateSpec {
  /**
   * Coordinate type:
   * 'cartesian' | 'polar' | 'theta' | 'radial' | 'parallel' |
   * 'radar' | 'helix' | 'fisheye' | 'transpose'
   */
  type?: string;

  /** Coordinate transforms (e.g., transpose, reflect). */
  transforms?: Array<{ type: string; [option: string]: unknown }>;

  /** Any additional coordinate options. */
  [option: string]: unknown;
}
```

---

### Presentation

#### AxesSpec

```typescript
interface AxesSpec {
  x?: AxisChannelSpec | false;
  y?: AxisChannelSpec | false;
}

interface AxisChannelSpec {
  title?: string | false;
  grid?: boolean;
  line?: boolean;
  labels?: {
    /** Format function or format string. */
    format?: string | ((value: unknown) => string);
    /** Max characters before truncation. */
    maxLength?: number;
    /** Rotation angle in degrees. */
    rotate?: number;
  };
}
```

**Simplification vs G2:** G2's axis API has dozens of styling options (`lineStroke`, `labelFill`, `gridStroke`, `tickCount`, etc.). VistralSpec exposes semantic options (show/hide grid, title text, label formatting) and lets the theme handle visual styling. Power users can pass through G2 options via spread.

#### LegendSpec

```typescript
interface LegendSpec {
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Enable click-to-highlight series behavior. */
  interactive?: boolean;
}
```

#### TooltipSpec

```typescript
interface TooltipSpec {
  /** Title accessor or field name. */
  title?: string | ((datum: Record<string, unknown>) => string);
  /** Items to show. If omitted, auto-generated from encodings. */
  items?: TooltipItemSpec[];
}

interface TooltipItemSpec {
  field: string;
  name?: string;
  format?: (value: unknown) => string;
}
```

#### AnnotationSpec

```typescript
interface AnnotationSpec {
  /**
   * Annotation type. Implemented as G2 marks:
   * 'lineX' | 'lineY' | 'rangeX' | 'rangeY' | 'text' | 'image'
   */
  type: string;

  /** Position value(s) for the annotation. */
  value?: unknown;

  /** Visual style. */
  style?: StyleSpec;

  /** Label text for the annotation. */
  label?: string;
}
```

#### InteractionSpec

```typescript
interface InteractionSpec {
  /**
   * Interaction type. Supports all G2 interactions:
   * 'tooltip' | 'legendFilter' | 'legendHighlight' |
   * 'brushXFilter' | 'brushXHighlight' | 'brushYFilter' | 'brushYHighlight' |
   * 'brushFilter' | 'brushHighlight' | 'brushAxisHighlight' |
   * 'elementHighlight' | 'elementSelect' | 'elementHighlightByColor' |
   * 'elementSelectByColor' | 'elementHighlightByX' | 'elementSelectByX' |
   * 'fisheye' | 'sliderFilter' | 'scrollbarFilter'
   */
  type: string;

  /** Interaction-specific options. */
  [option: string]: unknown;
}
```

#### StyleSpec

```typescript
interface StyleSpec {
  fill?: string;
  stroke?: string;
  lineWidth?: number;
  opacity?: number;
  shape?: string;
  [property: string]: unknown;
}
```

---

## Spec Engine

The Spec Engine is the runtime that takes a `VistralSpec` and produces a rendered G2 chart. It replaces the per-component translation logic.

### Pipeline

```
VistralSpec
    │
    ▼
┌─────────────────────┐
│ 1. Validate         │  Type-check spec, warn on unknown types
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 2. Apply Streaming  │  Wire up maxItems, append/replace, throttle
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 3. Apply Temporal   │  Insert filter/dedupe transforms based on mode
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 4. Resolve Fields   │  Map field names → array indices (if array data)
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 5. Build G2 Spec    │  Translate VistralSpec → G2 options object
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 6. Apply Theme      │  Merge theme colors into G2 theme config
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 7. Render           │  chart.clear() → chart.options(g2Spec) → chart.render()
└─────────────────────┘
```

### Step 3: Temporal Transform Injection

The temporal spec is converted into G2 transforms that are prepended to the transform pipeline. This is the key mechanism that makes temporal bounding work for any mark type.

**Axis mode** inserts a filter transform:
```typescript
// temporal: { mode: 'axis', field: 'timestamp', range: 5 }
// Becomes:
{
  type: 'filter',
  callback: (d) => {
    const t = parseTime(d[field]);
    return t >= (now - range * 60000) && t <= now;
  }
}
```

Plus a sort transform to ensure chronological order:
```typescript
{ type: 'sortBy', fields: [field] }
```

**Frame mode** inserts a filter that keeps only the latest timestamp:
```typescript
// temporal: { mode: 'frame', field: 'timestamp' }
// Becomes:
{
  type: 'filter',
  callback: (d) => parseTime(d[field]) === maxTimestamp
}
```

**Key mode** inserts a deduplication transform (custom Vistral transform):
```typescript
// temporal: { mode: 'key', field: 'timestamp', keyField: 'device_id' }
// Becomes:
{
  type: 'vistral:deduplicateByKey',
  keyField: keyField,
  timeField: field
}
```

The `vistral:deduplicateByKey` is a custom transform registered with G2's extension mechanism. It keeps only the latest row per unique key value.

### Step 5: G2 Spec Translation

The translation maps VistralSpec concepts to G2's spec format:

| VistralSpec | G2 Spec |
|---|---|
| `marks[i].type` | `children[i].type` |
| `marks[i].encode.x` | `children[i].encode.x` (resolved to field accessor) |
| `marks[i].encode.color` | `children[i].encode.color` + `children[i].scale.color` |
| `scales.x` | `children[i].scale.x` (propagated to all marks) |
| `transforms` | `children[i].transform` (prepended to per-mark transforms) |
| `coordinate` | `coordinate` |
| `axes` | `axis` |
| `legend` | `legend` |
| `tooltip` | Interaction config + per-mark `.tooltip()` |
| `theme` | `theme` (resolved from Vistral theme definitions) |
| `annotations` | Additional `children` entries (marks used as annotations) |
| `interactions` | `interaction` |

---

## React Integration

### VistralChart Component

The primary React component that renders a `VistralSpec`:

```typescript
interface VistralChartProps {
  /** The visualization specification. */
  spec: VistralSpec;

  /** Streaming data source (columns + data). */
  source?: StreamDataSource;

  /** Chart dimensions. If omitted, auto-fits to container. */
  width?: number;
  height?: number;

  /** Callback when chart is ready. */
  onReady?: (chart: ChartHandle) => void;
}

interface ChartHandle {
  /** Append new data rows (streaming). */
  append: (rows: unknown[][] | Record<string, unknown>[]) => void;

  /** Replace all data. */
  replace: (rows: unknown[][] | Record<string, unknown>[]) => void;

  /** Clear all data. */
  clear: () => void;

  /** Access underlying G2 chart (escape hatch). */
  g2: Chart;
}
```

### Hooks

```typescript
/**
 * Hook version of VistralChart for custom rendering scenarios.
 * Returns a ref to attach to a container div and a chart handle.
 */
function useVistralChart(
  spec: VistralSpec,
  source?: StreamDataSource
): {
  ref: React.RefObject<HTMLDivElement>;
  chart: ChartHandle | null;
};
```

### StreamChart Backward Compatibility

The existing `StreamChart` component continues to work. Internally, it:

1. Takes a `ChartConfig` (TimeSeriesConfig, BarColumnConfig, etc.).
2. Calls a compiler function to produce a `VistralSpec`.
3. Passes the spec to the Spec Engine.

```typescript
// Conceptual implementation
function StreamChart({ config, source, ...props }) {
  const spec = compileConfig(config, source);
  return <VistralChart spec={spec} source={source} {...props} />;
}
```

The `compileConfig` function maps each config type to a VistralSpec:

```typescript
function compileConfig(config: ChartConfig, source: StreamDataSource): VistralSpec {
  switch (config.chartType) {
    case 'line':
    case 'area':
      return compileTimeSeriesConfig(config, source);
    case 'bar':
    case 'column':
      return compileBarColumnConfig(config, source);
    // ...
  }
}
```

---

## High-Level Config Compilers

Each existing config type gets a compiler that produces a `VistralSpec`. This replaces the imperative G2 code currently in each chart component.

### Example: TimeSeriesConfig Compiler

```typescript
function compileTimeSeriesConfig(config: TimeSeriesConfig, source: StreamDataSource): VistralSpec {
  const marks: MarkSpec[] = [];

  // Main mark
  marks.push({
    type: config.chartType,  // 'line' or 'area'
    encode: {
      x: config.xAxis,
      y: config.yAxis,
      ...(config.color ? { color: config.color } : {}),
    },
    style: {
      shape: config.lineStyle === 'curve' ? 'smooth' : 'line',
      connect: true,
    },
    labels: config.dataLabel ? [{
      text: config.yAxis,
      format: formatWithUnit(config.unit, config.fractionDigits),
      overlapHide: true,
      selector: config.showAll ? undefined : 'last',
    }] : [],
  });

  // Optional point overlay
  if (config.points) {
    marks.push({
      type: 'point',
      encode: { x: config.xAxis, y: config.yAxis },
      tooltip: false,
    });
  }

  // Stacking for area charts with series
  const transforms: TransformSpec[] = [];
  if (config.chartType === 'area' && config.color) {
    transforms.push({ type: 'stackY' });
  }

  return {
    marks,
    transforms,
    scales: {
      x: { type: 'time', mask: config.xFormat },
      y: {
        type: 'linear',
        ...(config.yRange ? { domain: [config.yRange.min, config.yRange.max] } : {}),
        nice: true,
      },
    },
    temporal: config.temporal ? {
      mode: config.temporal.mode,
      field: config.xAxis,
      range: config.temporal.range,
    } : undefined,
    streaming: { maxItems: 1000 },
    axes: {
      x: { title: config.xTitle || false, grid: false },
      y: { title: config.yTitle || false, grid: config.gridlines ?? true },
    },
    legend: config.legend !== false ? { position: 'bottom', interactive: true } : false,
    theme: config.theme || 'dark',
    animate: false,
  };
}
```

### Example: BarColumnConfig Compiler

```typescript
function compileBarColumnConfig(config: BarColumnConfig, source: StreamDataSource): VistralSpec {
  const isBar = config.chartType === 'bar';

  return {
    marks: [{
      type: 'interval',
      encode: {
        x: config.xAxis,
        y: config.yAxis,
        ...(config.color ? { color: config.color } : {}),
      },
      labels: config.dataLabel ? [{
        text: config.yAxis,
        format: formatWithUnit(config.unit, config.fractionDigits),
        overlapHide: true,
      }] : [],
    }],
    transforms: config.color ? [{
      type: config.groupType === 'stack' ? 'stackY' : 'dodgeX',
    }] : [],
    coordinate: isBar ? { transforms: [{ type: 'transpose' }] } : undefined,
    scales: {
      x: { padding: 0.5 },
      y: {
        type: 'linear',
        ...(config.yRange ? { domain: [config.yRange.min, config.yRange.max] } : {}),
        nice: true,
      },
    },
    temporal: config.temporal,
    streaming: { maxItems: 1000 },
    axes: {
      x: { title: config.xTitle || false },
      y: { title: config.yTitle || false, grid: config.gridlines ?? true },
    },
    legend: config.legend !== false ? { position: 'bottom', interactive: true } : false,
    theme: config.theme || 'dark',
    animate: false,
  };
}
```

---

## What This Unlocks

With the grammar layer in place, users can create visualizations that are impossible with today's fixed configs:

### 1. Radar Chart (new coordinate system)

```typescript
const spec: VistralSpec = {
  marks: [{ type: 'line', encode: { x: 'metric', y: 'value', color: 'server' } }],
  coordinate: { type: 'radar' },
  temporal: { mode: 'frame', field: 'timestamp' },
  streaming: { maxItems: 100 },
};
```

### 2. Heatmap with Streaming (new mark type)

```typescript
const spec: VistralSpec = {
  marks: [{ type: 'cell', encode: { x: 'hour', y: 'day', color: 'count' } }],
  scales: { color: { type: 'sequential', range: ['#eee', '#e00'] } },
  temporal: { mode: 'key', field: 'timestamp', keyField: 'hour_day' },
};
```

### 3. Multi-Mark Composition (line + annotation)

```typescript
const spec: VistralSpec = {
  marks: [
    { type: 'line', encode: { x: 'time', y: 'cpu' } },
    { type: 'lineY', style: { stroke: 'red', lineWidth: 2 }, encode: { y: () => 80 } },
    { type: 'text', encode: { x: () => 'max', y: () => 80 },
      style: { text: 'Alert threshold', fill: 'red' } },
  ],
  temporal: { mode: 'axis', field: 'time', range: 10 },
  streaming: { maxItems: 2000 },
};
```

### 4. Histogram with Live Binning (new transform)

```typescript
const spec: VistralSpec = {
  marks: [{ type: 'rect', encode: { x: 'latency', color: 'service' } }],
  transforms: [{ type: 'binX', thresholds: 20 }, { type: 'stackY' }],
  temporal: { mode: 'axis', field: 'timestamp', range: 1 },
};
```

### 5. Faceted Small Multiples (composition)

```typescript
const spec: VistralSpec = {
  marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
  facet: { type: 'rect', encode: { y: 'region' } },
  temporal: { mode: 'axis', field: 'time', range: 5 },
};
```

---

## Implementation Strategy

### Phase 1: Foundation

1. Define `VistralSpec` TypeScript types in `src/types/spec.ts`.
2. Implement the Spec Engine core (`src/core/spec-engine.ts`):
   - Spec validation
   - Temporal transform injection
   - G2 spec translation
   - G2 lifecycle management (create, update, destroy)
3. Implement `VistralChart` React component and `useVistralChart` hook.
4. Register custom Vistral transforms with G2 (e.g., `vistral:deduplicateByKey`).

### Phase 2: Config Compilers

5. Write compilers for existing config types:
   - `compileTimeSeriesConfig` → VistralSpec
   - `compileBarColumnConfig` → VistralSpec
   - `compileSingleValueConfig` → VistralSpec (sparkline portion)
6. Wire `StreamChart` to use compilers + Spec Engine internally.
7. Verify all existing examples/tests still pass.

### Phase 3: Extended Grammar

8. Enable mark types beyond the current 4 (cell, rect, text, box, density, etc.).
9. Enable coordinate systems beyond transpose (polar, theta, radial, radar, parallel).
10. Enable transforms beyond the current 4 (bin, group, jitter, normalizeY, etc.).
11. Enable advanced scales (log, pow, quantile, sequential).
12. Enable interactions beyond tooltip (brush, element highlight, slider).

### Phase 4: Composition

13. Add `facet` support (facetRect, facetCircle, repeatMatrix).
14. Add `layers` support (spaceLayer — multiple specs overlaid).
15. Add `views` support (spaceFlex — multiple specs side by side).

---

## Open Questions

1. **Animation strategy for streaming.** Currently all animations are disabled. Should the grammar allow opt-in animations for specific scenarios (e.g., bar chart value transitions in key-bound mode)?

2. **GeoChart integration.** The current GeoChart uses Canvas directly, not G2. Should it be migrated to G2's `geoPath`/`geoView` marks, or remain a special case?

3. **DataTable integration.** The DataTable is an HTML table with sparklines. Should it remain outside the grammar system, or should there be a `table` composition type?

4. **Custom transform registration.** Should users be able to register their own transforms (beyond Vistral's built-in ones)?

5. **Spec diffing for performance.** Should the engine diff the previous and current spec to avoid full chart rebuilds when only data changes?

---

## References

- [Vistral Design Principles — Temporal Binding](../design-principles.md)
- [AntV G2 Documentation](https://g2.antv.antgroup.com/en/)
- [G2 5.0 Spec (Observable)](https://observablehq.com/@antv/g2-spec)
- [G2 GitHub — Marks](https://github.com/antvis/G2/tree/v5/src/mark)
- [G2 GitHub — Transforms](https://github.com/antvis/G2/tree/v5/src/transform)
- [G2 GitHub — Coordinates](https://github.com/antvis/G2/tree/v5/src/coordinate)
- [G2 GitHub — Interactions](https://github.com/antvis/G2/tree/v5/src/interaction)
- [G2 GitHub — Compositions](https://github.com/antvis/G2/tree/v5/src/composition)
