
import { describe, it, expect } from 'vitest';
import { getChartThemeColors } from '../../core/chart-utils';
import { resolveTheme, buildG2ThemeObject } from '../../core/theme-registry';

describe('Theme Color Debug', () => {
    it('should return correct colors for dark theme', () => {
        const colors = getChartThemeColors('dark');
        console.log('Dark Theme Colors:', JSON.stringify(colors, null, 2));

        // Check key colors used in spec-engine
        expect(colors.text).toBe('#E5E5E5');
        // Check line color - if this is too dark, axes will be invisible on dark background
        console.log('Line Color:', colors.line);
    });

    it('should produce correct G2 theme spec', () => {
        const themeSpec = buildG2ThemeObject(resolveTheme('dark'));
        console.log('G2 Theme Spec:', JSON.stringify(themeSpec, null, 2));

        // G2 uses flat keys in its theme: lineStroke, not axis.x.line.stroke
        expect((themeSpec.axis as any).lineStroke).toBeDefined();
        console.log('Axis Line Stroke:', (themeSpec.axis as any).lineStroke);
    });
});
