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
} from './basic-examples';

// Theme context
export const ThemeContext = createContext<{
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}>({
  theme: 'dark',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const examples = [
  { name: 'Basic Line Chart', component: BasicLineChart },
  { name: 'Multi-Series Area Chart', component: MultiSeriesAreaChart },
  { name: 'Stacked Column Chart', component: StackedBarChart },
  { name: 'Grouped Bar Chart', component: GroupedBarChart },
  { name: 'Single Value with Sparkline', component: SingleValueWithSparkline },
  { name: 'Streaming Data Table', component: StreamingDataTable },
  { name: 'Metrics Dashboard', component: MetricsDashboard },
  { name: 'Chart with Table Toggle', component: ChartWithTableToggle },
  { name: 'Streaming Geo Chart', component: StreamingGeoChart },
];

export default function App() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const CurrentExample = examples[selectedExample].component;

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          backgroundColor: isDark ? '#111827' : '#F9FAFB',
          transition: 'background-color 0.3s',
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            width: '280px',
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            padding: '20px',
            borderRight: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
            transition: 'all 0.3s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: isDark ? '#F9FAFB' : '#1F2937',
                margin: 0,
              }}
            >
              Vistral Examples
            </h1>
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              style={{
                padding: '8px',
                backgroundColor: isDark ? '#374151' : '#E5E7EB',
                color: isDark ? '#FCD34D' : '#6B7280',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
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
            {examples.map((example, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                <button
                  onClick={() => setSelectedExample(index)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    backgroundColor:
                      selectedExample === index
                        ? '#3B82F6'
                        : 'transparent',
                    color: selectedExample === index
                      ? '#FFFFFF'
                      : isDark ? '#D1D5DB' : '#4B5563',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
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
                  {example.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: '32px' }}>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '24px',
              color: isDark ? '#F9FAFB' : '#1F2937',
            }}
          >
            {examples[selectedExample].name}
          </h2>
          <div
            style={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderRadius: '8px',
              padding: '24px',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              transition: 'all 0.3s',
            }}
          >
            <CurrentExample />
          </div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
