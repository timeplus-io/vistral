# DataTable Feature Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate trend indicator, fractionDigits, row highlight, extended condition operators, and bar mini chart from the axion table into vistral's DataTable component, and replace inline styles with an external CSS file.

**Architecture:** New pure helper functions (`evaluateCondition`, `formatCellValue`, `hexToRgba`) are added to `DataTable.tsx` and tested in isolation. All visual features plug into the existing `TableCell` and row-render loop. CSS is extracted to `DataTable.css` following axion's class-based pattern.

**Tech Stack:** React 18, TypeScript, Vitest, inline CSS-border triangles for trend arrows, CSS classes for theming.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Modify | Extend `TableConfig` with new fields |
| `src/charts/DataTable.css` | Create | External CSS replacing inline `<style>` tag |
| `src/charts/DataTable.tsx` | Modify | All new logic: trend, fractionDigits, row highlight, bar chart; import CSS |
| `src/__tests__/charts/DataTable.test.ts` | Create | Unit tests for pure helper functions |
| `examples/basic-examples.tsx` | Modify | Extend `KeyBoundTable` to demo trend + fractionDigits + row highlight |

---

## Task 1: Create DataTable.css

**Files:**
- Create: `src/charts/DataTable.css`

- [ ] **Step 1: Create the CSS file**

Create `src/charts/DataTable.css` with this exact content:

```css
/* Base table — following axion table.css pattern */
.vistral-table {
  width: 100%;
  border-collapse: collapse;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
}

.vistral-table th {
  padding: 8px 12px;
  text-align: left;
  font-weight: 500;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vistral-table td {
  padding: 10px 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Value box — used in cells, mirrors axion .value-box */
.vistral-table .value-box {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vistral-table .value-box.wrap {
  white-space: normal;
}

/* Column resizer handle — mirrors axion .resizer */
.vistral-table .resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 8px;
  cursor: col-resize;
  user-select: none;
  touch-action: none;
  opacity: 0;
  background: transparent;
  transition: background-color 0.15s;
}

.vistral-table .resizer.is-resizing {
  opacity: 1;
  background: #3B82F6;
}

@media (hover: hover) {
  .vistral-table th:hover .resizer {
    opacity: 1;
    background: #4B5563;
  }
}

/* ── Dark theme ─────────────────────────────── */
.vistral-table.theme-dark {
  color: #e5e7eb;
  background-color: #111827;
}
.vistral-table.theme-dark th {
  background-color: #374151;
  border-bottom: 1px solid #4b5563;
  color: #d1d5db;
}
.vistral-table.theme-dark td {
  border-bottom: 1px solid #1f2937;
}
.vistral-table.theme-dark tbody tr:nth-child(even) {
  background-color: #1f2937;
}
.vistral-table.theme-dark tbody tr:hover {
  background-color: #374151;
}
.vistral-table.theme-dark td.monospace {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  color: #d1d5db;
}
.vistral-table.theme-dark .type-badge {
  background-color: #374151;
  color: #9ca3af;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
}

/* ── Light theme ────────────────────────────── */
.vistral-table.theme-light {
  color: #1a1c1d;
  background-color: #ffffff;
}
.vistral-table.theme-light th {
  background-color: #e0e0e0;
  border-bottom: 1px solid #c0c0c0;
  color: #4a4a4a;
}
.vistral-table.theme-light td {
  border-bottom: 1px solid #f0f0f0;
}
.vistral-table.theme-light tbody tr:nth-child(even) {
  background-color: #fafafa;
}
.vistral-table.theme-light tbody tr:hover {
  background-color: #f2f7ff;
}
.vistral-table.theme-light td.monospace {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  color: #333;
}
.vistral-table.theme-light .type-badge {
  background-color: #e5e7eb;
  color: #6b7280;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/charts/DataTable.css
git commit -m "feat(table): add external DataTable.css following axion class-based pattern"
```

---

## Task 2: Extend TableConfig Types

**Files:**
- Modify: `src/types/index.ts:191-214`

- [ ] **Step 1: Replace the `TableConfig` interface**

In `src/types/index.ts`, find the `TableConfig` interface (lines 191–214) and replace with:

```ts
// Table Chart Configuration
export interface TableConfig extends ChartConfigBase {
  chartType: 'table';
  /** Column styles and visibility */
  tableStyles?: Record<
    string,
    {
      /** Display name override for the column header */
      name?: string;
      /** Whether column is visible */
      show?: boolean;
      /** Column width in pixels */
      width?: number;
      /** Decimal places for numeric display */
      fractionDigits?: number;
      /** Show ▲▼ trend indicator when value changes */
      trend?: boolean;
      /** CSS color for upward trend (default: #22c55e) */
      increaseColor?: string;
      /** CSS color for downward trend (default: #ef4444) */
      decreaseColor?: string;
      /** Mini chart type rendered inside cell */
      miniChart?: 'none' | 'sparkline' | 'bar';
      /** Cell background color configuration */
      color?: {
        type: 'none' | 'scale' | 'condition';
        colorScale?: string;
        conditions?: Array<{
          /** Comparison operator */
          operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | '!contains';
          /** Value to compare against (string for text operators, number for numeric) */
          value: string | number;
          /** CSS color to apply to the cell background */
          color: string;
          /** When true, the entire row gets this background color at 20% opacity */
          highlightRow?: boolean;
        }>;
      };
    }
  >;
  /** Enable text wrapping in cells */
  tableWrap?: boolean;
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
cd /Users/gangtao/Code/timeplus/vistral && npm run typecheck
```

Expected: zero errors. The existing `KeyBoundTable` example uses `value: 'down' as unknown as number` — after this change the cast is no longer needed, but it still compiles so no example changes required yet.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(table): extend TableConfig with trend, fractionDigits, row highlight, string conditions"
```

---

## Task 3: Add Helper Functions with Tests

**Files:**
- Create: `src/__tests__/charts/DataTable.test.ts`
- Modify: `src/charts/DataTable.tsx` (add helpers near top, before components)

This task adds three pure functions and covers them with tests before touching any rendering code.

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/charts/DataTable.test.ts`:

```ts
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
});

describe('formatCellValue', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatCellValue(null, false)).toBe('');
    expect(formatCellValue(undefined, false)).toBe('');
  });

  it('applies fractionDigits to numeric values', () => {
    expect(formatCellValue(3.14159, true, 2)).toBe('3.14');
    expect(formatCellValue(1000, true, 0)).toBe('1,000');
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
```

- [ ] **Step 2: Run tests — expect failures**

```bash
cd /Users/gangtao/Code/timeplus/vistral && npm test -- src/__tests__/charts/DataTable.test.ts
```

Expected: FAIL — `evaluateCondition`, `formatCellValue`, `hexToRgba` not exported yet.

- [ ] **Step 3: Add the three helper functions to DataTable.tsx**

At the top of `src/charts/DataTable.tsx`, after the imports, add these exported functions (place them **before** `getTableDefaults` and the component definitions):

```ts
/** Evaluate a single condition operator against a cell value. */
export function evaluateCondition(
  cellValue: unknown,
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | '!contains',
  conditionValue: string | number
): boolean {
  if (operator === 'contains') {
    return String(cellValue).includes(String(conditionValue));
  }
  if (operator === '!contains') {
    return !String(cellValue).includes(String(conditionValue));
  }
  if (operator === 'eq') {
    return String(cellValue) === String(conditionValue);
  }
  const num = Number(cellValue);
  if (isNaN(num)) return false;
  const condNum = Number(conditionValue);
  switch (operator) {
    case 'gt':  return num > condNum;
    case 'gte': return num >= condNum;
    case 'lt':  return num < condNum;
    case 'lte': return num <= condNum;
    default:    return false;
  }
}

/** Format a cell value for display, applying fractionDigits when column is numeric. */
export function formatCellValue(
  value: unknown,
  isNumeric: boolean,
  fractionDigits?: number
): string {
  if (value === null || value === undefined) return '';
  if (isNumeric && fractionDigits !== undefined) {
    const num = Number(value);
    if (!isNaN(num)) {
      return num.toLocaleString(undefined, { maximumFractionDigits: fractionDigits });
    }
  }
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value !== null && typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

/** Convert a hex color string to rgba() with the given alpha (0–1). Non-hex colors pass through unchanged. */
export function hexToRgba(hex: string, alpha: number): string {
  // Expand 3-digit hex: #rgb → #rrggbb
  const normalized = hex.replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i, '#$1$1$2$2$3$3');
  const match = /^#([0-9a-f]{6})$/i.exec(normalized);
  if (!match) return hex;
  const r = parseInt(match[1].slice(0, 2), 16);
  const g = parseInt(match[1].slice(2, 4), 16);
  const b = parseInt(match[1].slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd /Users/gangtao/Code/timeplus/vistral && npm test -- src/__tests__/charts/DataTable.test.ts
```

