import { describe, it, expect } from 'vitest';
import { buildG2Options } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('buildG2Options Reproduction', () => {
    it('should apply time domain to Y axis when Y is temporal field, keeping X axis linear', () => {
        const spec: VistralSpec = {
            temporal: { mode: 'axis', field: 'time', range: 5 },
            marks: [{
                type: 'line',
                encode: { x: 'cpu', y: 'time' }
            }],
            scales: {
                x: { type: 'linear' },
                y: { type: 'time' }
            }
        };

        const now = Date.now();
        const data = [
            { time: new Date(now - 60_000).toISOString(), cpu: 50 },
            { time: new Date(now).toISOString(), cpu: 60 },
        ];

        const g2 = buildG2Options(spec, data);
        const child = g2.children[0];
        const xScale = child.scale?.x;
        const yScale = child.scale?.y;

        // X scale should stay linear as configured (not forced to time)
        // Note: If no explicit type was given, G2 might infer linear for cpu numbers, 
        // but Vistral shouldn't force 'time'.
        if (xScale) {
            expect(xScale.type).not.toBe('time');
            expect(xScale.type).toBe('linear');
        }

        // Check data conversion
        expect(g2.data).toBeDefined();
        expect(g2.data.length).toBe(2);
        // Timestamp should be converted to Date object because it is encoded to Y (which is 'time')
        expect(g2.data[0].time).toBeInstanceOf(Date);
        expect(g2.data[0].cpu).toBeTypeOf('number');

        // Y scale needs to be 'time' AND have the sliding window domain
        expect(yScale).toBeDefined();
        expect(yScale.type).toBe('time');
        expect(yScale.domainMin).toBeInstanceOf(Date);
        expect(yScale.domainMax).toBeInstanceOf(Date);

        // Check specific domain values to be sure it's the sliding window
        expect(yScale.domainMax.getTime()).toBe(now); // Max timestamp in data
        expect(yScale.domainMin.getTime()).toBe(now - 5 * 60_000); // 5 min range
    });
});
