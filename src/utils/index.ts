/**
 * Utility functions for stream visualization
 */

import type { ColumnDefinition, DataRow, ProcessedDataSource, StreamDataSource } from '../types';

// Type detection constants
const NUMBER_TYPES = [
  'int8', 'int16', 'int32', 'int64', 'int128', 'int256',
  'uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256',
  'float32', 'float64', 'float', 'double',
  'decimal', 'decimal32', 'decimal64', 'decimal128', 'decimal256',
  'number'
];

const DATETIME_TYPES = ['datetime', 'datetime64', 'date', 'date32', 'timestamp'];

const STRING_TYPES = ['string', 'fixedstring', 'text', 'varchar', 'char'];

/**
 * Check if a column type is numeric
 */
export function isNumericColumn(type: string): boolean {
  const upperType = type.toUpperCase();
  return NUMBER_TYPES.some((t) => upperType.startsWith(t.toUpperCase()));
}

/**
 * Check if a column type is datetime
 */
export function isDateTimeColumn(type: string): boolean {
  const upperType = type.toUpperCase();
  return DATETIME_TYPES.some((t) => upperType.startsWith(t.toUpperCase()));
}

/**
 * Check if a column type is string
 */
export function isStringColumn(type: string): boolean {
  const upperType = type.toUpperCase();
  return STRING_TYPES.some((t) => upperType.startsWith(t.toUpperCase()));
}

/**
 * Check if a column type is boolean
 */
export function isBooleanColumn(type: string): boolean {
  const upperType = type.toUpperCase();
  return upperType === 'BOOL' || upperType === 'BOOLEAN';
}

/**
 * Determine automatic time format mask based on domain range
 */