Expected: all 17 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/charts/DataTable.tsx src/__tests__/charts/DataTable.test.ts
git commit -m "feat(table): add evaluateCondition, formatCellValue, hexToRgba helpers with tests"
```

---

## Task 4: Integrate All Features into DataTable.tsx

**Files:**
- Modify: `src/charts/DataTable.tsx`

This is the main implementation task. It does four things in one go because they are all tightly coupled in the render loop:

1. Replace inline `<style>` tag with `import './DataTable.css'`
2. Use `evaluateCondition` in `getCellBackgroundColor` (replace the old switch)
3. Add `computeRowHighlight` + row-level background on `<tr>`
4. Add trend tracking ref + triangle indicator in `TableCell`
5. Add `fractionDigits` formatting via `formatCellValue`
6. Add `CellBar` component for `miniChart: 'bar'`
7. Update `TableHeaderCell` resizer to use CSS class `.resizer` / `.resizer.is-resizing`

- [ ] **Step 1: Add the CSS import and remove the inline style tag**

At the top of `src/charts/DataTable.tsx`, after the existing React import line, add:

```ts
import './DataTable.css';
```

Remove the `const tableStyles = \`...\`` string and the `<style>{tableStyles}</style>` element from the `DataTable` component's JSX.

- [ ] **Step 2: Replace getCellBackgroundColor to use evaluateCondition**

Find the existing `getCellBackgroundColor` function and replace it entirely:

```ts
function getCellBackgroundColor(
  value: unknown,
  colorConfig?: TableCellColorConfig,
  forHighlightRow = false
): string | undefined {
  if (!colorConfig || colorConfig.type === 'none') return undefined;

  if (colorConfig.type === 'condition' && colorConfig.conditions) {
    for (const condition of colorConfig.conditions) {
      // Skip highlightRow conditions unless we're computing row-level background
      if (condition.highlightRow && !forHighlightRow) continue;
      if (!condition.highlightRow && forHighlightRow) continue;
      if (evaluateCondition(value, condition.operator, condition.value)) {
        return condition.color;
      }
    }
  }

  return undefined;
}
```

Also update the `TableCellColorConfig` type alias at the top of the file to match the new condition shape:

```ts
type TableCellColorConfig = {
  type: 'none' | 'scale' | 'condition';
  colorScale?: string;
  conditions?: Array<{
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | '!contains';
    value: string | number;
    color: string;
    highlightRow?: boolean;
  }>;
};
```

- [ ] **Step 3: Add computeRowHighlight helper**

Add this function after `getCellBackgroundColor`:

```ts
function computeRowHighlight(
  row: unknown[],
  columns: { name: string; type: string }[],
  styles: TableConfig['tableStyles']
): string | undefined {
  if (!styles) return undefined;
  for (const col of columns) {
    const colStyle = styles[col.name];
    if (colStyle?.color?.type !== 'condition' || !colStyle.color.conditions) continue;
    const colIndex = columns.indexOf(col);
    const cellValue = row[colIndex];
    for (const cond of colStyle.color.conditions) {
      if (cond.highlightRow && evaluateCondition(cellValue, cond.operator, cond.value)) {
        return hexToRgba(cond.color, 0.2);
      }
    }
  }
  return undefined;
}
```

- [ ] **Step 4: Add CellBar component**

Add after the `CellSparkline` component:

```tsx
const CellBar: React.FC<{ value: number; maxValue: number; isDark: boolean }> = ({
  value,
  maxValue,
  isDark,
}) => {
  const pct = maxValue > 0 ? Math.min(100, (Math.abs(value) / maxValue) * 100) : 0;
  return (
    <div
      style={{
        width: '80px',
        height: '8px',
        backgroundColor: isDark ? '#374151' : '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: isDark ? '#6366f1' : '#4f46e5',
          borderRadius: '4px',
        }}
      />
    </div>
  );
};
```

