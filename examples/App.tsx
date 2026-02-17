import React, { useState, createContext, useContext } from 'react';
import logo from './assets/timeplus-vistral_logo_pink.svg';
import { Sun, Moon } from 'lucide-react';
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
import { exampleSources } from './example-sources';

// Theme context
export const ThemeContext = createContext<{
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}>({
  theme: 'dark',
  setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

interface ExampleItem {
  name: string;
  component: React.FC;
  isPlayground?: boolean;
  category?: 'examples' | 'grammar';
}

const examples: ExampleItem[] = [
  // Playground - Interactive Grammar Builder
  { name: 'Playground', component: Playground, isPlayground: true },
  { name: 'Grammar Playground', component: GrammarPlayground, isPlayground: true },
  // Chart Examples
  { name: 'Line Chart', component: BasicLineChart, category: 'examples' },
  { name: 'Area Chart', component: MultiSeriesAreaChart, category: 'examples' },
  { name: 'Column Chart (Stacked)', component: StackedBarChart, category: 'examples' },
  { name: 'Bar Chart (Grouped)', component: GroupedBarChart, category: 'examples' },
  { name: 'Single Value', component: SingleValueWithSparkline, category: 'examples' },
  { name: 'Data Table', component: StreamingDataTable, category: 'examples' },
  { name: 'Metrics Dashboard', component: MetricsDashboard, category: 'examples' },
  { name: 'Chart/Table Toggle', component: ChartWithTableToggle, category: 'examples' },
  { name: 'Geo Chart', component: StreamingGeoChart, category: 'examples' },
  { name: 'Table (Frame-Bound)', component: FrameBoundTable, category: 'examples' },
  { name: 'Table (Key-Bound)', component: KeyBoundTable, category: 'examples' },
  { name: 'Geo Chart (Key-Bound)', component: KeyBoundGeoChart, category: 'examples' },
  { name: 'Bar Chart (Frame-Bound)', component: FrameBoundBarChart, category: 'examples' },
  { name: 'Line Chart (Axis-Bound)', component: AxisBoundLineChart, category: 'examples' },
  // Grammar API Examples
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

export default function App() {
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const isDark = theme === 'dark';

  // Timeplus design guide color tokens
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
      codeBg: '#120F1A',
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
      codeBg: '#F7F6F6',
    };

  const currentExample = selectedExample !== null ? examples[selectedExample] : null;
  const CurrentExample = currentExample?.component;
  const isPlayground = currentExample?.isPlayground ?? false;
  const sourceCode = currentExample ? (exampleSources[currentExample.name] || '// Source code not available') : '';

  // Separate playgrounds from other examples
  const playgroundExamples = examples.filter(e => e.isPlayground);
  const chartExamples = examples.filter(e => !e.isPlayground && e.category === 'examples');
  const grammarExamples = examples.filter(e => e.category === 'grammar');

  const renderNavButton = (example: ExampleItem, index: number) => (
    <li key={index} style={{ marginBottom: '4px' }}>
      <button
        onClick={() => { setSelectedExample(index); setActiveTab('preview'); }}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '8px 16px',
          backgroundColor:
            selectedExample === index
              ? colors.accent
              : 'transparent',
          color: selectedExample === index
            ? '#FFFFFF'
            : colors.text,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 400,
          lineHeight: '1.5',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (selectedExample !== index) {
            e.currentTarget.style.backgroundColor = colors.hoverBg;
          }
        }}
        onMouseLeave={(e) => {
          if (selectedExample !== index) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {example.name}
      </button>
    </li>
  );

  const categoryTitleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '16px',
    marginBottom: '8px',
    paddingLeft: '8px',
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: colors.pageBg,
          transition: 'background-color 0.3s',
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            width: '260px',
            backgroundColor: colors.containerBg,
            padding: '16px',
            borderRight: `1px solid ${colors.border}`,
            transition: 'all 0.3s',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div
              onClick={() => setSelectedExample(null)}
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <img src={logo} alt="Vistral Logo" style={{ height: '24px', marginRight: '8px' }} />
              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: colors.heading,
                  margin: 0,
                  lineHeight: '1.4',
                }}
              >
              </h1>
            </div>
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              style={{
                padding: '8px',
                borderRadius: '6px',
                color: '#71717a', // text-zinc-500
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#27272a' : '#e4e4e7'; // zinc-800 : zinc-200
                e.currentTarget.style.color = isDark ? '#a1a1aa' : '#52525b'; // slightly darken/lighten on hover if needed, or keep zinc-500
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#71717a';
              }}
              title="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {/* Gallery Link */}
            <li style={{ marginBottom: '4px' }}>
              <button
                onClick={() => setSelectedExample(null)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  backgroundColor: selectedExample === null ? colors.accent : 'transparent',
                  color: selectedExample === null ? '#FFFFFF' : colors.text,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '1.5',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedExample !== null) {
                    e.currentTarget.style.backgroundColor = colors.hoverBg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedExample !== null) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Gallery
              </button>
            </li>

            {/* Playgrounds */}
            {playgroundExamples.map(example => renderNavButton(example, examples.indexOf(example)))}

            {/* Chart Examples */}
            <div style={categoryTitleStyle}>Examples</div>
            {chartExamples.map(example => renderNavButton(example, examples.indexOf(example)))}

            {/* Grammar API Examples */}
            <div style={categoryTitleStyle}>Grammar API</div>
            {grammarExamples.map(example => renderNavButton(example, examples.indexOf(example)))}
          </ul>
        </nav>

        {/* Main content */}
        <main style={{
          flex: 1,
          padding: selectedExample === null ? '24px' : (isPlayground ? '16px' : '24px'),
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          {selectedExample === null ? (
            /* Home page grid */
            <div style={{ flex: 1, overflow: 'auto' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: colors.heading,
                margin: '0 0 24px 0',
                lineHeight: '1.4',
              }}>
                Vistral Gallery
              </h2>

              <div style={{
                marginBottom: '24px',
                padding: '16px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                backgroundColor: colors.containerBg,
                fontSize: '16px',
                color: colors.label,
                lineHeight: '1.6',
              }}>
                <p style={{ marginBottom: '8px' }}>
                  <a href="https://github.com/timeplus-io/vistral" target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, textDecoration: 'underline' }}>Vistral</a> is a streaming data visualization library open sourced by <a href="https://timeplus.com" target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, textDecoration: 'underline' }}>timeplus</a>, based on the Grammar of Graphics.
                </p>
                <p style={{ marginBottom: '8px' }}>
                  Check out our open source SQL pipeline engine: <a href="https://github.com/timeplus-io/proton/" target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, textDecoration: 'underline' }}>Timeplus Proton</a>
                </p>
                <p style={{ margin: 0 }}>
                  Want to contribute an idea or connect with our team? Join our community on <a href="https://timeplus.com/slack" target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, textDecoration: 'underline' }}>Slack</a>
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
                          onClick={() => { setSelectedExample(idx); setActiveTab('preview'); }}
                          style={{
                            backgroundColor: colors.containerBg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = colors.accent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = colors.border;
                          }}
                        >
                          {/* Chart preview area */}
                          <div style={{
                            height: '360px',
                            padding: '12px',
                            pointerEvents: 'none',
                            overflow: 'hidden',
                          }}>
                            <ExampleComponent />
                          </div>
                          {/* Card label */}
                          <div style={{
                            padding: '12px 16px',
                            borderTop: `1px solid ${colors.border}`,
                            color: colors.heading,
                            fontSize: '14px',
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
          ) : isPlayground ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              {CurrentExample && <CurrentExample />}
            </div>
          ) : (
            <>
              {/* Header with title and tabs */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    margin: 0,
                    color: colors.heading,
                    lineHeight: '1.4',
                  }}
                >
                  {currentExample!.name}
                </h2>

                {/* Tab buttons */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  padding: '4px',
                  backgroundColor: isDark ? colors.muted : colors.hoverBg,
                  borderRadius: '4px',
                }}>
                  <button
                    onClick={() => setActiveTab('preview')}
                    style={{
                      padding: '6px 16px',
                      height: '32px',
                      backgroundColor: activeTab === 'preview'
                        ? colors.containerBg
                        : 'transparent',
                      color: activeTab === 'preview'
                        ? colors.heading
                        : colors.label,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    style={{
                      padding: '6px 16px',
                      height: '32px',
                      backgroundColor: activeTab === 'code'
                        ? colors.containerBg
                        : 'transparent',
                      color: activeTab === 'code'
                        ? colors.heading
                        : colors.label,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    Code
                  </button>
                </div>
              </div>

              {/* Content area */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: colors.containerBg,
                  borderRadius: '4px',
                  padding: activeTab === 'code' ? '0' : '24px',
                  border: `1px solid ${colors.border}`,
                  transition: 'all 0.3s',
                  overflow: 'auto',
                  minHeight: 0,
                }}
              >
                {activeTab === 'preview' ? (
                  CurrentExample && <CurrentExample />
                ) : (
                  <pre
                    style={{
                      margin: 0,
                      padding: '24px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                      color: colors.text,
                      backgroundColor: colors.codeBg,
                      borderRadius: '4px',
                      overflow: 'auto',
                      height: '100%',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    <code>{sourceCode}</code>
                  </pre>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
