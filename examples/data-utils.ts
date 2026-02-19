
// Shared Data Generators for Playgrounds

export interface Column {
    name: string;
    type: string;
}

export interface DataGenerator {
    name: string;
    description?: string;
    columns: Column[];
    generate: (historyCount?: number) => Record<string, unknown>[];
    interval: number;
}

// Helper to simulate random walk
export const generateNextValue = (current: number, min: number, max: number, volatility: number = 0.1): number => {
    const change = (Math.random() - 0.5) * 2 * volatility * (max - min);
    return Math.min(max, Math.max(min, current + change));
};

// Store current state for continuity across calls
const currentValues: Record<string, number> = {};

export const dataGenerators: Record<string, DataGenerator> = {
    metrics: {
        name: 'Server Metrics',
        description: 'CPU, memory, and request metrics for multiple servers',
        columns: [
            { name: 'timestamp', type: 'datetime64' },
            { name: 'server', type: 'string' },
            { name: 'cpu', type: 'float64' },
            { name: 'memory', type: 'float64' },
            { name: 'requests', type: 'int64' },
        ],
        generate: (historyCount?: number) => {
            const servers = ['server-01', 'server-02', 'server-03', 'server-04'];
            const INTERVAL_MS = 1000; // must equal this generator's interval property

            const generateFrame = (ts: string): Record<string, unknown>[] => {
                return servers.map(server => {
                    const cpuKey = `${server}_cpu`;
                    const memKey = `${server}_mem`;
                    currentValues[cpuKey] = generateNextValue(currentValues[cpuKey] ?? 50, 10, 95, 0.15);
                    currentValues[memKey] = generateNextValue(currentValues[memKey] ?? 60, 20, 90, 0.1);

                    return {
                        timestamp: ts,
                        server,
                        cpu: currentValues[cpuKey],
                        memory: currentValues[memKey],
                        requests: Math.floor(Math.random() * 500) + 100,
                    };
                });
            };

            if (historyCount && historyCount > 0) {
                const frames: Record<string, unknown>[] = [];
                const now = Date.now();
                for (let i = historyCount; i >= 0; i--) {
                    const ts = new Date(now - i * INTERVAL_MS).toISOString();
                    frames.push(...generateFrame(ts));
                }
                return frames;
            }

            return generateFrame(new Date().toISOString());
        },
        interval: 1000,
    },
    stocks: {
        name: 'Stock Prices',
        description: 'Simulated stock price movements',
        columns: [
            { name: 'timestamp', type: 'datetime64' },
            { name: 'symbol', type: 'string' },
            { name: 'price', type: 'float64' },
            { name: 'volume', type: 'int64' },
            { name: 'change', type: 'float64' },
        ],
        generate: (historyCount?: number) => {
            const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN'];
            const INTERVAL_MS = 1500; // must equal this generator's interval property

            const generateFrame = (ts: string): Record<string, unknown>[] => {
                return symbols.map(symbol => {
                    const priceKey = `${symbol}_price`;
                    const basePrices: Record<string, number> = { AAPL: 180, GOOGL: 140, MSFT: 380, AMZN: 175 };
                    const basePrice = basePrices[symbol] || 100;
                    currentValues[priceKey] = generateNextValue(currentValues[priceKey] ?? basePrice, basePrice * 0.9, basePrice * 1.1, 0.02);

                    const prevPrice = currentValues[`${symbol}_prev`] ?? currentValues[priceKey];
                    const change = ((currentValues[priceKey] - prevPrice) / prevPrice) * 100;
                    currentValues[`${symbol}_prev`] = currentValues[priceKey];

                    return {
                        timestamp: ts,
                        symbol,
                        price: currentValues[priceKey],
                        volume: Math.floor(Math.random() * 10000) + 1000,
                        change,
                    };
                });
            };

            if (historyCount && historyCount > 0) {
                const frames: Record<string, unknown>[] = [];
                const now = Date.now();
                for (let i = historyCount; i >= 0; i--) {
                    const ts = new Date(now - i * INTERVAL_MS).toISOString();
                    frames.push(...generateFrame(ts));
                }
                return frames;
            }

            return generateFrame(new Date().toISOString());
        },
        interval: 1500,
    },
    sensors: {
        name: 'IoT Sensors',
        description: 'Temperature and humidity from multiple locations',
        columns: [
            { name: 'timestamp', type: 'datetime64' },
            { name: 'location', type: 'string' },
            { name: 'temperature', type: 'float64' },
            { name: 'humidity', type: 'float64' },
            { name: 'battery', type: 'int64' },
        ],
        generate: (historyCount?: number) => {
            const locations = ['Warehouse A', 'Warehouse B', 'Office', 'Lab'];
            const INTERVAL_MS = 2000; // must equal this generator's interval property

            const generateFrame = (ts: string): Record<string, unknown>[] => {
                return locations.map(location => {
                    const tempKey = `${location}_temp`;
                    const humKey = `${location}_hum`;
                    currentValues[tempKey] = generateNextValue(currentValues[tempKey] ?? 22, 15, 35, 0.08);
                    currentValues[humKey] = generateNextValue(currentValues[humKey] ?? 45, 30, 70, 0.1);

                    return {
                        timestamp: ts,
                        location,
                        temperature: currentValues[tempKey],
                        humidity: currentValues[humKey],
                        battery: Math.floor(Math.random() * 30) + 70,
                    };
                });
            };

            if (historyCount && historyCount > 0) {
                const frames: Record<string, unknown>[] = [];
                const now = Date.now();
                for (let i = historyCount; i >= 0; i--) {
                    const ts = new Date(now - i * INTERVAL_MS).toISOString();
                    frames.push(...generateFrame(ts));
                }
                return frames;
            }

            return generateFrame(new Date().toISOString());
        },
        interval: 2000,
    },
    vehicles: {
        name: 'Vehicle Tracking',
        description: 'GPS positions of delivery vehicles',
        columns: [
            { name: 'timestamp', type: 'datetime64' },
            { name: 'vehicle_id', type: 'string' },
            { name: 'latitude', type: 'float64' },
            { name: 'longitude', type: 'float64' },
            { name: 'speed', type: 'float64' },
            { name: 'status', type: 'string' },
        ],
        generate: (historyCount?: number) => {
            const vehicles = ['car-01', 'car-02', 'car-03', 'car-04', 'car-05', 'car-06', 'car-07', 'car-08', 'car-09', 'car-10'];
            const statuses = ['moving', 'moving', 'moving', 'stopped', 'loading'];
            const INTERVAL_MS = 500;

            const generateFrame = (ts: string): Record<string, unknown>[] => {
                return vehicles.map(vehicle => {
                    const latKey = `${vehicle}_lat`;
                    const lngKey = `${vehicle}_lng`;
                    currentValues[latKey] = generateNextValue(currentValues[latKey] ?? (40 + Math.random() * 2), 39, 42, 0.03);
                    currentValues[lngKey] = generateNextValue(currentValues[lngKey] ?? (-74 + Math.random() * 2), -76, -72, 0.03);

                    return {
                        timestamp: ts,
                        vehicle_id: vehicle,
                        latitude: currentValues[latKey],
                        longitude: currentValues[lngKey],
                        speed: Math.floor(Math.random() * 60) + 20,
                        status: statuses[Math.floor(Math.random() * statuses.length)],
                    };
                });
            };

            if (historyCount && historyCount > 0) {
                const frames: Record<string, unknown>[] = [];
                const now = Date.now();
                for (let i = historyCount; i >= 0; i--) {
                    const ts = new Date(now - i * INTERVAL_MS).toISOString();
                    frames.push(...generateFrame(ts));
                }
                return frames;
            }

            return generateFrame(new Date().toISOString());
        },
        interval: 500,
    },
    logs: {
        name: 'Application Logs',
        description: 'Streaming log entries with severity levels',
        columns: [
            { name: 'timestamp', type: 'datetime64' },
            { name: 'level', type: 'string' },
            { name: 'service', type: 'string' },
            { name: 'message', type: 'string' },
            { name: 'duration_ms', type: 'int64' },
        ],
        generate: (historyCount?: number) => {
            const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR', 'DEBUG'];
            const services = ['api', 'auth', 'database', 'cache', 'worker'];
            const messages = [
                'Request processed successfully',
                'User authenticated',
                'Query executed',
                'Cache hit',
                'Background job started',
                'Connection timeout',
                'Rate limit exceeded',
                'Memory usage high',
            ];
            const INTERVAL_MS = 500; // must equal this generator's interval property

            const generateFrame = (ts: string): Record<string, unknown>[] => {
                return [{
                    timestamp: ts,
                    level: levels[Math.floor(Math.random() * levels.length)],
                    service: services[Math.floor(Math.random() * services.length)],
                    message: messages[Math.floor(Math.random() * messages.length)],
                    duration_ms: Math.floor(Math.random() * 500) + 10,
                }];
            };

            if (historyCount && historyCount > 0) {
                const frames: Record<string, unknown>[] = [];
                const now = Date.now();
                for (let i = historyCount; i >= 0; i--) {
                    const ts = new Date(now - i * INTERVAL_MS).toISOString();
                    frames.push(...generateFrame(ts));
                }
                return frames;
            }

            return generateFrame(new Date().toISOString());
        },
        interval: 500,
    },
    revenue: {
        name: 'Quarterly Revenue',
        description: 'Revenue by product and quarter (Stacked Column)',
        columns: [
            { name: 'quarter', type: 'string' },
            { name: 'revenue', type: 'float64' },
            { name: 'product', type: 'string' },
        ],
        generate: (historyCount?: number) => {
            // historyCount is intentionally ignored for non-timestamped category generators
            const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
            const products = ['Product A', 'Product B', 'Product C'];
            const results: Record<string, unknown>[] = [];

            quarters.forEach(q => {
                products.forEach(p => {
                    const key = `revenue_${q}_${p}`;
                    // Initialize if not present
                    if (currentValues[key] === undefined) {
                        // Typed lookup to avoid implicit any
                        const baseData: Record<string, Record<string, number>> = {
                            Q1: { 'Product A': 45000, 'Product B': 32000, 'Product C': 28000 },
                            Q2: { 'Product A': 52000, 'Product B': 38000, 'Product C': 35000 },
                            Q3: { 'Product A': 48000, 'Product B': 42000, 'Product C': 31000 },
                            Q4: { 'Product A': 61000, 'Product B': 45000, 'Product C': 42000 },
                        };
                        const base = baseData[q]?.[p] ?? 30000;
                        currentValues[key] = base;
                    }

                    // Update value
                    currentValues[key] = generateNextValue(currentValues[key], 15000, 85000, 0.05);

                    results.push({
                        quarter: q,
                        revenue: currentValues[key],
                        product: p,
                    });
                });
            });

            return results;
        },
        interval: 1500,
    },
    sales: {
        name: 'Yearly Sales',
        description: 'Sales by category and year (Grouped Bar)',
        columns: [
            { name: 'category', type: 'string' },
            { name: 'value', type: 'float64' },
            { name: 'year', type: 'string' },
        ],
        generate: (historyCount?: number) => {
            // historyCount is intentionally ignored for non-timestamped category generators
            const categories = ['Electronics', 'Clothing', 'Food', 'Books'];
            const years = ['2023', '2024'];
            const results: Record<string, unknown>[] = [];

            categories.forEach(cat => {
                years.forEach(year => {
                    const key = `sales_${cat}_${year}`;
                    // Initialize
                    if (currentValues[key] === undefined) {
                        const baseData: Record<string, Record<string, number>> = {
                            Electronics: { '2023': 85, '2024': 92 },
                            Clothing: { '2023': 62, '2024': 71 },
                            Food: { '2023': 45, '2024': 48 },
                            Books: { '2023': 28, '2024': 35 },
                        };
                        currentValues[key] = baseData[cat]?.[year] ?? 50;
                    }

                    // Update
                    const limits: Record<string, { min: number, max: number }> = {
                        Electronics: { min: 60, max: 110 },
                        Clothing: { min: 40, max: 90 },
                        Food: { min: 30, max: 65 },
                        Books: { min: 15, max: 50 }
                    };
                    const limit = limits[cat] ?? { min: 10, max: 100 };

                    currentValues[key] = generateNextValue(currentValues[key], limit.min, limit.max, 0.08);

                    results.push({
                        category: cat,
                        value: currentValues[key],
                        year: year,
                    });
                });
            });

            return results;
        },
        interval: 1200,
    },
    cpuLoad: {
        name: 'CPU Load',
        description: 'Single server CPU utilization over time',
        columns: [
            { name: 'time', type: 'datetime64' },
            { name: 'value', type: 'float64' },
        ],
        generate: (historyCount?: number) => {
            const INTERVAL_MS = 1000; // must equal this generator's interval property
            if (historyCount && historyCount > 0) {
                const frames: Record<string, unknown>[] = [];
                const now = Date.now();
                for (let i = historyCount; i >= 0; i--) {
                    currentValues['cpuLoad'] = generateNextValue(currentValues['cpuLoad'] ?? 50, 10, 90, 0.15);
                    frames.push({ time: new Date(now - i * INTERVAL_MS).toISOString(), value: currentValues['cpuLoad'] });
                }
                return frames;
            }
            currentValues['cpuLoad'] = generateNextValue(currentValues['cpuLoad'] ?? 50, 10, 90, 0.15);
            return [{ time: new Date().toISOString(), value: currentValues['cpuLoad'] }];
        },
        interval: 1000,
    },
    apiTraffic: {
        name: 'API Traffic',
        description: 'HTTP requests, errors, and timeouts per second',
        columns: [
            { name: 'time', type: 'datetime64' },
            { name: 'metric', type: 'string' },
            { name: 'value', type: 'float64' },
        ],
        generate: (historyCount?: number) => {
            const INTERVAL_MS = 2000; // must equal this generator's interval property
            const metrics = ['requests', 'errors', 'timeouts'];
            const defaults: Record<string, number> = { requests: 120, errors: 5, timeouts: 2 };
            const bounds: Record<string, [number, number]> = { requests: [50, 300], errors: [0, 30], timeouts: [0, 15] };
            const generateFrame = (ts: string): Record<string, unknown>[] =>
                metrics.map(m => {
                    const key = `apiTraffic_${m}`;
                    currentValues[key] = generateNextValue(currentValues[key] ?? defaults[m], bounds[m][0], bounds[m][1], 0.12);
                    return { time: ts, metric: m, value: currentValues[key] };
                });
            if (historyCount && historyCount > 0) {
                const frames: Record<string, unknown>[] = [];
                const now = Date.now();
                for (let i = historyCount; i >= 0; i--) {
                    frames.push(...generateFrame(new Date(now - i * INTERVAL_MS).toISOString()));
                }
                return frames;
            }
            return generateFrame(new Date().toISOString());
        },
        interval: 2000,
    },
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
        interval: 2000,
    },
    productInventory: {
        name: 'Product Inventory',
        description: 'Current stock levels for store products',
        columns: [
            { name: 'timestamp', type: 'datetime64' },
            { name: 'product', type: 'string' },
            { name: 'sales', type: 'float64' },
        ],
        generate: (historyCount?: number) => {
            // historyCount is intentionally ignored for frame-bound generators
            const products = ['Widgets', 'Gadgets', 'Gizmos', 'Doodads'];
            const defaults: Record<string, number> = { Widgets: 120, Gadgets: 85, Gizmos: 95, Doodads: 65 };
            const bounds: Record<string, [number, number]> = {
                Widgets: [80, 160], Gadgets: [50, 120], Gizmos: [60, 130], Doodads: [40, 100],
            };
            const now = new Date().toISOString();
            return products.map(p => {
                const key = `inventory_${p}`;
                currentValues[key] = generateNextValue(currentValues[key] ?? defaults[p], bounds[p][0], bounds[p][1], 0.1);
                return { timestamp: now, product: p, sales: currentValues[key] };
            });
        },
        interval: 2000,
    },
    serviceLoad: {
        name: 'Service Load',
        description: 'Request counts per microservice',
        columns: [
            { name: 'service', type: 'string' },
            { name: 'requests', type: 'float64' },
        ],
        generate: (historyCount?: number) => {
            // historyCount is intentionally ignored for frame-bound generators
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
    httpResponses: {
        name: 'HTTP Responses',
        description: 'HTTP status code distribution',
        columns: [
            { name: 'status', type: 'string' },
            { name: 'count', type: 'float64' },
        ],
        generate: (historyCount?: number) => {
            // historyCount is intentionally ignored for frame-bound generators
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
    cloudRegions: {
        name: 'Cloud Regions',
        description: 'Performance metrics across cloud regions',
        columns: [
            { name: 'region', type: 'string' },
            { name: 'latency', type: 'float64' },
            { name: 'throughput', type: 'float64' },
            { name: 'connections', type: 'float64' },
        ],
        generate: (historyCount?: number) => {
            // historyCount is intentionally ignored for frame-bound generators
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
    serverProfile: {
        name: 'Server Profile',
        description: 'Multi-dimensional health scores for two servers',
        columns: [
            { name: 'dimension', type: 'string' },
            { name: 'value', type: 'float64' },
            { name: 'server', type: 'string' },
        ],
        generate: (historyCount?: number) => {
            // historyCount is intentionally ignored for frame-bound generators
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
    datacenterLoad: {
        name: 'Datacenter Load',
        description: 'CPU load by hour of day and day of week',
        columns: [
            { name: 'hour', type: 'string' },
            { name: 'day', type: 'string' },
            { name: 'load', type: 'float64' },
        ],
        generate: (historyCount?: number) => {
            // historyCount is intentionally ignored for frame-bound generators
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00');
            const rows: Record<string, unknown>[] = [];
            days.forEach(day => {
                hours.forEach(hour => {
                    const key = `dc_${day}_${hour}`;
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
            const INTERVAL_MS = 2000; // must equal this generator's interval property
            const generateCandle = (prevClose: number, ts: string): Record<string, unknown> => {
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
                    const ts = new Date(now - i * INTERVAL_MS).toISOString();
                    const candle = generateCandle(currentValues['candle_close'], ts);
                    currentValues['candle_close'] = candle.close as number;
                    frames.push(candle);
                }
                return frames;
            }
            currentValues['candle_close'] = currentValues['candle_close'] ?? 150;
            const candle = generateCandle(currentValues['candle_close'], new Date().toISOString());
            currentValues['candle_close'] = candle.close as number;
            return [candle];
        },
        interval: 2000,
    },
    activeUsers: {
        name: 'Active Users',
        description: 'Live count of active users on the platform',
        columns: [
            { name: 'activeUsers', type: 'int64' },
        ],
        generate: (historyCount?: number) => {
            // historyCount is intentionally ignored for this single-value generator
            currentValues['activeUsers'] = generateNextValue(currentValues['activeUsers'] ?? 1234, 800, 1800, 0.1);
            return [{ activeUsers: Math.floor(currentValues['activeUsers']) }];
        },
        interval: 1000,
    },
};