- [ ] **Step 5: Add trendHistoryRef and trend-per-cell computation to DataTable**

Inside the `DataTable` component, after the existing `sparklineHistoryRef`:

```ts
// Trend tracking: stores previous numeric value per (keyValue or '__last') per column
const trendHistoryRef = useRef<Record<string, Record<string, number>>>({});
```

Add a new `useEffect` after the sparkline update effect:

```ts
// Update trend history after each data change
useEffect(() => {
  if (!config.tableStyles) return;

  const trendCols = Object.entries(config.tableStyles)
    .filter(([, style]) => style?.trend)
    .map(([name]) => name);

  if (trendCols.length === 0) return;

  const isKeyMode = config.temporal?.mode === 'key';
  const keyField = isKeyMode
    ? (Array.isArray(config.temporal!.field) ? config.temporal!.field[0] : config.temporal!.field)
    : null;
  const keyColIndex = keyField
    ? dataSource.columns.findIndex((c) => c.name === keyField)
    : -1;

  displayData.forEach((row, rowIndex) => {
    const bucket = isKeyMode && keyColIndex >= 0
      ? String(row[keyColIndex])
      : `__row_${rowIndex}`;

    if (!trendHistoryRef.current[bucket]) {
      trendHistoryRef.current[bucket] = {};
    }

    trendCols.forEach((colName) => {
      const colIndex = dataSource.columns.findIndex((c) => c.name === colName);
      if (colIndex < 0) return;
      const value = Number(row[colIndex]);
      if (!isNaN(value)) {
        trendHistoryRef.current[bucket][colName] = value;
      }
    });
  });
}, [displayData, config.tableStyles, config.temporal, dataSource.columns]);
```

Add a pure helper (outside the component, after `computeRowHighlight`) to compute trend for a single cell:

```ts
function getTrend(
  currentValue: unknown,
  prevValue: number | undefined,
  increaseColor = '#22c55e',
  decreaseColor = '#ef4444'
): { sign: '+' | '-'; color: string } | null {
  if (prevValue === undefined) return null;
  const curr = Number(currentValue);
  if (isNaN(curr) || curr === prevValue) return null;
  return curr > prevValue
    ? { sign: '+', color: increaseColor }
    : { sign: '-', color: decreaseColor };
}
```

- [ ] **Step 6: Update TableCell to use formatCellValue, trend indicator, and CellBar**

Replace the entire `TableCell` component with:

```tsx
const TableCell: React.FC<{
  value: unknown;
  isNumeric: boolean;
  fractionDigits?: number;
  miniChart?: 'none' | 'sparkline' | 'bar';
  sparklineData?: number[];
  barMaxValue?: number;
  color?: TableCellColorConfig;
  trend?: { sign: '+' | '-'; color: string } | null;
  wrap?: boolean;
  isMonospace?: boolean;
  isDark?: boolean;
}> = ({
  value,
  isNumeric,
  fractionDigits,
  miniChart,
  sparklineData = [],
  barMaxValue = 0,
  color,
  trend,
  wrap,
  isMonospace,
  isDark = true,
}) => {
  const bgColor = getCellBackgroundColor(value, color);
  const displayValue = formatCellValue(value, isNumeric, fractionDigits);

  return (
    <td
      className={isMonospace ? 'monospace' : ''}
      style={{
        textAlign: isNumeric ? 'right' : 'left',
        backgroundColor: bgColor,
        maxWidth: '300px',
      }}
      title={String(value ?? '')}
    >
      <div
        className={`value-box${wrap ? ' wrap' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: isNumeric ? 'flex-end' : 'flex-start',
        }}
      >
        {miniChart === 'sparkline' && sparklineData.length > 0 && (
          <CellSparkline data={sparklineData} />
        )}
        {miniChart === 'bar' && (
          <CellBar value={Number(value)} maxValue={barMaxValue} isDark={isDark} />
        )}
        <span>{displayValue}</span>
        {trend && (
          <span
            style={{
              display: 'inline-block',
              width: 0,
              height: 0,
              marginLeft: '2px',
              borderStyle: 'solid',
              ...(trend.sign === '+'
                ? {
                    borderWidth: '0 4px 7px 4px',
                    borderColor: `transparent transparent ${trend.color} transparent`,
                    marginBottom: '1px',
                  }
                : {
                    borderWidth: '7px 4px 0 4px',
                    borderColor: `${trend.color} transparent transparent transparent`,
                    marginTop: '1px',
                  }),
            }}
          />
        )}
      </div>
    </td>
  );
};
```

- [ ] **Step 7: Update TableHeaderCell to use CSS class for resizer**

In the `TableHeaderCell` component, replace the resizer `<div>`'s inline `style` with a className approach:

```tsx
<div
  ref={resizeRef}
  className={`resizer${isResizing ? ' is-resizing' : ''}`}
  onMouseDown={handleMouseDown}
  onMouseEnter={(e) => {
    if (!isResizing) {
      (e.currentTarget as HTMLDivElement).style.opacity = '1';
    }
  }}
  onMouseLeave={(e) => {
    if (!isResizing) {
      (e.currentTarget as HTMLDivElement).style.opacity = '0';
    }
  }}
