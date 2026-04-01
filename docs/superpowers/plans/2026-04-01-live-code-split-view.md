---
render_with_liquid: false
---
# Live Code Split View — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tab-based Preview/Code switcher in the Vistral examples app with a resizable side-by-side split view where the right pane is an editable Monaco editor and the left pane renders the chart live by executing the editor code via Babel + eval.

**Architecture:** A new `examples/code-runner.ts` module handles Babel transformation, import stripping, and dynamic component extraction via `new Function`. A new `examples/LiveSplitView.tsx` composes a drag-resizable container, `<LivePreview>` (executes code, renders component), and Monaco editor. `App.tsx` swaps the old tab UI for `<LiveSplitView>` on non-playground examples.

**Tech Stack:** `@monaco-editor/react` (editor), `@babel/standalone` (in-browser JSX/TS transform), React `new Function` eval pattern, pointer events API for drag resize.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `package.json` | Modify | Add `@monaco-editor/react`, `@babel/standalone`, `@types/babel__standalone` |
| `examples/code-runner.ts` | **Create** | `stripImports`, `findLastComponentName`, `buildComponent`, `buildScope` |
| `src/__tests__/examples/code-runner.test.ts` | **Create** | Unit tests for code-runner pipeline |
| `examples/LiveSplitView.tsx` | **Create** | `ErrorBoundary`, `LivePreview`, `LiveSplitView` |
| `examples/App.tsx` | Modify | Remove tab state/UI, render `<LiveSplitView>` for non-playground examples |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add dependencies to package.json**

Open `package.json` and add to `"devDependencies"` (these are examples-only, not published):

```json
"@monaco-editor/react": "^4.6.0",
"@babel/standalone": "^7.24.0",
"@types/babel__standalone": "^7.1.7"
```

- [ ] **Step 2: Install**

```bash
npm install
```

Expected: resolves successfully, `node_modules/@monaco-editor/react` and `node_modules/@babel/standalone` appear.

- [ ] **Step 3: Verify Monaco types are available**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

Expected: no errors related to `@monaco-editor/react` or `@babel/standalone`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add monaco-editor and babel-standalone for live code examples"
```

---

## Task 2: Create Code Runner Module with Tests

**Files:**
- Create: `examples/code-runner.ts`
- Create: `src/__tests__/examples/code-runner.test.ts`

The code runner is the heart of the feature. It takes a TypeScript/JSX string and returns a React component function by:
1. Transforming with Babel (strips types, compiles JSX)
2. Stripping import statements (replaced by injected scope)
3. Stripping `export` keywords (invalid in `new Function` scope)
4. Finding the last declared component (uppercase name)
5. Wrapping in `new Function` with injected dependencies

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/examples/code-runner.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { stripImports, findLastComponentName, buildComponent } from '../../../examples/code-runner';

describe('stripImports', () => {
  it('removes single-line imports', () => {
    const code = `import React from 'react';\nconst x = 1;`;
    expect(stripImports(code)).not.toContain('import');
    expect(stripImports(code)).toContain('const x = 1;');
  });

  it('removes multi-line imports', () => {
    const code = `import {\n  StreamChart,\n  useStreamingData,\n} from '@timeplus/vistral';\nconst x = 1;`;
    expect(stripImports(code)).not.toContain('import');
    expect(stripImports(code)).toContain('const x = 1;');
  });

  it('removes multiple imports', () => {
    const code = `import React from 'react';\nimport { foo } from './bar';\nfunction MyComp() {}`;
    const result = stripImports(code);
    expect(result).not.toContain('import');
    expect(result).toContain('function MyComp');
  });

  it('returns code unchanged when no imports', () => {
    const code = `function MyComp() { return null; }`;
    expect(stripImports(code)).toContain('function MyComp');
  });
});

describe('findLastComponentName', () => {
  it('finds a function declaration', () => {
    expect(findLastComponentName('function MyChart() {}')).toBe('MyChart');
  });

  it('finds a const arrow function', () => {
    expect(findLastComponentName('const MyChart = () => null;')).toBe('MyChart');
  });

  it('returns last component when multiple exist', () => {
    const code = `function Helper() {}\nfunction MainChart() {}`;
    expect(findLastComponentName(code)).toBe('MainChart');
  });

  it('ignores lowercase identifiers (not components)', () => {
    const code = `const helper = () => {};\nfunction MyChart() {}`;
    expect(findLastComponentName(code)).toBe('MyChart');
  });

  it('returns null when no component found', () => {
    expect(findLastComponentName('const x = 5;')).toBeNull();
  });
});

describe('buildComponent', () => {
  it('transforms JSX and returns a callable function', () => {
    const code = `
      function HelloWorld() {
        return React.createElement('div', null, 'Hello');
      }
    `;
    const Component = buildComponent(code, { React });
    expect(typeof Component).toBe('function');
  });

  it('handles export function declarations', () => {
    const code = `
      export function MyComp() {
        return React.createElement('div', null, 'hi');
      }
    `;
    const Component = buildComponent(code, { React });
    expect(typeof Component).toBe('function');
  });

  it('handles JSX syntax', () => {
    const code = `
      function MyComp() {
        return <div>hello</div>;
      }
    `;
    const Component = buildComponent(code, { React });
    expect(typeof Component).toBe('function');
  });

  it('throws when no component name found', () => {
    expect(() => buildComponent('const x = 5;', { React })).toThrow('No component found');
  });

  it('injects scope variables so component can use them', () => {
    const code = `
      function MyComp() {
        const val = injectedValue;
        return React.createElement('div', null, val);
      }
    `;
    const Component = buildComponent(code, { React, injectedValue: 42 });
    expect(typeof Component).toBe('function');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/__tests__/examples/code-runner.test.ts --config vitest.verify.config.ts
```

