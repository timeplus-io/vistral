---
name: vistral
description: Use when building React streaming data visualizations with @timeplus/vistral — creating charts, writing VistralSpec, using VistralChart, configuring streaming data sources, or wiring up live data via ChartHandle.
---

# Vistral — Streaming Data Visualization

## Overview

`@timeplus/vistral` is a React library for real-time streaming charts built on AntV G2. Two APIs exist — pick the right one before writing any code.

## Which API to Use

```
Need custom marks / full G2 control?
  → Grammar API: VistralChart + VistralSpec

Want a quick chart with minimal config?
  → Config API: StreamChart + TimeSeriesConfig / BarColumnConfig / etc.
```

**AI agents should default to the Grammar API** — it's more expressive and maps cleanly to spec-driven generation.

---

## Grammar API (VistralChart + VistralSpec)

### Component

```tsx
import { VistralChart, type ChartHandle } from '@timeplus/vistral';
import type { VistralSpec } from '@timeplus/vistral';

const ref = useRef<ChartHandle>(null);

<VistralChart
  ref={ref}
  spec={spec}
  source={dataSource}   // optional: declarative initial data
  height={400}
  theme="dark"          // 'dark' | 'light' — prop on VistralChart
  onReady={(handle) => {
    handle.append(rows);   // add rows, re-render
    handle.replace(rows);  // replace all data, re-render
    handle.clear();        // empty buffer, re-render
    handle.g2;             // raw G2 instance
  }}
/>
```

### VistralSpec Fields

| Field | Type | Description |
|-------|------|-------------|
| `marks` | `MarkSpec[]` | **Required.** Visual elements: `line`, `area`, `interval`, `point`, `rect`, `text`, etc. |
| `scales` | `Record<string, ScaleSpec>` | Scale config per channel (`x`, `y`, `color`). Per-mark scales override. |
| `transforms` | `TransformSpec[]` | Visual transforms: `stackY`, `dodgeX`, `bin`, `group` |
| `temporal` | `TemporalSpec` | Streaming time control (see below) |
| `streaming` | `StreamingSpec` | `maxItems`, `mode`, `throttle` |
| `axes` | `AxesSpec` | `{ x?, y? }` — title, grid, label format/rotate |
| `legend` | `LegendSpec \| false` | `{ position?, interactive? }` or `false` to hide |
| `tooltip` | `TooltipSpec \| false` | `{ title?, items[] }` — `items[].format` maps to G2 `valueFormatter` |
| `coordinate` | `CoordinateSpec` | `polar`, `theta`, `transpose`, etc. |
| `annotations` | `AnnotationSpec[]` | Reference lines, ranges, text overlays |
| `interactions` | `InteractionSpec[]` | `{ type: 'tooltip' \| 'brush' \| ... }` |
| `theme` | `'dark' \| 'light'` | Spec-level theme (overridden by component prop) |
| `animate` | `boolean` | Disable for streaming: `animate: false` |
| `g2Overrides` | `Record<string, unknown>` | Raw G2 options deep-merged last — override anything |

### Common Mark Pattern

```tsx
const spec: VistralSpec = {
  marks: [{
    type: 'line',
    encode: { x: 'time', y: 'value', color: 'series' },
    scales: { x: { type: 'time' } },
    style: { shape: 'smooth' },
  }],
  temporal: { mode: 'axis', field: 'time', range: 5 },
  axes: {
    y: { labels: { format: (v) => `${Number(v).toFixed(1)}` } }
  },
  tooltip: {
    items: [{ field: 'value', name: 'Value', format: (v) => `${v}` }]
  },
  animate: false,
  theme: 'dark',
};
```

### Temporal Modes

| Mode | When to use | Key fields |
|------|-------------|------------|
| `axis` | Sliding time window on X | `field: 'time'`, `range: 5` (minutes) |
| `frame` | Latest timestamp only | `field: 'time'` |
| `key` | Latest value per entity | `field: 'id'` or `field: ['region','server']` |

