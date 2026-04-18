/**
 * MonkeyTable — the main public API for embedding an editable table.
 * Self-contained: creates its own MemoryAdapter, BrowserClient,
 * QueryClientProvider, and MonkeyTabClientProvider.
 *
 * Usage:
 *   <MonkeyTable
 *     columns={[{ id: 'Name' }, { id: 'Age', type: 'Number' }]}
 *     rows={[{ Name: 'Alice', Age: 30 }, { Name: 'Bob', Age: 25 }]}
 *     onChange={(rows) => console.log(rows)}
 *   />
 */

import { forwardRef, useState, useEffect, useRef, useCallback, useImperativeHandle, useMemo } from 'react';
import type { ForwardedRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryAdapter } from '@monkeytab/adapter-memory';
import type {
  FieldType,
  FieldSpec,
  FieldOptions,
  TableSpec,
  Row,
  Value,
  BaseSpec,
  FunctionDef,
  FieldTypeConstraint,
  PresenceUser,
  QueryResult,
  RemoteChangeEvent,
} from '@monkeytab/core';
import { functionRegistry, constraintRegistry } from '@monkeytab/core';
import { MonkeyTabClientProvider } from '../ui/client/ClientContext.tsx';
import { CrudHooksProvider, type CrudHooks } from '../ui/client/CrudHooksContext.tsx';
import { PresenceProvider } from '../ui/client/PresenceContext.tsx';
import { PresenceBar } from '../ui/components/PresenceBar.tsx';
import { ActiveCellBridge } from '../ui/components/grid/ActiveCellBridge.tsx';
import { GridStoreProvider } from '../ui/state/GridStoreContext.tsx';
import { I18nProvider, type I18nStrings } from '../ui/i18n/index.ts';
import { registerDefaults } from '../ui/registry/defaults.ts';
import { componentRegistry, type CellRenderer as RegistryCellRenderer, type CellEditor } from '../ui/registry/ComponentRegistry.ts';
import { TextPopupSizeProvider, type TextPopupSize } from '../ui/components/editors/TextPopupContext.tsx';
import { BrowserClient } from './BrowserClient.ts';
import { TableView } from './TableView.tsx';
import type { RowHeightOption, CellRenderer as GridCellRenderer } from '../ui/components/grid/Grid.tsx';

// Ensure registries are initialized
registerDefaults();

/** Custom cell renderer function for a column */
export type CellRendererFn = (value: Value, row: Record<string, Value>, fieldId: string) => React.ReactNode;

export interface MonkeyTableColumn {
  id: string;
  label?: string;
  type?: FieldType;
  options?: FieldOptions;
  /** Custom icon for the column header — overrides the default type icon */
  icon?: React.ReactNode;
  /** Custom renderer — replaces the default type-aware cell renderer */
  render?: CellRendererFn;
  /** Hide this column from display while keeping data accessible to renderers */
  hidden?: boolean;
  /** Per-column editable flag — false makes this column read-only even when the table is editable */
  editable?: boolean;
  /** Initial column width in pixels (default: 180) */
  width?: number;
  /** Minimum column width in pixels (default: 80) */
  minWidth?: number;
  /** Maximum column width in pixels (default: 600) */
  maxWidth?: number;
  /** Whether this column can be sorted — false hides sort from header menu (default: true) */
  sortable?: boolean;
  /** Cell text alignment (default: type-dependent — 'right' for Number, 'left' for others) */
  align?: 'left' | 'center' | 'right';
  /** When true, Add Row is blocked unless this column has a value.
   *  Missing = null, undefined, '', or []. `0` and `false` count as present. */
  required?: boolean;
}

export interface MonkeyTableProps {
  // ── Data ────────────────────────────────────────────────────────────────
  /** Column definitions */
  columns: MonkeyTableColumn[];
  /** Row data — each row is an id→value mapping */
  rows: Array<Record<string, Value>>;
  /** Called with denormalized row data whenever a mutation settles */
  onChange?: (rows: Array<Record<string, Value>>) => void;
  /** Called with full Row objects (includes ids and timestamps) */
  onRowsChange?: (rows: Row[]) => void;
  /** Called when row checkbox selection changes */
  onSelectionChange?: (selectedRowIds: string[]) => void;
  /** Controlled selection — set selected row IDs externally (e.g. to clear after bulk action) */
  selectedRowIds?: string[];
  /** Called when a row is clicked (distinct from cell editing or context menu) */
  onRowClick?: (row: Record<string, Value>) => void;
  /** Called when a single cell value changes — fires before the mutation with rowId, fieldId, new and old values */
  onCellChange?: (rowId: string, fieldId: string, newValue: Value, oldValue: Value) => void;
  /** Called when the active (focused) cell changes via click or keyboard navigation.
   *  Nulls mean no cell is focused. Useful for broadcasting the local cursor in
   *  multiplayer presence. */
  onActiveCellChange?: (rowId: string | null, fieldId: string | null) => void;

