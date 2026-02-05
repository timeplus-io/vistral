/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Spec Engine — converts VistralSpec + data into renderable configuration.
 *
 * This module is the heart of the declarative pipeline. It takes a
 * VistralSpec and the current data snapshot and produces transforms,
 * scales, and other derived configuration that downstream renderers
 * (e.g. AntV G2) can consume.
 */

import type {
  VistralSpec,
  TransformSpec,
  MarkSpec,
  LabelSpec,
  AnnotationSpec,
  CoordinateSpec,
  AxesSpec,
  AxisChannelSpec,
} from '../types/spec';
import { parseDateTime, getTimeMask } from '../utils';
import { getChartThemeColors } from './chart-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the maximum parsed timestamp across all rows for the given field.
 * If data is empty, returns `Date.now()` as a sensible fallback.
 */
function getMaxTimestamp(
  data: Record<string, unknown>[],
  field: string
): number {
  if (data.length === 0) return Date.now();

  let max = -Infinity;
  for (const row of data) {
    const ts = parseDateTime(row[field]);
    if (ts > max) {
      max = ts;
    }
  }
  return max === -Infinity ? Date.now() : max;
}

// ---------------------------------------------------------------------------
// Temporal transform injection
// ---------------------------------------------------------------------------

/**
 * Analyse the `temporal` section of a VistralSpec and inject the appropriate
 * data transforms (filter / sortBy) at the **front** of the spec's transform
 * pipeline. The original spec is not mutated; a shallow copy is returned.
 *
 * ### Modes
 *
 * - **axis** — sliding time-window.  When `range` is a finite number (minutes),
 *   a `filter` keeping data within `[max - range*60000, max]` is prepended,
 *   followed by a `sortBy` on the temporal field.  When `range` is `'Infinity'`
 *   or `undefined`, only the `sortBy` is injected.
 *
 * - **frame** — snapshot at latest timestamp.  A `filter` keeping only rows
 *   whose temporal field equals the max timestamp is prepended.
 *
 * - **key** — latest-per-key de-duplication.  A `filter` keeping only rows
 *   whose temporal value matches the latest timestamp for their key is
 *   prepended.  Requires `temporal.keyField`.
 */
export function applyTemporalTransforms(
  spec: VistralSpec,
  data: Record<string, unknown>[]
): VistralSpec {
  const { temporal } = spec;
  if (!temporal) return spec;

  const { mode, field } = temporal;
  const newTransforms: TransformSpec[] = [];

  switch (mode) {
    case 'axis': {
      const { range } = temporal;

      // Inject a time-window filter when range is a finite number.
      if (typeof range === 'number' && range !== Infinity) {
        // Axis mode expects a single time field
        const timeField = Array.isArray(field) ? field[0] : field;
        const maxTs = getMaxTimestamp(data, timeField);
        const windowMs = range * 60_000;
        const minTs = maxTs - windowMs;

        newTransforms.push({
          type: 'filter',
          callback: (d: Record<string, unknown>) => {
            const ts = parseDateTime(d[timeField]);
            return ts >= minTs && ts <= maxTs;
          },
        });
      }

      // Always inject sortBy for axis mode.
      newTransforms.push({
        type: 'sortBy',
        fields: Array.isArray(field) ? field : [field],
      });
      break;
    }

    case 'frame': {
      const timeField = Array.isArray(field) ? field[0] : field;
      const maxTs = getMaxTimestamp(data, timeField);

      newTransforms.push({
        type: 'filter',
        callback: (d: Record<string, unknown>) =>
          parseDateTime(d[timeField]) === maxTs,
      });
      break;
    }

    case 'key': {
      // In 'key' mode, the `field` property represents the categorical Key (e.g. 'server').
      const keyFields = Array.isArray(temporal.field) ? temporal.field : [temporal.field];
      let timeField = 'timestamp'; // default guess

      // We need to find the timestamp field to determine "latest".
      // Heuristic: check for common names or first date-like field.
      if (data.length > 0) {
        const row = data[0];
        if (Object.prototype.hasOwnProperty.call(row, 'timestamp')) timeField = 'timestamp';
        else if (Object.prototype.hasOwnProperty.call(row, 'time')) timeField = 'time';
        else if (Object.prototype.hasOwnProperty.call(row, 'date')) timeField = 'date';
        else {
          // Scan for a value that looks like a timestamp
          for (const k in row) {
            // key fields are NOT time fields
            if (keyFields.includes(k)) continue;
            if (parseDateTime(row[k]) > 0) {
              timeField = k;
              break;
            }
          }
        }
      }

      // Build a lookup: keyValue -> latest timestamp.
      const latestByKey = new Map<string, number>();
      for (const row of data) {
        const key = keyFields.map(f => String(row[f] ?? '')).join('::');
        const ts = parseDateTime(row[timeField]);
        const prev = latestByKey.get(key);
        if (prev === undefined || ts > prev) {
          latestByKey.set(key, ts);
        }
      }

      newTransforms.push({
        type: 'filter',
        callback: (d: Record<string, unknown>) => {
          const key = keyFields.map(f => String(d[f] ?? '')).join('::');
          const ts = parseDateTime(d[timeField]);
          return latestByKey.get(key) === ts;
        },
      });
      break;
    }
  }

  if (newTransforms.length === 0) return spec;

  // Prepend temporal transforms before any existing transforms.
  const existingTransforms = spec.transforms ?? [];
  return {
    ...spec,
    transforms: [...newTransforms, ...existingTransforms],
  };
}

