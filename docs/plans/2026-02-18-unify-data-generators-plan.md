# Unify Data Generators Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** All sample data in `basic-examples.tsx` and `grammar-examples.tsx` must come from `dataGenerators` in `data-utils.ts` — no example component should contain its own inline data generation logic or a local copy of `generateNextValue`.

**Architecture:** Add an optional `historyCount` parameter to `generate()` that returns N backdated frames synchronously for chart pre-population. Export `generateNextValue` so generator implementations can use it internally. Migrate all examples to use the unified generators.

**Tech Stack:** TypeScript, React, Vite (examples dev server), `npm run test` for Vitest tests.

---

## Task 1: Export `generateNextValue` and add `historyCount` to existing generators

**Files:**
- Modify: `examples/data-utils.ts`

### Step 1: Update the `DataGenerator` interface and export `generateNextValue`

Change the `generate` signature and export the helper:

```typescript
export const generateNextValue = (current: number, min: number, max: number, volatility: number = 0.1): number => {
    const change = (Math.random() - 0.5) * 2 * volatility * (max - min);
    return Math.min(max, Math.max(min, current + change));
};

export interface DataGenerator {
    name: string;
    description?: string;
    columns: Column[];
    generate: (historyCount?: number) => Record<string, unknown>[];
    interval: number;
}
```

The `generate(N)` contract: when `historyCount > 0`, return N frames backdated as `now - N*interval`, `now - (N-1)*interval`, …, `now`. When `historyCount` is 0 or undefined, return the current frame only (existing behavior).

### Step 2: Add `historyCount` to the `metrics` generator

```typescript
generate: (historyCount?: number) => {
    const servers = ['server-01', 'server-02', 'server-03', 'server-04'];
    if (historyCount && historyCount > 0) {
        const frames: Record<string, unknown>[] = [];
        const now = Date.now();
        for (let i = historyCount; i >= 0; i--) {
            const ts = new Date(now - i * 1000).toISOString();
            servers.forEach(server => {
                const cpuKey = `${server}_cpu`;
                const memKey = `${server}_mem`;
                currentValues[cpuKey] = generateNextValue(currentValues[cpuKey] ?? 50, 10, 95, 0.15);
                currentValues[memKey] = generateNextValue(currentValues[memKey] ?? 60, 20, 90, 0.1);
                frames.push({
                    timestamp: ts,
                    server,
                    cpu: currentValues[cpuKey],
                    memory: currentValues[memKey],
                    requests: Math.floor(Math.random() * 500) + 100,
                });
            });
        }
        return frames;
    }
    const now = new Date().toISOString();
    return servers.map(server => {
        // ... existing single-frame logic ...
    });
},
```

Apply the same `historyCount` pattern to ALL existing generators: `stocks`, `sensors`, `vehicles`, `logs`, `revenue`, `sales`. The pattern is identical: when `historyCount > 0`, loop `i` from `historyCount` down to `0`, use `now - i * interval` as the timestamp, and call the per-frame logic for each step.

**Note on non-time generators (`revenue`, `sales`):** These don't have a `timestamp` column. For `historyCount` support, simply return `historyCount + 1` snapshots of the full dataset (all categories) with generated values — the consumer can use the last snapshot. In practice, these frame-based examples don't need history, so `generate()` without args is sufficient.

### Step 3: Run tests

```bash
npm run test
```

Expected: all existing tests pass (no interface changes visible to test suite).

### Step 4: Commit

```bash
git add examples/data-utils.ts
git commit -m "feat(data-utils): export generateNextValue; add historyCount to existing generators"
```

---

## Task 2: Add 11 new generators to `data-utils.ts`

**Files:**
- Modify: `examples/data-utils.ts`

Add each generator to the `dataGenerators` object. All support `historyCount`.

### Generator implementations

#### `cpuLoad` — Single server CPU % over time
Used by: `BasicLineChart`, `AxisBoundLineChart`, `GrammarLineChart`, `GrammarCompiledChart`, `GrammarTimeSeriesBar`

```typescript
cpuLoad: {
    name: 'CPU Load',
    description: 'Single server CPU utilization over time',
    columns: [
        { name: 'time', type: 'datetime64' },
        { name: 'value', type: 'float64' },
    ],
    generate: (historyCount?: number) => {
        const INTERVAL = 1000;
        if (historyCount && historyCount > 0) {
            const frames: Record<string, unknown>[] = [];
            const now = Date.now();
            for (let i = historyCount; i >= 0; i--) {
                currentValues['cpuLoad'] = generateNextValue(currentValues['cpuLoad'] ?? 50, 10, 90, 0.15);
                frames.push({ time: new Date(now - i * INTERVAL).toISOString(), value: currentValues['cpuLoad'] });
            }
            return frames;
        }
        currentValues['cpuLoad'] = generateNextValue(currentValues['cpuLoad'] ?? 50, 10, 90, 0.15);
        return [{ time: new Date().toISOString(), value: currentValues['cpuLoad'] }];
    },
    interval: 1000,
},
```

