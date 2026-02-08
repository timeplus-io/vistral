import React, { useState, createContext, useContext } from 'react';
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
  { name: 'Grammar: Candlestick', component: GrammarCandlestickChart, category: 'grammar' },
];

export default function App() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const currentExample = examples[selectedExample];
  const CurrentExample = currentExample.component;
  const isPlayground = currentExample.isPlayground;

  const isDark = theme === 'dark';
  const sourceCode = exampleSources[currentExample.name] || '// Source code not available';

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
          padding: example.isPlayground ? '12px 16px' : '10px 16px',
          backgroundColor:
            selectedExample === index
              ? '#3B82F6'
              : 'transparent',
          color: selectedExample === index
            ? '#FFFFFF'
            : isDark ? '#D1D5DB' : '#4B5563',
          border: example.isPlayground ? `2px solid ${isDark ? '#6366F1' : '#4F46E5'}` : 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: example.isPlayground ? '15px' : '13px',
          fontWeight: example.isPlayground ? 600 : 400,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (selectedExample !== index) {
            e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#E5E7EB';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedExample !== index) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {example.isPlayground && '🎮 '}{example.name}
      </button>
    </li>
  );

  const categoryTitleStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: isDark ? '#6B7280' : '#9CA3AF',
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
          backgroundColor: isDark ? '#111827' : '#F9FAFB',
          transition: 'background-color 0.3s',
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            width: '260px',
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            padding: '16px',
            borderRight: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
            transition: 'all 0.3s',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: isDark ? '#F9FAFB' : '#1F2937',
                margin: 0,
              }}
            >
              Vistral
            </h1>
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              style={{
                padding: '6px',
                backgroundColor: isDark ? '#374151' : '#E5E7EB',
                color: isDark ? '#FCD34D' : '#6B7280',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
          padding: isPlayground ? '16px' : '32px',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          {isPlayground ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <CurrentExample />
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
                    fontSize: '24px',
                    fontWeight: '600',
                    margin: 0,
                    color: isDark ? '#F9FAFB' : '#1F2937',
                  }}
                >
                  {currentExample.name}
                </h2>

                {/* Tab buttons */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  padding: '4px',
                  backgroundColor: isDark ? '#374151' : '#E5E7EB',
                  borderRadius: '8px',
                }}>
                  <button
                    onClick={() => setActiveTab('preview')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: activeTab === 'preview'
                        ? (isDark ? '#1F2937' : '#FFFFFF')
                        : 'transparent',
                      color: activeTab === 'preview'
                        ? (isDark ? '#F9FAFB' : '#1F2937')
                        : (isDark ? '#9CA3AF' : '#6B7280'),
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: activeTab === 'code'
                        ? (isDark ? '#1F2937' : '#FFFFFF')
                        : 'transparent',
                      color: activeTab === 'code'
                        ? (isDark ? '#F9FAFB' : '#1F2937')
                        : (isDark ? '#9CA3AF' : '#6B7280'),
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
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
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderRadius: '8px',
                  padding: activeTab === 'code' ? '0' : '24px',
                  border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                  transition: 'all 0.3s',
                  overflow: 'auto',
                  minHeight: 0,
                }}
              >
                {activeTab === 'preview' ? (
                  <CurrentExample />
                ) : (
                  <pre
                    style={{
                      margin: 0,
                      padding: '24px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                      color: isDark ? '#E5E7EB' : '#374151',
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderRadius: '8px',
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