/>
```

Remove all the existing inline `backgroundColor` / `transition` style properties from the resizer div.

- [ ] **Step 8: Update DataTable render loop to wire up row highlight, trend, and bar max**

Inside the `DataTable` component's JSX, replace the `<tbody>` section with:

```tsx
<tbody>
  {displayData.map((row, rowIndex) => {
    // Row highlight: check all columns for highlightRow conditions
    const rowHighlight = computeRowHighlight(
      row,
      dataSource.columns,
      config.tableStyles
    );

    // Trend and key bucket for this row
    const isKeyMode = config.temporal?.mode === 'key';
    const keyField = isKeyMode
      ? (Array.isArray(config.temporal!.field) ? config.temporal!.field[0] : config.temporal!.field)
      : null;
    const keyColIndex = keyField
      ? dataSource.columns.findIndex((c) => c.name === keyField)
      : -1;
    const bucket = isKeyMode && keyColIndex >= 0
      ? String(row[keyColIndex])
      : `__row_${rowIndex}`;

    return (
      <tr key={rowIndex} style={rowHighlight ? { backgroundColor: rowHighlight } : undefined}>
        <td
          style={{
            textAlign: 'center',
            fontWeight: 500,
            opacity: 0.7,
          }}
        >
          {rowIndex + 1}
        </td>
        {visibleColumns.map((col) => {
          const colIndex = dataSource.columns.findIndex((c) => c.name === col.name);
          const value = row[colIndex];
          const colStyle = config.tableStyles?.[col.name];
          const sparklineKey = `${rowIndex}-${col.name}`;
          const numeric = isNumericColumn(col.type);

          // Trend
          const prevValue = trendHistoryRef.current[bucket]?.[col.name];
          const trend = colStyle?.trend
            ? getTrend(value, prevValue, colStyle.increaseColor, colStyle.decreaseColor)
            : null;

          // Bar max value: max across visible rows for this column
          const barMaxValue = numeric && colStyle?.miniChart === 'bar'
            ? Math.max(...displayData.map((r) => {
                const idx = dataSource.columns.findIndex((c) => c.name === col.name);
                return Math.abs(Number(r[idx]));
              }).filter((v) => !isNaN(v)))
            : 0;

          return (
            <TableCell
              key={col.name}
              value={value}
              isNumeric={numeric}
              fractionDigits={colStyle?.fractionDigits}
              miniChart={colStyle?.miniChart}
              sparklineData={sparklineHistoryRef.current[sparklineKey]}
              barMaxValue={barMaxValue}
              color={colStyle?.color as TableCellColorConfig}
              trend={trend}
              wrap={config.tableWrap}
              isMonospace={col.type === 'string'}
              isDark={isDarkTheme(theme)}
            />
          );
        })}
      </tr>
    );
  })}
</tbody>
```

Also update the outer container `div` to use class `vistral-table` instead of `vistral-data-table`:

In the `DataTable` return, change the outer container className from `vistral-data-table` to `vistral-table` and the `<table>` element to include the class:

```tsx
<div
  ref={containerRef}
  className={`${className || ''}`}
  style={{
    width: '100%',
    height: '100%',
    overflow: 'auto',
    ...style,
  }}
  data-testid="data-table"
>
  <table className={`vistral-table ${isDarkTheme(theme) ? 'theme-dark' : 'theme-light'}`}>