### g2Overrides — Escape Hatch

Use for any G2 option not modeled by VistralSpec:

```tsx
g2Overrides: {
  axis: { y: { tickCount: 5 } },         // tick count
  paddingLeft: 60,                         // view padding
  tooltip: {                               // raw G2 tooltip
    items: [{ channel: 'y', valueFormatter: (v) => formatBps(v) }]
  }
}
```

---

## StreamDataSource Format

```tsx
import type { StreamDataSource } from '@timeplus/vistral';

const source: StreamDataSource = {
  columns: [
    { name: 'time',   type: 'datetime64' },
    { name: 'value',  type: 'float64' },
    { name: 'series', type: 'string' },
  ],
  data: [
    { time: '2024-01-01T00:00:00Z', value: 42.5, series: 'A' },  // object rows
    // OR array rows (must match column order):
    // ['2024-01-01T00:00:00Z', 42.5, 'A'],
  ],
};
```

**Column types:** `string`, `number`, `datetime`, `datetime64`, `float32`, `float64`, `int32`, `int64`, `boolean`

---

## Streaming Pattern (Grammar API)

```tsx
function LiveChart() {
  const handleRef = useRef<ChartHandle>(null);
  const loadedRef = useRef(false);  // ← REQUIRED: React 18 Strict Mode guard

  useEffect(() => {
    if (!loadedRef.current && handleRef.current) {
      loadedRef.current = true;
      handleRef.current.append(historicalRows);  // seed history once
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      handleRef.current?.append(newRows);  // push live rows
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <VistralChart ref={handleRef} spec={spec} height={400} theme="dark" />;
}

// Note: use `ref` for ongoing appends, `onReady` for one-time setup.
// Do NOT duplicate seeding in both — use loadedRef to guard whichever you choose.
```

---

## Config API (StreamChart) — Quick Reference

```tsx
import { StreamChart, useStreamingData } from '@timeplus/vistral';
import type { TimeSeriesConfig, StreamDataSource } from '@timeplus/vistral';

function QuickChart() {
  // useStreamingData<ElementType> — generic is the ROW type, not array
  const { data, append } = useStreamingData<Record<string, unknown>>([], 1000);

  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'time',
    yAxis: 'value',
    color: 'series',
    lineStyle: 'curve',
    legend: true,
    temporal: { mode: 'axis', field: 'time', range: 5 },
  };

  // StreamChart has NO ref/ChartHandle (use VistralChart for imperative control)
  return <StreamChart config={config} data={{ columns, data }} theme="dark" />;
}
```

---

## Critical Gotchas

| Mistake | Fix |
|---------|-----|
| `useStreamingData<Row[]>` (wrong generic) | Use `useStreamingData<Row>` — element type, not array |
| `<StreamChart ref={...}>` | `StreamChart` has NO ref/ChartHandle. Use `VistralChart` for imperative append/replace/clear. |
| `append([singleRow])` when row is already an array | Wrap: `append([[singleRow]])` — `append` treats top-level array as multiple items |
| No `loadedRef` guard when seeding history | React 18 Strict Mode runs effects twice → doubled rows |
| `tooltip.items[].format` not working | `format` IS supported — translated to G2's `valueFormatter` internally (v0.1.6+). Use `g2Overrides.tooltip` only for raw G2 tooltip features beyond what `TooltipSpec` models. |
| `legend.interactive` silently ignored | Use `legend: { interactive: true }` — now translated correctly |

---

## Axis Label Formatting

```tsx
axes: {
  y: {
    title: 'Throughput',
    labels: {
      format: (v) => {
        const n = Number(v);
        if (n >= 1e9) return `${(n/1e9).toFixed(1)} Gbps`;
        if (n >= 1e6) return `${(n/1e6).toFixed(1)} Mbps`;
        if (n >= 1e3) return `${(n/1e3).toFixed(1)} Kbps`;
        return `${n.toFixed(0)} bps`;
      }
    }
  }
}
```