// ---------------------------------------------------------------------------
// G2 Spec Translation
// ---------------------------------------------------------------------------

/**
 * Translate a CoordinateSpec to G2 format.
 * Renames `transforms` to `transform`.
 */
function translateCoordinate(
  coord: CoordinateSpec
): Record<string, any> {
  const { transforms, ...rest } = coord;
  const result: Record<string, any> = { ...rest };
  if (transforms) {
    result.transform = transforms;
  }
  return result;
}

/**
 * Translate an AxisChannelSpec to G2 axis channel format.
 */
function translateAxisChannel(
  axis: AxisChannelSpec,
  colors: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {};

  if (axis.title !== undefined) {
    result.title = axis.title;
    result.titleFill = colors.text;
    result.titleFillOpacity = 1;
  }
  if (axis.grid !== undefined) {
    result.grid = axis.grid;
    result.gridStroke = colors.gridline;
    result.gridStrokeOpacity = 1;
  }
  if (axis.line !== undefined) {
    result.line = axis.line;
    result.lineStroke = colors.line;
    result.lineStrokeOpacity = 1;
  }

  // Force tick visibility and color
  result.tick = true;
  result.tickStroke = colors.line;
  result.tickStrokeOpacity = 1;

  // Force label color
  result.labelFill = colors.text;
  result.labelFillOpacity = 1;

  if (axis.labels) {
    if (axis.labels.format !== undefined) {
      result.labelFormatter = axis.labels.format;
    }
    if (axis.labels.rotate !== undefined) {
      result.labelTransform = [{ type: 'rotate', angle: axis.labels.rotate }];
    }
  }

  return result;
}

/**
 * Translate AxesSpec to G2 axis format.
 */
function translateAxes(
  axes: AxesSpec,
  theme: 'dark' | 'light' = 'dark'
): Record<string, any> {
  const result: Record<string, any> = {};
  const colors = getChartThemeColors(theme);

  for (const channel of ['x', 'y'] as const) {
    const value = axes[channel];
    if (value === undefined) continue;
    if (value === false) {
      result[channel] = false;
    } else {
      result[channel] = translateAxisChannel(value, colors);
    }
  }

  return result;
}

