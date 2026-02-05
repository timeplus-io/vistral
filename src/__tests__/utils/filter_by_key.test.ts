
import { describe, it, expect } from 'vitest';
import { filterByKey } from '../../utils/index';

describe('filterByKey', () => {
    const data = [
        ['group1', 'A', 10],
        ['group1', 'B', 20],
        ['group2', 'A', 30],
        ['group1', 'A', 15], // update to group1/A
        ['group2', 'B', 40],
    ];

    it('should filter by single key index', () => {
        // Key is index 0
        const result = filterByKey(data, 0);
        // group1 -> 15 (latest group1 row)
        // group2 -> 40 (latest group2 row)
        expect(result).toHaveLength(2);
        const group1 = result.find(r => r[0] === 'group1');
        const group2 = result.find(r => r[0] === 'group2');
        expect(group1?.[2]).toBe(15);
        expect(group2?.[2]).toBe(40); // Technically 'group2' 'B' is latest for group 2
    });

    it('should filter by multiple key indices (composite key)', () => {
        // Keys: index 0 and 1 (Group + SubGroup)
        const result = filterByKey(data, [0, 1]);

        // Expected groups:
        // group1::A -> 15
        // group1::B -> 20
        // group2::A -> 30
        // group2::B -> 40
        expect(result).toHaveLength(4);

        const g1a = result.find(r => r[0] === 'group1' && r[1] === 'A');
        expect(g1a?.[2]).toBe(15);

        const g1b = result.find(r => r[0] === 'group1' && r[1] === 'B');
        expect(g1b?.[2]).toBe(20);
    });

    it('should handle empty data', () => {
        expect(filterByKey([], [0])).toEqual([]);
    });

    it('should handle invalid indices', () => {
        expect(filterByKey(data, [-1])).toEqual(data);
    });
});