  // ── Async CRUD (back a real database) ────────────────────────────────────
  /** Called when the user adds a row. Return the row's id (and optionally enriched fields
   *  like DB-assigned timestamps). If this rejects, the pending row is removed. */
  onRowCreate?: (draft: { fields: Record<string, Value> }) => Promise<{ id: string; fields?: Record<string, Value> }>;
  /** Called when a cell is edited. Return a Promise that resolves once persisted.
   *  If it rejects, the UI rolls back to `oldValue`. */
  onCellSave?: (rowId: string, fieldId: string, newValue: Value, oldValue: Value) => Promise<void>;
  /** Called when a row is deleted. Return a Promise. If it rejects, the row reappears. */
  onRowDelete?: (rowId: string) => Promise<void>;
  /** Called whenever an async CRUD hook rejects. Consumers can wire their own toast/logging here. */
  onHookError?: (kind: 'create' | 'update' | 'delete', err: unknown) => void;
  /** Show a minimal built-in toast with the last hook error message (default: false). */
  errorToast?: boolean;
  /** Render a per-cell saving indicator (left border) while async hooks are in flight (default: false). */
  showCellSaveStatus?: boolean;

  // ── Realtime / multiplayer ───────────────────────────────────────────────
  /** Other users currently viewing/editing this table. Renders a small avatar
   *  strip above the grid and colored cell outlines at each user's cursor.
   *  Build this list from your own auth + socket layer. Leave empty / undefined
   *  for single-user tables (no UI impact). */
  presence?: PresenceUser[];

  // ── Row identity ─────────────────────────────────────────────────────────
  /** Controls how MonkeyTable derives the id for each input row.
   *  - `string` — the row object key to read (e.g. 'uuid', '_id').
   *  - `(row) => string` — a function that returns the id.
   *  When omitted, `row.id` is used if present, otherwise a sequential id is generated. */
  rowKey?: string | ((row: Record<string, Value>) => string);

  /** Render prop for custom bulk actions shown when rows are selected.
   *  Receives the selected row IDs and a function to clear the selection. */
  selectionActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;

  // ── Grouping ──────────────────────────────────────────────────────────────
  /** Field ID to group rows by (single column). Omit or null for no grouping. */
  groupBy?: string | null;
  /** Default collapsed state for groups (default: false = expanded) */
  groupCollapsed?: boolean;
  /** Called when user changes grouping via column header menu */
  onGroupByChange?: (fieldId: string | null) => void;
  /** Group display order.
   *  - `'auto'` (default): SingleSelect/MultiSelect use their option order; other fields sort alphabetically.
   *  - `'asc'` / `'desc'`: alphabetical / reverse-alphabetical by group value.
   *  - `'count-desc'` / `'count-asc'`: by row count within each group.
   *  - `string[]`: explicit order — list of group values in the desired sequence. */
  groupOrder?: 'auto' | 'asc' | 'desc' | 'count-asc' | 'count-desc' | string[];

  // ── Row Coloring ──────────────────────────────────────────────────────────
  /** Field ID whose value determines each row's background tint. Uses the field's
   *  existing color mapping (SingleSelect option colors, Boolean true/false). */
  colorBy?: string | null;
  /** Called when user changes coloring via column header menu */
  onColorByChange?: (fieldId: string | null) => void;
  /** Optional per-value color overrides, keyed by stringified value. */
  colorByMap?: Record<string, string>;

  // ── Sorting ───────────────────────────────────────────────────────────────
  /** Controlled sort field — the column currently sorted */
  sortBy?: string | null;
  /** Controlled sort direction */
  sortDirection?: 'asc' | 'desc' | null;
  /** Called when user changes sort via column header click or menu */
  onSortChange?: (fieldId: string | null, direction: 'asc' | 'desc' | null) => void;

  // ── Pagination ────────────────────────────────────────────────────────────
  /** Total row count from the server. When set, enables pagination UI. */
  totalRows?: number;
  /** Current page (1-based). Controlled. */
  page?: number;
  /** Rows per page (default: 500) */
  pageSize?: number;
  /** Called when user navigates to a different page */
  onPageChange?: (page: number) => void;
  /** Pagination UI style: 'simple' for Previous/Next, 'load-more' for infinite scroll (default: 'simple') */
  paginationMode?: 'simple' | 'load-more';
  /** Whether more data is being fetched (shows loading state in pagination) */
  paginationLoading?: boolean;

  // ── Layout ──────────────────────────────────────────────────────────────
  /** Show faint ghost rows/columns to fill the viewport, spreadsheet-style.
   *  `true` auto-fills the visible area. Pass `{ rows, columns }` for explicit counts. */
  ghostGrid?: boolean | { rows?: number; columns?: number };
  /** Container height.
   *  - `'auto'`: fits content exactly — no scrollbar for small tables. Pair with `maxHeight` to cap.
   *  - `number`: fixed pixel height. `ghostGrid` defaults to `true` to fill empty space.
   *  - CSS string (`'100%'`, `'50vh'`): fills parent (default `'100%'`). */
  height?: 'auto' | number | string;
  /** Maximum height in pixels. Useful with `height="auto"` to cap growth, or with
   *  `height="100%"` to limit fluid containers. Ignored when `height` is a fixed number. */
  maxHeight?: number;
  /** Column sizing strategy.
   *  - `'auto'` (default): each column sized to fit its content (header + data). Table may scroll horizontally.
   *  - `'fill'`: distribute available container width evenly across columns (no horizontal overflow).
   *  - `'fixed'`: each column starts at 180px (or its `width` prop). */
  columnFit?: 'auto' | 'fill' | 'fixed';
  /** Minimum column width in `'auto'` mode (default: 60). Per-column `minWidth` overrides this. */
  autoFitMin?: number;
  /** Maximum column width in `'auto'` mode (default: 320). Per-column `maxWidth` overrides this. */
  autoFitMax?: number;
  /** Row height preset (default: 'medium') */
  rowHeight?: RowHeightOption;
  /** Show row number column (default: false) */
  showRowNumbers?: boolean;
  /** Reduce padding/fonts for denser display (default: false) */
  compactMode?: boolean;

