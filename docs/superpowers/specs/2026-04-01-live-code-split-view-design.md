# Live Code Split View — Design Spec

**Date:** 2026-04-01  
**Status:** Approved

## Summary

Redesign the example detail view in the Vistral demo app from a tab-based Preview/Code switcher into a side-by-side live code playground. The left pane shows the chart rendering in real time; the right pane is an editable Monaco editor. Editing the code updates the chart with no page reload. Playgrounds and the gallery home page are untouched.

---

## Architecture Overview

### What Changes

Only the non-playground example detail view changes. The gallery grid, sidebar navigation, playgrounds (Playground, Grammar Playground), and all existing component files remain untouched.

**Before:** User selects an example → tabs appear (Preview | Code). "Code" tab shows a static non-executable string from `example-sources.ts`.

**After:** User selects an example → resizable split panel. Left = live chart. Right = Monaco editor with real, runnable code. Edits update the chart.

### New File

`examples/LiveSplitView.tsx` — contains all new logic (resizable divider, Monaco editor, live preview renderer).

### Modified File

`examples/App.tsx` — for non-playground examples, replaces the tab-switcher block with `<LiveSplitView name={currentExample.name} />`.

### Unchanged Files

- `examples/example-sources.ts` — becomes the single source of truth for initial editor code (no longer a display-only copy)
- `examples/basic-examples.tsx` — still used for gallery thumbnail rendering
- `examples/grammar-examples.tsx` — still used for gallery thumbnail rendering
- `examples/Playground.tsx`, `examples/GrammarPlayground.tsx` — unchanged

---

## LiveSplitView Component

**Props:**
```tsx
interface LiveSplitViewProps {
  name: string;   // example name, used to look up initial code from exampleSources
}
```

**State:**
- `splitRatio: number` — fraction of width given to the left (chart) pane. Default `0.6`.
- `code: string` — current code in the editor. Initialized from `exampleSources[name]`.
- `deferredCode: string` — debounced (300ms) version of `code` passed to `LivePreview`.

**Layout:** Flex row, 100% height. Left pane = `splitRatio * 100%`, right pane = remaining. A thin drag handle (8px wide) sits between them.

**Resizing:** `onPointerDown` on the drag handle → `onPointerMove` on document computes new ratio from mouse X position relative to container width. Clamped to [0.2, 0.8]. `onPointerUp` releases. Uses `setPointerCapture` for smooth dragging outside the handle bounds.

**Editor:** `<Editor />` from `@monaco-editor/react`.
- `language="typescript"`
- `theme` mapped to `"vs-dark"` or `"light"` from app theme context
- `onChange` → updates `code` state (Monaco calls onChange with `string | undefined`)
- Options: `fontSize: 13`, `minimap: { enabled: false }`, `scrollBeyondLastLine: false`, `wordWrap: "on"`, `lineNumbers: "on"`

**Live Preview:** `<LivePreview code={deferredCode} />` in the left pane, wrapped in an error boundary that catches render errors and shows them as readable text instead of crashing.

---

## Code Execution Pipeline

`LivePreview` takes `code: string`, transforms it, evaluates it, and renders the result. Re-runs on every `code` change.

### Step 1 — Babel Transform

```ts
import * as Babel from '@babel/standalone';

const transformed = Babel.transform(code, {
  presets: ['react', 'typescript'],
  filename: 'example.tsx',
}).code;
```

This compiles JSX and strips TypeScript types. Result is plain ES5-compatible JS.

### Step 2 — Import Stripping

Regex removes all `import` lines from the transformed output:
```ts
const stripped = transformed.replace(/^import\s+.*?;?\s*$/gm, '');
```

All symbols that were imported are instead injected via the function scope in Step 3.

### Step 3 — Component Extraction via `new Function`

A wrapper extracts the last declared component function:

```ts
const scopeKeys = ['React', 'useState', 'useEffect', 'useRef', 'useCallback',
  'useMemo', 'useContext', ...vistralExportNames, 'dataGenerators', 'theme', 'useTheme'];

const fn = new Function(...scopeKeys, `
  ${stripped}
  // Return the last function defined in scope
  // (resolved by scanning declared names at runtime)
  return __LAST_EXPORT__;
`);

const Component = fn(...scopeValues);
```

In practice, the last exported/declared function is detected by scanning the stripped code for the last `function FooName(` or `const FooName =` declaration using a regex like `/(?:export\s+)?(?:function|const)\s+(\w+)/g`, capturing the last match as the component name, and appending `return ComponentName;` before the closing of the `new Function` body.

### Step 4 — Render

```tsx
// Inside LivePreview:
const [Component, setComponent] = useState<React.FC | null>(null);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  try {
    const result = buildComponent(code); // steps 1–3
    setComponent(() => result);
    setError(null);
  } catch (e) {
    setError(String(e));
  }
}, [code]);

return error
  ? <ErrorDisplay message={error} />
  : Component ? <Component /> : null;
```

### Injected Scope

All of the following are available inside the editor without any import statement:

| Name | Source |
|------|--------|
| `React` | `import React from 'react'` |
| `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, `useContext` | React named exports |
| All vistral named exports | `import * as vistral from '@timeplus/vistral'` |
| `dataGenerators` | `import { dataGenerators } from './data-utils'` |
| `theme` | Current app theme string (`'dark'` or `'light'`) — passed as prop to `LivePreview` so it updates live when the theme toggle is clicked |
| `useTheme` | `() => theme` — returns current theme, no import needed |

---

## Error Handling

Three failure modes are handled gracefully:

1. **Syntax / transform error** (Babel throws) — caught in `useEffect`, displayed in left pane as a styled error box with the error message. Editor remains editable.
2. **Evaluation error** (`new Function` throws) — same handling as above.
3. **Runtime render error** (component throws during render) — caught by an `ErrorBoundary` class component wrapping `<Component />`. Displays the error and a "Reset" button that reverts the editor code to the original from `exampleSources`.

---

## Dependencies to Add

```json
"@monaco-editor/react": "^4.6.0",
"@babel/standalone": "^7.24.0",
"@types/babel__standalone": "^7.1.0"
```

---

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar (260px)  │ Left pane (default 60%)   │ ║ │ Right (40%)  │
│                  │                            │ ║ │              │
│ [nav items...]   │  [Live Chart Renders Here] │ ║ │ [Monaco Ed.] │
│                  │                            │ ║ │              │
│                  │                            │ ║ │              │
└─────────────────────────────────────────────────────────────────┘
                                                 ↑
                                         drag handle (8px)
```

Default: 60% chart / 40% editor. Draggable. Clamped to [20%, 80%].

---

## Out of Scope

- Gallery home page (unchanged)
- Playground and Grammar Playground (unchanged, full-screen as before)
- Sidebar navigation (unchanged)
- Syntax highlighting / autocomplete for vistral types in Monaco (nice-to-have, not in this spec)
- Persisting edited code across navigation (resetting to original on nav change is acceptable)
