import React, { useState, createContext, useContext } from 'react';
import logo from './assets/timeplus-vistral_logo_pink.svg';
import { Sun, Moon, Code2 } from 'lucide-react';
import {
  BasicLineChart,
  MultiSeriesAreaChart,
  StackedBarChart,
  GroupedBarChart,
  SingleValueWithSparkline,
  StreamingDataTable,
  MetricsDashboard,
  ChartWithTableToggle,
  StreamingGeoChart,
  FrameBoundTable,
  KeyBoundTable,
  KeyBoundGeoChart,
  FrameBoundBarChart,
  AxisBoundLineChart,
  MultipleValueExample,
} from './basic-examples';
import {
  GrammarLineChart,
  GrammarMultiMark,
  GrammarBarChart,
  GrammarStackedArea,
  GrammarCompiledChart,
  GrammarRoseChart,
  GrammarDonutChart,
  GrammarRadarChart,
  GrammarRadialBar,
  GrammarScatterChart,
  GrammarHeatmap,
  GrammarTimeSeriesBar,
  GrammarCandlestickChart,
} from './grammar-examples';
import { Playground } from './Playground';
import { GrammarPlayground } from './GrammarPlayground';
import { LiveSplitView } from './LiveSplitView';

// Theme context
export const ThemeContext = createContext<{
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}>({
  theme: 'dark',
  setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

type Section = 'examples' | 'playground' | 'grammar-playground';

interface ExampleItem {
  name: string;
  component: React.FC;
  category: 'examples' | 'grammar';
}

const examples: ExampleItem[] = [
  { name: 'Line Chart', component: BasicLineChart, category: 'examples' },
  { name: 'Area Chart', component: MultiSeriesAreaChart, category: 'examples' },
  { name: 'Column Chart (Stacked)', component: StackedBarChart, category: 'examples' },
  { name: 'Bar Chart (Grouped)', component: GroupedBarChart, category: 'examples' },
  { name: 'Single Value', component: SingleValueWithSparkline, category: 'examples' },
  { name: 'Multiple Value', component: MultipleValueExample, category: 'examples' },
  { name: 'Data Table', component: StreamingDataTable, category: 'examples' },
  { name: 'Metrics Dashboard', component: MetricsDashboard, category: 'examples' },
  { name: 'Chart/Table Toggle', component: ChartWithTableToggle, category: 'examples' },
  { name: 'Geo Chart', component: StreamingGeoChart, category: 'examples' },
  { name: 'Table (Frame-Bound)', component: FrameBoundTable, category: 'examples' },
  { name: 'Table (Key-Bound)', component: KeyBoundTable, category: 'examples' },
  { name: 'Geo Chart (Key-Bound)', component: KeyBoundGeoChart, category: 'examples' },
  { name: 'Bar Chart (Frame-Bound)', component: FrameBoundBarChart, category: 'examples' },
  { name: 'Line Chart (Axis-Bound)', component: AxisBoundLineChart, category: 'examples' },
  { name: 'Grammar: Line Chart', component: GrammarLineChart, category: 'grammar' },
  { name: 'Grammar: Multi-Mark', component: GrammarMultiMark, category: 'grammar' },
  { name: 'Grammar: Bar Chart', component: GrammarBarChart, category: 'grammar' },
  { name: 'Grammar: Stacked Area', component: GrammarStackedArea, category: 'grammar' },
  { name: 'Grammar: Compiled Config', component: GrammarCompiledChart, category: 'grammar' },
  { name: 'Grammar: Rose Chart', component: GrammarRoseChart, category: 'grammar' },
  { name: 'Grammar: Donut Chart', component: GrammarDonutChart, category: 'grammar' },
  { name: 'Grammar: Radar Chart', component: GrammarRadarChart, category: 'grammar' },
  { name: 'Grammar: Radial Bar', component: GrammarRadialBar, category: 'grammar' },
  { name: 'Grammar: Scatter/Bubble', component: GrammarScatterChart, category: 'grammar' },
  { name: 'Grammar: Heatmap', component: GrammarHeatmap, category: 'grammar' },
  { name: 'Grammar: Time Series Bar', component: GrammarTimeSeriesBar, category: 'grammar' },
  { name: 'Grammar: Candlestick', component: GrammarCandlestickChart, category: 'grammar' },
];

const chartExamples = examples.filter(e => e.category === 'examples');
const grammarExamples = examples.filter(e => e.category === 'grammar');

export default function App() {
  const [section, setSection] = useState<Section>('examples');
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const [showCode, setShowCode] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const isDark = theme === 'dark';

  const colors = isDark
    ? {
      pageBg: '#120F1A',
      containerBg: '#231F2B',
      heading: '#F7F6F6',
      text: '#DAD9DB',
      label: '#B5B4B8',
      muted: '#3A3741',
      border: '#3A3741',
      hoverBg: '#3A3741',
      accent: '#D53F8C',
      accentHover: '#B83280',
      headerBg: '#1A1625',
    }
    : {
      pageBg: '#F7F6F6',
      containerBg: '#FFFFFF',
      heading: '#231F2B',
      text: '#120F1A',
      label: '#3A3741',
      muted: '#B5B4B8',
      border: '#DAD9DB',
      hoverBg: '#ECECED',
      accent: '#D53F8C',
      accentHover: '#B83280',
      headerBg: '#FFFFFF',
    };

  const handleSectionChange = (s: Section) => {
    setSection(s);
    if (s !== 'examples') setSelectedExample(null);
  };

  const currentExample = selectedExample !== null ? examples[selectedExample] : null;

  const navButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? 600 : 400,
    backgroundColor: active ? colors.accent : 'transparent',
    color: active ? '#FFFFFF' : colors.label,
    transition: 'background-color 0.2s, color 0.2s',
  });

  const renderNavButton = (example: ExampleItem, index: number) => {
    const isActive = selectedExample === index;
    return (
      <li key={index} style={{ marginBottom: '2px' }}>
        <button
          onClick={() => setSelectedExample(index)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '7px 12px',
            backgroundColor: isActive ? colors.accent : 'transparent',
            color: isActive ? '#FFFFFF' : colors.text,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 400,
            lineHeight: '1.5',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = colors.hoverBg; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {example.name}
        </button>
      </li>
    );
  };

  const categoryTitleStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginTop: '16px',
    marginBottom: '6px',
    paddingLeft: '12px',
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: colors.pageBg,
        transition: 'background-color 0.3s',
      }}>

        {/* ── Top navigation header ── */}
        <header style={{
          height: '52px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          backgroundColor: colors.headerBg,
          borderBottom: `1px solid ${colors.border}`,
          gap: '24px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <img src={logo} alt="Vistral" style={{ height: '28px' }} />
          </div>

          {/* Nav buttons */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
            <button
              style={navButtonStyle(section === 'examples')}
              onClick={() => handleSectionChange('examples')}
              onMouseEnter={e => { if (section !== 'examples') e.currentTarget.style.backgroundColor = colors.hoverBg; }}
              onMouseLeave={e => { if (section !== 'examples') e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Examples
            </button>
            <button
              style={navButtonStyle(section === 'playground')}
              onClick={() => handleSectionChange('playground')}
              onMouseEnter={e => { if (section !== 'playground') e.currentTarget.style.backgroundColor = colors.hoverBg; }}
              onMouseLeave={e => { if (section !== 'playground') e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Playground
            </button>
            <button
              style={navButtonStyle(section === 'grammar-playground')}
              onClick={() => handleSectionChange('grammar-playground')}
              onMouseEnter={e => { if (section !== 'grammar-playground') e.currentTarget.style.backgroundColor = colors.hoverBg; }}
              onMouseLeave={e => { if (section !== 'grammar-playground') e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Grammar Playground
            </button>
          </nav>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title="Toggle theme"
            style={{
              padding: '7px',
              borderRadius: '6px',
              color: colors.label,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = colors.hoverBg; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* ── Body below header ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Playground sections — full width, no sidebar */}
          {section === 'playground' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <Playground />
            </div>
          )}

          {section === 'grammar-playground' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <GrammarPlayground />
            </div>
          )}

          {/* Examples section — sidebar + content */}
          {section === 'examples' && (
            <>
              {/* Sidebar */}
              <nav style={{
                width: '220px',
                flexShrink: 0,
                backgroundColor: colors.containerBg,
                borderRight: `1px solid ${colors.border}`,
                overflowY: 'auto',
                padding: '12px 8px',
              }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {/* Gallery */}
                  <li style={{ marginBottom: '2px' }}>
                    <button
                      onClick={() => setSelectedExample(null)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '7px 12px',
                        backgroundColor: selectedExample === null ? colors.accent : 'transparent',
                        color: selectedExample === null ? '#FFFFFF' : colors.text,
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 400,
                        lineHeight: '1.5',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={e => { if (selectedExample !== null) e.currentTarget.style.backgroundColor = colors.hoverBg; }}
                      onMouseLeave={e => { if (selectedExample !== null) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      Gallery
                    </button>
                  </li>

                  <div style={categoryTitleStyle}>Charts</div>
                  {chartExamples.map(e => renderNavButton(e, examples.indexOf(e)))}

                  <div style={categoryTitleStyle}>Grammar API</div>
                  {grammarExamples.map(e => renderNavButton(e, examples.indexOf(e)))}
                </ul>
              </nav>

              {/* Main content */}
              <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                overflow: 'hidden',
                padding: selectedExample === null ? '24px' : '16px',
              }}>
                {selectedExample === null ? (
                  /* Gallery grid */
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <div style={{
                      marginBottom: '20px',
                      padding: '16px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      backgroundColor: colors.containerBg,
                      fontSize: '14px',
                      color: colors.label,
                      lineHeight: '1.6',
                    }}>
                      <p style={{ marginBottom: '8px' }}>
                        <a href="https://github.com/timeplus-io/vistral" target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, textDecoration: 'underline' }}>Vistral</a> is a streaming data visualization library open sourced by <a href="https://timeplus.com" target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, textDecoration: 'underline' }}>Timeplus</a>, based on the Grammar of Graphics.
                      </p>
                      <p style={{ marginBottom: '8px' }}>
                        Check out our open source SQL pipeline engine: <a href="https://github.com/timeplus-io/proton/" target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, textDecoration: 'underline' }}>Timeplus Proton</a>
                      </p>
                      <p style={{ margin: 0 }}>
                        Want to contribute? Join our community on <a href="https://timeplus.com/slack" target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, textDecoration: 'underline' }}>Slack</a>
                      </p>
                    </div>

                    {[
                      { title: 'Chart Examples', items: chartExamples },
                      { title: 'Grammar API', items: grammarExamples },
                    ].map(section => (
                      <div key={section.title} style={{ marginBottom: '24px' }}>
                        <h3 style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: colors.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          margin: '0 0 12px 0',
                        }}>
                          {section.title}
                        </h3>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                          gap: '16px',
                        }}>
                          {section.items.map(example => {
                            const idx = examples.indexOf(example);
                            const ExampleComponent = example.component;
                            return (
                              <div
                                key={idx}
                                onClick={() => setSelectedExample(idx)}
                                style={{
                                  backgroundColor: colors.containerBg,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  transition: 'border-color 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; }}
                              >
                                <div style={{ height: '360px', padding: '12px', pointerEvents: 'none', overflow: 'hidden' }}>
                                  <ExampleComponent />
                                </div>
                                <div style={{
                                  padding: '10px 16px',
                                  borderTop: `1px solid ${colors.border}`,
                                  color: colors.heading,
                                  fontSize: '13px',
                                  fontWeight: 600,
                                }}>
                                  {example.name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        margin: 0,
                        color: colors.heading,
                        lineHeight: '1.4',
                        flex: 1,
                      }}>
                        {currentExample!.name}
                      </h2>
                      <button
                        onClick={() => setShowCode(v => !v)}
                        title={showCode ? 'Hide code' : 'Show code'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${showCode ? colors.accent : colors.border}`,
                          backgroundColor: showCode ? colors.accent : 'transparent',
                          color: showCode ? '#FFFFFF' : colors.label,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          flexShrink: 0,
                          transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
                        }}
                        onMouseEnter={e => { if (!showCode) e.currentTarget.style.borderColor = colors.accent; }}
                        onMouseLeave={e => { if (!showCode) e.currentTarget.style.borderColor = colors.border; }}
                      >
                        <Code2 size={13} />
                        Code
                      </button>
                    </div>
                    <div style={{
                      flex: 1,
                      minHeight: 0,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      backgroundColor: colors.containerBg,
                    }}>
                      <LiveSplitView name={currentExample!.name} showCode={showCode} />
                    </div>
                  </>
                )}
              </main>
            </>
          )}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