#### `apiTraffic` — Requests / errors / timeouts (3 series)
Used by: `GrammarStackedArea`, `GrammarMultiMark`

```typescript
apiTraffic: {
    name: 'API Traffic',
    description: 'HTTP requests, errors, and timeouts per second',
    columns: [
        { name: 'time', type: 'datetime64' },
        { name: 'metric', type: 'string' },
        { name: 'value', type: 'float64' },
    ],
    generate: (historyCount?: number) => {
        const INTERVAL = 2000;
        const metrics = ['requests', 'errors', 'timeouts'];
        const defaults: Record<string, number> = { requests: 120, errors: 5, timeouts: 2 };
        const bounds: Record<string, [number, number]> = { requests: [50, 300], errors: [0, 30], timeouts: [0, 15] };
        if (historyCount && historyCount > 0) {
            const frames: Record<string, unknown>[] = [];
            const now = Date.now();
            for (let i = historyCount; i >= 0; i--) {
                const ts = new Date(now - i * INTERVAL).toISOString();
                metrics.forEach(m => {
                    const key = `apiTraffic_${m}`;
                    currentValues[key] = generateNextValue(currentValues[key] ?? defaults[m], bounds[m][0], bounds[m][1], 0.12);
                    frames.push({ time: ts, metric: m, value: currentValues[key] });
                });
            }
            return frames;
        }
        const now = new Date().toISOString();
        return metrics.map(m => {
            const key = `apiTraffic_${m}`;
            currentValues[key] = generateNextValue(currentValues[key] ?? defaults[m], bounds[m][0], bounds[m][1], 0.12);
            return { time: now, metric: m, value: currentValues[key] };
        });
    },
    interval: 2000,
},
```

#### `globalEvents` — Geo points scattered worldwide
Used by: `StreamingGeoChart`

```typescript
globalEvents: {
    name: 'Global Events',
    description: 'Geo-distributed events with category and magnitude',
    columns: [
        { name: 'latitude', type: 'float64' },
        { name: 'longitude', type: 'float64' },
        { name: 'value', type: 'int64' },
        { name: 'category', type: 'string' },
    ],
    generate: (historyCount?: number) => {
        const categories = ['Category A', 'Category B', 'Category C'];
        const count = historyCount && historyCount > 0 ? historyCount * 5 : 5;
        const rows: Record<string, unknown>[] = [];
        for (let i = 0; i < count; i++) {
            rows.push({
                latitude: (Math.random() - 0.5) * 140,
                longitude: (Math.random() - 0.5) * 360,
                value: Math.floor(Math.random() * 100),
                category: categories[Math.floor(Math.random() * categories.length)],
            });
        }
        return rows;
    },
    interval: 200,
},
```

#### `productInventory` — Stock levels for store products
Used by: `FrameBoundBarChart`, `GrammarBarChart`

```typescript
productInventory: {
    name: 'Product Inventory',
    description: 'Current stock levels for store products',
    columns: [
        { name: 'timestamp', type: 'datetime64' },
        { name: 'product', type: 'string' },
        { name: 'sales', type: 'float64' },
    ],
    generate: (historyCount?: number) => {
        const INTERVAL = 2000;
        const products = ['Widgets', 'Gadgets', 'Gizmos', 'Doodads'];
        const defaults: Record<string, number> = { Widgets: 120, Gadgets: 85, Gizmos: 95, Doodads: 65 };
        const bounds: Record<string, [number, number]> = {
            Widgets: [80, 160], Gadgets: [50, 120], Gizmos: [60, 130], Doodads: [40, 100],
        };
        if (historyCount && historyCount > 0) {
            // For frame-bound charts, return only the current snapshot (no time-series needed)
            // historyCount is ignored; always returns one frame
        }
        const now = new Date().toISOString();
        return products.map(p => {
            const key = `inventory_${p}`;
            currentValues[key] = generateNextValue(currentValues[key] ?? defaults[p], bounds[p][0], bounds[p][1], 0.1);
            return { timestamp: now, product: p, sales: currentValues[key] };
        });
    },
    interval: 2000,
},
```

#### `serviceLoad` — Per-service request counts
Used by: `GrammarRoseChart`

```typescript
serviceLoad: {
    name: 'Service Load',
    description: 'Request counts per microservice',
    columns: [
        { name: 'service', type: 'string' },
        { name: 'requests', type: 'float64' },
    ],
    generate: () => {
        const services = ['API', 'Auth', 'DB', 'Cache', 'Worker', 'Gateway'];
        const defaults: Record<string, number> = { API: 500, Auth: 300, DB: 400, Cache: 800, Worker: 200, Gateway: 600 };
        return services.map(s => {
            const key = `serviceLoad_${s}`;
            currentValues[key] = generateNextValue(currentValues[key] ?? defaults[s], 50, 1200, 0.1);
            return { service: s, requests: currentValues[key] };
        });
    },
    interval: 1500,
},
```

