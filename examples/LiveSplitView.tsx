import React, { useState, useEffect, useRef, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as vistral from '@timeplus/vistral';
import { useTheme } from './App';
import { exampleSources } from './example-sources';
import { buildComponent } from './code-runner';
import { dataGenerators } from './data-utils';

// ─── Scope ────────────────────────────────────────────────────────────────────

function buildScope(theme: 'dark' | 'light'): Record<string, unknown> {
  // Filter out 'default' and any non-identifier keys from the vistral namespace.
  // ES module namespace objects always include a 'default' key when the module has
  // a default export, and 'default' is a reserved keyword — passing it as a
  // new Function() parameter name causes a SyntaxError.
  const vistralExports = Object.fromEntries(
    Object.entries(vistral as unknown as Record<string, unknown>)
      .filter(([key]) => key !== 'default' && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key))
  );
  return {
    React,
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo: React.useMemo,
    useContext: React.useContext,
    ...vistralExports,
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
  const { theme: appTheme } = useTheme();
  const isDark = appTheme === 'dark';

  const [splitRatio, setSplitRatio] = useState(0.6);
  const [code, setCode] = useState(() => exampleSources[name] ?? '// Source not available');
  const [deferredCode, setDeferredCode] = useState(code);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

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
          beforeMount={(monaco) => {
            // Disable semantic and suggestion diagnostics so Monaco doesn't
            // show "Cannot find module" errors for injected scope symbols.
            // Syntax highlighting and basic editing still work normally.
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: true,
              noSyntaxValidation: true,
              noSuggestionDiagnostics: true,
            });
          }}
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
