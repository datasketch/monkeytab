/**
 * EmbedMonkeyTable — read-only embed component.
 *
 * Fetches data from a URL (or accepts inline data) and renders a
 * pre-configured MonkeyTable. View state comes from props, a
 * TableViewConfig object, or URL search params.
 *
 * Usage (data URL):
 *   <EmbedMonkeyTable
 *     dataUrl="/api/v1/db/my-db/cities"
 *     config={{ sort: { field: 'pop', direction: 'desc' }, rowHeight: 'short' }}
 *   />
 *
 * Usage (inline data):
 *   <EmbedMonkeyTable
 *     columns={[{ id: 'Name' }, { id: 'Pop', type: 'Number' }]}
 *     rows={[{ Name: 'Tokyo', Pop: 13960000 }]}
 *     config={{ toolbar: false }}
 *   />
 *
 * Usage (URL params — for iframe embeds):
 *   <EmbedMonkeyTable dataUrl="/api/v1/db/my-db/cities" readParamsFromURL />
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { MonkeyTable, type MonkeyTableColumn } from '../MonkeyTable.tsx';
import type { Value } from '@monkeytab/core';
import type { TableViewConfig } from './TableViewConfig.ts';
import { paramsToConfig } from './configParams.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of the JSON response from the data URL. */
export interface EmbedDataResponse {
  columns: MonkeyTableColumn[];
  rows: Array<Record<string, Value>>;
  totalRows?: number;
}

export interface EmbedMonkeyTableProps {
  // ── Data source (pick one) ───────────────────────────────────────────────
  /** URL to fetch table data from. Response must match EmbedDataResponse. */
  dataUrl?: string;
  /** Optional auth token — sent as Bearer token in Authorization header */
  authToken?: string;
  /** Transform the fetch response before rendering (e.g. reshape API response) */
  transformResponse?: (data: unknown) => EmbedDataResponse;
  /** Inline columns — used when dataUrl is not provided */
  columns?: MonkeyTableColumn[];
  /** Inline rows — used when dataUrl is not provided */
  rows?: Array<Record<string, Value>>;

  // ── View config ──────────────────────────────────────────────────────────
  /** View configuration. Overrides URL params when both are present. */
  config?: TableViewConfig;
  /** Read config from the current page's URL search params (for iframe embeds) */
  readParamsFromURL?: boolean;

  // ── Callbacks ────────────────────────────────────────────────────────────
  /** Called when data fetch fails */
  onError?: (error: Error) => void;
  /** Called when data is loaded successfully */
  onLoad?: (data: EmbedDataResponse) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmbedMonkeyTable({
  dataUrl,
  authToken,
  transformResponse,
  columns: inlineColumns,
  rows: inlineRows,
  config: configProp,
  readParamsFromURL = false,
  onError,
  onLoad,
}: EmbedMonkeyTableProps) {
  // ── Merge config: URL params (lowest priority) → prop config (highest) ──
  const config = useMemo(() => {
    let base: TableViewConfig = {};
    if (readParamsFromURL && typeof window !== 'undefined') {
      base = paramsToConfig(new URLSearchParams(window.location.search));
    }
    return { ...base, ...configProp };
  }, [configProp, readParamsFromURL]);

  // ── Fetch remote data ──────────────────────────────────────────────────
  const [remoteData, setRemoteData] = useState<EmbedDataResponse | null>(null);
  const [loading, setLoading] = useState(!!dataUrl);
  const [error, setError] = useState<Error | null>(null);

  // Use ref for transformResponse to keep it out of deps but always current
  const transformRef = useRef(transformResponse);
  transformRef.current = transformResponse;

  // Track fetch generation to discard stale responses
  const fetchGenRef = useRef(0);

  // Warn about auth over HTTP
  useEffect(() => {
    if (authToken && dataUrl?.startsWith('http://')) {
      console.warn(
        '[EmbedMonkeyTable] Sending auth token over unencrypted HTTP. Use HTTPS in production.',
      );
    }
  }, [authToken, dataUrl]);

  useEffect(() => {
    if (!dataUrl) return;
    setLoading(true);
    setError(null);

    const gen = ++fetchGenRef.current;
    const controller = new AbortController();
    const headers: Record<string, string> = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    fetch(dataUrl, { signal: controller.signal, headers })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((json) => {
        // Discard if a newer fetch was started
        if (gen !== fetchGenRef.current) return;
        const transform = transformRef.current;
        const data = transform ? transform(json) : (json as EmbedDataResponse);
        setRemoteData(data);
        setLoading(false);
        onLoad?.(data);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (gen !== fetchGenRef.current) return;
        setError(err);
        setLoading(false);
        onError?.(err);
      });

    return () => controller.abort();
  }, [dataUrl, authToken]);

  // ── Resolve data source ────────────────────────────────────────────────
  const columns = remoteData?.columns ?? inlineColumns ?? [];
  const allRows = remoteData?.rows ?? inlineRows ?? [];

  // ── Apply config: column filtering + ordering ──────────────────────────
  const visibleColumns = useMemo(() => {
    if (!config.columns?.length) return columns;
    return config.columns
      .map((id) => columns.find((c) => c.id === id))
      .filter(Boolean) as MonkeyTableColumn[];
  }, [columns, config.columns]);

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        height: config.height ? `${config.height}px` : '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: '#991b1b',
        background: '#fef2f2',
        borderRadius: '6px',
        border: '1px solid #fecaca',
        fontSize: '14px',
      }}>
        Failed to load data: {error.message}
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        height: config.height ? `${config.height}px` : '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#9ca3af',
          borderRadius: '50%',
          animation: 'mt-spin 0.6s linear infinite',
        }} />
        <style>{`@keyframes mt-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <MonkeyTable
      columns={visibleColumns}
      rows={allRows}
      editable={false}
      height={config.height ?? '100%'}
      rowHeight={config.rowHeight}
      showRowNumbers={config.rowNumbers}
      compactMode={config.compact}
      ghostGrid={config.ghostGrid}
      sortBy={config.sort?.field}
      sortDirection={config.sort?.direction}
      showToolbar={config.toolbar}
      showSearch={config.showSearch}
      showFilters={config.showFilters}
      showAddRowButton={false}
      showRowHeightControl={false}
      showRowNumbersControl={false}
      allowCreateField={false}
      allowDeleteField={false}
      allowCreateRecord={false}
      locale={config.locale}
      language={config.language}
    />
  );
}