#### `httpResponses` — HTTP status code distribution
Used by: `GrammarDonutChart`

```typescript
httpResponses: {
    name: 'HTTP Responses',
    description: 'HTTP status code distribution',
    columns: [
        { name: 'status', type: 'string' },
        { name: 'count', type: 'float64' },
    ],
    generate: () => {
        const statuses = [
            { code: '200 OK', base: 800 },
            { code: '301 Redirect', base: 100 },
            { code: '404 Not Found', base: 50 },
            { code: '500 Error', base: 20 },
            { code: '503 Unavailable', base: 10 },
        ];
        return statuses.map(s => {
            const key = `http_${s.code}`;
            currentValues[key] = generateNextValue(currentValues[key] ?? s.base, 1, s.base * 2, 0.08);
            return { status: s.code, count: currentValues[key] };
        });
    },
    interval: 1500,
},
```

#### `cloudRegions` — Latency / throughput / connections by region
Used by: `GrammarRadialBar`, `GrammarScatterChart`

```typescript
cloudRegions: {
    name: 'Cloud Regions',
    description: 'Performance metrics across cloud regions',
    columns: [
        { name: 'region', type: 'string' },
        { name: 'latency', type: 'float64' },
        { name: 'throughput', type: 'float64' },
        { name: 'connections', type: 'float64' },
    ],
    generate: () => {
        const regions = ['us-east', 'us-west', 'eu-west', 'ap-southeast', 'ap-northeast'];
        const defaults: Record<string, [number, number, number]> = {
            'us-east': [20, 800, 1200],
            'us-west': [35, 600, 900],
            'eu-west': [45, 700, 1000],
            'ap-southeast': [80, 500, 700],
            'ap-northeast': [60, 550, 800],
        };
        return regions.map(r => {
            const [dLat, dThru, dConn] = defaults[r];
            currentValues[`cr_lat_${r}`] = generateNextValue(currentValues[`cr_lat_${r}`] ?? dLat, 5, 200, 0.08);
            currentValues[`cr_thru_${r}`] = generateNextValue(currentValues[`cr_thru_${r}`] ?? dThru, 100, 1500, 0.08);
            currentValues[`cr_conn_${r}`] = generateNextValue(currentValues[`cr_conn_${r}`] ?? dConn, 100, 2000, 0.08);
            return {
                region: r,
                latency: currentValues[`cr_lat_${r}`],
                throughput: currentValues[`cr_thru_${r}`],
                connections: currentValues[`cr_conn_${r}`],
            };
        });
    },
    interval: 1500,
},
```

#### `serverProfile` — Multi-dimension server health
Used by: `GrammarRadarChart`

```typescript
serverProfile: {
    name: 'Server Profile',
    description: 'Multi-dimensional health scores for two servers',
    columns: [
        { name: 'dimension', type: 'string' },
        { name: 'value', type: 'float64' },
        { name: 'server', type: 'string' },
    ],
    generate: () => {
        const dimensions = ['CPU', 'Memory', 'Disk', 'Network', 'Latency'];
        const servers = ['server-a', 'server-b'];
        const rows: Record<string, unknown>[] = [];
        servers.forEach(srv => {
            dimensions.forEach(dim => {
                const key = `sp_${srv}_${dim}`;
                currentValues[key] = generateNextValue(currentValues[key] ?? 70, 20, 100, 0.1);
                rows.push({ dimension: dim, value: currentValues[key], server: srv });
            });
        });
        return rows;
    },
    interval: 2000,
},
```

#### `datacenterLoad` — Hour-of-day × day-of-week heatmap
Used by: `GrammarHeatmap`

```typescript
datacenterLoad: {
    name: 'Datacenter Load',
    description: 'CPU load by hour of day and day of week',
    columns: [
        { name: 'hour', type: 'string' },
        { name: 'day', type: 'string' },
        { name: 'load', type: 'float64' },
    ],
    generate: () => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00');
        const rows: Record<string, unknown>[] = [];
        days.forEach(day => {
            hours.forEach(hour => {
                const key = `dc_${day}_${hour}`;
                // Business hours have higher base load
                const h = parseInt(hour);
                const base = (h >= 9 && h <= 17 && !['Sat', 'Sun'].includes(day)) ? 70 : 30;
                currentValues[key] = generateNextValue(currentValues[key] ?? base, 5, 100, 0.05);
                rows.push({ hour, day, load: currentValues[key] });
            });
        });
        return rows;
    },
    interval: 3000,
},
```

#### `stockCandles` — OHLC price candles
Used by: `GrammarCandlestickChart`