Expected: `FAIL` — `Cannot find module '../../../examples/code-runner'`

- [ ] **Step 3: Create `examples/code-runner.ts`**

```typescript
import * as Babel from '@babel/standalone';

/**
 * Strips all import statements from code (handles single and multi-line).
 */
export function stripImports(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  let inImport = false;

  for (const line of lines) {
    if (!inImport && line.trimStart().startsWith('import ')) {
      inImport = true;
      // Single-line import ends with from '...' or is a side-effect import
      if (/from\s+['"][^'"]+['"]|^import\s+['"]/.test(line)) {
        inImport = false;
      }
      continue;
    }
    if (inImport) {
      if (/from\s+['"][^'"]+['"]/.test(line)) {
        inImport = false;
      }
      continue;
    }
    result.push(line);
  }

  return result.join('\n');
}

/**
 * Finds the name of the last declared React component (uppercase identifier)
 * in the given code string. Returns null if none found.
 */
export function findLastComponentName(code: string): string | null {
  const matches = [...code.matchAll(/(?:export\s+)?(?:function|const|var|let)\s+([A-Z][A-Za-z0-9_]*)/g)];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1];
}

/**
 * Transforms TypeScript/JSX code and returns a React component by:
 * 1. Babel-transforming (strips types, compiles JSX)
 * 2. Stripping import statements
 * 3. Stripping export keywords (invalid inside new Function)
 * 4. Finding the last declared component name
 * 5. Executing via new Function with injected scope
 *
 * @param code - Raw TypeScript/JSX source string
 * @param scope - Object whose keys become available as variables inside the code
 * @returns A React component function
 * @throws If no component is found or code has syntax errors
 */
export function buildComponent(
  code: string,
  scope: Record<string, unknown>
): React.ComponentType {
  // Step 1: Babel transform (JSX → React.createElement, strip TS types)
  const transformed = Babel.transform(code, {
    presets: ['react', 'typescript'],
    filename: 'example.tsx',
  }).code!;

  // Step 2: Strip import statements
  const noImports = stripImports(transformed);

  // Step 3: Strip export keywords (export function Foo → function Foo)
  const noExports = noImports.replace(/\bexport\s+(default\s+)?/g, '');

  // Step 4: Find the last component name
  const componentName = findLastComponentName(noExports);
  if (!componentName) {
    throw new Error('No component found in code');
  }

  // Step 5: Execute via new Function with injected scope
  const keys = Object.keys(scope);
  const values = Object.values(scope);
  const fn = new Function(...keys, `${noExports}\nreturn ${componentName};`);

  return fn(...values) as React.ComponentType;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/__tests__/examples/code-runner.test.ts --config vitest.verify.config.ts
```

