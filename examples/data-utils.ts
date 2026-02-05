
// Shared Data Generators for Playgrounds

export interface Column {
    name: string;
    type: string;
}

export interface DataGenerator {
    name: string;
    description?: string;
    columns: Column[];
    generate: () => Record<string, unknown>[];
    interval: number;
}

// Helper to simulate random walk
const generateNextValue = (current: number, min: number, max: number, volatility: number = 0.1): number => {
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
        generate: () => {
            const servers = ['server-01', 'server-02', 'server-03', 'server-04'];
            const now = new Date().toISOString();
            return servers.map(server => {
                const cpuKey = `${server}_cpu`;
                const memKey = `${server}_mem`;
                currentValues[cpuKey] = generateNextValue(currentValues[cpuKey] ?? 50, 10, 95, 0.15);
                currentValues[memKey] = generateNextValue(currentValues[memKey] ?? 60, 20, 90, 0.1);

                return {
                    timestamp: now,
                    server,
                    cpu: currentValues[cpuKey],
                    memory: currentValues[memKey],
                    requests: Math.floor(Math.random() * 500) + 100,
                };
            });
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
        generate: () => {
            const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN'];
            const now = new Date().toISOString();
            return symbols.map(symbol => {
                const priceKey = `${symbol}_price`;
                const basePrices: Record<string, number> = { AAPL: 180, GOOGL: 140, MSFT: 380, AMZN: 175 };
                const basePrice = basePrices[symbol] || 100;
                currentValues[priceKey] = generateNextValue(currentValues[priceKey] ?? basePrice, basePrice * 0.9, basePrice * 1.1, 0.02);

                const prevPrice = currentValues[`${symbol}_prev`] ?? currentValues[priceKey];
                const change = ((currentValues[priceKey] - prevPrice) / prevPrice) * 100;
                currentValues[`${symbol}_prev`] = currentValues[priceKey];

                return {
                    timestamp: now,
                    symbol,
                    price: currentValues[priceKey],
                    volume: Math.floor(Math.random() * 10000) + 1000,
                    change,
                };
            });
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
        generate: () => {
            const locations = ['Warehouse A', 'Warehouse B', 'Office', 'Lab'];
            const now = new Date().toISOString();
            return locations.map(location => {
                const tempKey = `${location}_temp`;
                const humKey = `${location}_hum`;
                currentValues[tempKey] = generateNextValue(currentValues[tempKey] ?? 22, 15, 35, 0.08);
                currentValues[humKey] = generateNextValue(currentValues[humKey] ?? 45, 30, 70, 0.1);

                return {
                    timestamp: now,
                    location,
                    temperature: currentValues[tempKey],
                    humidity: currentValues[humKey],
                    battery: Math.floor(Math.random() * 30) + 70,
                };
            });
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
        generate: () => {
            const vehicles = ['truck-01', 'truck-02', 'truck-03', 'van-01', 'van-02'];
            const statuses = ['moving', 'moving', 'moving', 'stopped', 'loading'];
            const now = new Date().toISOString();
            // Updat random vehicle
            const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
            const latKey = `${vehicle}_lat`;
            const lngKey = `${vehicle}_lng`;
            currentValues[latKey] = generateNextValue(currentValues[latKey] ?? (40 + Math.random() * 2), 39, 42, 0.01);
            currentValues[lngKey] = generateNextValue(currentValues[lngKey] ?? (-74 + Math.random() * 2), -76, -72, 0.01);

            return [{
                timestamp: now,
                vehicle_id: vehicle,
                latitude: currentValues[latKey],
                longitude: currentValues[lngKey],
                speed: Math.floor(Math.random() * 60) + 20,
                status: statuses[Math.floor(Math.random() * statuses.length)],
            }];
        },
        interval: 1000,
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
        generate: () => {
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
            const now = new Date().toISOString();

            return [{
                timestamp: now,
                level: levels[Math.floor(Math.random() * levels.length)],
                service: services[Math.floor(Math.random() * services.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                duration_ms: Math.floor(Math.random() * 500) + 10,
            }];
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
        generate: () => {
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
        generate: () => {
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
};
