import { describe, it, expect } from 'vitest';
import { compileTimeSeriesConfig, compileBarColumnConfig } from '../../core/compilers';
import type { TimeSeriesConfig, BarColumnConfig, AxisChannelSpec } from '../../types';

// ---------------------------------------------------------------------------
// compileTimeSeriesConfig
// ---------------------------------------------------------------------------

describe('compileTimeSeriesConfig', () => {
  const baseConfig: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'time',
    yAxis: 'value',
  };

  it('should produce a line mark from line chartType', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect(spec.marks[0].type).toBe('line');
  });

  it('should produce an area mark from area chartType', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, chartType: 'area' });
    expect(spec.marks[0].type).toBe('area');
  });

  it('should encode color when color field is set', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, color: 'series' });
    expect(spec.marks[0].encode?.color).toBe('series');
  });

  it('should add a point mark when points is true', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, points: true });
    expect(spec.marks).toHaveLength(2);
    expect(spec.marks[1].type).toBe('point');
    expect(spec.marks[1].tooltip).toBe(false);
  });

  it('should add stackY transform for area with color', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      chartType: 'area',
      color: 'series',
    });
    expect(spec.transforms).toEqual([{ type: 'stackY' }]);
  });

  it('should set time scale for x', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect(spec.scales?.x?.type).toBe('time');
  });

  it('should map temporal config', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      temporal: { mode: 'axis', field: 'ts', range: 5 },
    });
    expect(spec.temporal).toEqual({ mode: 'axis', field: 'ts', range: 5 });
  });

  it('should use xAxis as temporal field when temporal.field is not set', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      temporal: { mode: 'axis', field: '' },
    });
    expect(spec.temporal?.field).toBe('time');
  });

  it('should produce smooth shape for curve lineStyle', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      lineStyle: 'curve',
    });
    expect(spec.marks[0].style?.shape).toBe('smooth');
  });

  it('should produce line shape for straight lineStyle', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      lineStyle: 'straight',
    });
    expect(spec.marks[0].style?.shape).toBe('line');
  });

  it('should set legend to false when legend is false', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, legend: false });
    expect(spec.legend).toBe(false);
  });

  it('should set legend with position and interactive when legend is not false', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, legend: true });
    expect(spec.legend).toEqual({ position: 'bottom', interactive: true });
  });

  it('should set y domain from yRange when both min and max are set', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      yRange: { min: 0, max: 100 },
    });
    expect(spec.scales?.y?.domain).toEqual([0, 100]);
  });

  it('should not set y domain when yRange values are null', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      yRange: { min: null, max: null },
    });
    expect(spec.scales?.y?.domain).toBeUndefined();
  });

  it('should add label when dataLabel is true', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      dataLabel: true,
    });
    expect(spec.marks[0].labels).toBeDefined();
    expect(spec.marks[0].labels![0].text).toBe('value');
    expect(spec.marks[0].labels![0].overlapHide).toBe(true);
  });

  it('should add selector:last to label when dataLabel true and showAll false', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      dataLabel: true,
      showAll: false,
    });
    expect(spec.marks[0].labels![0].selector).toBe('last');
  });

  it('should not add selector when dataLabel true and showAll true', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      dataLabel: true,
      showAll: true,
    });
    expect(spec.marks[0].labels![0].selector).toBeUndefined();
  });

  it('should always set animate to false', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect(spec.animate).toBe(false);
  });

  it('should always set style.connect to true', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect(spec.marks[0].style?.connect).toBe(true);
  });

  it('should set x-axis mask from xFormat', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      xFormat: 'HH:mm:ss',
    });
    expect(spec.scales?.x?.mask).toBe('HH:mm:ss');
  });

  it('should set streaming maxItems to 1000', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect(spec.streaming?.maxItems).toBe(1000);
  });

  it('should set theme to dark', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect(spec.theme).toBe('dark');
  });

  it('should set axes titles and gridlines', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      xTitle: 'Time',
      yTitle: 'Value',
      gridlines: false,
    });
    const xAxis = spec.axes?.x as AxisChannelSpec;
    const yAxis = spec.axes?.y as AxisChannelSpec;
    expect(xAxis.title).toBe('Time');
    expect(yAxis.title).toBe('Value');
    expect(yAxis.grid).toBe(false);
  });

  it('should default x grid to false and y grid to true', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    const xAxis = spec.axes?.x as AxisChannelSpec;
    const yAxis = spec.axes?.y as AxisChannelSpec;
    expect(xAxis.grid).toBe(false);
    expect(yAxis.grid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// compileBarColumnConfig
// ---------------------------------------------------------------------------

describe('compileBarColumnConfig', () => {
  const baseConfig: BarColumnConfig = {
    chartType: 'column',
    xAxis: 'category',
    yAxis: 'value',
  };

  it('should produce an interval mark', () => {
    const spec = compileBarColumnConfig(baseConfig);
    expect(spec.marks[0].type).toBe('interval');
  });

  it('should add transpose coordinate for bar chart', () => {
    const spec = compileBarColumnConfig({ ...baseConfig, chartType: 'bar' });
    expect(spec.coordinate?.transforms).toEqual([{ type: 'transpose' }]);
  });

  it('should not add transpose for column chart', () => {
    const spec = compileBarColumnConfig(baseConfig);
    expect(spec.coordinate).toBeUndefined();
  });

  it('should add stackY transform for stacked multi-series', () => {
    const spec = compileBarColumnConfig({
      ...baseConfig,
      color: 'series',
      groupType: 'stack',
    });
    expect(spec.transforms).toEqual([{ type: 'stackY' }]);
  });

  it('should add dodgeX transform for dodged multi-series', () => {
    const spec = compileBarColumnConfig({
      ...baseConfig,
      color: 'series',
      groupType: 'dodge',
    });
    expect(spec.transforms).toEqual([{ type: 'dodgeX' }]);
  });

  it('should default to dodgeX when color set but no groupType', () => {
    const spec = compileBarColumnConfig({
      ...baseConfig,
      color: 'series',
    });
    expect(spec.transforms).toEqual([{ type: 'dodgeX' }]);
  });

  it('should map temporal config', () => {
    const spec = compileBarColumnConfig({
      ...baseConfig,
      temporal: { mode: 'frame', field: 'ts' },
    });
    expect(spec.temporal).toEqual({ mode: 'frame', field: 'ts' });
  });

  it('should add label when dataLabel is true', () => {
    const spec = compileBarColumnConfig({
      ...baseConfig,
      dataLabel: true,
    });
    expect(spec.marks[0].labels).toBeDefined();
    expect(spec.marks[0].labels![0].text).toBe('value');
    expect(spec.marks[0].labels![0].overlapHide).toBe(true);
  });

  it('should set x scale padding', () => {
    const spec = compileBarColumnConfig(baseConfig);
    expect(spec.scales?.x?.padding).toBe(0.5);
  });

  it('should set y scale to linear with nice', () => {
    const spec = compileBarColumnConfig(baseConfig);
    expect(spec.scales?.y?.type).toBe('linear');
    expect(spec.scales?.y?.nice).toBe(true);
  });

  it('should always set animate to false', () => {
    const spec = compileBarColumnConfig(baseConfig);
    expect(spec.animate).toBe(false);
  });

  it('should set theme to dark', () => {
    const spec = compileBarColumnConfig(baseConfig);
    expect(spec.theme).toBe('dark');
  });

  it('should encode color when color field is set', () => {
    const spec = compileBarColumnConfig({ ...baseConfig, color: 'group' });
    expect(spec.marks[0].encode?.color).toBe('group');
  });

  it('should set streaming maxItems to 1000', () => {
    const spec = compileBarColumnConfig(baseConfig);
    expect(spec.streaming?.maxItems).toBe(1000);
  });
});
