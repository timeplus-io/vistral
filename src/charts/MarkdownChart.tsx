/**
 * MarkdownChart — renders a markdown template populated with streaming data values.
 *
 * Template syntax:
 *   {{fieldName}}           — replaced with the value from the latest row
 *                             (frame / axis / no-temporal modes)
 *   {{@keyValue::fieldName}} — replaced with fieldName for the row whose key
 *                              field equals keyValue (key mode only)
 *
 * Temporal binding mirrors the other vistral charts:
 *   mode: 'frame' | 'axis' | none  → latest row substitution
 *   mode: 'key'                     → per-entity substitution via key-indexed map
 */

import React, { useMemo } from 'react';
import { marked } from 'marked';
import './MarkdownChart.css';

import { applyTemporalFilter, rowToArray } from '../utils';
import { isDarkTheme } from '../core/theme-registry';
import type { MarkdownConfig } from '../types';
import type { StreamDataSource } from '../types';
import type { VistralTheme } from '../types/theme';

// Regex for {{fieldName}} placeholders (frame / axis / no-temporal)
const RE_FIELD = /\{\{([^@}][^}]*)\}\}/g;
// Regex for {{@keyValue::fieldName}} placeholders (key mode)
const RE_KEY_FIELD = /\{\{@([^:}]+)::([^}]+)\}\}/g;

marked.setOptions({ async: false });

function substituteTemplate(
  content: string,
  columns: StreamDataSource['columns'],
  displayData: unknown[][],
  temporal: MarkdownConfig['temporal']
): string {
  if (displayData.length === 0) return content;

  const isKeyMode = temporal?.mode === 'key';

  if (isKeyMode) {
    const keyField = Array.isArray(temporal!.field) ? temporal!.field[0] : temporal!.field;
    const keyColIdx = columns.findIndex((c) => c.name === keyField);

    // Build a map: keyValue → row
    const rowByKey = new Map<string, unknown[]>();
    for (const row of displayData) {
      const key = String(row[keyColIdx] ?? '');
      rowByKey.set(key, row);
    }

    return content.replace(RE_KEY_FIELD, (_, keyValue: string, fieldName: string) => {
      const row = rowByKey.get(keyValue);
      if (!row) return `${keyValue}.${fieldName}`;
      const colIdx = columns.findIndex((c) => c.name === fieldName.trim());
      return colIdx >= 0 ? String(row[colIdx] ?? '') : `${keyValue}.${fieldName}`;
    });
  }

  // frame / axis / no-temporal: use the last row
  const latestRow = displayData[displayData.length - 1];
  return content.replace(RE_FIELD, (_, fieldName: string) => {
    const colIdx = columns.findIndex((c) => c.name === fieldName.trim());
    return colIdx >= 0 ? String(latestRow[colIdx] ?? '') : fieldName;
  });
}

export interface MarkdownChartProps {
  config: MarkdownConfig;
  data: StreamDataSource;
  theme?: string | VistralTheme;
  className?: string;
  style?: React.CSSProperties;
}

export const MarkdownChart: React.FC<MarkdownChartProps> = ({
  config,
  data,
  theme = 'dark',
  className,
  style,
}) => {
  const dark = isDarkTheme(theme);

  // Normalise incoming rows to arrays
  const columns = data.columns;
  const rawRows = useMemo(
    () => data.data.map((row) => rowToArray(row, columns)),
    [data.data, columns]
  );

  // Apply temporal filtering (same pipeline as DataTable)
  const displayData = useMemo(() => {
    let rows = rawRows;
    if (config.temporal) {
      rows = applyTemporalFilter(rows, columns, config.temporal);
    }
    return rows;
  }, [rawRows, columns, config.temporal]);

  // Substitute template placeholders and render to HTML
  const html = useMemo(() => {
    const substituted = substituteTemplate(
      config.content || '',
      columns,
      displayData,
      config.temporal
    );
    return marked.parse(substituted) as string;
  }, [config.content, config.temporal, columns, displayData]);

  const themeClass = dark ? 'vistral-markdown-dark' : 'vistral-markdown-light';

  return (
    <div
      className={[themeClass, className].filter(Boolean).join(' ')}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        padding: '16px',
        boxSizing: 'border-box',
        color: dark ? '#e5e7eb' : '#111827',
        ...style,
      }}
    >
      <div
        className="vistral-markdown"
        // marked output is controlled by the user-authored template; same trust model as axion
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ fontFamily: 'inherit' }}
      />
    </div>
  );
};