  // ── Permissions ─────────────────────────────────────────────────────────
  /** Master switch — allow any editing (default: true) */
  editable?: boolean;
  /** Allow adding new columns (default: true) */
  allowCreateField?: boolean;
  /** Allow deleting columns (default: true) */
  allowDeleteField?: boolean;
  /** Allow adding new rows (default: true) */
  allowCreateRecord?: boolean;
  /** Allow reordering columns via drag-and-drop (default: true) */
  allowColumnReorder?: boolean;
  /** Allow dragging multiple selected columns at once (default: true) */
  allowMultiColumnDrag?: boolean;
  /** Show confirmation dialog before deleting rows/columns (default: true) */
  confirmBeforeDelete?: boolean;

  // ── Toolbar ─────────────────────────────────────────────────────────────
  /** Show the toolbar above the grid (default: true) */
  showToolbar?: boolean;
  /** Show the search input in the toolbar (default: true) */
  showSearch?: boolean;
  /** Show the filter button in the toolbar (default: true) */
  showFilters?: boolean;
  /** Show the row height dropdown in the toolbar (default: true) */
  showRowHeightControl?: boolean;
  /** Show the row numbers toggle in the toolbar (default: true) */
  showRowNumbersControl?: boolean;
  /** Show the add-row button in the toolbar (default: true) */
  showAddRowButton?: boolean;

  // ── Locale & Formatting ─────────────────────────────────────────────────
  /** BCP 47 locale tag, e.g. 'en-US', 'es-CO', 'ja-JP' (default: 'en-US') */
  locale?: string;
  /** UI language override — defaults to locale primary subtag */
  language?: string;
  /** Default date display format (default: 'iso') */
  dateDisplayFormat?: 'iso' | 'locale' | 'relative';
  /** Default decimal places for number fields (default: 2) */
  numberDecimalPlaces?: number;
  /** Show thousands separator in number fields (default: false) */
  numberThousandsSeparator?: boolean;
  /** ISO 4217 currency code, e.g. 'USD', 'EUR', 'COP' (default: 'USD') */
  currencyCode?: string;
  /** How to display currency (default: 'symbol') */
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';

  // ── Translations ──────────────────────────────────────────────────────
  /** Partial string overrides for UI labels (merged with built-in language bundle) */
  translations?: Partial<I18nStrings>;

  // ── Advanced ────────────────────────────────────────────────────────────
  /** URL for server-side computed field functions */
  functionsEndpoint?: string | null;
  /** Called when a file is selected in file-type editors. Return the permanent URL after uploading. */
  onUpload?: (file: File, fieldType: string) => Promise<string>;

  // ── Text editor popup ────────────────────────────────────────────────────
  /** Global defaults for the Text column popup editor (multiline / richText / json).
   *  Accepts numbers (pixels) or CSS length strings (e.g. `'50vw'`, `'60vh'`).
   *  Per-column `TextFieldOptions.popupWidth/popupMinHeight/popupMaxHeight` override these. */
  textPopup?: TextPopupSize;

  // ── Column lifecycle ─────────────────────────────────────────────────────
  // Each hook fires after the internal mutation succeeds. Provide a callback
  // to enable the matching header-menu entry (or the ghost "+ column" / "Add
  // field" button for onColumnCreate). Omit a callback to hide its entry.
  // These are the schema counterparts of the row-level CRUD hooks.
  /** Fires when the user renames a column. Update your `columns` prop to keep the label in sync. */
  onColumnRename?: (fieldId: string, newLabel: string, oldLabel: string) => void;
  /** Fires when the user deletes a column. Remove it from your `columns` prop. */
  onColumnDelete?: (fieldId: string) => void;
  /** Fires when the user adds a column (via "+" button, ghost cell, or formula builder). Append it to your `columns` prop. */
  onColumnCreate?: (field: { id: string; label: string; type: FieldType; options?: FieldOptions }) => void;
  /** Fires when the user changes a column's field type. */
  onColumnChangeType?: (fieldId: string, newType: FieldType) => void;
  /** Fires when the user edits a column's type-specific options (select choices, number format, etc.). */
  onColumnUpdateOptions?: (fieldId: string, options: FieldOptions) => void;

  // ── Registry Extensions ────────────────────────────────────────────────
  /** Custom computed functions — registered on mount, unregistered on unmount */
  functions?: FunctionDef[];
  /** Custom field constraints — registered on mount, unregistered on unmount */
  constraints?: FieldTypeConstraint[];
  /** Custom type-level renderers — keyed by FieldType, overrides built-in renderers */
  renderers?: Record<string, RegistryCellRenderer>;
  /** Custom type-level editors — keyed by FieldType, overrides built-in editors */
  editors?: Record<string, CellEditor>;
}

