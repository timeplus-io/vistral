# API Reference

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
