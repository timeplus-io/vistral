

import { buildG2Options } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('Interval Mark Crash Reproduction', () => {
    it('should generate valid G2 options for interval mark with ordinal scale and key mode', () => {
        const spec: VistralSpec = {
            marks: [
                {
                    type: "interval",
                    encode: {
                        x: "cpu",
                        y: "server",
                        color: "server"
                    },
                    style: {}
                }
            ],
            scales: {
                x: { type: "linear" },
                y: { type: "ordinal", nice: true } // The problematic scale
            },
            streaming: { maxItems: 500 },
            temporal: { mode: "key", field: "server" },
            axes: {
                x: { title: false, grid: false },
                y: { title: false, grid: true }
            },
            legend: { position: "bottom", interactive: true },
            theme: "dark",
            animate: false
        };

        const data = [
            { server: 's1', cpu: 10, timestamp: 1000 },
            { server: 's2', cpu: 20, timestamp: 1000 },
            { server: 's1', cpu: 15, timestamp: 2000 }
        ];

        const g2 = buildG2Options(spec, data);

        // Inspection
        const layer0 = g2.children?.[0];
        expect(layer0).toBeDefined();

        // We expect the Y scale to be compatible with interval mark.
        // If it returns 'ordinal', G2 crashes. If it returns 'band', G2 works.
        // We want to verify if Vistral converts it or leaves it as is.
        // For the purpose of this test, we asserting the CURRENT behavior (bug) matches the output,
        // or we assert the DESIRED behavior if we are TDDing.
        // Let's assert what we have effectively:

        const yScale = layer0?.scale?.y;
        // console.log('Y Scale:', yScale);

        // The fix should essentially ensure this is 'band'
        expect(yScale?.type).toBe('band');
    });
});
