import { describe, it, expect } from 'vitest';
import { buildG2Options } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('buildG2Options Interval Mark Issue', () => {
    it('should NOT force "time" scale on interval marks (requires band)', () => {
        const spec: VistralSpec = {
            temporal: { mode: 'axis', field: 'time', range: 5 },
            marks: [{
                type: 'interval',
                encode: { x: 'time', y: 'count' }
            }]
        };

        const now = Date.now();
        const data = [
            { time: new Date(now).toISOString(), count: 10 },
        ];

        const g2 = buildG2Options(spec, data);
        const child = g2.children[0];
        const xScale = child.scale?.x;

        // For interval marks, we usually need 'band' or identity scales to handle width.
        // Spec engine should NOT force 'time' type which causes getBandWidth() crash in G2.
        // If it is undefined, G2 infers it. If it is 'time', it crashes.
        // We expect it to be UNDEFINED (letting G2 handle it) or explicitly NOT 'time'.
        if (xScale) {
            expect(xScale.type).not.toBe('time');
        } else {
            expect(xScale).toBeUndefined();
        }
    });
});
