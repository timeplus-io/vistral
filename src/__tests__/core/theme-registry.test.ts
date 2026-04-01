import { describe, it, expect } from 'vitest';
import { registerTheme, resolveTheme, buildG2ThemeObject, buildTooltipCss, isDarkTheme } from '../../core/theme-registry';
import { DARK_THEME, LIGHT_THEME } from '../../types/theme';
import type { VistralTheme } from '../../types/theme';

describe('resolveTheme', () => {
  it('returns DARK_THEME for "dark"', () => {
    expect(resolveTheme('dark')).toBe(DARK_THEME);
  });

  it('returns LIGHT_THEME for "light"', () => {
    expect(resolveTheme('light')).toBe(LIGHT_THEME);
  });

  it('returns DARK_THEME for undefined', () => {
    expect(resolveTheme(undefined)).toBe(DARK_THEME);
  });

  it('falls back to DARK_THEME for unknown name', () => {
    const result = resolveTheme('does-not-exist');
    expect(result).toEqual(DARK_THEME);
  });

  it('merges a theme object onto dark base by default', () => {
    const custom: VistralTheme = { axis: { grid: { color: '#FF0000' } } };
    const result = resolveTheme(custom);
    // Override wins
    expect(result.axis?.grid?.color).toBe('#FF0000');
    // Base values preserved
    expect(result.axis?.label?.color).toBe(DARK_THEME.axis!.label!.color);
    expect(result.background).toBe(DARK_THEME.background);
  });

  it('merges onto light base when extends: "light"', () => {
    const custom: VistralTheme = { extends: 'light', axis: { grid: { color: '#FF0000' } } };
    const result = resolveTheme(custom);
    expect(result.axis?.grid?.color).toBe('#FF0000');
    expect(result.axis?.label?.color).toBe(LIGHT_THEME.axis!.label!.color);
  });

  it('does not mutate the input theme object', () => {
    const custom: VistralTheme = { axis: { grid: { color: '#FF0000' } } };
    const before = JSON.stringify(custom);
    resolveTheme(custom);
    expect(JSON.stringify(custom)).toBe(before);
  });
});

describe('registerTheme', () => {
  it('registers and retrieves a custom theme by name', () => {
    const myTheme: VistralTheme = { background: '#123456' };
    registerTheme('my-test-theme', myTheme);
    const resolved = resolveTheme('my-test-theme');
    expect(resolved.background).toBe('#123456');
  });

  it('throws when trying to overwrite "dark"', () => {
    expect(() => registerTheme('dark', {})).toThrow();
  });

  it('throws when trying to overwrite "light"', () => {
    expect(() => registerTheme('light', {})).toThrow();
  });
});

describe('buildG2ThemeObject', () => {
  it('produces correct G2 view fill from background', () => {
    const g2 = buildG2ThemeObject(DARK_THEME);
    expect((g2.view as any).viewFill).toBe('transparent');
  });

  it('produces axis label fill from theme', () => {
    const g2 = buildG2ThemeObject(DARK_THEME);
    expect((g2.axis as any).x.label.fill).toBe('#E5E5E5');
    expect((g2.axis as any).y.label.fill).toBe('#E5E5E5');
  });

  it('produces axis grid stroke from theme', () => {
    const g2 = buildG2ThemeObject(DARK_THEME);
    expect((g2.axis as any).x.grid.stroke).toBe('#374151');
  });

  it('produces legend label fill from theme', () => {
    const g2 = buildG2ThemeObject(DARK_THEME);
    expect((g2.legend as any).label.fill).toBe('#E5E5E5');
  });

  it('applies font family to label', () => {
    const theme: VistralTheme = { ...DARK_THEME, font: { family: 'Roboto', size: 13 } };
    const g2 = buildG2ThemeObject(theme);
    expect((g2.label as any).fontFamily).toBe('Roboto');
    expect((g2.label as any).fontSize).toBe(13);
  });

  it('applies grid dash when specified', () => {
    const theme: VistralTheme = {
      ...DARK_THEME,
      axis: { ...DARK_THEME.axis, grid: { color: '#444', dash: [4, 4] } },
    };
    const g2 = buildG2ThemeObject(theme);
    expect((g2.axis as any).x.grid.lineDash).toEqual([4, 4]);
  });

  it('g2ThemeOverrides win over compiled values', () => {
    const theme: VistralTheme = {
      ...DARK_THEME,
      g2ThemeOverrides: { view: { viewFill: '#ABCDEF' } },
    };
    const g2 = buildG2ThemeObject(theme);
    expect((g2.view as any).viewFill).toBe('#ABCDEF');
  });

  it('does not mutate the input theme', () => {
    const theme = { ...DARK_THEME, g2ThemeOverrides: { view: { viewFill: '#ABCDEF' } } };
    const before = JSON.stringify(theme);
    buildG2ThemeObject(theme);
    expect(JSON.stringify(theme)).toBe(before);
  });

  it('should include palette as color array when specified', () => {
    const theme: VistralTheme = { ...DARK_THEME, palette: ['#FF0000', '#00FF00'] };
    const result = buildG2ThemeObject(theme);
    expect(result.color).toEqual(['#FF0000', '#00FF00']);
  });

  it('should not include color key when palette is not specified', () => {
    const result = buildG2ThemeObject(DARK_THEME);
    expect(result.color).toBeUndefined();
  });
});

describe('isDarkTheme', () => {
  it('returns true for undefined', () => {
    expect(isDarkTheme(undefined)).toBe(true);
  });

  it('returns true for "dark"', () => {
    expect(isDarkTheme('dark')).toBe(true);
  });

  it('returns false for "light"', () => {
    expect(isDarkTheme('light')).toBe(false);
  });

  it('returns false for VistralTheme object with extends: "light"', () => {
    expect(isDarkTheme({ extends: 'light' })).toBe(false);
  });

  it('returns true for VistralTheme object with extends: "dark"', () => {
    expect(isDarkTheme({ extends: 'dark' })).toBe(true);
  });

  it('returns true for VistralTheme object with no extends (defaults to dark)', () => {
    expect(isDarkTheme({})).toBe(true);
  });

  it('returns true for VistralTheme object with other fields but no extends', () => {
    expect(isDarkTheme({ palette: ['red'] })).toBe(true);
  });

  it('should return false for a registered named theme that extends light', () => {
    registerTheme('test-light-named', { extends: 'light', palette: ['#000'] });
    expect(isDarkTheme('test-light-named')).toBe(false);
  });
});

describe('buildTooltipCss', () => {
  it('returns correct CSS for dark theme', () => {
    const css = buildTooltipCss(DARK_THEME);
    expect(css['background-color']).toBe('rgba(0,0,0,0.8)');
    expect(css['color']).toBe('#FFFFFF');
    expect(css['font-size']).toBe('12px');
    expect(css['border']).toBe('1px solid transparent');
  });

  it('returns border style when border color is set', () => {
    const theme: VistralTheme = { ...DARK_THEME, tooltip: { ...DARK_THEME.tooltip, border: { color: '#FF0000' } } };
    const css = buildTooltipCss(theme);
    expect(css['border']).toBe('1px solid #FF0000');
  });
});
