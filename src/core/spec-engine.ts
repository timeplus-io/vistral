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
import { parseDateTime } from '../utils';
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
        const maxTs = getMaxTimestamp(data, field);
        const windowMs = range * 60_000;
        const minTs = maxTs - windowMs;

        newTransforms.push({
          type: 'filter',
          callback: (d: Record<string, unknown>) => {
            const ts = parseDateTime(d[field]);
            return ts >= minTs && ts <= maxTs;
          },
        });
      }

      // Always inject sortBy for axis mode.
      newTransforms.push({
        type: 'sortBy',
        fields: [field],
      });
      break;
    }

    case 'frame': {
      const maxTs = getMaxTimestamp(data, field);

      newTransforms.push({
        type: 'filter',
        callback: (d: Record<string, unknown>) =>
          parseDateTime(d[field]) === maxTs,
      });
      break;
    }

    case 'key': {
      const { keyField } = temporal;
      if (!keyField) break;

      // Build a lookup: keyValue -> latest timestamp.
      const latestByKey = new Map<string, number>();
      for (const row of data) {
        const key = String(row[keyField] ?? '');
        const ts = parseDateTime(row[field]);
        const prev = latestByKey.get(key);
        if (prev === undefined || ts > prev) {
          latestByKey.set(key, ts);
        }
      }

      newTransforms.push({
        type: 'filter',
        callback: (d: Record<string, unknown>) => {
          const key = String(d[keyField] ?? '');
          const ts = parseDateTime(d[field]);
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
  axis: AxisChannelSpec
): Record<string, any> {
  const result: Record<string, any> = {};

  if (axis.title !== undefined) {
    result.title = axis.title;
  }
  if (axis.grid !== undefined) {
    result.grid = axis.grid;
  }
  if (axis.line !== undefined) {
    result.line = axis.line;
  }

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
  axes: AxesSpec
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const channel of ['x', 'y'] as const) {
    const value = axes[channel];
    if (value === undefined) continue;
    if (value === false) {
      result[channel] = false;
    } else {
      result[channel] = translateAxisChannel(value);
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

  // Coordinate
  if (spec.coordinate) {
    g2.coordinate = translateCoordinate(spec.coordinate);
  }

  // Axes
  if (spec.axes) {
    g2.axis = translateAxes(spec.axes);
  }

  // Legend
  if (spec.legend !== undefined) {
    if (spec.legend === false) {
      g2.legend = false;
    } else {
      g2.legend = { color: { position: spec.legend.position } };
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
  const children: Record<string, any>[] = spec.marks.map((mark) =>
    translateMark(mark, spec)
  );

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
    label: { fill: colors.text, fontSize: 11 },
    axis: {
      x: {
        line: { stroke: colors.line },
        tick: { stroke: colors.line },
        label: { fill: colors.text, fontSize: 11 },
        title: { fill: colors.text, fontSize: 12, fontWeight: 500 },
        grid: { stroke: colors.gridline },
      },
      y: {
        line: { stroke: colors.line },
        tick: { stroke: colors.line },
        label: { fill: colors.text, fontSize: 11 },
        title: { fill: colors.text, fontSize: 12, fontWeight: 500 },
        grid: { stroke: colors.gridline },
      },
    },
    legend: {
      label: { fill: colors.text, fontSize: 12 },
      title: { fill: colors.text, fontSize: 12 },
      itemLabel: { fill: colors.text, fontSize: 12 },
      itemName: { fill: colors.text, fontSize: 12 },
      itemValue: { fill: colors.textSecondary, fontSize: 12 },
    },
    legendCategory: {
      itemLabel: { fill: colors.text },
      itemName: { fill: colors.text },
    },
  };
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

/**
 * Main pipeline — combines temporal transforms, G2 spec translation, and
 * theme application into a single G2-ready options object.
 *
 * 1. `applyTemporalTransforms(spec, data)` — inject time-based transforms
 * 2. `translateToG2Spec(specWithTemporal)` — produce G2 options
 * 3. `applySpecTheme(spec.theme)` — attach theme configuration
 *
 * The returned object is ready for `chart.options(result)`.
 */
export function buildG2Options(
  spec: VistralSpec,
  data: Record<string, unknown>[]
): Record<string, any> {
  const specWithTemporal = applyTemporalTransforms(spec, data);
  const g2Spec = translateToG2Spec(specWithTemporal);
  g2Spec.theme = applySpecTheme(spec.theme);
  return g2Spec;
}
