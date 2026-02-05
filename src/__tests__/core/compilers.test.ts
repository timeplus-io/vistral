
import { describe, it, expect } from 'vitest';
import { compileTimeSeriesConfig, compileBarColumnConfig } from '../../core/compilers';
import type { TimeSeriesConfig, BarColumnConfig } from '../../types';

describe('compileTimeSeriesConfig', () => {
  const baseConfig: TimeSeriesConfig = {
    chartType: 'line',
    xAxis: 'timestamp',
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
    expect(spec.marks[1].type).toBe('point');
  });

  it('should add stackY transform for area with color', () => {
    const spec = compileTimeSeriesConfig({
      ...baseConfig,
      chartType: 'area',
      color: 'series',
    });
    // Updated expectation: stackY should include orderBy
    expect(spec.transforms).toEqual([{ type: 'stackY', orderBy: 'value' }]);
  });

  it('should set correct default shape for area chart', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, chartType: 'area' });
    expect(spec.marks[0].type).toBe('area');
    // Area chart should generally NOT have a shape set unless 'smooth' is requested
    // If it's undefined, G2 defaults correctly to 'area'.
    expect(spec.marks[0].style?.shape).toBeUndefined();
  });

  it('should set smooth shape for area chart when curve style requested', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, chartType: 'area', lineStyle: 'curve' });
    expect(spec.marks[0].style?.shape).toBe('smooth');
  });

  it('should set line shape for line chart', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, chartType: 'line' });
    expect(spec.marks[0].style?.shape).toBe('line');
  });

  it('should set time scale for x', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect(spec.scales?.x?.type).toBe('time');
  });

  it('should map temporal config', () => {
    const config: TimeSeriesConfig = {
      ...baseConfig,
      temporal: { mode: 'axis', field: 'timestamp', range: 5 },
    };
    const spec = compileTimeSeriesConfig(config);
    expect(spec.temporal?.mode).toBe('axis');
    expect(spec.temporal?.field).toBe('timestamp');
    expect(spec.temporal?.range).toBe(5);
  });

  it('should use xAxis as temporal field when temporal.field is not set', () => {
    const config: TimeSeriesConfig = {
      ...baseConfig,
      temporal: { mode: 'axis', field: '', range: 5 },
    };
    const spec = compileTimeSeriesConfig(config);
    expect(spec.temporal?.field).toBe('timestamp');
  });

  it('should produce smooth shape for curve lineStyle', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, lineStyle: 'curve' });
    expect(spec.marks[0].style?.shape).toBe('smooth');
  });

  it('should produce line shape for straight lineStyle', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, lineStyle: 'straight' });
    expect(spec.marks[0].style?.shape).toBe('line');
  });

  it('should set legend to false when legend is false', () => {
    const spec = compileTimeSeriesConfig({ ...baseConfig, legend: false });
    expect(spec.legend).toBe(false);
  });

  it('should set legend with position and interactive when legend is not false', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect(spec.legend).toMatchObject({
      position: 'bottom',
      interactive: true,
    });
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
    const spec = compileTimeSeriesConfig({ ...baseConfig, dataLabel: true });
    expect(spec.marks[0].labels).toHaveLength(1);
    expect(spec.marks[0].labels![0].text).toBe('value');
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
    const spec = compileTimeSeriesConfig({ ...baseConfig, xFormat: 'HH:mm' });
    expect(spec.scales?.x?.mask).toBe('HH:mm');
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
      xTitle: 'Time Check',
      yTitle: 'Value Check',
      gridlines: false,
    });
    expect((spec.axes?.x as { title?: unknown; grid?: unknown })?.title).toBe('Time Check');
    expect((spec.axes?.y as { title?: unknown; grid?: unknown })?.title).toBe('Value Check');
    expect((spec.axes?.y as { title?: unknown; grid?: unknown })?.grid).toBe(false);
  });

  it('should default x grid to false and y grid to true', () => {
    const spec = compileTimeSeriesConfig(baseConfig);
    expect((spec.axes?.x as { grid?: unknown })?.grid).toBe(false);
    expect((spec.axes?.y as { grid?: unknown })?.grid).toBe(true);
  });
});

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
      color: 'type',
      groupType: 'stack',
    });
    expect(spec.transforms).toEqual([{ type: 'stackY' }]);
  });

  it('should add dodgeX transform for dodged multi-series', () => {
    const spec = compileBarColumnConfig({
      ...baseConfig,
      color: 'type',
      groupType: 'dodge',
    });
    expect(spec.transforms).toEqual([{ type: 'dodgeX' }]);
  });

  it('should default to dodgeX when color set but no groupType', () => {
    const spec = compileBarColumnConfig({ ...baseConfig, color: 'type' });
    expect(spec.transforms).toEqual([{ type: 'dodgeX' }]);
  });

  it('should map temporal config', () => {
    const config: BarColumnConfig = {
      ...baseConfig,
      temporal: { mode: 'frame', field: 'ts' },
    };
    const spec = compileBarColumnConfig(config);
    expect(spec.temporal?.mode).toBe('frame');
    expect(spec.temporal?.field).toBe('ts');
  });

  it('should add label when dataLabel is true', () => {
    const spec = compileBarColumnConfig({ ...baseConfig, dataLabel: true });
    expect(spec.marks[0].labels).toHaveLength(1);
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
    const spec = compileBarColumnConfig({ ...baseConfig, color: 'type' });
    expect(spec.marks[0].encode?.color).toBe('type');
  });

  it('should set streaming maxItems to 1000', () => {
    const spec = compileBarColumnConfig(baseConfig);
    expect(spec.streaming?.maxItems).toBe(1000);
  });
});