```typescript
stockCandles: {
    name: 'Stock Candles',
    description: 'OHLC candlestick data for a single symbol',
    columns: [
        { name: 'time', type: 'datetime64' },
        { name: 'open', type: 'float64' },
        { name: 'high', type: 'float64' },
        { name: 'low', type: 'float64' },
        { name: 'close', type: 'float64' },
    ],
    generate: (historyCount?: number) => {
        const INTERVAL = 2000;
        const generateCandle = (prevClose: number, ts: string) => {
            const open = prevClose;
            const move = (Math.random() - 0.5) * 6;
            const close = Math.max(80, Math.min(220, open + move));
            const high = Math.max(open, close) + Math.random() * 3;
            const low = Math.min(open, close) - Math.random() * 3;
            return { time: ts, open, high, low, close };
        };
        if (historyCount && historyCount > 0) {
            const frames: Record<string, unknown>[] = [];
            const now = Date.now();
            currentValues['candle_close'] = currentValues['candle_close'] ?? 150;
            for (let i = historyCount; i >= 0; i--) {
                const ts = new Date(now - i * INTERVAL).toISOString();
                const candle = generateCandle(currentValues['candle_close'], ts);
                currentValues['candle_close'] = candle.close;
                frames.push(candle);
            }
            return frames;
        }
        currentValues['candle_close'] = currentValues['candle_close'] ?? 150;
        const candle = generateCandle(currentValues['candle_close'], new Date().toISOString());
        currentValues['candle_close'] = candle.close;
        return [candle];
    },
    interval: 2000,
},
```

#### `activeUsers` — Live active user count
Used by: `SingleValueWithSparkline`

```typescript
activeUsers: {
    name: 'Active Users',
    description: 'Live count of active users on the platform',
    columns: [
        { name: 'activeUsers', type: 'int64' },
    ],
    generate: () => {
        currentValues['activeUsers'] = generateNextValue(currentValues['activeUsers'] ?? 1234, 800, 1800, 0.1);
        return [{ activeUsers: Math.floor(currentValues['activeUsers']) }];
    },
    interval: 1000,
},
```

### Step 3: Run tests

```bash
npm run test
```

Expected: all tests pass.

### Step 4: Commit

```bash
git add examples/data-utils.ts
git commit -m "feat(data-utils): add 11 new domain-specific data generators"
```

---

## Task 3: Refactor `basic-examples.tsx`

**Files:**
- Modify: `examples/basic-examples.tsx`

### Step 1: Remove local `generateNextValue` and update imports

Remove the `generateNextValue` function at the top of the file (lines 34–37).

Add `generateNextValue` to the `data-utils` import:

```typescript
import { dataGenerators, generateNextValue } from './data-utils';
```

### Step 2: Refactor `BasicLineChart`

Replace inline random walk with `dataGenerators.cpuLoad`:

```tsx
export function BasicLineChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>([], 300);

  useEffect(() => {
    // Pre-populate with 30 seconds of history
    append(dataGenerators.cpuLoad.generate(30));

    const id = setInterval(() => {
      append(dataGenerators.cpuLoad.generate());
    }, dataGenerators.cpuLoad.interval);

    return () => clearInterval(id);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const source: StreamDataSource = {
    columns: dataGenerators.cpuLoad.columns,
    data,
    isStreaming: true,
  };

  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'time',
    yAxis: 'value',
    lineStyle: 'curve',
    gridlines: true,
    yTitle: 'CPU Usage (%)',
    yRange: { min: 0, max: 100 },
    unit: { position: 'right', value: '%' },
    fractionDigits: 1,
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <StreamChart config={config} data={source} theme={theme} />
    </div>
  );
}
```

### Step 3: Refactor `MultiSeriesAreaChart`

Add history pre-population (30 frames). Already uses `dataGenerators.sensors`, just add the initial append:

```tsx
useEffect(() => {
  append(dataGenerators.sensors.generate(30));

  const id = setInterval(() => {
    append(dataGenerators.sensors.generate());
  }, dataGenerators.sensors.interval);

  return () => clearInterval(id);
}, []);  // eslint-disable-line react-hooks/exhaustive-deps
```

### Step 4: Refactor `StackedBarChart` and `GroupedBarChart`

These are frame-bound (category charts). Remove the wordy comments. Use clean replace-on-interval pattern:

**`StackedBarChart`:** Use `dataGenerators.revenue` with `useStreamingData` and `data.slice(-12)` — already correct. Remove the long comment block.

**`GroupedBarChart`:** Use `dataGenerators.sales` with `data.slice(-8)` — already correct. Remove comments.

### Step 5: Refactor `SingleValueWithSparkline`

Replace local `generateNextValue` with `dataGenerators.activeUsers`:

```tsx
export function SingleValueWithSparkline() {
  const theme = useTheme();
  const [value, setValue] = useState(1234);

  useEffect(() => {
    const id = setInterval(() => {
      const row = dataGenerators.activeUsers.generate()[0];
      setValue(row.activeUsers as number);
    }, dataGenerators.activeUsers.interval);
    return () => clearInterval(id);
  }, []);

  const data: StreamDataSource = {
    columns: dataGenerators.activeUsers.columns,
    data: [[value]],
    isStreaming: true,
  };
  // ... rest unchanged
}
```

### Step 6: Refactor `StreamingDataTable`

Replace inline log generation with `dataGenerators.logs`:

```tsx
export function StreamingDataTable() {
  const theme = useTheme();
  const { data, append } = useStreamingData<unknown[]>([], 50);

  useEffect(() => {
    const id = setInterval(() => {
      const row = dataGenerators.logs.generate()[0];
      append([[row.timestamp, row.level, row.service, row.message, row.duration_ms]]);
    }, dataGenerators.logs.interval);
    return () => clearInterval(id);
  }, []);

  const dataSource: StreamDataSource = {
    columns: dataGenerators.logs.columns,
    data,
    isStreaming: true,
  };
  // ... table config unchanged
}
```

### Step 7: Refactor `MetricsDashboard`

Replace local `generateNextValue` with `dataGenerators.metrics`. Use the `metrics` generator directly:

```tsx
export function MetricsDashboard() {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({ cpu: 45, memory: 62, requests: 1520, errors: 3 });

  useEffect(() => {
    const id = setInterval(() => {
      const rows = dataGenerators.metrics.generate();
      // Pick server-01 for display values
      const s01 = rows.find(r => r.server === 'server-01');
      if (s01) {
        setMetrics(prev => ({
          cpu: s01.cpu as number,
          memory: s01.memory as number,
          requests: prev.requests + Math.floor(Math.random() * 50) + 10,
          errors: prev.errors + (Math.random() > 0.85 ? 1 : 0),
        }));
      }
    }, dataGenerators.metrics.interval);
    return () => clearInterval(id);
  }, []);
  // ... rest unchanged
}
```

### Step 8: Refactor `ChartWithTableToggle`

Replace local `generateNextValue` calls with `dataGenerators.sensors`. Use a single location's data:

```tsx
export function ChartWithTableToggle() {
  const theme = useTheme();
  const [showTable, setShowTable] = useState(false);
  const { data: streamData, append } = useStreamingData<unknown[]>([], 30);

  useEffect(() => {
    // Pre-populate with 20 points from sensors (Warehouse A)
    const history = dataGenerators.sensors.generate(20)
      .filter(r => r.location === 'Warehouse A')
      .map(r => [r.timestamp, r.temperature, r.humidity]);
    append(history as unknown[][]);

    const id = setInterval(() => {
      const row = dataGenerators.sensors.generate().find(r => r.location === 'Warehouse A');
      if (row) append([[row.timestamp, row.temperature, row.humidity]]);
    }, dataGenerators.sensors.interval);
    return () => clearInterval(id);
  }, []);

  const data: StreamDataSource = {
    columns: [
      { name: 'timestamp', type: 'datetime64' },
      { name: 'temperature', type: 'float64' },
      { name: 'humidity', type: 'float64' },
    ],
    data: streamData,
    isStreaming: true,
  };
  // ... rest unchanged
}
```

### Step 9: Refactor `StreamingGeoChart`

Replace inline geo point generation with `dataGenerators.globalEvents`:

```tsx
export function StreamingGeoChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>([], 300);

  useEffect(() => {
    // Pre-populate with initial points
    append(dataGenerators.globalEvents.generate(40));

    const id = setInterval(() => {
      append(dataGenerators.globalEvents.generate());
    }, dataGenerators.globalEvents.interval);
    return () => clearInterval(id);
  }, []);

  const source: StreamDataSource = {
    columns: dataGenerators.globalEvents.columns,
    data,
    isStreaming: true,
  };
  // ... config unchanged
}
```

### Step 10: Refactor `FrameBoundTable`

Replace local `generateNextValue` with `dataGenerators.metrics`:

```tsx
useEffect(() => {
  const id = setInterval(() => {
    const rows = dataGenerators.metrics.generate();
    append(rows.map(r => [r.timestamp, r.server, r.cpu, r.memory, r.requests]));
  }, dataGenerators.metrics.interval);
  return () => clearInterval(id);
}, []);
```

Update the `dataSource.columns` to use `dataGenerators.metrics.columns`.

### Step 11: Refactor `KeyBoundTable`

Replace inline service table data with `dataGenerators.logs`-style generation. Since there's no matching generator, use `dataGenerators.metrics` for latency/service-like data, or keep a minimal inline dataset since `KeyBoundTable` is a UI pattern demo (temporal key-bound behavior), not a domain example.

