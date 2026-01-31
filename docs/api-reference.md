# API Reference

## Configuration Reference

### TimeSeriesConfig (Line/Area)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chartType` | `'line' \| 'area'` | required | Chart type |
| `xAxis` | `string` | required | Time field name |
| `yAxis` | `string` | required | Value field name |
| `color` | `string` | - | Series grouping field |
| `xTitle` | `string` | - | X-axis title |
| `yTitle` | `string` | - | Y-axis title |
| `xRange` | `number \| 'Infinity'` | `'Infinity'` | Time range in minutes |
| `yRange` | `{ min?, max? }` | auto | Y-axis range |
| `dataLabel` | `boolean` | `false` | Show data labels |
| `legend` | `boolean` | `false` | Show legend |
| `gridlines` | `boolean` | `false` | Show gridlines |
| `points` | `boolean` | `false` | Show data points |
| `lineStyle` | `'curve' \| 'straight'` | `'curve'` | Line interpolation |
| `fractionDigits` | `number` | `2` | Decimal places |
| `unit` | `{ position, value }` | - | Unit prefix/suffix |
| `colors` | `string[]` | Dawn palette | Custom colors |

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
| `unit` | `{ position, value }` | - | Unit prefix/suffix |

### TableConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chartType` | `'table'` | required | Chart type |
| `tableStyles` | `Record<string, ColumnStyle>` | - | Per-column styling |
| `tableWrap` | `boolean` | `false` | Enable text wrapping |
| `updateMode` | `'all' \| 'key' \| 'time'` | `'all'` | Update strategy |
| `updateKey` | `string` | - | Key field for deduplication |

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
| `updateKey` | `string` | - | Key field for deduplication |
| `updateMode` | `'all' \| 'key' \| 'time'` | `'all'` | Update strategy |
| `showZoomControl` | `boolean` | `true` | Show zoom buttons |
| `showCenterDisplay` | `boolean` | `false` | Show center coordinates |
| `pointOpacity` | `number` | `0.8` | Point opacity (0-1) |
| `pointColor` | `string` | `'#3B82F6'` | Default point color |

## Hooks

### useStreamingData

Manage streaming data with automatic size limiting.

```tsx
const { data, append, replace, clear } = useStreamingData(initialData, maxItems);
```

### useChart

Access the underlying AntV G2 chart instance.

```tsx
const { chart, chartRef, isMouseOver, activeColor, setActiveColor } = useChart();
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
const { suggestedXAxis, suggestedYAxis, hasTimeSeries } = autoConfig();
```

## Utilities

```tsx
import {
  isNumericColumn,
  isDateTimeColumn,
  formatNumber,
  abbreviateNumber,
  getTimeMask,
  processDataSource,
} from '@timeplus/vistral';

// Type detection
isNumericColumn('float64'); // true
isDateTimeColumn('datetime64'); // true

// Formatting
formatNumber(1234567.89, 2); // "1,234,567.89"
abbreviateNumber(1500000); // "1.5m"

// Time format auto-detection
getTimeMask(startDate, endDate); // "HH:mm:ss" or "MM/DD" etc.
```
