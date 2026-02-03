# API Reference

Vistral provides two API levels:

1. **Grammar API** (`VistralSpec` + `VistralChart`) — composable, low-level, full control over marks, scales, transforms, coordinates, and streaming behavior.
2. **Chart Config API** (`TimeSeriesConfig`, `BarColumnConfig`, etc. + `StreamChart`) — high-level, opinionated presets that compile down to VistralSpec internally.

---

## Grammar API

### VistralSpec

The core specification type. Every visualization in Vistral is described by a `VistralSpec`.

```tsx
import { VistralChart, type VistralSpec } from '@timeplus/vistral';

const spec: VistralSpec = {
  marks: [{ type: 'line', encode: { x: 'time', y: 'value' } }],
  scales: { x: { type: 'time' }, y: { type: 'linear', nice: true } },
  temporal: { mode: 'axis', field: 'time', range: 5 },
  streaming: { maxItems: 2000 },
  theme: 'dark',
  animate: false,
};

<VistralChart spec={spec} source={dataSource} height={400} />
```

#### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `marks` | `MarkSpec[]` | **Required.** Visual marks to render (line, area, interval, point, cell, rect, text, etc.) |
| `scales` | `Record<string, ScaleSpec>` | Scale configs shared across all marks. Per-mark scales override these. |
| `transforms` | `TransformSpec[]` | Transforms applied to all marks (stackY, dodgeX, bin, group, etc.) |
| `coordinate` | `CoordinateSpec` | Coordinate system (cartesian, polar, theta, radar, transpose, etc.) |
| `streaming` | `StreamingSpec` | Streaming data management (maxItems, append/replace mode, throttle) |
| `temporal` | `TemporalSpec` | Temporal bounding (axis sliding window, frame snapshot, key deduplication) |
| `axes` | `AxesSpec` | X/Y axis configuration (title, grid, labels) |
| `legend` | `LegendSpec \| false` | Legend configuration or false to hide |
| `tooltip` | `TooltipSpec \| false` | Tooltip configuration or false to hide |
| `annotations` | `AnnotationSpec[]` | Reference lines, ranges, text annotations |
| `interactions` | `InteractionSpec[]` | Interactions (tooltip, brush, element highlight, etc.) |
| `theme` | `'dark' \| 'light'` | Theme. Default: `'dark'` |
| `animate` | `boolean` | Enable/disable animations. Default: `false` for streaming |

### MarkSpec

A mark is an atomic visual element — what to draw.

```tsx
{
  type: 'line',                         // Any G2 5.x mark type
  encode: { x: 'time', y: 'value', color: 'series' },
  scales: { y: { type: 'log' } },      // Per-mark scale overrides
  transforms: [{ type: 'stackY' }],    // Per-mark transforms
  style: { shape: 'smooth', opacity: 0.8 },
  labels: [{ text: 'value', overlapHide: true }],
  tooltip: { title: 'time', items: [{ field: 'value' }] },
  animate: false,
}
```

**Supported mark types:** `line`, `area`, `interval`, `point`, `rect`, `cell`, `link`, `polygon`, `vector`, `text`, `image`, `shape`, `box`, `boxplot`, `connector`, `lineX`, `lineY`, `range`, `rangeX`, `rangeY`, `density`, `heatmap`, `chord`, `gauge`, `liquid`, `sunburst`, `wordCloud`, `forceGraph`, `sankey`, `tree`, `treemap`, `pack`, `geoPath`, `geoView`

### StreamingSpec