Actually, create a new generator `serviceHealth` in data-utils that matches this exactly — but per the design, `serviceLoad` is the closest. Since `KeyBoundTable` shows service status/uptime (which `serviceLoad` doesn't have), keep a minimal inline random pick from a services list but remove `generateNextValue` — use `Math.random()` directly for the status/latency (these are not continuity-requiring values).

```tsx
useEffect(() => {
  const services = ['auth-service', 'api-gateway', 'user-service', 'payment-service', 'notification-service'];
  const statuses = ['healthy', 'healthy', 'healthy', 'degraded', 'down'];

  const id = setInterval(() => {
    const service = services[Math.floor(Math.random() * services.length)];
    append([[
      new Date().toISOString(),
      service,
      statuses[Math.floor(Math.random() * statuses.length)],
      Math.floor(Math.random() * 200) + 10,
      99 + (Math.random() - 0.5) * 2,
    ]]);
  }, 1000);
  return () => clearInterval(id);
}, []);
```

(This removes `generateNextValue` from `KeyBoundTable` while keeping the example's intent intact.)

### Step 12: Refactor `KeyBoundGeoChart`

Replace inline vehicle tracking with `dataGenerators.vehicles`:

```tsx
useEffect(() => {
  append(dataGenerators.vehicles.generate(10));

  const id = setInterval(() => {
    append(dataGenerators.vehicles.generate());
  }, dataGenerators.vehicles.interval);
  return () => clearInterval(id);
}, []);
```

Remove the `vehiclePositions` ref (state tracking is now inside the generator). Update `columns` to use `dataGenerators.vehicles.columns`. Map lat/lng field names to match generator columns (`latitude`/`longitude`).

### Step 13: Refactor `FrameBoundBarChart`

Replace inline product inventory generation with `dataGenerators.productInventory`:

```tsx
export function FrameBoundBarChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>([], 100);

  useEffect(() => {
    append(dataGenerators.productInventory.generate());

    const id = setInterval(() => {
      append(dataGenerators.productInventory.generate());
    }, dataGenerators.productInventory.interval);
    return () => clearInterval(id);
  }, []);

  const source: StreamDataSource = {
    columns: dataGenerators.productInventory.columns,
    data,
    isStreaming: true,
  };

  const config: BarColumnConfig = {
    chartType: 'column',
    xAxis: 'product',
    yAxis: 'sales',
    temporal: { mode: 'frame', field: 'timestamp' },
    dataLabel: true,
    gridlines: true,
    yTitle: 'Sales',
    fractionDigits: 0,
    colors: findPaletteByLabel('Ocean')?.values,
  };
  // ...
}
```

### Step 14: Refactor `AxisBoundLineChart`

Replace local `generateNextValue` with `dataGenerators.cpuLoad`:

```tsx
export function AxisBoundLineChart() {
  const theme = useTheme();
  const { data, append } = useStreamingData<Record<string, unknown>[]>([], 300);

  useEffect(() => {
    const id = setInterval(() => {
      append(dataGenerators.cpuLoad.generate());
    }, dataGenerators.cpuLoad.interval);
    return () => clearInterval(id);
  }, []);

  const source: StreamDataSource = {
    columns: dataGenerators.cpuLoad.columns,
    data,
    isStreaming: true,
  };

  const config: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'time',
    yAxis: 'value',
    temporal: { mode: 'axis', field: 'time', range: 1 },
    lineStyle: 'curve',
    gridlines: true,
    yTitle: 'Metric Value',
    yRange: { min: 0, max: 100 },
    fractionDigits: 1,
  };
  // ...
}
```

### Step 15: Run the dev server to visually verify

```bash
npm run dev:examples
```

Open `http://localhost:3000`. Click through all examples to verify they render data and animate correctly.

### Step 16: Commit

```bash
git add examples/basic-examples.tsx
git commit -m "refactor(basic-examples): remove local generateNextValue; use dataGenerators for all examples"
```

---

## Task 4: Refactor `grammar-examples.tsx`

**Files:**
- Modify: `examples/grammar-examples.tsx`

### Step 1: Add import for `dataGenerators` and `generateNextValue`

```typescript
import { dataGenerators, generateNextValue } from './data-utils';
```

Remove the local `generateNextValue` function definition.

### Step 2: Refactor `GrammarLineChart`

Replace inline history generation with `dataGenerators.cpuLoad.generate(30)`:

```tsx
useEffect(() => {
  if (!loadedRef.current && handleRef.current) {
    loadedRef.current = true;
    handleRef.current.append(dataGenerators.cpuLoad.generate(30));
  }
  const id = setInterval(() => {
    handleRef.current?.append(dataGenerators.cpuLoad.generate());
  }, dataGenerators.cpuLoad.interval);
  return () => clearInterval(id);
}, []);
```

Update the spec to use `field: 'time'` (matching `cpuLoad` columns). Remove `valueRef` — state is inside the generator.

### Step 3: Refactor `GrammarStackedArea`

Replace inline history generation with `dataGenerators.apiTraffic.generate(40)`:

```tsx
useEffect(() => {
  if (!loadedRef.current && handleRef.current) {
    loadedRef.current = true;
    handleRef.current.append(dataGenerators.apiTraffic.generate(40));
  }
  const id = setInterval(() => {
    handleRef.current?.append(dataGenerators.apiTraffic.generate());
  }, dataGenerators.apiTraffic.interval);
  return () => clearInterval(id);
}, []);
```

Update spec encode to use `{ x: 'time', y: 'value', color: 'metric' }`. Remove inline series state.

### Step 4: Refactor `GrammarMultiMark`

Replace inline history with `dataGenerators.apiTraffic.generate(30)`. Use `apiTraffic` (same columns as stacked area):

```tsx
useEffect(() => {
  if (!loadedRef.current && handleRef.current) {
    loadedRef.current = true;
    handleRef.current.append(dataGenerators.apiTraffic.generate(30));
  }
  const id = setInterval(() => {
    handleRef.current?.append(dataGenerators.apiTraffic.generate());
  }, dataGenerators.apiTraffic.interval);
  return () => clearInterval(id);
}, []);
```

Filter to `metric === 'requests'` in the area mark if needed, or keep multi-mark to show all 3 series.

### Step 5: Refactor `GrammarCompiledChart`

Replace inline history with `dataGenerators.cpuLoad.generate(30)`:

```tsx
useEffect(() => {
  if (!loadedRef.current && handleRef.current) {
    loadedRef.current = true;
    handleRef.current.append(dataGenerators.cpuLoad.generate(30));
  }
  const id = setInterval(() => {
    handleRef.current?.append(dataGenerators.cpuLoad.generate());
  }, dataGenerators.cpuLoad.interval);
  return () => clearInterval(id);
}, []);
```

### Step 6: Refactor `GrammarBarChart`

Replace inline history with `dataGenerators.productInventory`:

```tsx
useEffect(() => {
  handleRef.current?.replace(dataGenerators.productInventory.generate());
  const id = setInterval(() => {
    handleRef.current?.replace(dataGenerators.productInventory.generate());
  }, dataGenerators.productInventory.interval);
  return () => clearInterval(id);
}, []);
```

(Frame-bound: use `replace` not `append`, no `loadedRef` needed.)

### Step 7: Refactor `GrammarRoseChart`

Replace inline service data with `dataGenerators.serviceLoad`:

```tsx
useEffect(() => {
  handleRef.current?.replace(dataGenerators.serviceLoad.generate());
  const id = setInterval(() => {
    handleRef.current?.replace(dataGenerators.serviceLoad.generate());
  }, dataGenerators.serviceLoad.interval);
  return () => clearInterval(id);
}, []);
```

Update spec encode to `{ x: 'service', y: 'requests', color: 'service' }`.

### Step 8: Refactor `GrammarDonutChart`

Replace inline HTTP data with `dataGenerators.httpResponses`:

```tsx
useEffect(() => {
  handleRef.current?.replace(dataGenerators.httpResponses.generate());
  const id = setInterval(() => {
    handleRef.current?.replace(dataGenerators.httpResponses.generate());
  }, dataGenerators.httpResponses.interval);
  return () => clearInterval(id);
}, []);
```

Update spec encode to `{ color: 'status', y: 'count' }`.

### Step 9: Refactor `GrammarRadialBar`

Replace inline region data with `dataGenerators.cloudRegions`:

```tsx
useEffect(() => {
  handleRef.current?.replace(dataGenerators.cloudRegions.generate());
  const id = setInterval(() => {
    handleRef.current?.replace(dataGenerators.cloudRegions.generate());
  }, dataGenerators.cloudRegions.interval);
  return () => clearInterval(id);
}, []);
```

Update spec encode to `{ x: 'region', y: 'latency', color: 'region' }`.

### Step 10: Refactor `GrammarScatterChart`

Replace inline scatter data with `dataGenerators.cloudRegions`:

```tsx
useEffect(() => {
  if (!loadedRef.current && handleRef.current) {
    loadedRef.current = true;
    handleRef.current.append(dataGenerators.cloudRegions.generate());
  }
  const id = setInterval(() => {
    handleRef.current?.append(dataGenerators.cloudRegions.generate());
  }, dataGenerators.cloudRegions.interval);
  return () => clearInterval(id);
}, []);
```

Update spec encode to `{ x: 'throughput', y: 'latency', color: 'region', size: 'connections' }`.

### Step 11: Refactor `GrammarRadarChart`

Replace inline radar data with `dataGenerators.serverProfile`:

```tsx
useEffect(() => {
  handleRef.current?.replace(dataGenerators.serverProfile.generate());
  const id = setInterval(() => {
    handleRef.current?.replace(dataGenerators.serverProfile.generate());
  }, dataGenerators.serverProfile.interval);
  return () => clearInterval(id);
}, []);
```

Update spec encode to `{ x: 'dimension', y: 'value', color: 'server' }`.

### Step 12: Refactor `GrammarHeatmap`

Replace inline heatmap data with `dataGenerators.datacenterLoad`:

```tsx
useEffect(() => {
  handleRef.current?.replace(dataGenerators.datacenterLoad.generate());
  const id = setInterval(() => {
    handleRef.current?.replace(dataGenerators.datacenterLoad.generate());
  }, dataGenerators.datacenterLoad.interval);
  return () => clearInterval(id);
}, []);
```

Update spec encode to `{ x: 'hour', y: 'day', color: 'load' }`.

### Step 13: Refactor `GrammarCandlestickChart`

Replace inline candlestick generation with `dataGenerators.stockCandles`:

```tsx
useEffect(() => {
  if (!loadedRef.current && handleRef.current) {
    loadedRef.current = true;
    handleRef.current.append(dataGenerators.stockCandles.generate(40));
  }
  const id = setInterval(() => {
    handleRef.current?.append(dataGenerators.stockCandles.generate());
  }, dataGenerators.stockCandles.interval);
  return () => clearInterval(id);
}, []);
```

Remove `priceRef` — state is inside the generator. Update spec encode to use `field: 'time'`.

### Step 14: Refactor `GrammarTimeSeriesBar`

Replace inline CPU bar generation with `dataGenerators.cpuLoad`:

```tsx
useEffect(() => {
  if (!loadedRef.current && handleRef.current) {
    loadedRef.current = true;
    handleRef.current.append(dataGenerators.cpuLoad.generate(30));
  }
  const id = setInterval(() => {
    handleRef.current?.append(dataGenerators.cpuLoad.generate());
  }, dataGenerators.cpuLoad.interval);
  return () => clearInterval(id);
}, []);
```

Update the rect mark encode to use `'time'` field (matching `cpuLoad` columns).

### Step 15: Run dev server

```bash
npm run dev:examples
```

Verify all grammar examples display data correctly.

### Step 16: Commit

```bash
git add examples/grammar-examples.tsx
git commit -m "refactor(grammar-examples): remove local generateNextValue; use dataGenerators for all examples"
```

---

## Task 5: Update `example-sources.ts`

**Files:**
- Modify: `examples/example-sources.ts`

### Step 1: Update each source string entry

For every example whose implementation changed in Tasks 3–4, update the corresponding source code string in `example-sources.ts`. The source strings are what users see in the "Code" tab — they should reflect the new `dataGenerators` patterns.

Key patterns to reflect in the source strings:

**Time-series append pattern (grammar examples):**
```typescript
// In source string:
const loadedRef = useRef(false);

useEffect(() => {
  if (!loadedRef.current && handleRef.current) {
    loadedRef.current = true;
    handleRef.current.append(dataGenerators.cpuLoad.generate(30));
  }
  const id = setInterval(() => {
    handleRef.current?.append(dataGenerators.cpuLoad.generate());
  }, dataGenerators.cpuLoad.interval);
  return () => clearInterval(id);
}, []);
```

**Frame-bound replace pattern:**
```typescript
useEffect(() => {
  handleRef.current?.replace(dataGenerators.productInventory.generate());
  const id = setInterval(() => {
    handleRef.current?.replace(dataGenerators.productInventory.generate());
  }, dataGenerators.productInventory.interval);
  return () => clearInterval(id);
}, []);
```

**Streaming append pattern (basic examples):**
```typescript
useEffect(() => {
  append(dataGenerators.cpuLoad.generate(30));
  const id = setInterval(() => {
    append(dataGenerators.cpuLoad.generate());
  }, dataGenerators.cpuLoad.interval);
  return () => clearInterval(id);
}, []);
```

### Step 2: Run build to verify no compile errors

```bash
npm run build
```

Expected: clean build, no TypeScript errors.

### Step 3: Commit

```bash
git add examples/example-sources.ts
git commit -m "chore(example-sources): update source display strings to reflect dataGenerators refactor"
```

---

## Task 6: Final verification

### Step 1: Run full test suite

```bash
npm run test
```

Expected: all tests pass.

### Step 2: Run typecheck

```bash
npm run typecheck
```

Expected: no type errors.

### Step 3: Run dev server for end-to-end visual check

```bash
npm run dev:examples
```

Walk through every example in the sidebar:
- All examples display data immediately or within 1–2 seconds
- No console errors
- Grammar examples with `loadedRef` pre-populate their charts from frame 0
- Frame-bound examples (rose, donut, bar, heatmap, radar, radial) update in place
- Time-series examples (line, stacked area, candlestick, time series bar) scroll correctly

### Step 4: Final commit if any cleanup needed

```bash
git add -p
git commit -m "chore: final cleanup from data generator unification"
```