export function getTimeMask(domainMin: number | Date, domainMax: number | Date): string {
  const date1 = new Date(domainMin);
  const date2 = new Date(domainMax);

  const y1 = date1.getFullYear();
  const m1 = date1.getMonth();
  const d1 = date1.getDate();
  const h1 = date1.getHours();
  const min1 = date1.getMinutes();
  const s1 = date1.getSeconds();

  const y2 = date2.getFullYear();
  const m2 = date2.getMonth();
  const d2 = date2.getDate();
  const h2 = date2.getHours();
  const min2 = date2.getMinutes();
  const s2 = date2.getSeconds();

  if (y1 !== y2) return 'YY/MM/DD';
  if (m1 !== m2) return 'MM/DD';
  if (d1 !== d2) {
    return Math.abs(d1 - d2) > 1 ? 'MM/DD' : 'MM/DD HH:mm:ss';
  }
  if (h1 !== h2 || min1 !== min2 || s1 !== s2) return 'HH:mm:ss';
  return 'HH:mm:ss';
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Truncate a string with ellipsis if too long
 */
export function truncateWithEllipsis(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Format a number with locale formatting
 */
export function formatNumber(num: number, digits = 2): string {
  if (isNaN(num)) return '-';
  return num.toLocaleString('en-US', { maximumFractionDigits: digits });
}

/**
 * Format a large number with abbreviation (k, m, b, t)
 */
export function abbreviateNumber(num: number, decPlaces = 2): string {
  if (isNaN(num)) return '-';

  const abbrev = ['', 'k', 'm', 'b', 't'];
  let tier = 0;
  let scaledNum = num;

  while (Math.abs(scaledNum) >= 1000 && tier < abbrev.length - 1) {
    scaledNum /= 1000;
    tier++;
  }

  return `${scaledNum.toFixed(tier > 0 ? decPlaces : 0)}${abbrev[tier]}`;
}

/**
 * Format duration from milliseconds to human readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  if (isNaN(bytes)) return '-';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get value from a data row by column index or name
 */
export function getRowValue(row: DataRow, column: number | string): unknown {
  if (Array.isArray(row)) {
    return typeof column === 'number' ? row[column] : row[parseInt(column, 10)];
  }
  return row[column as string];
}

/**
 * Convert a row to array format if it's an object
 */
export function rowToArray(row: DataRow, columns: ColumnDefinition[]): unknown[] {
  if (Array.isArray(row)) return row;
  return columns.map((col) => row[col.name]);
}

/**
 * Find column index by name
 */
export function findColumnIndex(columns: ColumnDefinition[], name: string): number {
  return columns.findIndex((col) => col.name === name);
}

/**
 * Get filtered columns by type
 */
export function getColumnsByType(
  columns: ColumnDefinition[],
  filter: 'numeric' | 'datetime' | 'string' | 'boolean' | 'all'
): ColumnDefinition[] {
  switch (filter) {
    case 'numeric':
      return columns.filter((col) => isNumericColumn(col.type));
    case 'datetime':
      return columns.filter((col) => isDateTimeColumn(col.type));
    case 'string':
      return columns.filter((col) => isStringColumn(col.type));
    case 'boolean':
      return columns.filter((col) => isBooleanColumn(col.type));
    default:
      return columns;
  }
}

/**
 * Calculate statistics for a numeric column
 */
export function calculateColumnStats(
  data: DataRow[],
  columnIndex: number
): { min: number; max: number; sum: number; count: number; avg: number } {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;

  for (const row of data) {
    const value = Array.isArray(row) ? row[columnIndex] : Object.values(row)[columnIndex];
    if (typeof value === 'number' && !isNaN(value)) {
      min = Math.min(min, value);
      max = Math.max(max, value);
      sum += value;
      count++;
    }
  }

  return {
    min: min === Infinity ? 0 : min,
    max: max === -Infinity ? 0 : max,
    sum,
    count,
    avg: count > 0 ? sum / count : 0,
  };
}

/**
 * Get unique values for a column (for categorical data)
 */
export function getUniqueValues(data: DataRow[], columnIndex: number): string[] {
  const values = new Set<string>();
  for (const row of data) {
    const value = Array.isArray(row) ? row[columnIndex] : Object.values(row)[columnIndex];
    if (value !== null && value !== undefined) {
      values.add(String(value));
    }
  }
  return Array.from(values);
}

/**
 * Parse datetime value to timestamp
 */
export function parseDateTime(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Process data source into internal format for charts
 */
export function processDataSource(
  source: StreamDataSource,
  xKey: string,
  yKey: string,
  zKey?: string
): ProcessedDataSource {
  const { columns, data } = source;

  const xIndex = findColumnIndex(columns, xKey);
  const yIndex = findColumnIndex(columns, yKey);
  const zIndex = zKey ? findColumnIndex(columns, zKey) : -1;

  const isXTime = xIndex >= 0 && isDateTimeColumn(columns[xIndex].type);

  // Calculate statistics
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  const zValues: string[] = [];

  for (const row of data) {
    const arr = rowToArray(row, columns);

    // X stats
    if (xIndex >= 0) {
      const xVal = isXTime ? parseDateTime(arr[xIndex]) : Number(arr[xIndex]);
      if (!isNaN(xVal)) {
        xMin = Math.min(xMin, xVal);
        xMax = Math.max(xMax, xVal);
      }
    }

    // Y stats
    if (yIndex >= 0) {
      const yVal = Number(arr[yIndex]);
      if (!isNaN(yVal)) {
        yMin = Math.min(yMin, yVal);
        yMax = Math.max(yMax, yVal);
      }
    }

    // Z categories
    if (zIndex >= 0) {
      const zVal = String(arr[zIndex] ?? '');
      if (zVal && !zValues.includes(zVal)) {
        zValues.push(zVal);
      }
    }
  }

  // Transform function for x-axis
  const xTransform = isXTime ? (v: unknown) => parseDateTime(v) : (v: unknown) => v;

  return {
    data: data.map((row) => rowToArray(row, columns)),
    header: columns,
    x: {
      index: xIndex,
      isTime: isXTime,
      min: xMin === Infinity ? 0 : xMin,
      max: xMax === -Infinity ? 0 : xMax,
      offset: 0,
    },
    y: {
      index: yIndex,
      min: yMin === Infinity ? 0 : yMin,
      max: yMax === -Infinity ? 0 : yMax,
    },
    z: {
      index: zIndex,
      values: zValues,
    },
    xTransform,
  };
}

/**
 * Merge deep objects (like lodash merge)
 */
export function mergeDeep<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;

  const source = sources.shift();
  if (!source) return target;

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      target[key] = mergeDeep(
        { ...targetValue } as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else if (sourceValue !== undefined) {
      target[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return mergeDeep(target, ...sources);
}

function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'stream-viz'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
