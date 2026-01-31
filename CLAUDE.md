# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vistral is a React streaming data visualization library built on AntV G2. It provides real-time chart components (line, area, bar, column, single value, data table) with TypeScript support, dark/light themes, and optimized streaming data handling.

## Common Commands

```bash
npm run build          # Build library (CommonJS + ESM + TypeScript declarations)
npm run dev            # Watch mode - rebuilds library on changes
npm run dev:examples   # Start Vite dev server at http://localhost:3000 to view examples
npm run test           # Run tests with Vitest
npm run test:coverage  # Run tests with coverage
npm run lint           # ESLint check
npm run typecheck      # TypeScript type checking only
```

## Architecture

### Data Flow

1. **StreamDataSource** - Input format with `columns` (schema) and `data` (rows as arrays or objects)
2. **useDataSource hook** - Processes raw data via `processDataSource()` utility
3. **Chart components** - Render using AntV G2 chart instances managed by `useChart` hook

### Component Hierarchy

- **StreamChart** - Universal router that selects appropriate chart based on `config.chartType`
  - Routes to: `TimeSeriesChart` (line/area), `BarColumnChart` (bar/column), `SingleValueChart`, `DataTable`, `GeoChart`
  - Wraps all charts in `ChartErrorBoundary`

### Key Patterns

- **useStreamingData hook** - Manages streaming data with size limits. Note: `append()` treats arrays as multiple items, so wrap single row arrays: `append([[row]])` not `append([row])`
- **useSparklineData hook** - Internally accumulates value history for sparkline rendering
- **Theme system** - Dark/light themes defined in `src/themes/`, applied via `applyChartTheme()`
- **Color palettes** - 5 multi-color (Dawn, Morning, Midnight, Ocean, Sunset) and 9 single-color palettes

### Type Definitions

All chart configs extend `ChartConfigBase`. Key types in `src/types/index.ts`:
- `TimeSeriesConfig` - line/area charts
- `BarColumnConfig` - bar/column charts
- `SingleValueConfig` - single metric display
- `TableConfig` - data table
- `GeoChartConfig` - geographic map with points

## Build Output

- `dist/index.js` - CommonJS
- `dist/index.esm.js` - ES Module
- `dist/index.d.ts` - TypeScript declarations
- `dist/styles.css` - Extracted CSS
