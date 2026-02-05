import { describe, it, expect } from 'vitest';
import type {
  VistralSpec,
  MarkSpec,
  EncodeSpec,
  EncodeFn,
  ScaleSpec,
  TransformSpec,
  CoordinateSpec,
  StreamingSpec,
  TemporalSpec,
  StyleSpec,
  LabelSpec,
  MarkTooltipSpec,
  AxesSpec,
  AxisChannelSpec,
  AxisLabelSpec,
  LegendSpec,
  TooltipSpec,
  TooltipItemSpec,
  AnnotationSpec,
  InteractionSpec,
} from '../../types/spec';

describe('VistralSpec types', () => {
  it('should accept a minimal spec with just marks', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'line' }],
    };
    expect(spec.marks).toHaveLength(1);
    expect(spec.marks[0].type).toBe('line');
  });

  it('should compile all exported types correctly', () => {
    // Verify every exported type can be used standalone
    const scale: ScaleSpec = { type: 'linear', nice: true };
    const transform: TransformSpec = { type: 'sortX' };
    const style: StyleSpec = { fill: 'red', opacity: 0.5 };
    const label: LabelSpec = { text: 'value', overlapHide: true };
    const markTooltip: MarkTooltipSpec = { title: 'Test' };
    const axisLabel: AxisLabelSpec = { format: '.2f', rotate: -45 };
    const legend: LegendSpec = { position: 'top', interactive: true };
    const tooltip: TooltipSpec = { title: 'Info' };
    const tooltipItem: TooltipItemSpec = { field: 'value', name: 'Val' };
    const annotation: AnnotationSpec = { type: 'lineY', value: 50 };
    const interaction: InteractionSpec = { type: 'tooltip' };

    expect(scale.type).toBe('linear');
    expect(transform.type).toBe('sortX');
    expect(style.fill).toBe('red');
    expect(label.text).toBe('value');
    expect(markTooltip.title).toBe('Test');
    expect(axisLabel.format).toBe('.2f');
    expect(legend.position).toBe('top');
    expect(tooltip.title).toBe('Info');
    expect(tooltipItem.field).toBe('value');
    expect(annotation.type).toBe('lineY');
    expect(interaction.type).toBe('tooltip');
  });

  it('should accept a full spec with all sections populated', () => {
    const spec: VistralSpec = {
      streaming: {
        maxItems: 500,
        mode: 'append',
        throttle: 100,
      },
      temporal: {
        mode: 'axis',
        field: 'timestamp',
        range: 10,
      },
      marks: [
        {
          type: 'line',
          encode: {
            x: 'time',
            y: 'value',
            color: 'series',
          },
          scales: {
            x: { type: 'time', nice: true },
            y: { type: 'linear', domain: [0, 100] },
          },
          transforms: [{ type: 'sortX' }],
          style: {
            stroke: '#1890ff',
            lineWidth: 2,
            opacity: 0.8,
          },
          labels: [
            {
              text: 'value',
              format: (v: unknown) => `${v}%`,
              overlapHide: true,
              selector: 'last',
              style: { fill: '#333' },
            },
          ],
          tooltip: {
            title: 'Metric',
            items: [
              { field: 'value', name: 'Value', format: (v: unknown) => `${v}` },
            ],
          },
          animate: true,
        },
      ],
      scales: {
        color: { type: 'ordinal', range: ['red', 'blue'] },
      },
      transforms: [{ type: 'filter', field: 'value', gt: 0 }],
      coordinate: {
        type: 'cartesian',
      },
      axes: {
        x: {
          title: 'Time',
          grid: true,
          line: true,
          labels: { format: 'HH:mm', maxLength: 10, rotate: -45 },
        },
        y: {
          title: 'Value',
          grid: true,
          line: false,
          labels: { format: '.2f' },
        },
      },
      legend: {
        position: 'top',
        interactive: true,
      },
      tooltip: {
        title: 'Details',
        items: [{ field: 'value', name: 'Val' }],
      },
      theme: 'dark',
      annotations: [
        {
          type: 'lineY',
          value: 50,
          style: { stroke: 'red', lineWidth: 1 },
          label: 'Threshold',
        },
      ],
      interactions: [
        { type: 'tooltip', shared: true },
        { type: 'brush' },
      ],
      animate: true,
    };

    expect(spec.streaming!.maxItems).toBe(500);
    expect(spec.temporal!.mode).toBe('axis');
    expect(spec.marks).toHaveLength(1);
    expect(spec.scales!.color.type).toBe('ordinal');
    expect(spec.axes!.x).not.toBe(false);
    expect(spec.legend).not.toBe(false);
    expect(spec.tooltip).not.toBe(false);
    expect(spec.theme).toBe('dark');
    expect(spec.annotations).toHaveLength(1);
    expect(spec.interactions).toHaveLength(2);
    expect(spec.animate).toBe(true);
  });

  it('should support EncodeFn accessors', () => {
    const fn: EncodeFn = (datum) => datum['value'];
    const encode: EncodeSpec = {
      x: 'time',
      y: fn,
      color: (d) => d['category'],
      size: (d) => Number(d['count']) * 2,
    };

    expect(typeof encode.x).toBe('string');
    expect(typeof encode.y).toBe('function');
    expect(typeof encode.color).toBe('function');

    const testDatum = { value: 42, category: 'A', count: 5 };
    expect((encode.y as EncodeFn)(testDatum)).toBe(42);
    expect((encode.color as EncodeFn)(testDatum)).toBe('A');
    expect((encode.size as EncodeFn)(testDatum)).toBe(10);
  });

  it('should allow legend and tooltip to be false', () => {
    const spec: VistralSpec = {
      marks: [{ type: 'interval' }],
      legend: false,
      tooltip: false,
    };
    expect(spec.legend).toBe(false);
    expect(spec.tooltip).toBe(false);
  });

  it('should support temporal key mode with keyField', () => {
    const temporal: TemporalSpec = {
      mode: 'key',
      field: 'timestamp',
      keyField: 'device_id',
    };
    expect(temporal.mode).toBe('key');
    expect(temporal.keyField).toBe('device_id');
  });

  it('should support various coordinate types', () => {
    const cartesian: CoordinateSpec = { type: 'cartesian' };
    const polar: CoordinateSpec = { type: 'polar' };
    const parallel: CoordinateSpec = { type: 'parallel' };

    expect(cartesian.type).toBe('cartesian');
    expect(polar.type).toBe('polar');
    expect(parallel.type).toBe('parallel');
  });

  it('should support coordinate transforms', () => {
    const coord: CoordinateSpec = {
      type: 'cartesian',
      transforms: [
        { type: 'transpose' },
        { type: 'reflect', axis: 'x' },
      ],
    };
    expect(coord.transforms).toHaveLength(2);
    expect(coord.transforms![0].type).toBe('transpose');
    expect(coord.transforms![1].type).toBe('reflect');
  });

  it('should support mark-level tooltip set to false', () => {
    const mark: MarkSpec = {
      type: 'point',
      tooltip: false,
    };
    expect(mark.tooltip).toBe(false);
  });

  it('should support axes set to false per channel', () => {
    const axes: AxesSpec = {
      x: false,
      y: { title: 'Count', grid: true },
    };
    expect(axes.x).toBe(false);
    expect((axes.y as AxisChannelSpec).title).toBe('Count');
  });

  it('should support streaming spec defaults conceptually', () => {
    const streaming: StreamingSpec = {};
    // All fields are optional, should compile and be empty
    expect(streaming.maxItems).toBeUndefined();
    expect(streaming.mode).toBeUndefined();
    expect(streaming.throttle).toBeUndefined();
  });

  it('should support index signature on EncodeSpec', () => {
    const encode: EncodeSpec = {
      x: 'time',
      y: 'value',
      customChannel: 'extra',
    };
    expect(encode['customChannel']).toBe('extra');
  });

  it('should support temporal axis mode with Infinity range', () => {
    const temporal: TemporalSpec = {
      mode: 'axis',
      field: 'ts',
      range: 'Infinity',
    };
    expect(temporal.range).toBe('Infinity');
  });
});