Expected: all tests `PASS`.

- [ ] **Step 5: Commit**

```bash
git add examples/code-runner.ts src/__tests__/examples/code-runner.test.ts
git commit -m "feat: add code-runner module for in-browser JSX/TS evaluation"
```

---

## Task 3: Create LiveSplitView Component

**Files:**
- Create: `examples/LiveSplitView.tsx`

This file has three components:
- `ErrorBoundary` — class component that catches render errors, shows them instead of crashing
- `LivePreview` — runs `buildComponent` on code changes, renders result inside ErrorBoundary
- `LiveSplitView` — resizable split container with Monaco on right, LivePreview on left

No unit tests for the UI layer (drag handle, Monaco integration). A smoke test verifying the module exports is sufficient.

- [ ] **Step 1: Create `examples/LiveSplitView.tsx`**

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as vistral from '@timeplus/vistral';
import { useTheme } from './App';
import { exampleSources } from './example-sources';
import { buildComponent } from './code-runner';
import { dataGenerators } from './data-utils';

// ─── Scope ────────────────────────────────────────────────────────────────────

function buildScope(theme: 'dark' | 'light'): Record<string, unknown> {
  return {
    React,
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo: React.useMemo,
    useContext: React.useContext,
    ...(vistral as unknown as Record<string, unknown>),
    dataGenerators,
    theme,
    useTheme: () => theme,
  };
}

// ─── ErrorBoundary ────────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: (error: Error) => React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

// ─── LivePreview ──────────────────────────────────────────────────────────────

interface LivePreviewProps {
  code: string;
  theme: 'dark' | 'light';
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div style={{
      padding: '16px',
      color: '#e53e3e',
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: '13px',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>
      {message}
    </div>
  );
}

function LivePreview({ code, theme }: LivePreviewProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const scope = buildScope(theme);
      const result = buildComponent(code, scope);
      setComponent(() => result);
      setError(null);
    } catch (e) {
      setError(String(e));
      setComponent(null);
    }
  }, [code, theme]);

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!Component) return null;

  return (
    <ErrorBoundary
      key={code}
      fallback={(err) => <ErrorDisplay message={`Runtime error: ${err.message}`} />}
    >
      <Component />
    </ErrorBoundary>
  );
}

// ─── LiveSplitView ────────────────────────────────────────────────────────────

interface LiveSplitViewProps {
  name: string;
}

