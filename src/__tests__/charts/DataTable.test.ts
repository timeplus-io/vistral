import { describe, it, expect } from 'vitest';
import { evaluateCondition, formatCellValue, hexToRgba } from '../../charts/DataTable';

describe('evaluateCondition', () => {
  it('gt: returns true when cell > condition', () => {
    expect(evaluateCondition(10, 'gt', 5)).toBe(true);
    expect(evaluateCondition(5, 'gt', 10)).toBe(false);
    expect(evaluateCondition(5, 'gt', 5)).toBe(false);
  });

  it('gte: returns true when cell >= condition', () => {
    expect(evaluateCondition(5, 'gte', 5)).toBe(true);
    expect(evaluateCondition(4, 'gte', 5)).toBe(false);
  });

  it('lt: returns true when cell < condition', () => {
    expect(evaluateCondition(3, 'lt', 5)).toBe(true);
    expect(evaluateCondition(5, 'lt', 5)).toBe(false);
  });

  it('lte: returns true when cell <= condition', () => {
    expect(evaluateCondition(5, 'lte', 5)).toBe(true);
    expect(evaluateCondition(6, 'lte', 5)).toBe(false);
  });

  it('eq: compares as strings (handles string values)', () => {
    expect(evaluateCondition('down', 'eq', 'down')).toBe(true);
    expect(evaluateCondition('down', 'eq', 'up')).toBe(false);
    expect(evaluateCondition(42, 'eq', 42)).toBe(true);
    expect(evaluateCondition(42, 'eq', '42')).toBe(true);
  });

  it('contains: substring match', () => {
    expect(evaluateCondition('hello world', 'contains', 'world')).toBe(true);
    expect(evaluateCondition('hello world', 'contains', 'xyz')).toBe(false);
  });

  it('!contains: negated substring match', () => {
    expect(evaluateCondition('hello world', '!contains', 'xyz')).toBe(true);
    expect(evaluateCondition('hello world', '!contains', 'world')).toBe(false);
  });

  it('numeric operators return false for non-numeric cell values', () => {
    expect(evaluateCondition('abc', 'gt', 5)).toBe(false);
    expect(evaluateCondition('abc', 'lt', 5)).toBe(false);
  });

  it('numeric operators return false for null/undefined cell values', () => {
    expect(evaluateCondition(null, 'gt', -1)).toBe(false);
    expect(evaluateCondition(undefined, 'lt', 100)).toBe(false);
    expect(evaluateCondition(null, 'lte', 0)).toBe(false);
  });
});

describe('formatCellValue', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatCellValue(null, false)).toBe('');
    expect(formatCellValue(undefined, false)).toBe('');
  });

  it('applies fractionDigits to numeric values', () => {
    expect(formatCellValue(3.14159, true, 2)).toBe('3.14');
    // Use parseFloat to avoid locale-specific thousand separators
    const result = formatCellValue(1000, true, 0);
    expect(parseFloat(result.replace(/[^0-9.]/g, ''))).toBe(1000);
  });

  it('ignores fractionDigits for non-numeric columns', () => {
    expect(formatCellValue('hello', false, 2)).toBe('hello');
  });

  it('does not apply fractionDigits when undefined', () => {
    const result = formatCellValue(3.14159, true, undefined);
    expect(result).toBe('3.14159');
  });

  it('serializes arrays to JSON', () => {
    expect(formatCellValue([1, 2, 3], false)).toBe('[1,2,3]');
  });

  it('serializes plain objects to JSON', () => {
    expect(formatCellValue({ a: 1 }, false)).toBe('{\n  "a": 1\n}');
  });

  it('converts other types to string', () => {
    expect(formatCellValue(true, false)).toBe('true');
    expect(formatCellValue(42, false)).toBe('42');
  });
});

describe('hexToRgba', () => {
  it('converts 6-digit hex to rgba', () => {
    expect(hexToRgba('#ff0000', 0.2)).toBe('rgba(255, 0, 0, 0.2)');
    expect(hexToRgba('#22c55e', 0.2)).toBe('rgba(34, 197, 94, 0.2)');
  });

  it('converts 3-digit hex to rgba', () => {
    expect(hexToRgba('#f00', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('returns original value for non-hex colors (passthrough)', () => {
    expect(hexToRgba('rgba(255,0,0,0.3)', 0.2)).toBe('rgba(255,0,0,0.3)');
    expect(hexToRgba('red', 0.2)).toBe('red');
  });
});