Controls how streaming data is managed.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxItems` | `number` | `1000` | Maximum data rows retained in memory |
| `mode` | `'append' \| 'replace'` | `'append'` | How new data is incorporated |
| `throttle` | `number` | `0` | Minimum ms between render updates |

### TemporalSpec

Controls temporal bounding — how time governs data lifecycle on the canvas.

| Property | Type | Description |
|----------|------|-------------|
| `mode` | `'axis' \| 'frame' \| 'key'` | **Required.** Temporal binding mode |
| `field` | `string` | **Required.** Data field containing the temporal value |
| `range` | `number \| 'Infinity'` | Axis-mode only. Time window in minutes |
| `keyField` | `string` | Key-mode only. Field identifying unique entities |

### ScaleSpec

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | `'linear'`, `'log'`, `'pow'`, `'sqrt'`, `'time'`, `'ordinal'`, `'band'`, `'point'`, `'quantile'`, `'quantize'`, `'threshold'`, `'sequential'` |
| `domain` | `unknown[]` | Explicit domain |
| `range` | `unknown[]` | Explicit range |
| `nice` | `boolean` | Round to nice numbers |
| `clamp` | `boolean` | Clamp values to domain |
| `padding` | `number` | Padding for band/point scales |
| `mask` | `string` | Time format mask (time scales) |

### CoordinateSpec

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | `'cartesian'`, `'polar'`, `'theta'`, `'radial'`, `'parallel'`, `'radar'`, `'helix'`, `'fisheye'` |
| `transforms` | `Array<{type: string}>` | Coordinate transforms, e.g. `[{ type: 'transpose' }]` |

### VistralChart Component

```tsx
import { VistralChart, type ChartHandle } from '@timeplus/vistral';

const ref = useRef<ChartHandle>(null);

<VistralChart
  ref={ref}
  spec={spec}
  source={dataSource}
  height={400}
  onReady={(handle) => {
    // handle.append(newRows)
    // handle.replace(allRows)
    // handle.clear()
    // handle.g2 — underlying G2 instance
  }}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `spec` | `VistralSpec` | **Required.** The visualization specification |
| `source` | `StreamDataSource` | Initial/declarative data source |
| `width` | `number` | Explicit width in pixels (defaults to 100% of container) |
| `height` | `number` | Explicit height in pixels (defaults to 100% of container) |
| `className` | `string` | CSS class for wrapper div |
| `style` | `CSSProperties` | Inline styles for wrapper div |
| `onReady` | `(handle: ChartHandle) => void` | Called when chart is ready |

### ChartHandle (ref)

| Method | Description |
|--------|-------------|
| `append(rows)` | Add rows to data buffer, re-render |
| `replace(rows)` | Replace all data, re-render |
| `clear()` | Empty data buffer, re-render |
| `g2` | Direct access to G2 Chart instance |

### Config Compilers

Convert high-level configs to VistralSpec:

```tsx
import { compileTimeSeriesConfig, compileBarColumnConfig } from '@timeplus/vistral';

const spec = compileTimeSeriesConfig({
  chartType: 'line',
  xAxis: 'timestamp',
  yAxis: 'value',
  color: 'series',
  lineStyle: 'curve',
  temporal: { mode: 'axis', field: 'timestamp', range: 5 },
});
// spec is a VistralSpec — can be further customized before rendering
```

### Spec Engine

For advanced use, the spec engine functions are exported:

```tsx
import { buildG2Options, translateToG2Spec, applyTemporalTransforms } from '@timeplus/vistral';

// Full pipeline: VistralSpec + data → G2 options
const g2Options = buildG2Options(spec, data);

// Individual steps
const specWithTemporal = applyTemporalTransforms(spec, data);
const g2Spec = translateToG2Spec(specWithTemporal);
```

---

## Temporal Configuration

All chart types support a unified `temporal` configuration for handling streaming data:

### TemporalConfig

| Property | Type | Description |
|----------|------|-------------|
| `mode` | `'axis' \| 'frame' \| 'key'` | Temporal binding mode |
| `field` | `string` | Field name for temporal binding |
| `range` | `number \| 'Infinity'` | Time range in minutes (axis mode only) |

### Temporal Modes

| Mode | Description | Supported Charts |
|------|-------------|------------------|
| `axis` | Sliding time window on X-axis | Line, Area |
| `frame` | Filter to latest timestamp only | Table, Bar, Column, Geo |
| `key` | Keep latest value per unique key | Table, Bar, Column, Geo |

**Example:**
```tsx
// Axis-bound: 5-minute sliding window
temporal: { mode: 'axis', field: 'timestamp', range: 5 }

// Frame-bound: show only latest timestamp
temporal: { mode: 'frame', field: 'timestamp' }

// Key-bound: deduplicate by ID
temporal: { mode: 'key', field: 'id' }
```

---

## Chart Configuration Reference

### ChartConfigBase

