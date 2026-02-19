# Design: Unify Sample Data via dataGenerators

**Date:** 2026-02-18
**Status:** Approved

## Goal

All sample data in `basic-examples.tsx` and `grammar-examples.tsx` must come from
`dataGenerators` in `data-utils.ts`. No example component should contain its own
inline data generation logic or a local copy of `generateNextValue`.

## DataGenerator Interface Change

Add an optional `historyCount` parameter to `generate()`:

```typescript
export interface DataGenerator {
  name: string;
  description?: string;
  columns: Column[];
  generate: (historyCount?: number) => Record<string, unknown>[];
  interval: number;
}
```

- `generate()` — returns the current frame (existing behavior, interval-aligned timestamp = now)
- `generate(N)` — returns N past frames with timestamps backdated by `interval` each
  (`now - N*interval`, `now - (N-1)*interval`, …, `now`)

Historical rows are returned synchronously so charts render fully pre-populated from
frame 0. Streaming then begins on the regular interval.

### generateNextValue helper

The private `generateNextValue` helper in `data-utils.ts` must be exported so that
any generator implementation (and nothing else) can use it. Both `basic-examples.tsx`
and `grammar-examples.tsx` currently define their own copies — those are removed.

## Generator Inventory

### Existing (6) — extend with `historyCount` support

| Key | Data |
|---|---|
| `metrics` | Server CPU/memory/requests (4 servers) |
| `sensors` | IoT temperature/humidity (4 locations) |
| `revenue` | Quarterly revenue by product |
| `sales` | Yearly sales by category |
| `logs` | Application log entries |
| `vehicles` | Vehicle GPS tracking |

### New (11)

| Key | Data | Used by |
|---|---|---|
| `cpuLoad` | Single server CPU % over time | BasicLineChart, AxisBoundLineChart, GrammarLineChart, GrammarCompiledChart, GrammarTimeSeriesBar |
| `apiTraffic` | requests / errors / timeouts (3 series) | GrammarStackedArea, GrammarMultiMark |
| `globalEvents` | Geo points scattered worldwide (lat/lng/value/category) | StreamingGeoChart |
| `productInventory` | Stock levels for store products (Widgets/Gadgets/Gizmos/Doodads) | FrameBoundBarChart, GrammarBarChart |
| `serviceLoad` | Per-service request counts (API/Auth/DB/Cache/Worker/Gateway) | GrammarRoseChart |
| `httpResponses` | HTTP status code distribution (200/301/404/500/503) | GrammarDonutChart |
| `cloudRegions` | Latency/throughput/connections by cloud region | GrammarRadialBar, GrammarScatterChart |
| `serverProfile` | Multi-dimension server health (CPU/Memory/Disk/Network/Latency, 2 servers) | GrammarRadarChart |
| `datacenterLoad` | Hour-of-day × day-of-week CPU load grid | GrammarHeatmap |
| `stockCandles` | OHLC price candles for a single symbol | GrammarCandlestickChart |
| `activeUsers` | Live active user count (single integer) | SingleValueWithSparkline |

## Usage Pattern in Examples

### Streaming (basic-examples.tsx)

```tsx
const { data, append } = useStreamingData([], 240);

useEffect(() => {
  append(dataGenerators.sensors.generate(30)); // pre-populate history
  const id = setInterval(() => {
    append(dataGenerators.sensors.generate());
  }, dataGenerators.sensors.interval);
  return () => clearInterval(id);
}, []);
```

### Grammar append path (grammar-examples.tsx)

```tsx
const loadedRef = useRef(false);

useEffect(() => {
  if (!loadedRef.current && handleRef.current) {
    loadedRef.current = true;
    handleRef.current.append(dataGenerators.cpuLoad.generate(40));
  }
  const id = setInterval(() => {
    handleRef.current?.append(dataGenerators.cpuLoad.generate());
  }, dataGenerators.cpuLoad.interval);
  return () => clearInterval(id);
}, []);
```

### Frame-bound (replace pattern)

```tsx
useEffect(() => {
  handleRef.current?.replace(dataGenerators.productInventory.generate());
  const id = setInterval(() => {
    handleRef.current?.replace(dataGenerators.productInventory.generate());
  }, dataGenerators.productInventory.interval);
  return () => clearInterval(id);
}, []);
```

## Files Changed

1. `examples/data-utils.ts` — export `generateNextValue`; add `historyCount` to all existing generators; add 11 new generators
2. `examples/basic-examples.tsx` — remove local `generateNextValue`; switch all inline data generation to `dataGenerators`
3. `examples/grammar-examples.tsx` — remove local `generateNextValue`; switch all inline data generation to `dataGenerators`
4. `examples/example-sources.ts` — update source code display strings to match

## Out of Scope

- Playground components (`Playground.tsx`, `GrammarPlayground.tsx`) — these are interactive tools that let users pick generators; they already use `dataGenerators` and are not affected
- `example-sources.ts` source strings for non-generator examples (Single Value, Metrics Dashboard, etc.) — updated to reflect new patterns
