# Vistral Design Principles

## Introduction

Vistral is a streaming data visualization library built on [AntV G2](https://g2.antv.antgroup.com/), extending the Grammar of Graphics to address the unique challenges of real-time data visualization.

### The Grammar of Graphics Foundation

The Grammar of Graphics, introduced by Leland Wilkinson, provides a layered approach to describing visualizations through independent components: data, aesthetics (mappings), geometries (marks), scales, coordinates, and facets. AntV G2 implements this grammar, allowing declarative chart construction.

### The Streaming Data Challenge

Traditional visualization assumes **bounded data**—a complete dataset that can be rendered entirely on canvas. Streaming data fundamentally breaks this assumption:

- **Time-Unbounded**: Data arrives continuously with no defined end
- **Ever-Growing**: Without intervention, data accumulates indefinitely
- **Memory-Constrained**: Canvas and memory cannot hold infinite points
- **Recency-Biased**: Recent data typically matters more than historical data

**The core question becomes: what data should be visible, and what data should be removed from the canvas?**

This is not merely a technical optimization—it's a fundamental design decision that shapes how users perceive and understand their streaming data.

### Extending the Grammar

Vistral extends the Grammar of Graphics with a new semantic layer: **temporal binding**. While traditional grammars describe *what* to visualize and *how*, streaming visualization requires describing *when* data appears and disappears.

This document defines three temporal binding modes that govern data lifecycle on the canvas.

---

## The Three Temporal Binding Modes

Vistral introduces three distinct modes for managing streaming data on the visualization canvas. Each mode answers the question "what stays and what goes?" differently.

| Mode | Time Binding | Data Lifecycle | Use Case |
|------|-------------|----------------|----------|
| **Axis-Bound** | Time mapped to an axis | Sliding window by time range | Time-series trends |
| **Frame-Bound** | Time as playback controller | Only latest timestamp visible | Real-time snapshots |
| **Key-Bound** | Time implicit via updates | Latest value per key | Live dashboards, tracking |

---

## Mode 1: Axis-Bound Temporal Binding

### Concept

In axis-bound mode, time is explicitly mapped to a visual axis (typically X, but potentially Y). As new data arrives, the visualization scrolls—recent data enters from one edge while old data exits from the opposite edge.

```
Time Direction →

    ┌─────────────────────────────┐
    │  ·   ·                      │
    │ ·  ·   ·  ·                 │
    │·     ·  ·   ·  ·    ·      │
    │        ·     ·   ·  ·  ·   │
    └─────────────────────────────┘
    t-5min                    t-now

    ← Old data exits    New data enters →
```

### Grammar Extension

Traditional Grammar of Graphics mapping:
```
x: time_field
y: value_field
color: series_field
geometry: line
```

Vistral adds temporal binding:
```
temporal: {
  mode: 'axis',
  field: 'time_field',    // Which field contains time
  axis: 'x',              // Which axis time binds to
  range: '5m'             // Visible time window
}
```

### Design Principles

1. **Recency Priority**: Recent data is more important. The visible window keeps the most recent N minutes/seconds.

2. **Smooth Scrolling**: Data appears to flow across the canvas as time progresses, creating intuitive temporal understanding.

3. **Configurable Window**: Users specify the time range (e.g., 30 seconds, 5 minutes, 1 hour) based on their monitoring needs.

4. **Direction Flexibility**: While left-to-right (X-axis) is most common, the grammar supports:
   - X-axis: left-to-right or right-to-left
   - Y-axis: bottom-to-top or top-to-bottom

### Applicable Chart Types

- **Line Charts**: Continuous trends over time
- **Area Charts**: Cumulative or stacked values over time
- **Scatter Plots**: Event distribution over time
- **Bar/Column Charts**: Discrete time intervals (e.g., per-minute aggregations)

### Implementation in Vistral

```typescript
// TimeSeriesConfig
{
  chartType: 'line',
  xAxis: 'timestamp',      // Time field bound to X-axis
  yAxis: 'value',
  xRange: 5,               // 5 minutes visible window
}
```

The `xRange` parameter defines the sliding window. Data older than `now - xRange` is removed from the canvas.

---

## Mode 2: Frame-Bound Temporal Binding

### Concept

In frame-bound mode, time acts as a **playback controller** rather than a visual dimension. The visualization displays only data from the current timestamp, like frames in a movie. As time advances, the entire canvas updates to show the new frame.

```
Frame t=1          Frame t=2          Frame t=3
┌──────────┐       ┌──────────┐       ┌──────────┐
│    ●     │       │      ●   │       │  ●       │
│  ●   ●   │  →    │   ●      │  →    │     ●  ● │
│      ●   │       │ ●    ●   │       │   ●      │
└──────────┘       └──────────┘       └──────────┘
```

### Grammar Extension

Traditional mapping remains unchanged for spatial dimensions:
```
x: longitude
y: latitude
color: category
geometry: point
```

Vistral adds frame binding:
```
temporal: {
  mode: 'frame',
  field: 'timestamp',     // Field that controls frame selection
  retention: 'latest'     // Only show data from latest timestamp
}
```

### Design Principles

1. **Complete Replacement**: Each new timestamp completely replaces the previous visualization. No blending or transition between frames.

2. **Temporal Filtering**: Data is filtered by timestamp before any other processing. Only rows matching the current frame are rendered.

3. **Animation Potential**: Frame-bound mode naturally supports animation—replaying historical data as a sequence of frames.

4. **Snapshot Semantics**: Each frame represents a complete snapshot of the system state at that moment.

### Applicable Chart Types

- **Scatter/Bubble Charts**: Entity positions at a moment (e.g., vehicle locations)
- **Geo Maps**: Geographic distribution at current time
- **Bar Charts**: Current rankings or comparisons
- **Pie/Donut Charts**: Current proportions

### Implementation in Vistral

```typescript
// GeoChartConfig with frame-bound behavior
{
  chartType: 'geo',
  latitude: 'lat',
  longitude: 'lng',
  updateMode: 'time',      // Frame-bound: filter by timestamp
}
```

When `updateMode: 'time'` is set, only data from the most recent timestamp is displayed.

---

## Mode 3: Key-Bound Temporal Binding

### Concept

In key-bound mode, each unique key maintains exactly one data point on the canvas—its **most recent value**. When new data arrives for a key, it replaces the previous value. Think of chess pieces: each piece (key) has one position (value), and moves update that position.

```
Key-based updates:

Initial State         After Update (key=B)    After Update (key=A)
┌──────────────┐      ┌──────────────┐        ┌──────────────┐
│ A: 100       │      │ A: 100       │        │ A: 150  ←new │
│ B: 200       │  →   │ B: 250  ←new │   →    │ B: 250       │
│ C: 150       │      │ C: 150       │        │ C: 150       │
└──────────────┘      └──────────────┘        └──────────────┘
```

### Grammar Extension

Traditional mapping:
```
x: category
y: value
color: status
geometry: bar
```

Vistral adds key binding:
```
temporal: {
  mode: 'key',
  field: 'entity_id',     // Field that identifies unique entities
  retention: 'latest'     // Keep only latest value per key
}
```

### Design Principles

1. **Entity Identity**: Each key represents a distinct entity whose state evolves over time.

2. **State Replacement**: New data for a key completely replaces old data—no history accumulation per key.

3. **Bounded Growth**: The canvas size is bounded by the number of unique keys, not by time or data volume.

4. **Eventual Consistency**: The visualization always reflects the latest known state of each entity.

### Applicable Chart Types

- **Single Value**: Current metric value (one implicit key)
- **Tables**: Live updating rows keyed by ID
- **Geo Maps**: Entity positions keyed by ID (e.g., fleet tracking)
- **Bar Charts**: Current values per category
- **Leaderboards**: Rankings that update in place

### Implementation in Vistral

```typescript
// TableConfig with key-bound behavior
{
  chartType: 'table',
  updateMode: 'key',       // Key-bound: deduplicate by key
  updateKey: 'device_id',  // The key field
}

// GeoChartConfig with key-bound behavior
{
  chartType: 'geo',
  latitude: 'lat',
  longitude: 'lng',
  updateMode: 'key',
  updateKey: 'vehicle_id',
}
```

---

## Choosing the Right Mode

### Decision Framework

```
                    ┌─────────────────────────┐
                    │ Is time a visual        │
                    │ dimension (axis)?       │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                   YES                      NO
                    │                       │
                    ▼                       ▼
            ┌───────────────┐      ┌─────────────────────┐
            │  AXIS-BOUND   │      │ Do entities have    │
            │  (Mode 1)     │      │ persistent identity?│
            └───────────────┘      └──────────┬──────────┘
                                              │
                                   ┌──────────┴──────────┐
                                   │                     │
                                  YES                    NO
                                   │                     │
                                   ▼                     ▼
                           ┌───────────────┐    ┌───────────────┐
                           │  KEY-BOUND    │    │  FRAME-BOUND  │
                           │  (Mode 3)     │    │  (Mode 2)     │
                           └───────────────┘    └───────────────┘
```

### Mode Comparison

| Aspect | Axis-Bound | Frame-Bound | Key-Bound |
|--------|-----------|-------------|-----------|
| Time visualization | Explicit (on axis) | Implicit (playback) | Implicit (updates) |
| Data accumulation | Sliding window | None (single frame) | One per key |
| Memory growth | Bounded by time range | Bounded by frame size | Bounded by key count |
| History visible | Recent window | Current only | Current only |
| Best for | Trends, patterns | Snapshots, animations | Entity tracking |

### Common Patterns

| Visualization Goal | Recommended Mode | Example |
|-------------------|------------------|---------|
| Monitor metric trends | Axis-Bound | CPU usage over last 5 minutes |
| Track entity positions | Key-Bound | Fleet vehicle locations |
| Show current rankings | Key-Bound | Live leaderboard |
| Display system snapshot | Frame-Bound | Current server statuses |
| Animate historical data | Frame-Bound | Replay of events |
| Stream aggregated data | Axis-Bound | Requests per second |

---

## Implementation Architecture

### Data Flow

```
┌─────────────────┐
│ StreamDataSource│
│ (columns + data)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Temporal Filter │ ← Mode determines filter logic
│ (Mode 1/2/3)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useStreamingData│ ← Memory management (maxItems)
│ Hook            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ processDataSource│ ← Schema + statistics
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Chart Component │ ← AntV G2 rendering
└─────────────────┘
```

### Memory Management

Each mode has different memory characteristics:

**Axis-Bound**:
- Memory = O(data_rate × time_window)
- Managed via `xRange` configuration
- `useStreamingData` provides additional `maxItems` safety limit

**Frame-Bound**:
- Memory = O(frame_size)
- Naturally bounded by single timestamp
- Old frames garbage collected automatically

**Key-Bound**:
- Memory = O(unique_keys)
- Managed via `updateKey` deduplication
- Growth bounded by domain cardinality

---

## Design Guidelines for Extending Vistral

### Adding New Chart Types

When adding a new chart type, determine which temporal modes it should support:

1. **Identify natural time binding**: Does the chart have a time axis? Does it track entities?

2. **Implement mode support**: Add relevant `updateMode` and `updateKey` configuration options.

3. **Handle data lifecycle**: Implement appropriate filtering/deduplication in the chart component.

### Grammar Consistency

Maintain consistency with Grammar of Graphics principles:

- **Separation of concerns**: Temporal binding is independent of geometry, color, and other encodings
- **Declarative configuration**: Users specify *what* they want, not *how* to achieve it
- **Composability**: Temporal modes should compose with other chart features

### Performance Considerations

- **Debouncing**: Use `useDebouncedValue` to prevent excessive re-renders during rapid updates
- **Animation**: Disable animations (`animate: false`) for high-frequency streaming
- **Incremental updates**: Prefer appending/replacing over full re-renders when possible

---

## Glossary

| Term | Definition |
|------|------------|
| **Temporal Binding** | The grammar extension that specifies how time controls data visibility |
| **Axis-Bound** | Mode where time maps to a visual axis with sliding window |
| **Frame-Bound** | Mode where time controls which data snapshot is visible |
| **Key-Bound** | Mode where each key maintains only its latest value |
| **Sliding Window** | A time range that moves forward, dropping old data |
| **Update Key** | The field used to identify unique entities in key-bound mode |
| **Bounded Data** | Traditional datasets with defined start and end |
| **Unbounded Data** | Streaming data with no defined end |

---

## References

- Wilkinson, L. (2005). *The Grammar of Graphics*. Springer.
- [AntV G2 Documentation](https://g2.antv.antgroup.com/)
- [Vistral API Reference](./api-reference.md)
