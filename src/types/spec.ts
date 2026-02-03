/**
 * VistralSpec — declarative grammar types for streaming visualizations.
 *
 * These types define a renderer-agnostic specification that can be compiled
 * down to AntV G2 options (or other backends in the future).
 */

// ---------------------------------------------------------------------------
// Accessor
// ---------------------------------------------------------------------------

/** Accessor function for computed encodings. */
export type EncodeFn = (datum: Record<string, unknown>) => unknown;

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

/** Streaming data management configuration. */
export interface StreamingSpec {
  /** Maximum number of data items to keep in memory. Default: 1000 */
  maxItems?: number;
  /** How incoming data is merged with existing data. Default: 'append' */
  mode?: 'append' | 'replace';
  /** Minimum interval (ms) between render updates. Default: 0 */
  throttle?: number;
}

// ---------------------------------------------------------------------------
// Temporal
// ---------------------------------------------------------------------------

/** Temporal bounding — controls how time-windowed data is managed. */
export interface TemporalSpec {
  /** Temporal binding mode. */
  mode: 'axis' | 'frame' | 'key';
  /** Field used for temporal binding. */
  field: string;
  /** Time range in minutes (axis-mode only). */
  range?: number | 'Infinity';
  /** Key field for de-duplication (key-mode only). */
  keyField?: string;
}

// ---------------------------------------------------------------------------
// Encoding channels
// ---------------------------------------------------------------------------

/** Encoding channels map visual properties to data fields or accessor fns. */
export interface EncodeSpec {
  x?: string | EncodeFn;
  y?: string | EncodeFn;
  color?: string | EncodeFn;
  size?: string | EncodeFn;
  shape?: string | EncodeFn;
  opacity?: string | EncodeFn;
  series?: string | EncodeFn;
  /** Additional custom channels. */
  [channel: string]: string | EncodeFn | undefined;
}

// ---------------------------------------------------------------------------
// Scale
// ---------------------------------------------------------------------------

/** Scale configuration for a single encoding channel. */
export interface ScaleSpec {
  type?: string;
  domain?: unknown[];
  range?: unknown[];
  nice?: boolean;
  clamp?: boolean;
  padding?: number;
  /** Date/time format mask. */
  mask?: string;
  [option: string]: unknown;
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

/** Data or visual transform applied before rendering. */
export interface TransformSpec {
  type: string;
  [option: string]: unknown;
}

// ---------------------------------------------------------------------------
// Coordinate
// ---------------------------------------------------------------------------

/** Coordinate system configuration. */
export interface CoordinateSpec {
  type?: string;
  transforms?: Array<{ type: string; [option: string]: unknown }>;
  [option: string]: unknown;
}

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

/** Visual style properties for marks, labels, and annotations. */
export interface StyleSpec {
  fill?: string;
  stroke?: string;
  lineWidth?: number;
  opacity?: number;
  shape?: string;
  [property: string]: unknown;
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

/** Label configuration for a mark. */
export interface LabelSpec {
  text?: string | EncodeFn;
  format?: string | ((value: unknown) => string);
  overlapHide?: boolean;
  selector?: string;
  style?: StyleSpec;
  [option: string]: unknown;
}

// ---------------------------------------------------------------------------
// Mark tooltip
// ---------------------------------------------------------------------------

/** Tooltip configuration scoped to a single mark. */
export interface MarkTooltipSpec {
  title?: string | ((datum: Record<string, unknown>) => string);
  items?: TooltipItemSpec[];
}

// ---------------------------------------------------------------------------
// Mark
// ---------------------------------------------------------------------------

/** A single mark (geometric element) in the visualization. */
export interface MarkSpec {
  type: string;
  encode?: EncodeSpec;
  scales?: Record<string, ScaleSpec>;
  transforms?: TransformSpec[];
  style?: StyleSpec;
  labels?: LabelSpec[];
  tooltip?: MarkTooltipSpec | false;
  animate?: boolean;
}

// ---------------------------------------------------------------------------
// Axes
// ---------------------------------------------------------------------------

/** Label formatting options for an axis. */
export interface AxisLabelSpec {
  format?: string | ((value: unknown) => string);
  maxLength?: number;
  rotate?: number;
}

/** Configuration for a single axis channel. */
export interface AxisChannelSpec {
  title?: string | false;
  grid?: boolean;
  line?: boolean;
  labels?: AxisLabelSpec;
}

/** Axis configuration for x and y channels. */
export interface AxesSpec {
  x?: AxisChannelSpec | false;
  y?: AxisChannelSpec | false;
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

/** Legend configuration. */
export interface LegendSpec {
  position?: 'top' | 'bottom' | 'left' | 'right';
  interactive?: boolean;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

/** A single item within a tooltip. */
export interface TooltipItemSpec {
  field: string;
  name?: string;
  format?: (value: unknown) => string;
}

/** Top-level tooltip configuration. */
export interface TooltipSpec {
  title?: string | ((datum: Record<string, unknown>) => string);
  items?: TooltipItemSpec[];
}

// ---------------------------------------------------------------------------
// Annotation
// ---------------------------------------------------------------------------

/** A reference mark / annotation overlaid on the chart. */
export interface AnnotationSpec {
  type: string;
  value?: unknown;
  style?: StyleSpec;
  label?: string;
  encode?: EncodeSpec;
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

/** An interaction behaviour attached to the chart. */
export interface InteractionSpec {
  type: string;
  [option: string]: unknown;
}

// ---------------------------------------------------------------------------
// Top-level spec
// ---------------------------------------------------------------------------

/**
 * VistralSpec — the top-level declarative specification for a streaming
 * visualization. This is the single object a user hands to the library.
 */
export interface VistralSpec {
  /** Streaming data management. */
  streaming?: StreamingSpec;
  /** Temporal bounding configuration. */
  temporal?: TemporalSpec;
  /** One or more marks (geometric elements) to render. */
  marks: MarkSpec[];
  /** Shared scale definitions (keyed by channel name). */
  scales?: Record<string, ScaleSpec>;
  /** Data transforms applied before mark-level transforms. */
  transforms?: TransformSpec[];
  /** Coordinate system. */
  coordinate?: CoordinateSpec;
  /** Axis configuration. */
  axes?: AxesSpec;
  /** Legend configuration, or false to disable. */
  legend?: LegendSpec | false;
  /** Tooltip configuration, or false to disable. */
  tooltip?: TooltipSpec | false;
  /** Theme name. */
  theme?: 'dark' | 'light';
  /** Annotations overlaid on the chart. */
  annotations?: AnnotationSpec[];
  /** Interaction behaviours. */
  interactions?: InteractionSpec[];
  /** Enable/disable animation globally. */
  animate?: boolean;
}
