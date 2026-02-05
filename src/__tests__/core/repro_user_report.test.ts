
import { describe, it, expect } from 'vitest';
import { buildG2Options } from '../../core/spec-engine';
import type { VistralSpec } from '../../types/spec';

describe('User Reported Interval Crash', () => {
    it('should generate band scale for y axis given user spec', () => {
        const spec: VistralSpec = {
            "marks": [
                {
                    "type": "interval",
                    "encode": {
                        "x": "cpu",
                        "y": "server",
                        "color": "server"
                    },
                    "style": {}
                }
            ],
            "scales": {
                "x": {
                    "type": "linear"
                },
                "y": {
                    "type": "band"
                }
            },
            "streaming": {
                "maxItems": 500
            },
            "temporal": {
                "mode": "key",
                "field": "server"
            },
            "axes": {
                "x": {
                    "title": false,
                    "grid": false
                },
                "y": {
                    "title": false,
                    "grid": true
                }
            },
            "legend": {
                "position": "bottom",
                "interactive": true
            },
            "theme": "dark",
            "animate": false
        };

        const data = [
            { server: 's1', cpu: 10, timestamp: 1000 },
            { server: 's2', cpu: 20, timestamp: 1000 },
            { server: 's1', cpu: 15, timestamp: 2000 }
        ];

        const g2 = buildG2Options(spec, data);

        const layer0 = g2.children?.[0];
        const yScale = layer0?.scale?.y;

        console.log('User Spec G2 Output Y Scale:', JSON.stringify(yScale, null, 2));
        console.log('User Spec G2 Output Encoding:', JSON.stringify(layer0?.encode, null, 2));
        console.log('User Spec G2 Children Scale:', JSON.stringify(layer0?.scale, null, 2));

        expect(yScale).toBeDefined();
        // The Y scale type (originally passed as Y=Band) should now be on the X channel of the generated spec?
        // Wait, did we swap the scales too? Yes.
        // So Logic X scale should be Band. Logic Y scale should be Linear.
        // Let's check Logic X.
        const layer0X = layer0?.scale?.x;
        expect(layer0X.type).toBe('band');
        expect(layer0?.scale?.y?.type).toBe('linear');

        // Check Encoding
        // Original: x: cpu, y: server
        // Swapped: x: server, y: cpu
        expect(layer0?.encode?.x).toBe('server');
        expect(layer0?.encode?.y).toBe('cpu');

        // AND we expect the coordinate to be transposed automatically
        expect(g2.coordinate).toBeDefined();
        expect(g2.coordinate.transform).toEqual([{ type: 'transpose' }]);
    });
});