All chart configs extend this base:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chartType` | `string` | required | Chart type identifier |
| `colors` | `string[]` | Dawn palette | Custom color palette |
| `temporal` | `TemporalConfig` | - | Temporal binding configuration |

### TimeSeriesConfig (Line/Area)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chartType` | `'line' \| 'area'` | required | Chart type |
| `xAxis` | `string` | required | Time field name |
| `yAxis` | `string` | required | Value field name |
| `color` | `string` | - | Series grouping field |
| `xTitle` | `string` | - | X-axis title |
| `yTitle` | `string` | - | Y-axis title |
| `yRange` | `{ min?, max? }` | auto | Y-axis range |
| `dataLabel` | `boolean` | `false` | Show data labels |
| `showAll` | `boolean` | `false` | Show all labels or just last |
| `legend` | `boolean` | `false` | Show legend |
| `gridlines` | `boolean` | `false` | Show gridlines |
| `points` | `boolean` | `false` | Show data points |
| `lineStyle` | `'curve' \| 'straight'` | `'curve'` | Line interpolation |
| `fractionDigits` | `number` | `2` | Decimal places |
| `unit` | `{ position, value }` | - | Unit prefix/suffix |
| `xFormat` | `string` | auto | X-axis date format mask |
| `yTickLabel` | `{ maxChar }` | `25` | Y-axis label max characters |

**Temporal Usage:** Use `temporal.mode: 'axis'` with `temporal.range` for sliding time windows.

### BarColumnConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chartType` | `'bar' \| 'column'` | required | Chart type |
| `xAxis` | `string` | required | Category field |
| `yAxis` | `string` | required | Value field |
| `color` | `string` | - | Grouping field |
| `groupType` | `'stack' \| 'dodge'` | `'stack'` | Multi-series layout |
| `xTitle` | `string` | - | X-axis title |
| `yTitle` | `string` | - | Y-axis title |
| `dataLabel` | `boolean` | `false` | Show data labels |
| `legend` | `boolean` | `false` | Show legend |
| `gridlines` | `boolean` | `false` | Show gridlines |
| `fractionDigits` | `number` | `2` | Decimal places |
| `unit` | `{ position, value }` | - | Unit prefix/suffix |
| `xTickLabel` | `{ maxChar }` | `10` | X-axis label max characters |
| `yTickLabel` | `{ maxChar }` | `25` | Y-axis label max characters |

**Temporal Usage:** Use `temporal.mode: 'frame'` or `temporal.mode: 'key'` for streaming data.

### SingleValueConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chartType` | `'singleValue'` | required | Chart type |
| `yAxis` | `string` | required | Value field |
| `fontSize` | `number` | `64` | Font size in pixels |
| `color` | `string` | `'blue'` | Color palette name |
| `fractionDigits` | `number` | `2` | Decimal places |
| `sparkline` | `boolean` | `false` | Show sparkline |
| `sparklineColor` | `string` | `'purple'` | Sparkline color |
| `delta` | `boolean` | `false` | Show change indicator |
| `increaseColor` | `string` | `'green'` | Color for positive changes |
| `decreaseColor` | `string` | `'red'` | Color for negative changes |
| `unit` | `{ position, value }` | - | Unit prefix/suffix |

**Note:** SingleValue implicitly uses the latest value (key-bound behavior).

### TableConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chartType` | `'table'` | required | Chart type |
| `tableStyles` | `Record<string, ColumnStyle>` | - | Per-column styling |
| `tableWrap` | `boolean` | `false` | Enable text wrapping |

**ColumnStyle Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Display name for column header |
| `show` | `boolean` | Whether to show this column |
| `width` | `number` | Column width in pixels |
| `miniChart` | `'none' \| 'sparkline'` | Show mini chart in cells |
| `color` | `ColorConfig` | Conditional coloring |

**Temporal Usage:** Use `temporal.mode: 'key'` for deduplication or `temporal.mode: 'frame'` for latest snapshot.

### GeoChartConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chartType` | `'geo'` | required | Chart type |
| `latitude` | `string` | required | Latitude field name |
| `longitude` | `string` | required | Longitude field name |
| `color` | `string` | - | Color grouping field |
| `size` | `{ key?, min?, max? }` | - | Point size configuration |
| `center` | `[number, number]` | auto | Initial center [lat, lng] |
| `zoom` | `number` | `2` | Initial zoom level (1-18) |
| `tileProvider` | `string` | `'cartodb-dark'` | Map tile provider |
| `showZoomControl` | `boolean` | `true` | Show zoom buttons |
| `showCenterDisplay` | `boolean` | `false` | Show center coordinates |
| `pointOpacity` | `number` | `0.8` | Point opacity (0-1) |
| `pointColor` | `string` | `'#3B82F6'` | Default point color |

**Tile Providers:** `'openstreetmap'`, `'cartodb-dark'`, `'cartodb-light'`

**Temporal Usage:** Use `temporal.mode: 'key'` for tracking entities or `temporal.mode: 'frame'` for snapshots.

---

## Hooks

### useStreamingData

Manage streaming data with automatic size limiting.

```tsx
const { data, append, replace, clear } = useStreamingData<T>(initialData, maxItems);
```

| Return | Type | Description |
|--------|------|-------------|
| `data` | `T[]` | Current data array |
| `append` | `(items: T[]) => void` | Add items to end |
| `replace` | `(items: T[]) => void` | Replace all data |
| `clear` | `() => void` | Clear all data |

**Note:** `append` treats arrays as multiple items. Wrap single row: `append([[row]])` not `append([row])`.

### useChart

Access the underlying AntV G2 chart instance.

```tsx
const { chart, chartRef, isMouseOver, activeColor, setActiveColor } = useChart(options);
```

### useDataSource

Process raw data into chart-ready format.

```tsx
const processedData = useDataSource(source, xKey, yKey, colorKey);
```

### useChartTheme

Manage theme state.

```tsx
const { theme, setTheme, toggleTheme, isDark } = useChartTheme('dark');
```

### useAutoConfig

Auto-detect suitable chart configuration from data schema.

```tsx
const autoConfig = useAutoConfig(columns);
```

### useSparklineData

Track value history for sparkline rendering.

```tsx
const sparklineValues = useSparklineData(currentValue, maxHistory);
```

---

## Utilities

### Type Detection

```tsx
import { isNumericColumn, isDateTimeColumn, isStringColumn } from '@timeplus/vistral';

isNumericColumn('float64');     // true
isDateTimeColumn('datetime64'); // true
isStringColumn('varchar');      // true
```

### Formatting

```tsx
import { formatNumber, abbreviateNumber, formatDuration, formatBytes } from '@timeplus/vistral';

formatNumber(1234567.89, 2);  // "1,234,567.89"
abbreviateNumber(1500000);    // "1.5m"
formatDuration(125000);       // "2.1m"
formatBytes(1536000);         // "1.46 MB"
```

### Temporal Utilities

```tsx
import { applyTemporalFilter, filterByLatestTimestamp, filterByKey } from '@timeplus/vistral';

// Filter to latest timestamp rows
const latestRows = filterByLatestTimestamp(data, timeFieldIndex);

// Keep latest row per key
const deduplicated = filterByKey(data, keyFieldIndex);

// Apply temporal config
const filtered = applyTemporalFilter(data, columns, { mode: 'frame', field: 'timestamp' });
```

### Data Processing

```tsx
import { processDataSource, rowToArray, findColumnIndex } from '@timeplus/vistral';

// Process data source for chart consumption
const processed = processDataSource(source, xKey, yKey, colorKey);

// Convert row object to array
const rowArray = rowToArray(rowObject, columns);

// Find column index by name
const index = findColumnIndex(columns, 'timestamp');
```

---

## Themes

### Built-in Themes

```tsx
import { darkTheme, lightTheme, getTheme } from '@timeplus/vistral';

const theme = getTheme('dark'); // or 'light'
```

### Color Palettes

```tsx
import { multiColorPalettes, singleColorPalettes, findPaletteByLabel } from '@timeplus/vistral';

// Multi-color: 'Dawn', 'Morning', 'Midnight', 'Ocean', 'Sunset'
// Single-color: 'red', 'pink', 'purple', 'blue', 'green', 'orange', 'yellow', 'cyan', 'gray'

const palette = findPaletteByLabel('Ocean');
// { label: 'Ocean', values: [...], keyColor: 0, keyColorValue: '...' }
```
