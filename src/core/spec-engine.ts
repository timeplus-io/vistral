/**
 * Spec Engine — converts VistralSpec + data into renderable configuration.
 *
 * This module is the heart of the declarative pipeline. It takes a
 * VistralSpec and the current data snapshot and produces transforms,
 * scales, and other derived configuration that downstream renderers
 * (e.g. AntV G2) can consume.
 */

import type { VistralSpec, TransformSpec } from '../types/spec';
import { parseDateTime } from '../utils';

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