export function LiveSplitView({ name }: LiveSplitViewProps) {
  const appTheme = useTheme();
  const isDark = appTheme === 'dark';

  const [splitRatio, setSplitRatio] = useState(0.6);
  const [code, setCode] = useState(() => exampleSources[name] ?? '// Source not available');
  const [deferredCode, setDeferredCode] = useState(code);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // Reset code when navigating to a different example
  useEffect(() => {
    const initial = exampleSources[name] ?? '// Source not available';
    setCode(initial);
    setDeferredCode(initial);
  }, [name]);

  // Debounce code execution by 300ms to avoid re-running on every keystroke
  const handleCodeChange = useCallback((value: string | undefined) => {
    const v = value ?? '';
    setCode(v);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDeferredCode(v), 300);
  }, []);

  // Drag handle: pointer events for smooth resize outside handle bounds
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setSplitRatio(Math.min(0.8, Math.max(0.2, ratio)));
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const dragHandleStyle: React.CSSProperties = {
    width: '6px',
    flexShrink: 0,
    cursor: 'col-resize',
    backgroundColor: isDark ? '#3A3741' : '#DAD9DB',
    userSelect: 'none',
    transition: 'background-color 0.15s',
  };

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', height: '100%', overflow: 'hidden' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Left pane: live chart */}
      <div style={{
        width: `${splitRatio * 100}%`,
        flexShrink: 0,
        overflow: 'auto',
        padding: '16px',
      }}>
        <LivePreview code={deferredCode} theme={appTheme} />
      </div>

      {/* Drag handle */}
      <div
        style={dragHandleStyle}
        onPointerDown={handlePointerDown}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#D53F8C';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isDark ? '#3A3741' : '#DAD9DB';
        }}
      />

      {/* Right pane: Monaco editor */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <MonacoEditor
          height="100%"
          language="typescript"
          theme={isDark ? 'vs-dark' : 'light'}
          value={code}
          onChange={handleCodeChange}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            tabSize: 2,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors from `examples/LiveSplitView.tsx`.

- [ ] **Step 3: Commit**

```bash
git add examples/LiveSplitView.tsx
git commit -m "feat: add LiveSplitView with Monaco editor and live code execution"
```

---

## Task 4: Update App.tsx

**Files:**
- Modify: `examples/App.tsx`

Remove `activeTab` state, the tab-switcher UI, and the source code display. For non-playground examples, render `<LiveSplitView>` inside a flex column that fills the remaining height.

- [ ] **Step 1: Add the import for LiveSplitView**

In `examples/App.tsx`, add to the import block (after the existing imports):

```tsx
import { LiveSplitView } from './LiveSplitView';
```

- [ ] **Step 2: Remove `activeTab` state**

Find and delete this line:

```tsx
const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
```

- [ ] **Step 3: Remove `sourceCode` variable**

Find and delete this line:

```tsx
const sourceCode = currentExample ? (exampleSources[currentExample.name] || '// Source code not available') : '';
```

- [ ] **Step 4: Remove the `exampleSources` import** (no longer used directly in App.tsx)

Find and remove from the import block at the top:

```tsx
import { exampleSources } from './example-sources';
```

- [ ] **Step 5: Replace the non-playground detail view**

Find the entire non-playground JSX block:

```tsx
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
```

Replace it with:

```tsx
) : (
  <>
    {/* Header: title only */}
    <div style={{ marginBottom: '12px', flexShrink: 0 }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 600,
        margin: 0,
        color: colors.heading,
        lineHeight: '1.4',
      }}>
        {currentExample!.name}
      </h2>
    </div>

    {/* Live split view: chart left, editor right */}
    <div style={{
      flex: 1,
      minHeight: 0,
      border: `1px solid ${colors.border}`,
      borderRadius: '4px',
      overflow: 'hidden',
      backgroundColor: colors.containerBg,
    }}>
      <LiveSplitView name={currentExample!.name} />
    </div>
  </>
)}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 7: Start dev server and manually verify**

```bash
npm run dev:examples
```

Open http://localhost:3000. Verify:
- Clicking "Line Chart" in the sidebar shows a split view: live chart on the left, Monaco editor on the right
- The drag handle between panes is visible and resizable (default ~60/40)
- Editing code in Monaco (e.g., change `'line'` to `'area'` in chartType) updates the chart after ~300ms
- Syntax errors in the editor show a red error message in the left pane instead of crashing
- Clicking "Playground" or "Grammar Playground" still shows the full-screen playground UI (unchanged)
- The gallery home page (click logo or "Gallery") still shows the grid of chart thumbnails

- [ ] **Step 8: Commit**

```bash
git add examples/App.tsx
git commit -m "feat: replace tab view with live split view for example detail pages"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Monaco Editor (`@monaco-editor/react`) — Task 1 installs, Task 3 uses
- [x] Babel Standalone + eval — Task 2 implements `buildComponent`
- [x] Resizable split, default 60/40 — Task 3 `LiveSplitView`, `splitRatio` state default `0.6`
- [x] Draggable clamped to [20%, 80%] — `Math.min(0.8, Math.max(0.2, ratio))`
- [x] 300ms debounce — `debounceTimer` in Task 3
- [x] Error boundary for render errors — `ErrorBoundary` class in Task 3
- [x] Error display for transform/eval errors — `error` state in `LivePreview`
- [x] Theme updates live — `theme` prop passed to `LivePreview`, triggers `buildComponent` re-run
- [x] Playgrounds unchanged — Task 4 only affects the `else` branch for non-playground examples
- [x] Gallery unchanged — Task 4 only touches the non-playground detail view branch
- [x] `exampleSources` remains single source of truth — used in `LiveSplitView` and still exists
- [x] Injected scope covers all needed symbols — `buildScope` in Task 3 covers React hooks, all vistral exports, `dataGenerators`, `theme`, `useTheme`

**Type consistency:** `buildComponent(code, scope)` signature matches between Task 2 (definition) and Task 3 (usage). `LiveSplitViewProps.name: string` matches usage in Task 4.

**No placeholders found.**