const BASE_ID = 'base-1';
const TABLE_ID = 'table-1';

/** Imperative handle exposed via `ref={...}` on `<MonkeyTable>`. */
export interface MonkeyTableHandle {
  /** Patch the grid with a change from another user (remote WebSocket, SSE, BroadcastChannel, etc.). */
  applyRemoteChange: (event: RemoteChangeEvent) => void;
}

// Chrome heights for auto-height calculation (must match Grid/TableView layout)
const AUTO_HEIGHT_HEADER = 44;
const AUTO_HEIGHT_TOOLBAR = 40;
const AUTO_HEIGHT_FOOTER = 37;
const AUTO_HEIGHT_CHROME = 2;
const AUTO_ROW_HEIGHTS: Record<string, number> = { short: 32, medium: 44, tall: 64, 'extra-tall': 88 };
const AUTO_COMPACT_ROW_HEIGHTS: Record<string, number> = { short: 24, medium: 28, tall: 40, 'extra-tall': 60 };

function MonkeyTableInner({
  // Data
  columns,
  rows: inputRows,
  onChange,
  onRowsChange,
  onSelectionChange,
  selectedRowIds,
  onRowClick,
  onCellChange,
  onActiveCellChange,
  // Async CRUD
  onRowCreate,
  onCellSave,
  onRowDelete,
  onHookError,
  errorToast,
  showCellSaveStatus,
  // Realtime / multiplayer
  presence,
  // Row identity
  rowKey,
  selectionActions,
  // Grouping
  groupBy,
  groupCollapsed,
  onGroupByChange,
  groupOrder,
  // Row coloring
  colorBy,
  onColorByChange,
  colorByMap,
  // Sorting
  sortBy,
  sortDirection,
  onSortChange,
  // Pagination
  totalRows,
  page,
  pageSize = 500,
  onPageChange,
  paginationMode = 'simple',
  paginationLoading,
  // Layout
  ghostGrid,
  height = '100%',
  maxHeight,
  rowHeight,
  columnFit = 'auto',
  autoFitMin,
  autoFitMax,
  showRowNumbers,
  compactMode,
  // Permissions
  editable = true,
  allowCreateField,
  allowDeleteField,
  allowCreateRecord,
  allowColumnReorder,
  allowMultiColumnDrag,
  confirmBeforeDelete,
  // Toolbar
  showToolbar,
  showSearch,
  showFilters,
  showRowHeightControl,
  showRowNumbersControl,
  showAddRowButton,
  // Locale
  locale,
  language,
  dateDisplayFormat,
  numberDecimalPlaces,
  numberThousandsSeparator,
  currencyCode,
  currencyDisplay,
  // Translations
  translations,
  // Advanced
  functionsEndpoint,
  onUpload,
  textPopup,
  // Column lifecycle
  onColumnRename,
  onColumnDelete,
  onColumnCreate,
  onColumnChangeType,
  onColumnUpdateOptions,
  // Registry extensions
  functions: functionDefs,
  constraints: constraintDefs,
  renderers: rendererOverrides,
  editors: editorOverrides,
}: MonkeyTableProps, ref: ForwardedRef<MonkeyTableHandle>) {
  // All columns (including hidden) — used for data mapping
  const allColumns = columns;

  // Visible columns only — used for field specs
  const visibleColumns = useMemo(
    () => allColumns.filter((col) => !col.hidden),
    [allColumns],
  );

  // Build field specs from visible columns
  const fields: FieldSpec[] = useMemo(
    () =>
      visibleColumns.map((col) => ({
        id: col.id,
        label: col.label ?? col.id,
        type: col.type ?? 'Text',
        options: col.options,
        ...(col.required !== undefined ? { required: col.required } : {}),
      })),
    [visibleColumns],
  );

  // Build custom renderers map (fieldId → renderer that adapts Row → Record<string, Value>)
  const customRenderers = useMemo(() => {
    const map: Record<string, GridCellRenderer> = {};
    for (const col of visibleColumns) {
      if (col.render) {
        const userRender = col.render;
        map[col.id] = (value, row, fieldId) => {
          // Denormalize all row fields (including extras not in column defs)
          const denormalized: Record<string, Value> = {};
          for (const [key, val] of Object.entries(row.fields)) {
            denormalized[key] = val;
          }
          return userRender(value, denormalized, fieldId);
        };
      }
    }
    return Object.keys(map).length > 0 ? map : undefined;
  }, [visibleColumns, allColumns]);

  // Build custom icons map (fieldId → ReactNode)
  const customIcons = useMemo(() => {
    const map: Record<string, React.ReactNode> = {};
    for (const col of visibleColumns) {
      if (col.icon) {
        map[col.id] = col.icon;
      }
    }
    return Object.keys(map).length > 0 ? map : undefined;
  }, [visibleColumns]);

  // Build per-column config maps (fieldId → value) for Grid consumption
  const columnConfig = useMemo(() => {
    const editableMap: Record<string, boolean> = {};
    const widthMap: Record<string, number> = {};
    const minWidthMap: Record<string, number> = {};
    const maxWidthMap: Record<string, number> = {};
    const sortableMap: Record<string, boolean> = {};
    const alignMap: Record<string, 'left' | 'center' | 'right'> = {};
    for (const col of visibleColumns) {
      if (col.editable !== undefined) editableMap[col.id] = col.editable;
      if (col.width !== undefined) widthMap[col.id] = col.width;
      if (col.minWidth !== undefined) minWidthMap[col.id] = col.minWidth;
      if (col.maxWidth !== undefined) maxWidthMap[col.id] = col.maxWidth;
      if (col.sortable !== undefined) sortableMap[col.id] = col.sortable;
      if (col.align !== undefined) alignMap[col.id] = col.align;
    }
    return {
      editable: Object.keys(editableMap).length > 0 ? editableMap : undefined,
      width: Object.keys(widthMap).length > 0 ? widthMap : undefined,
      minWidth: Object.keys(minWidthMap).length > 0 ? minWidthMap : undefined,
      maxWidth: Object.keys(maxWidthMap).length > 0 ? maxWidthMap : undefined,
      sortable: Object.keys(sortableMap).length > 0 ? sortableMap : undefined,
      align: Object.keys(alignMap).length > 0 ? alignMap : undefined,
    };
  }, [visibleColumns]);

  // Build rows for the adapter — include all columns (even hidden) so renderers can access them
  const adapterRows: Row[] = useMemo(
    () =>
      inputRows.map((row, i) => {
        const fieldValues: Record<string, Value> = {};
        // Preserve ALL row keys (including extra fields like __id)
        // so custom renderers and onChange can access them
        for (const [key, val] of Object.entries(row)) {
          fieldValues[key] = val as Value;
        }
        // Ensure all declared columns have at least null
        for (const col of allColumns) {
          if (!(col.id in fieldValues)) {
            fieldValues[col.id] = null;
          }
        }
        // Row identity: rowKey (string or function), then row.id, then fallback.
        let id: string | null = null;
        if (typeof rowKey === 'function') {
          const k = rowKey(row);
          if (typeof k === 'string' && k) id = k;
        } else if (typeof rowKey === 'string') {
          const k = row[rowKey];
          if (typeof k === 'string' && k) id = k;
        }
        if (!id && typeof row.id === 'string' && row.id) id = row.id as string;
        if (!id) id = `rec-${i + 1}`;
        return {
          id,
          fields: fieldValues,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }),
    [inputRows, allColumns, rowKey],
  );

  // Create adapter + client once, then seed with data
  const adapterRef = useRef<MemoryAdapter | null>(null);
  const clientRef = useRef<BrowserClient | null>(null);
  const queryClientRef = useRef<QueryClient | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const table: TableSpec = {
      id: TABLE_ID,
      label: 'Table',
      fields,
      primaryFieldId: fields[0]?.id,
      columnOrder: fields.map((f) => f.id),
      display: {
        rowHeight: rowHeight,
        showRowNumbers: showRowNumbers,
      },
    };

    const base: BaseSpec = {
      id: BASE_ID,
      label: 'Data',
      tables: [table],
    };

    const rowsMap = new Map<string, Row[]>();
    rowsMap.set(`${BASE_ID}:${TABLE_ID}`, adapterRows);

    const adapter = new MemoryAdapter({ bases: [base], rows: rowsMap });
    const browserClient = new BrowserClient(adapter);

    // Build settings from flat props (only include explicitly set values)
    const settingsFromProps: Record<string, unknown> = {};
    if (!editable) settingsFromProps.readOnly = true;
    if (allowCreateField !== undefined) settingsFromProps.allowCreateField = allowCreateField;
    if (allowDeleteField !== undefined) settingsFromProps.allowDeleteField = allowDeleteField;
    if (allowCreateRecord !== undefined) settingsFromProps.allowCreateRecord = allowCreateRecord;
    if (allowColumnReorder !== undefined) settingsFromProps.allowColumnReorder = allowColumnReorder;
    if (allowMultiColumnDrag !== undefined) settingsFromProps.allowMultiColumnDrag = allowMultiColumnDrag;
    if (confirmBeforeDelete !== undefined) settingsFromProps.confirmBeforeDelete = confirmBeforeDelete;
    if (compactMode !== undefined) settingsFromProps.defaultCompactMode = compactMode;
    if (showToolbar !== undefined) settingsFromProps.showToolbar = showToolbar;
    if (showSearch !== undefined) settingsFromProps.showSearch = showSearch;
    if (showFilters !== undefined) settingsFromProps.showFilters = showFilters;
    if (showRowHeightControl !== undefined) settingsFromProps.showRowHeightControl = showRowHeightControl;
    if (showRowNumbersControl !== undefined) settingsFromProps.showRowNumbersControl = showRowNumbersControl;
    if (showAddRowButton !== undefined) settingsFromProps.showAddRowButton = showAddRowButton;
    if (locale !== undefined) settingsFromProps.locale = locale;
    if (language !== undefined) settingsFromProps.language = language;
    if (dateDisplayFormat !== undefined) settingsFromProps.dateDisplayFormat = dateDisplayFormat;
    if (numberDecimalPlaces !== undefined) settingsFromProps.numberDecimalPlaces = numberDecimalPlaces;
    if (numberThousandsSeparator !== undefined) settingsFromProps.numberThousandsSeparator = numberThousandsSeparator;
    if (currencyCode !== undefined) settingsFromProps.currencyCode = currencyCode;
    if (currencyDisplay !== undefined) settingsFromProps.currencyDisplay = currencyDisplay;
    if (functionsEndpoint !== undefined) settingsFromProps.functionsEndpoint = functionsEndpoint;

    if (Object.keys(settingsFromProps).length > 0) {
      adapter.updateSettings(settingsFromProps);
    }

    adapterRef.current = adapter;
    clientRef.current = browserClient;

    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 0,
          retry: 0,
        },
      },
    });

    adapter.initialize().then(() => setReady(true));

    return () => {
      queryClientRef.current?.clear();
    };
  }, []); // Initialize only once

  // Re-seed adapter rows when inputRows change (e.g. pagination, external data swap)
  useEffect(() => {
    if (!ready || !adapterRef.current) return;
    adapterRef.current.replaceRows(BASE_ID, TABLE_ID, adapterRows);
    queryClientRef.current?.invalidateQueries({ queryKey: ['rows'] });
  }, [adapterRows, ready]);

  // React to column definition changes (labels, types, options, hidden, order)
  useEffect(() => {
    if (!ready || !adapterRef.current) return;
    adapterRef.current.replaceFields(BASE_ID, TABLE_ID, fields, fields.map((f) => f.id));
    queryClientRef.current?.invalidateQueries();
  }, [fields, ready]);

  // React to settings prop changes
  useEffect(() => {
    if (!ready || !adapterRef.current) return;
    const s: Record<string, unknown> = { readOnly: !editable };
    if (allowCreateField !== undefined) s.allowCreateField = allowCreateField;
    if (allowDeleteField !== undefined) s.allowDeleteField = allowDeleteField;
    if (allowCreateRecord !== undefined) s.allowCreateRecord = allowCreateRecord;
    if (allowColumnReorder !== undefined) s.allowColumnReorder = allowColumnReorder;
    if (allowMultiColumnDrag !== undefined) s.allowMultiColumnDrag = allowMultiColumnDrag;
    if (confirmBeforeDelete !== undefined) s.confirmBeforeDelete = confirmBeforeDelete;
    if (compactMode !== undefined) s.defaultCompactMode = compactMode;
    if (showToolbar !== undefined) s.showToolbar = showToolbar;
    if (showSearch !== undefined) s.showSearch = showSearch;
    if (showFilters !== undefined) s.showFilters = showFilters;
    if (showRowHeightControl !== undefined) s.showRowHeightControl = showRowHeightControl;
    if (showRowNumbersControl !== undefined) s.showRowNumbersControl = showRowNumbersControl;
    if (showAddRowButton !== undefined) s.showAddRowButton = showAddRowButton;
    if (locale !== undefined) s.locale = locale;
    if (language !== undefined) s.language = language;
    if (dateDisplayFormat !== undefined) s.dateDisplayFormat = dateDisplayFormat;
    if (numberDecimalPlaces !== undefined) s.numberDecimalPlaces = numberDecimalPlaces;
    if (numberThousandsSeparator !== undefined) s.numberThousandsSeparator = numberThousandsSeparator;
    if (currencyCode !== undefined) s.currencyCode = currencyCode;
    if (currencyDisplay !== undefined) s.currencyDisplay = currencyDisplay;
    if (functionsEndpoint !== undefined) s.functionsEndpoint = functionsEndpoint;
    adapterRef.current.updateSettings(s);
    queryClientRef.current?.invalidateQueries({ queryKey: ['settings'] });
  }, [
    editable, allowCreateField, allowDeleteField, allowCreateRecord,
    allowColumnReorder, allowMultiColumnDrag, confirmBeforeDelete, compactMode,
    showToolbar, showSearch, showFilters, showRowHeightControl, showRowNumbersControl, showAddRowButton,
    locale, language, dateDisplayFormat, numberDecimalPlaces, numberThousandsSeparator,
    currencyCode, currencyDisplay, functionsEndpoint, ready,
  ]);

  // React to `rowHeight` / `showRowNumbers` prop changes
  useEffect(() => {
    if (!ready || !adapterRef.current) return;
    adapterRef.current.updateTable(BASE_ID, TABLE_ID, {
      display: { rowHeight, showRowNumbers },
    });
    // Invalidate queries so the UI re-fetches the updated table spec
    queryClientRef.current?.invalidateQueries();
  }, [rowHeight, showRowNumbers, ready]);

  // ── Registry extension lifecycle ────────────────────────────────────────

  // Custom computed functions
  useEffect(() => {
    if (!functionDefs) return;
    for (const fn of functionDefs) {
      functionRegistry.register(fn);
    }
    return () => {
      for (const fn of functionDefs) {
        functionRegistry.unregister(fn.name);
      }
    };
  }, [functionDefs]);

  // Custom field constraints
  useEffect(() => {
    if (!constraintDefs) return;
    for (const c of constraintDefs) {
      constraintRegistry.register(c);
    }
    return () => {
      for (const c of constraintDefs) {
        constraintRegistry.unregister(c.name);
      }
    };
  }, [constraintDefs]);

  // Custom type-level renderers and editors
  useEffect(() => {
    if (!rendererOverrides && !editorOverrides) return;
    const types = new Set([
      ...Object.keys(rendererOverrides ?? {}),
      ...Object.keys(editorOverrides ?? {}),
    ]);
    // Save originals for cleanup
    const originals = new Map<string, { renderer?: RegistryCellRenderer; editor?: CellEditor }>();
    for (const type of types) {
      originals.set(type, {
        renderer: componentRegistry.getRenderer(type),
        editor: componentRegistry.getEditor(type),
      });
      componentRegistry.register(
        type,
        rendererOverrides?.[type] ?? componentRegistry.getRenderer(type)!,
        editorOverrides?.[type] ?? componentRegistry.getEditor(type)!,
      );
    }
    return () => {
      for (const [type, orig] of originals) {
        if (orig.renderer && orig.editor) {
          componentRegistry.register(type, orig.renderer, orig.editor);
        }
      }
    };
  }, [rendererOverrides, editorOverrides]);

  // Sync onChange callback: poll for changes after each render
  const lastRowsJson = useRef('');
  const notifyChange = useCallback(async () => {
    if (!adapterRef.current || (!onChange && !onRowsChange)) return;

    const result = await adapterRef.current.queryRecords(BASE_ID, TABLE_ID, { limit: 100000 });
    const currentRows = result.rows;

    // Check if data actually changed
    const json = JSON.stringify(currentRows.map((r: Row) => r.fields));
    if (json === lastRowsJson.current) return;
    lastRowsJson.current = json;

    if (onRowsChange) {
      onRowsChange(currentRows);
    }

    if (onChange) {
      // Denormalize: include ALL stored fields (not just declared columns)
      // so extra row properties survive the round-trip
      const denormalized = currentRows.map((row: Row) => {
        const out: Record<string, Value> = {};
        for (const [key, val] of Object.entries(row.fields)) {
          out[key] = val;
        }
        return out;
      });
      onChange(denormalized);
    }
  }, [onChange, onRowsChange]);

  // Set up a MutationCache observer to call notifyChange after any mutation settles
  useEffect(() => {
    if (!queryClientRef.current) return;
    const qc = queryClientRef.current;

    const unsubscribe = qc.getMutationCache().subscribe((event: any) => {
      if (event.type === 'updated' && (event.mutation?.state.status === 'success' || event.mutation?.state.status === 'error')) {
        // Small delay to let React Query invalidation settle
        setTimeout(notifyChange, 50);
      }
    });

    return () => unsubscribe();
  }, [notifyChange, ready]);

  // Denormalize a Row to user-facing Record<string, Value>
  // Includes all stored fields, not just declared columns
  const denormalizeRow = useCallback((row: Row): Record<string, Value> => {
    const out: Record<string, Value> = {};
    for (const [key, val] of Object.entries(row.fields)) {
      out[key] = val;
    }
    return out;
  }, []);

  // Wrap onRowClick to denormalize
  const handleRowClick = useMemo(() => {
    if (!onRowClick) return undefined;
    return (row: Row) => onRowClick(denormalizeRow(row));
  }, [onRowClick, denormalizeRow]);

  // Built-in error toast state (opt-in via `errorToast`). Auto-dismisses after 3s.
  const [lastError, setLastError] = useState<string | null>(null);
  useEffect(() => {
    if (!lastError) return;
    const id = setTimeout(() => setLastError(null), 3000);
    return () => clearTimeout(id);
  }, [lastError]);

  // Expose imperative `applyRemoteChange` so consumers can patch the grid
  // from their own realtime transport (WS/SSE/BroadcastChannel).
  useImperativeHandle(ref, () => ({
    applyRemoteChange: (event: RemoteChangeEvent) => {
      const qc = queryClientRef.current;
      if (!qc) return;
      qc.setQueriesData<QueryResult>({ queryKey: ['rows'] }, (prev) => {
        if (!prev) return prev;
        switch (event.type) {
          case 'row.created': {
            if (prev.rows.some((r) => r.id === event.row.id)) return prev;
            return {
              ...prev,
              rows: [...prev.rows, event.row],
              pagination: { ...prev.pagination, total: prev.pagination.total + 1 },
            };
          }
          case 'row.updated': {
            let touched = false;
            const rows = prev.rows.map((row) => {
              if (row.id !== event.rowId) return row;
              touched = true;
              return {
                ...row,
                fields: { ...row.fields, ...event.fields },
                updatedAt: event.updatedAt ?? row.updatedAt,
              };
            });
            if (!touched) return prev;
            return { ...prev, rows };
          }
          case 'row.deleted': {
            const rows = prev.rows.filter((r) => r.id !== event.rowId);
            if (rows.length === prev.rows.length) return prev;
            return {
              ...prev,
              rows,
              pagination: { ...prev.pagination, total: Math.max(0, prev.pagination.total - 1) },
            };
          }
          default:
            return prev;
        }
      });
    },
  }), []);

  // Assemble CRUD hooks for the context. Wrap `onHookError` so the built-in toast
  // (if `errorToast`) updates alongside the consumer's callback.
  const hooksValue: CrudHooks = useMemo(() => ({
    onRowCreate,
    onCellSave,
    onRowDelete,
    showCellSaveStatus,
    onHookError: (kind, err) => {
      if (errorToast) {
        const msg = err instanceof Error ? err.message : String(err);
        setLastError(`${kind}: ${msg}`);
      }
      onHookError?.(kind, err);
    },
  }), [onRowCreate, onCellSave, onRowDelete, showCellSaveStatus, onHookError, errorToast]);

  if (!ready || !clientRef.current || !queryClientRef.current) {
    return (
      <div style={{
        height: typeof height === 'number' ? `${height}px` : height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#9ca3af',
          borderRadius: '50%',
          animation: 'mt-spin 0.6s linear infinite',
        }} />
        <style>{`@keyframes mt-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Height mode resolution ───────────────────────────────────────────
  const isAutoHeight = height === 'auto';
  const isFixedHeight = typeof height === 'number';

  let resolvedHeight: string | number = height;
  if (isAutoHeight) {
    const rowHeightKey = rowHeight ?? 'medium';
    const cellH = rowHeightKey === 'fit'
      ? (compactMode ? 28 : 44)
      : (compactMode ? AUTO_COMPACT_ROW_HEIGHTS : AUTO_ROW_HEIGHTS)[rowHeightKey] ?? 44;
    const rowCount = inputRows?.length ?? 0;
    const computed = AUTO_HEIGHT_HEADER
      + (showToolbar !== false ? AUTO_HEIGHT_TOOLBAR : 0)
      + rowCount * cellH
      + AUTO_HEIGHT_FOOTER
      + AUTO_HEIGHT_CHROME;
    resolvedHeight = maxHeight ? Math.min(computed, maxHeight) : computed;
  }

  // Ghost grid: default to true for fixed-pixel heights so empty space is filled
  const resolvedGhostGrid = ghostGrid !== undefined
    ? ghostGrid
    : isFixedHeight ? true : undefined;

  const containerStyle: React.CSSProperties = {
    height: typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight,
    ...(maxHeight && !isFixedHeight && !isAutoHeight && { maxHeight: `${maxHeight}px` }),
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0, // Allow shrinking inside flex parents (prevents horizontal page overflow)
    position: 'relative', // anchor the optional error toast
  };

  return (
    <div style={containerStyle}>
      <QueryClientProvider client={queryClientRef.current}>
        <MonkeyTabClientProvider client={clientRef.current}>
          <CrudHooksProvider hooks={hooksValue}>
          <PresenceProvider users={presence ?? []}>
          <I18nProvider overrides={translations}>
            <TextPopupSizeProvider value={textPopup}>
            <GridStoreProvider>
              <PresenceBar />
              {onActiveCellChange && <ActiveCellBridge onActiveCellChange={onActiveCellChange} />}
              <TableView
                baseId={BASE_ID}
                tableId={TABLE_ID}
                onSelectionChange={onSelectionChange}
                selectedRowIds={selectedRowIds}
                onRowClick={handleRowClick}
                customRenderers={customRenderers}
                customIcons={customIcons}
                columnEditable={columnConfig.editable}
                columnWidth={columnConfig.width}
                columnMinWidth={columnConfig.minWidth}
                columnMaxWidth={columnConfig.maxWidth}
                columnSortable={columnConfig.sortable}
                columnAlign={columnConfig.align}
                onUpload={onUpload}
                onCellChange={onCellChange}
                onSortChange={onSortChange}
                sortBy={sortBy}
                sortDirection={sortDirection}
                totalRows={totalRows}
                page={page}
                pageSize={pageSize}
                onPageChange={onPageChange}
                ghostGrid={resolvedGhostGrid}
                columnFit={columnFit}
                autoFitMin={autoFitMin}
                autoFitMax={autoFitMax}
                paginationMode={paginationMode}
                paginationLoading={paginationLoading}
                selectionActions={selectionActions}
                groupBy={groupBy}
                groupCollapsed={groupCollapsed}
                onGroupByChange={onGroupByChange}
                groupOrder={groupOrder}
                colorBy={colorBy}
                onColorByChange={onColorByChange}
                colorByMap={colorByMap}
                onColumnRename={onColumnRename}
                onColumnDelete={onColumnDelete}
                onColumnCreate={onColumnCreate}
                onColumnChangeType={onColumnChangeType}
                onColumnUpdateOptions={onColumnUpdateOptions}
              />
            </GridStoreProvider>
            </TextPopupSizeProvider>
          </I18nProvider>
          </PresenceProvider>
          </CrudHooksProvider>
        </MonkeyTabClientProvider>
      </QueryClientProvider>
      {errorToast && lastError && (
        <div
          role="status"
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            padding: '8px 12px',
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 4,
            fontSize: 12,
            maxWidth: 360,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}
        >
          {lastError}
        </div>
      )}
    </div>
  );
}

export const MonkeyTable = forwardRef<MonkeyTableHandle, MonkeyTableProps>(MonkeyTableInner);
MonkeyTable.displayName = 'MonkeyTable';
