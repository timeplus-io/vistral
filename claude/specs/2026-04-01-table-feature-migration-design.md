# DataTable Feature Migration Design

**Date:** 2026-04-01  
**Branch:** feature/36-table-trend-indicator  
**Source:** axion `packages/viz/src/components/@Table`

---

## Overview

Migrate missing features from the axion table implementation into vistral's `DataTable` component. The axion table has richer per-column configuration that vistral currently lacks.

---

## Features to Migrate

### 1. Trend Indicator

Display a triangle arrow (▲ / ▼) next to a cell value to show whether the value increased or decreased since its last update.

**Config fields added to `tableStyles[colName]`:**
- `trend?: boolean` — enable/disable trend indicator for this column
- `increaseColor?: string` — CSS color for upward change (default: `'#22c55e'` green)
- `decreaseColor?: string` — CSS color for downward change (default: `'#ef4444'` red)

**Trend tracking logic:**
- When `config.temporal?.mode === 'key'`: track previous value **per key field value**. The key field is `config.temporal.field` (string or first element of string array). Trend reflects value change for that key entity across updates.
- Otherwise (no temporal or mode is not `'key'`): compare value in **current last row** vs **previous last row** per column. Tracked in a ref, updated each render.

**Rendering:** Inline CSS border triangle after the value:
- Up triangle: `borderWidth: '0 4px 7px 4px'`, color on bottom border
- Down triangle: `borderWidth: '7px 4px 0 4px'`, color on top border
- No triangle: when no previous value exists or value is unchanged

### 2. `fractionDigits`

**Config field:** `fractionDigits?: number` on `tableStyles[colName]`

Applied to numeric cell display via `toLocaleString(undefined, { maximumFractionDigits: fractionDigits })`. Non-numeric values are unaffected. Default: no constraint (browser default, which is typically up to 3).

### 3. Row Highlight

When a condition has `highlightRow: true` and the condition matches, the entire row gets a semi-transparent background of that condition's color. Cell-level background is suppressed for highlighted rows (row background takes priority).

Implementation: During row rendering, pre-compute a row-level background by checking all columns' conditions for `highlightRow: true` matches. Apply as `backgroundColor` on the `<tr>` element using the color at 20% opacity (via hex alpha or `rgba`).

### 4. Extended Condition Operators

Add string operators to the existing condition type:

```ts
operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | '!contains'
```

- `contains`: `String(cellValue).includes(String(conditionValue))`
- `!contains`: `!String(cellValue).includes(String(conditionValue))`

Also change `value` type from `number` to `string | number` to allow string comparisons with `=` / `contains`.

### 5. Bar Mini Chart

Add `'bar'` to `miniChart` options: `'none' | 'sparkline' | 'bar'`.

Bar renders a small horizontal bar whose width is proportional to the cell value relative to the column's visible max. Uses a simple `<div>` with width set as a percentage, no G2 chart instance needed.

---

## Type Changes (`src/types/index.ts`)

```ts
export interface TableConfig extends ChartConfigBase {
  chartType: 'table';
  tableStyles?: Record<
    string,
    {
      name?: string;
      show?: boolean;
      width?: number;
      fractionDigits?: number;           // NEW
      trend?: boolean;                   // NEW
      increaseColor?: string;            // NEW
      decreaseColor?: string;            // NEW
      miniChart?: 'none' | 'sparkline' | 'bar';  // EXTENDED
      color?: {
        type: 'none' | 'scale' | 'condition';
        colorScale?: string;
        conditions?: Array<{
          operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | '!contains';  // EXTENDED
          value: string | number;        // EXTENDED
          color: string;
          highlightRow?: boolean;        // NEW
        }>;
      };
    }
  >;
  tableWrap?: boolean;
}
```

---

## Implementation Scope (`src/charts/DataTable.tsx`)

### New helpers

**`formatCellValue(value, fractionDigits, isNumeric)`**
Returns display string. Applies `toLocaleString` with `maximumFractionDigits` when numeric.

**`evaluateCondition(cellValue, operator, conditionValue)`**
Evaluates all 8 operators including `contains` / `!contains`. Returns boolean.

**`getCellBackground(value, colorConfig)`** — extend existing function
Call `evaluateCondition` instead of the current switch. Skip `highlightRow` cells at this layer.

**`computeRowHighlight(row, columns, tableStyles)`**
Iterates all columns, checks conditions with `highlightRow: true`. Returns the first matching color (as `rgba` at 20% opacity) or `undefined`.

### New state/refs

**`trendHistoryRef`** — `useRef<Record<string, Record<string, number>>>({})`  
Shape: `{ [keyValue: string]: { [colName: string]: number } }` for key mode.  
Shape: `{ ['__last']: { [colName: string]: number } }` for non-key mode.

Updated after each render via a `useEffect` watching `displayData`.

### Trend computation per cell

Called during row render. Returns `{ sign: '+' | '-', color: string } | null`.

### Bar mini chart

`<CellBar>` component: receives `value` (number) and `maxValue` (number). Renders a `<div>` with `width: (value/maxValue * 100)%`, height `8px`, colored with the theme accent color. Max value computed once per render pass across all visible rows for that column.

### CSS Approach

Replace the current inline `<style>` tag in `DataTable.tsx` with an external CSS file (`src/charts/DataTable.css`), following the same pattern as axion's `table.css`.

The CSS file will use the `.vistral-table` class prefix (consistent with existing vistral naming) and adopt axion's structure:
- `.vistral-table` — base table styles
- `.vistral-table th` — header padding, font-weight, position relative
- `.vistral-table .value-box` — overflow hidden, text-overflow ellipsis, white-space nowrap
- `.vistral-table .resizer` — absolute position right-0, col-resize cursor, opacity 0 by default
- `.vistral-table .resizer.isResizing` — visible highlight color
- `@media (hover: hover)` — resizer shown on hover, hidden otherwise
- Theme variants (`.theme-dark`, `.theme-light`) stay in the CSS file as well

`DataTable.tsx` imports the CSS file: `import './DataTable.css'`

### No new dependencies

All new features use only React primitives and CSS classes. No new npm packages.

---

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Extend `TableConfig` type |
| `src/charts/DataTable.tsx` | Add trend, fractionDigits, row highlight, string conditions, bar chart; import CSS file; remove inline `<style>` tag |
| `src/charts/DataTable.css` | New file: extract and expand inline styles into class-based CSS following axion's table.css pattern |

---

## Testing

Manual testing via the examples app. The existing table example should be extended with:
- A column with `trend: true`, `increaseColor: 'green'`, `decreaseColor: 'red'`
- A numeric column with `fractionDigits: 2`
- A condition with `highlightRow: true`
- A string column with `contains` condition

No automated test changes are required unless the existing table tests cover condition evaluation.
