import React, { useState } from 'react';
import {
  BasicLineChart,
  MultiSeriesAreaChart,
  StackedBarChart,
  GroupedBarChart,
  SingleValueWithSparkline,
  StreamingDataTable,
  MetricsDashboard,
  ChartWithTableToggle,
} from './basic-examples';

const examples = [
  { name: 'Basic Line Chart', component: BasicLineChart },
  { name: 'Multi-Series Area Chart', component: MultiSeriesAreaChart },
  { name: 'Stacked Column Chart', component: StackedBarChart },
  { name: 'Grouped Bar Chart', component: GroupedBarChart },
  { name: 'Single Value with Sparkline', component: SingleValueWithSparkline },
  { name: 'Streaming Data Table', component: StreamingDataTable },
  { name: 'Metrics Dashboard', component: MetricsDashboard },
  { name: 'Chart with Table Toggle', component: ChartWithTableToggle },
];

export default function App() {
  const [selectedExample, setSelectedExample] = useState(0);
  const CurrentExample = examples[selectedExample].component;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav
        style={{
          width: '280px',
          backgroundColor: '#1F2937',
          padding: '20px',
          borderRight: '1px solid #374151',
        }}
      >
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '24px',
            color: '#F9FAFB',
          }}
        >
          Vistral Examples
        </h1>
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
                    selectedExample === index ? '#3B82F6' : 'transparent',
                  color: selectedExample === index ? '#FFFFFF' : '#D1D5DB',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedExample !== index) {
                    e.currentTarget.style.backgroundColor = '#374151';
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
            color: '#F9FAFB',
          }}
        >
          {examples[selectedExample].name}
        </h2>
        <div
          style={{
            backgroundColor: '#1F2937',
            borderRadius: '8px',
            padding: '24px',
            border: '1px solid #374151',
          }}
        >
          <CurrentExample />
        </div>
      </main>
    </div>
  );
}
