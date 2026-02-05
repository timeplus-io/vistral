import { describe, it, expect } from 'vitest';
import { buildG2Options } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('applyTemporalTransforms Key Mode', () => {
    // Tests: field=key (explicit semantic), implicit time field detection
    it('should use temporal.field as Key and automatically detect timestamp field', () => {
        const spec: VistralSpec = {
            temporal: { mode: 'key', field: 'device' }, // 'device' is the Key
            marks: [{
                type: 'line',
                encode: { x: 'timestamp', y: 'value', color: 'device' }
            }]
        };

        const data = [
            // Ordered mixed to prove it finds latest by time, not just last row
            { timestamp: new Date(1000).toISOString(), value: 10, device: 'A' },
            { timestamp: new Date(1000).toISOString(), value: 30, device: 'B' },
            { timestamp: new Date(2000).toISOString(), value: 20, device: 'A' }, // Latest for A
            { timestamp: new Date(3000).toISOString(), value: 40, device: 'B' }  // Latest for B
        ];

        const g2 = buildG2Options(spec, data);

        expect(g2.data).toBeDefined();
        if (g2.data) {
            const deviceA = g2.data.find((d: any) => d.device === 'A');
            const deviceB = g2.data.find((d: any) => d.device === 'B');

            expect(g2.data.length).toBe(2);
            // DEBUG: Dump data if deviceA is missing
            if (!deviceA) {
                expect(JSON.stringify(g2.data, null, 2)).toBe('Expected device A to be found');
            }

            expect(deviceA).toBeDefined();
            expect(deviceB).toBeDefined();

            if (!deviceA || !deviceB) return;

            // Check raw values
            expect(deviceA.timestamp).toBeDefined();
            expect(typeof deviceA.timestamp).toBe('string');

            // Assuming parseDateTime is a utility function available in the test environment
            const parseDateTime = (val: any) => new Date(val).getTime();

            const tsA = parseDateTime(deviceA.timestamp);
            const tsB = parseDateTime(deviceB.timestamp);

            expect(tsA).toBe(2000);
            expect(tsB).toBe(3000);
        }
    });

    // Tests: Fallback time detection (field named 'time')
    it('should detect "time" field if "timestamp" is missing', () => {
        const spec: VistralSpec = {
            temporal: { mode: 'key', field: 'server' },
            marks: [{ type: 'interval', encode: { x: 'server', y: 'cpu' } }]
        };

        const data = [
            { time: 100, server: 's1', cpu: 10 },
            { time: 200, server: 's1', cpu: 50 }, // Latest
        ];

        const g2 = buildG2Options(spec, data);
        expect(g2.data?.length).toBe(1);
        expect(g2.data?.[0].cpu).toBe(50);
    });
});