```

- [ ] **Step 9: Typecheck and test**

```bash
cd /Users/gangtao/Code/timeplus/vistral && npm run typecheck && npm test -- src/__tests__/charts/DataTable.test.ts
```

Expected: zero type errors, all tests pass.

- [ ] **Step 10: Commit**

```bash
git add src/charts/DataTable.tsx
git commit -m "feat(table): add trend indicator, fractionDigits, row highlight, bar chart; use external CSS"
```

---

## Task 5: Update Example to Demo New Features

**Files:**
- Modify: `examples/basic-examples.tsx:689-712` (`KeyBoundTable`)

The `KeyBoundTable` example uses key-bound temporal mode with a `service` key — perfect for demonstrating trend indicators per service.

- [ ] **Step 1: Update the KeyBoundTable config**

Replace the `config` object in `KeyBoundTable` (lines 689–712) with:

```ts
const config: TableConfig = {
  chartType: 'table',
  temporal: {
    mode: 'key',
    field: 'service',
  },
  tableStyles: {
    last_updated: { name: 'Last Updated', width: 200 },
    service: { name: 'Service', width: 150 },
    status: {
      name: 'Status',
      width: 100,
      color: {
        type: 'condition',
        conditions: [
          { operator: 'eq', value: 'down', color: 'rgba(239, 68, 68, 0.3)', highlightRow: true },
          { operator: 'eq', value: 'degraded', color: 'rgba(251, 146, 60, 0.3)' },
          { operator: 'eq', value: 'healthy', color: 'rgba(34, 197, 94, 0.2)' },
        ],
      },
    },
    latency_ms: {
      name: 'Latency (ms)',
      width: 140,
      fractionDigits: 0,
      trend: true,
      increaseColor: '#ef4444',
      decreaseColor: '#22c55e',
      miniChart: 'bar',
    },
    uptime: {
      name: 'Uptime %',
      width: 110,
      fractionDigits: 2,
      trend: true,
      increaseColor: '#22c55e',
      decreaseColor: '#ef4444',
    },
  },
};
```

- [ ] **Step 2: Start dev server and visually verify**

```bash
cd /Users/gangtao/Code/timeplus/vistral && npm run dev:examples
```

Open `http://localhost:3000`. Navigate to "Example 11: Table with Key-Bound Temporal Mode" and verify:
- Each service row shows ▲ or ▼ next to `latency_ms` and `uptime` when values change
- `latency_ms` has a horizontal bar chart in the cell
- `uptime` shows 2 decimal places (e.g., `99.73`)
- Rows with `status = 'down'` have the entire row highlighted in red
- Rows with `status = 'degraded'` show the cell in orange
- Rows with `status = 'healthy'` show the cell in green
- Column resizer handle appears on header hover

- [ ] **Step 3: Commit**

```bash
git add examples/basic-examples.tsx
git commit -m "feat(table): update KeyBoundTable example to demo trend, fractionDigits, row highlight, bar chart"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 5 spec features covered: trend (Task 4 steps 5–6), fractionDigits (Tasks 2, 4-step 6), row highlight (Tasks 2, 4 steps 3, 8), string conditions + `contains`/`!contains` (Tasks 2, 3), bar mini chart (Task 4 step 4), CSS file (Task 1).
- [x] **No placeholders:** All code blocks are complete and concrete.
- [x] **Type consistency:** `evaluateCondition` signature matches across Task 3 (definition), Task 4 step 2 (usage in `getCellBackgroundColor`), and Task 4 step 3 (usage in `computeRowHighlight`). `TableCellColorConfig` updated in step 2 before it's used in step 6.
- [x] **CSS class names consistent:** `vistral-table`, `.resizer`, `.is-resizing`, `.value-box`, `.theme-dark`, `.theme-light` match between `DataTable.css` (Task 1) and `DataTable.tsx` usages (Task 4).
- [x] **`trendHistoryRef` update timing:** The `useEffect` writes previous values AFTER render; `getTrend` reads them DURING render, so on first render for a key there's no prev (returns null — correct). On subsequent renders the prev value is set.
- [x] **`highlightRow` cell suppression:** `getCellBackgroundColor` with `forHighlightRow = false` (default) skips `highlightRow` conditions, so cell bg is not double-colored when the row is highlighted. The row-level `computeRowHighlight` uses `forHighlightRow = true`.
