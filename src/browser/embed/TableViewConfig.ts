/**
 * TableViewConfig — serializable view state for embedding and permalinks.
 *
 * Captures everything needed to reproduce a specific table view:
 * which columns, sort order, filters, layout, and display options.
 *
 * All fields are optional — omitted fields use MonkeyTable defaults.
 */

import type { RowHeightOption } from '../../ui/components/grid/Grid.tsx';

// ---------------------------------------------------------------------------
// Config type
// ---------------------------------------------------------------------------

export interface TableViewConfig {
  // ── Data view ────────────────────────────────────────────────────────────
  /** Which table to show (for multi-table databases) */
  table?: string;
  /** Visible columns in display order. Omit to show all. */
  columns?: string[];
  /** Sort column and direction */
  sort?: { field: string; direction: 'asc' | 'desc' };
  /** Pre-applied filter (simplified for URL serialization) */
  filters?: EmbedFilter[];
  /** Pre-filled search query */
  search?: string;
  /** Current page (1-based, for paginated embeds) */
  page?: number;

  // ── Layout ───────────────────────────────────────────────────────────────
  /** Row height preset */
  rowHeight?: RowHeightOption;
  /** Compact mode */
  compact?: boolean;
  /** Show row numbers column */
  rowNumbers?: boolean;
  /** Show ghost grid to fill viewport */
  ghostGrid?: boolean;
  /** Container height: 'auto' to fit content, or pixels. Omit for 100%. */
  height?: 'auto' | number;
  /** Maximum height in pixels (useful with height='auto') */
  maxHeight?: number;

  // ── Toolbar & chrome ─────────────────────────────────────────────────────
  /** Show the toolbar (default: true for pages, false for embeds) */
  toolbar?: boolean;
  /** Show search input */
  showSearch?: boolean;
  /** Show filter button */
  showFilters?: boolean;

  // ── Locale ───────────────────────────────────────────────────────────────
  /** BCP 47 locale tag, e.g. 'en-US', 'es-CO' */
  locale?: string;
  /** UI language override */
  language?: string;
}

/** Simplified filter for URL serialization (no nested groups). */
export interface EmbedFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
  value?: string | number | boolean;
}