/**
 * Translate a LabelSpec to G2 label format.
 * Converts `overlapHide` to `transform: [{ type: 'overlapHide' }]`.
 */
function translateLabel(
  label: LabelSpec
): Record<string, any> {
  const { overlapHide, ...rest } = label;
  const result: Record<string, any> = { ...rest };

  if (overlapHide) {
    result.transform = [{ type: 'overlapHide' }];
  }

  return result;
}

/**
 * Translate an AnnotationSpec to a G2 child entry.
 */
function translateAnnotation(
  annotation: AnnotationSpec
): Record<string, any> {
  const child: Record<string, any> = {
    type: annotation.type,
  };

  if (annotation.encode) {
    child.encode = annotation.encode;
  }
  if (annotation.style) {
    child.style = annotation.style;
  }
  if (annotation.value !== undefined) {
    child.data = [annotation.value];
  }
  if (annotation.label !== undefined) {
    child.labels = [{ text: annotation.label }];
  }

  return child;
}

/**
 * Translate a single MarkSpec to a G2 child entry.
 */
function translateMark(
  mark: MarkSpec,
  spec: VistralSpec
): Record<string, any> {
  const child: Record<string, any> = {
    type: mark.type,
  };

  // Encode
  if (mark.encode) {
    child.encode = { ...mark.encode };
  }

  // Scale: merge top-level scales with per-mark scales (per-mark wins)
  const topScales = spec.scales ?? {};
  const markScales = mark.scales ?? {};
  const mergedScales = { ...topScales, ...markScales };

  // --- Interval Mark Safety ---
  // If the mark is 'interval' (bar/column), G2 strictly requires a 'band' scale
  // for the categorical axis to calculate bandwidth. 'ordinal' (point) scales cause crashes.
  if (mark.type === 'interval') {
    // Detect which axis is likely categorical (band).
    // Usually X for column chart, Y for bar chart.
    // Heuristic: check if the scale type is explicitly 'ordinal'.
    for (const channel in mergedScales) {
      // eslint-disable-next-line no-prototype-builtins
      if (mergedScales.hasOwnProperty(channel)) {
        const sc = mergedScales[channel];
        if (sc?.type === 'ordinal') {
          // Coerce to 'band'
          mergedScales[channel] = { ...sc, type: 'band' };
        }
      }
    }
  }

  if (Object.keys(mergedScales).length > 0) {
    child.scale = mergedScales;
  }

  // Transforms: prepend top-level transforms before mark transforms
  const topTransforms = spec.transforms ?? [];
  const markTransforms = mark.transforms ?? [];
  const allTransforms = [...topTransforms, ...markTransforms];
  if (allTransforms.length > 0) {
    child.transform = allTransforms;
  }

  // Style
  if (mark.style) {
    child.style = mark.style;
  }

  // Labels
  if (mark.labels) {
    child.labels = mark.labels.map(translateLabel);
  }

  // Tooltip
  if (mark.tooltip !== undefined) {
    child.tooltip = mark.tooltip === false ? false : mark.tooltip;
  }

  // Animate: per-mark overrides top-level
  const animate = mark.animate ?? spec.animate;
  if (animate !== undefined) {
    child.animate = animate;
  }

  return child;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Translate a VistralSpec into a G2-compatible options object.
 *
 * This is a **pure function** — no G2 imports, no DOM access, no side effects.
 * It produces a plain object that can be handed to `chart.options(result)`.
 */
export function translateToG2Spec(
  spec: VistralSpec
): Record<string, any> {
  const g2: Record<string, any> = {
    type: 'view',
  };

  // Pre-analysis for Horizontal Bar Chart (Interval with X=Continuous, Y=Discrete)
  let shouldSwapAxes = false;
  if (!spec.coordinate) {
    const topScales = spec.scales ?? {};
    for (const mark of spec.marks) {
      if (mark.type === 'interval') {
        const markScales = mark.scales ?? {};
        const mergedScales = { ...topScales, ...markScales };

        const xScaleType = mergedScales.x?.type || 'linear';
        const yScaleType = mergedScales.y?.type || 'linear';

        const isXContinuous = ['linear', 'time', 'log', 'pow', 'sqrt'].includes(xScaleType);
        // check 'ordinal' too because we coerce it later, but here we detect intent
        const isYDiscrete = ['band', 'ordinal', 'point'].includes(yScaleType);

        if (isXContinuous && isYDiscrete) {
          shouldSwapAxes = true;
          break;
        }
      }
    }
  }

  // Coordinate
  if (spec.coordinate) {
    g2.coordinate = translateCoordinate(spec.coordinate);
  } else if (shouldSwapAxes) {
    g2.coordinate = { transform: [{ type: 'transpose' }] };
  }

  // Axes
  if (spec.axes) {
    // If swapping axes, we must swap the axis configuration too
    const effectiveAxes = shouldSwapAxes
      ? { ...spec.axes, x: spec.axes.y, y: spec.axes.x }
      : spec.axes;
    g2.axis = translateAxes(effectiveAxes, spec.theme);
  }

  // Legend
  if (spec.legend !== undefined) {
    if (spec.legend === false) {
      g2.legend = false;
    } else {
      const colors = getChartThemeColors(spec.theme ?? 'dark');
      g2.legend = {
        color: {
          position: spec.legend.position,
          // Explicitly inject colors to override G2 defaults/dimming
          itemLabelFill: colors.text,
          itemLabelFillOpacity: 1,
          itemNameFill: colors.text,
          itemNameFillOpacity: 1,
          titleFill: colors.text,
          titleFillOpacity: 1,
          // G2 5.0+ specific style overrides
          itemLabel: {
            fill: colors.text,
            fillOpacity: 1,
            fontSize: 12,
          },
          itemName: {
            fill: colors.text,
            fillOpacity: 1,
            fontSize: 12,
          },
        },
      };
    }
  }

  // Interactions: array → object map
  if (spec.interactions) {
    const interaction: Record<string, any> = {};
    for (const { type, ...options } of spec.interactions) {
      interaction[type] = options;
    }
    g2.interaction = interaction;
  }

  // Children: marks + annotations
  const children: Record<string, any>[] = spec.marks.map((mark) => {
    // If we are swapping axes, we need to swap the mark's encoding and scales 
    // BEFORE passing to translateMark (or inside it).
    // Let's create a "swapped" mark definition to pass down.
    if (shouldSwapAxes && mark.type === 'interval') {
      const swappedMark = { ...mark };

      // Swap Encodes
      if (mark.encode) {
        swappedMark.encode = { ...mark.encode };
        const oldX = swappedMark.encode.x;
        const oldY = swappedMark.encode.y;
        if (oldX) swappedMark.encode.y = oldX; else delete swappedMark.encode.y;
        if (oldY) swappedMark.encode.x = oldY; else delete swappedMark.encode.x;
      }

      // Swap Scales
      if (mark.scales) {
        swappedMark.scales = { ...mark.scales };
        const oldX = swappedMark.scales.x;
        const oldY = swappedMark.scales.y;
        if (oldX) swappedMark.scales.y = oldX; else delete swappedMark.scales.y;
        if (oldY) swappedMark.scales.x = oldY; else delete swappedMark.scales.x;
      }

      // Note: top-level scales also need swapping but `translateMark` retrieves them from `spec.scales`.
      // We need `translateMark` to use SWAPPED top-level scales.
      // So we pass a "virtual spec" to translateMark.
      const swappedSpec = { ...spec };
      if (spec.scales) {
        swappedSpec.scales = { ...spec.scales };
        const oldX = swappedSpec.scales.x;
        const oldY = swappedSpec.scales.y;
        if (oldX) swappedSpec.scales.y = oldX; else delete swappedSpec.scales.y;
        if (oldY) swappedSpec.scales.x = oldY; else delete swappedSpec.scales.x;
      }

      return translateMark(swappedMark, swappedSpec);
    }

    return translateMark(mark, spec);
  });

  if (spec.annotations) {
    for (const annotation of spec.annotations) {
      children.push(translateAnnotation(annotation));
    }
  }

  g2.children = children;

  return g2;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

/**
 * Build a G2 theme configuration object from a Vistral theme name.
 * Defaults to 'dark' when the theme argument is undefined.
 */
export function applySpecTheme(
  theme: 'dark' | 'light' | undefined
): Record<string, any> {
  const colors = getChartThemeColors(theme ?? 'dark');

  return {
    view: { viewFill: colors.background },
    label: { fill: colors.text, fontSize: 11, fillOpacity: 1 },
    axis: {
      x: {
        line: { stroke: colors.line, strokeOpacity: 1 },
        tick: { stroke: colors.line, strokeOpacity: 1 },
        label: { fill: colors.text, fontSize: 11, fillOpacity: 1 },
        title: { fill: colors.text, fontSize: 12, fontWeight: 500, fillOpacity: 1 },
        grid: { stroke: colors.gridline },
      },
      y: {
        line: { stroke: colors.line, strokeOpacity: 1 },
        tick: { stroke: colors.line, strokeOpacity: 1 },
        label: { fill: colors.text, fontSize: 11, fillOpacity: 1 },
        title: { fill: colors.text, fontSize: 12, fontWeight: 500, fillOpacity: 1 },
        grid: { stroke: colors.gridline },
      },
    },
    legend: {
      label: { fill: colors.text, fontSize: 12, fillOpacity: 1 },
      title: { fill: colors.text, fontSize: 12, fillOpacity: 1 },
      itemLabel: { fill: colors.text, fontSize: 12, fillOpacity: 1 },
      itemName: { fill: colors.text, fontSize: 12, fillOpacity: 1 },
      itemValue: { fill: colors.textSecondary, fontSize: 12, fillOpacity: 1 },
    },
    legendCategory: {
      itemLabel: { fill: colors.text, fillOpacity: 1 },
      itemName: { fill: colors.text, fillOpacity: 1 },
    },
  };
}

// ---------------------------------------------------------------------------
// Temporal data filtering (in JavaScript)
// ---------------------------------------------------------------------------

/**
 * Apply temporal filtering and sorting to data **in JavaScript** rather than
 * relying on G2 data transforms.  This is the preferred approach for the
 * declarative `chart.options()` API because G2 mark-level `transform` is
 * intended for visual transforms (stackY, dodgeX, …) — not data filtering.
 *
 * Returns a new array; the input is never mutated.
 */
export function filterDataByTemporal(
  spec: VistralSpec,
  data: Record<string, unknown>[]
): Record<string, unknown>[] {
  const { temporal } = spec;
  if (!temporal || data.length === 0) return data;

  const { mode, field } = temporal;
  let result = data;

  switch (mode) {
    case 'axis': {
      const { range } = temporal;

      // Time-window filter
      if (typeof range === 'number' && range !== Infinity) {
        const timeField = Array.isArray(field) ? field[0] : field;
        const maxTs = getMaxTimestamp(data, timeField);
        const windowMs = range * 60_000;
        const minTs = maxTs - windowMs;

        result = result.filter((d) => {
          const ts = parseDateTime(d[timeField]);
          return ts >= minTs && ts <= maxTs;
        });
      }

      // Sort by temporal field
      const sortField = Array.isArray(field) ? field[0] : field;
      result = [...result].sort(
        (a, b) => parseDateTime(a[sortField]) - parseDateTime(b[sortField])
      );
      break;
    }

    case 'frame': {
      const timeField = Array.isArray(field) ? field[0] : field;
      const maxTs = getMaxTimestamp(data, timeField);
      result = result.filter((d) => parseDateTime(d[timeField]) === maxTs);
      break;
    }

    case 'key': {
      // In 'key' mode, the `field` property represents the categorical Key (e.g. 'server').
      const keyFields = Array.isArray(temporal.field) ? temporal.field : [temporal.field];
      let timeField = 'timestamp'; // default guess

      // We need to find the timestamp field to determine "latest".
      // Heuristic: check for common names or first date-like field.
      if (data.length > 0) {
        const row = data[0];
        if (Object.prototype.hasOwnProperty.call(row, 'timestamp')) timeField = 'timestamp';
        else if (Object.prototype.hasOwnProperty.call(row, 'time')) timeField = 'time';
        else if (Object.prototype.hasOwnProperty.call(row, 'date')) timeField = 'date';
        else {
          // Scan for a value that looks like a timestamp
          for (const k in row) {
            if (keyFields.includes(k)) continue;
            if (parseDateTime(row[k]) > 0) {
              timeField = k;
              break;
            }
          }
        }
      }

      const latestByKey = new Map<string, number>();
      for (const row of data) {
        const key = keyFields.map(f => String(row[f] ?? '')).join('::');
        const ts = parseDateTime(row[timeField]);
        const prev = latestByKey.get(key);
        if (prev === undefined || ts > prev) {
          latestByKey.set(key, ts);
        }
      }

      result = result.filter((d) => {
        const key = keyFields.map(f => String(d[f] ?? '')).join('::');
        const ts = parseDateTime(d[timeField]);
        return latestByKey.get(key) === ts;
      });
      break;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Pipeline helpers
// ---------------------------------------------------------------------------

/**
 * Collect the set of data-field names that are encoded to a channel whose
 * scale `type` is `'time'`.  G2 needs Date objects (or epoch numbers) for
 * time scales — raw ISO strings are not parsed automatically.
 */
function collectTimeFields(spec: VistralSpec): Set<string> {
  const timeFields = new Set<string>();
  const topScales: Record<string, any> = spec.scales ?? {};

  for (const mark of spec.marks) {
    const markScales: Record<string, any> = mark.scales ?? {};
    const merged = { ...topScales, ...markScales };

    for (const [channel, scaleConfig] of Object.entries(merged)) {
      if (scaleConfig?.type === 'time') {
        const fieldName = mark.encode?.[channel];
        if (typeof fieldName === 'string') {
          timeFields.add(fieldName);
        }
      }
    }
  }

  // The temporal field is usually a date...
  // BUT if it is encoded to a 'band' scale (e.g. in a Bar Chart), 
  // we must NOT convert it to a Date object, otherwise G2 will override the band scale with a time scale.
  if (spec.temporal?.field) {
    // In 'key' mode, the fields is the KEY, not the time.
    if (spec.temporal.mode === 'key') {
      return timeFields;
    }

    const fields = Array.isArray(spec.temporal.field) ? spec.temporal.field : [spec.temporal.field];
    let isBand = false;

    for (const mark of spec.marks) {
      const markScales: Record<string, any> = mark.scales ?? {};
      const merged = { ...topScales, ...markScales };

      for (const [channel, encodedField] of Object.entries(mark.encode ?? {})) {
        if (fields.includes(encodedField as string)) {
          const type = merged[channel]?.type;
          if (type === 'band') {
            isBand = true;
          }
        }
      }
    }

    if (!isBand) {
      fields.forEach(f => timeFields.add(f));
    }
  }

  return timeFields;
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

/**
 * Main pipeline — combines temporal data filtering, G2 spec translation, and
 * theme application into a single G2-ready options object.
 *
 * 1. `filterDataByTemporal(spec, data)` — filter/sort data in JavaScript
 * 2. `translateToG2Spec(spec)` — produce G2 options (no visual transforms)
 * 3. `applySpecTheme(spec.theme)` — attach theme configuration
 * 4. Attach filtered data + sliding time domain to each child mark
 *
 * The returned object is ready for `chart.options(result)`.
 */
export function buildG2Options(
  spec: VistralSpec,
  data: Record<string, unknown>[]
): Record<string, any> {
  // Filter/sort data in JS — do NOT inject temporal transforms into G2
  let filteredData = filterDataByTemporal(spec, data);

  // --- Convert time-scale fields to Date objects ----------------------------
  // G2's time scale cannot parse ISO 8601 strings directly; it needs Date
  // objects (or epoch numbers).  Collect every data field that is encoded to a
  // channel whose scale `type` is `'time'` and convert those field values.
  const timeFields = collectTimeFields(spec);
  if (timeFields.size > 0 && filteredData.length > 0) {
    filteredData = filteredData.map((row) => {
      const newRow = { ...row };
      for (const f of timeFields) {
        if (newRow[f] !== undefined) {
          newRow[f] = new Date(parseDateTime(newRow[f]));
        }
      }
      return newRow;
    });
  }

  // Translate spec to G2 (only visual transforms like stackY/dodgeX reach G2)
  const g2Spec = translateToG2Spec(spec);
  g2Spec.theme = applySpecTheme(spec.theme);

  // Attach filtered data at the view level.  Child marks inherit from the
  // view; annotations that already carry their own `data` (set by
  // translateAnnotation) keep it — G2 lets child-level data override.
  g2Spec.data = filteredData;

  // --- Axis-mode temporal: set sliding time domain on appropriate scale ---
  // This makes the axis scroll forward as new data arrives.
  if (spec.temporal?.mode === 'axis' && filteredData.length > 0) {
    const field = spec.temporal.field;
    const timeField = Array.isArray(field) ? field[0] : field;
    const maxTs = getMaxTimestamp(filteredData, timeField);
    const range = spec.temporal.range;

    let minTs: number;
    if (typeof range === 'number' && range !== Infinity) {
      minTs = maxTs - range * 60_000;
    } else {
      // No finite range — span the full data extent
      minTs = maxTs;
      for (const row of filteredData) {
        const ts = parseDateTime(row[timeField]);
        if (ts < minTs) minTs = ts;
      }
    }

    // Auto-detect a suitable time format mask
    // Check both axes for mask config, though usually it's on the temporal axis
    const xMask = (spec.scales?.x as Record<string, unknown> | undefined)?.mask;
    const yMask = (spec.scales?.y as Record<string, unknown> | undefined)?.mask;
    const mask = (xMask || yMask) as string | undefined ?? getTimeMask(minTs, maxTs);

    if (g2Spec.children) {
      for (const child of g2Spec.children) {
        if (!child.scale) child.scale = {};

        // Interval marks (bars) usually require a 'band' scale for width calculation.
        // Forcing 'time' scale can cause internal G2 crashes (getBandWidth error).
        // Since data is already filtered by time, we can skip enforcing time scale here.
        if (child.type === 'interval') {
          continue;
        }

        // Find which channel is using the temporal field
        let targetChannel: 'x' | 'y' | null = null;

        // Check local encode first
        if (child.encode) {
          if (child.encode.x === timeField) targetChannel = 'x';
          else if (child.encode.y === timeField) targetChannel = 'y';
        }

        // If not found in local mark, could rely on defaults but Vistral requires explicit encode usually.
        // If we found a target channel, update its scale.
        if (targetChannel) {
          // Don't override an explicit 'band' scale with 'time'
          const existingType = child.scale[targetChannel]?.type || (spec.scales?.[targetChannel] as any)?.type;
          if (existingType === 'band') {
            continue;
          }

          child.scale[targetChannel] = {
            ...(child.scale[targetChannel] ?? {}),
            type: 'time',
            domainMin: new Date(minTs),
            domainMax: new Date(maxTs),
            mask,
          };
        }
      }
    }
  }

  return g2Spec;
}
