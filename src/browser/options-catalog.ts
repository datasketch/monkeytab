/**
 * MonkeyTable Options Catalog
 *
 * Machine-readable registry of all MonkeyTable props with lifecycle status,
 * rendering behavior, and usage examples.
 *
 * Used for:
 * - CLI documentation: `monkeytab options`, `monkeytab options --status wired`
 * - AI agent consumption: understand what each option does and how to use it
 * - Automated testing: verify every "implemented" option affects behavior
 * - Progress tracking: see what's wired vs planned
 *
 * Lifecycle statuses:
 *   implemented  — prop is accepted, wired through, and affects rendering/behavior
 *   wired        — prop is accepted and passed to settings/display, but downstream
 *                  component doesn't consume it yet
 *   planned      — prop is defined on the interface but not yet wired
 */

export type OptionLifecycle = 'implemented' | 'wired' | 'planned';
export type OptionVisibility = 'public' | 'private';

export type OptionCategory =
  | 'data'
  | 'layout'
  | 'permissions'
  | 'toolbar'
  | 'locale'
  | 'advanced';

export interface OptionEntry {
  /** Prop name on MonkeyTableProps */
  prop: string;
  /** Human-readable description */
  description: string;
  /** Category for grouping */
  category: OptionCategory;
  /** TypeScript type (for docs) */
  type: string;
  /** Default value */
  default: unknown;
  /** Lifecycle status */
  status: OptionLifecycle;
  /** Whether this prop ships in the public npm package or is private-only */
  visibility: OptionVisibility;
  /** Which internal setting/display key it maps to (if any) */
  mapsTo?: string;
  /** What this option affects at the rendering layer */
  affects?: string;
  /** Components that consume this option */
  consumedBy?: string[];
  /** Usage example (JSX-like string) */
  example?: string;
  /** Notes on what's needed to promote status */
  notes?: string;
}

export const OPTIONS_CATALOG: OptionEntry[] = [
  // ── Data ──────────────────────────────────────────────────────────────────
  {
    prop: 'columns',
    description: 'Column definitions — each column maps to a field in the grid.',
    category: 'data',
    type: 'MonkeyTableColumn[]',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Defines the table schema: which columns appear, their types, display labels, custom renderers, and visibility.',
    consumedBy: ['MonkeyTable', 'MemoryAdapter', 'Grid'],
    example: `columns={[
  { id: 'name', label: 'Full Name' },
  { id: 'email', type: 'Email' },
  { id: 'status', type: 'SingleSelect', options: { choices: [...] } },
  { id: 'actions', render: (_, row) => <Button onClick={() => edit(row)} /> },
  { id: 'internalId', hidden: true },
]}`,
  },
  {
    prop: 'rows',
    description: 'Row data — each row is a column-id → value mapping.',
    category: 'data',
    type: 'Array<Record<string, Value>>',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Populates the grid cells. Values are matched to columns by id.',
    consumedBy: ['MonkeyTable', 'MemoryAdapter', 'Grid'],
    example: `rows={[
  { name: 'Alice', email: 'alice@co.com', status: 'Active' },
  { name: 'Bob', email: 'bob@co.com', status: 'Inactive' },
]}`,
  },
  {
    prop: 'onChange',
    description: 'Called with denormalized row data whenever a mutation settles.',
    category: 'data',
    type: '(rows: Array<Record<string, Value>>) => void',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Fires after any cell edit, row create/delete, or field change. Receives all rows with column-id keys.',
    consumedBy: ['MonkeyTable'],
    example: 'onChange={(rows) => saveToBackend(rows)}',
  },
  {
    prop: 'onRowsChange',
    description: 'Called with full Row objects (includes internal ids and timestamps).',
    category: 'data',
    type: '(rows: Row[]) => void',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Same trigger as onChange but receives Row objects with id, createdAt, updatedAt.',
    consumedBy: ['MonkeyTable'],
    example: 'onRowsChange={(rows) => console.log(rows[0].id, rows[0].createdAt)}',
  },
  {
    prop: 'onSelectionChange',
    description: 'Called when row checkbox selection changes.',
    category: 'data',
    type: '(selectedRowIds: string[]) => void',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Fires on every checkbox toggle. Receives the full list of currently selected row IDs. Use with selectedRowIds for controlled selection.',
    consumedBy: ['MonkeyTable', 'TableView', 'Grid'],
    example: 'onSelectionChange={(ids) => setSelected(ids)}',
  },
  {
    prop: 'selectedRowIds',
    description: 'Controlled selection — set selected row IDs externally.',
    category: 'data',
    type: 'string[]',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'When provided, Grid uses this instead of internal selection state. Enables clearing selection after bulk actions.',
    consumedBy: ['Grid'],
    example: `const [sel, setSel] = useState<string[]>([]);
<MonkeyTable selectedRowIds={sel} onSelectionChange={setSel} />
// Clear after bulk action: setSel([])`,
  },
  {
    prop: 'onRowClick',
    description: 'Called when a row is clicked (distinct from cell editing or context menu).',
    category: 'data',
    type: '(row: Record<string, Value>) => void',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Adds a click handler on the <tr> element. Adds cursor: pointer styling. Receives the denormalized row. Does NOT fire on checkbox clicks.',
    consumedBy: ['MonkeyTable', 'TableView', 'Grid'],
    example: 'onRowClick={(row) => openDrawer(row.id)}',
  },
  {
    prop: 'onCellChange',
    description: 'Called when a single cell value changes — fires with rowId, fieldId, new and old values.',
    category: 'data',
    type: '(rowId: string, fieldId: string, newValue: Value, oldValue: Value) => void',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Fires synchronously before the internal mutation for every cell edit. Provides granular change info for per-cell API persistence (e.g., PATCH a single row). Does NOT fire for row create/delete — use onChange or onRowsChange for those.',
    consumedBy: ['MonkeyTable', 'TableView'],
    example: `onCellChange={(rowId, fieldId, newValue, oldValue) => {
  fetch(\`/api/tools/\${rowId}\`, {
    method: 'PATCH',
    body: JSON.stringify({ [fieldId]: newValue }),
  });
}}`,
  },
  // ── Sorting ──────────────────────────────────────────────────────────────
  {
    prop: 'sortBy',
    description: 'Controlled sort field — the column currently sorted. Use with sortDirection for server-side sorting.',
    category: 'data',
    type: 'string | null',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'When provided, drives the internal sort state. Click-to-sort on headers still fires onSortChange, but the consumer controls the actual sort state.',
    consumedBy: ['MonkeyTable', 'TableView', 'Grid'],
    example: `sortBy="Score"`,
  },
  {
    prop: 'sortDirection',
    description: 'Controlled sort direction — use with sortBy.',
    category: 'data',
    type: "'asc' | 'desc' | null",
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Controls which direction the current sort column is sorted. Shows arrow indicator in the column header.',
    consumedBy: ['MonkeyTable', 'TableView', 'Grid'],
    example: `sortDirection="asc"`,
  },
  {
    prop: 'onSortChange',
    description: 'Called when user changes sort via column header click or context menu. Receives fieldId and direction (null when sort is cleared).',
    category: 'data',
    type: '(fieldId: string | null, direction: "asc" | "desc" | null) => void',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Fires on every sort change — click column header to toggle asc/desc/none, or use the column context menu. For server-side sorting, use this callback to update your query params.',
    consumedBy: ['MonkeyTable', 'TableView', 'Grid'],
    example: `onSortChange={(fieldId, direction) => {
  setSort({ field: fieldId, dir: direction });
  refetchData();
}}`,
  },
  // ── Pagination ────────────────────────────────────────────────────────────
  {
    prop: 'totalRows',
    description: 'Total row count from the server. When set, enables pagination UI (Previous/Next or Load More).',
    category: 'data',
    type: 'number',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'When provided, replaces the default footer with a pagination bar. Without it, MonkeyTable shows "Showing X of Y" based on rows.length.',
    consumedBy: ['MonkeyTable', 'TableView', 'PaginationBar'],
    example: `totalRows={12345}`,
  },
  {
    prop: 'page',
    description: 'Current page (1-based). Controlled — consumer manages page state.',
    category: 'data',
    type: 'number',
    default: 1,
    status: 'implemented',
    visibility: 'public',
    affects: 'Determines which range is shown in the pagination bar ("Showing 501–1000 of 12,345").',
    consumedBy: ['MonkeyTable', 'TableView', 'PaginationBar'],
    example: `page={currentPage}`,
  },
  {
    prop: 'pageSize',
    description: 'Number of rows per page.',
    category: 'data',
    type: 'number',
    default: 500,
    status: 'implemented',
    visibility: 'public',
    affects: 'Used to calculate total pages and the "Showing X–Y" range.',
    consumedBy: ['MonkeyTable', 'TableView', 'PaginationBar'],
    example: `pageSize={100}`,
  },
  {
    prop: 'onPageChange',
    description: 'Called when user clicks Previous/Next or Load More. Consumer re-fetches data for the new page.',
    category: 'data',
    type: '(page: number) => void',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Fires on page navigation. For simple mode, consumer replaces rows. For load-more mode, consumer appends rows.',
    consumedBy: ['MonkeyTable', 'TableView', 'PaginationBar'],
    example: `onPageChange={(p) => router.push(\`?page=\${p}\`)}`,
  },
  {
    prop: 'paginationMode',
    description: "Pagination UI style: 'simple' for Previous/Next page buttons, 'load-more' for infinite scroll with a load-more button.",
    category: 'data',
    type: "'simple' | 'load-more'",
    default: 'simple',
    status: 'implemented',
    visibility: 'public',
    affects: "In 'simple' mode: shows Previous/Next buttons and page indicator. In 'load-more' mode: shows a Load More button and uses IntersectionObserver for automatic loading when scrolling near the bottom.",
    consumedBy: ['MonkeyTable', 'TableView', 'PaginationBar'],
    example: `paginationMode="load-more"`,
  },
  {
    prop: 'paginationLoading',
    description: 'Whether more data is being fetched. Shows loading state in the pagination UI.',
    category: 'data',
    type: 'boolean',
    default: false,
    status: 'implemented',
    visibility: 'public',
    affects: 'When true, disables the Load More button and shows "Loading..." text. Prevents duplicate fetches in load-more mode.',
    consumedBy: ['MonkeyTable', 'TableView', 'PaginationBar'],
    example: `paginationLoading={isFetching}`,
  },
  {
    prop: 'onUpload',
    description: 'Called when a file is selected in Image/Audio/Video/Attachment editors. Return the permanent URL.',
    category: 'data',
    type: '(file: File, fieldType: string) => Promise<string>',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'When provided, file editors call this instead of converting to base64 data URLs. The returned URL is stored in the Attachment object. Without it, files are converted to data URLs (works but large).',
    consumedBy: ['MonkeyTable', 'ImageEditor', 'AudioEditor', 'VideoEditor', 'AttachmentEditor'],
    example: `onUpload={async (file, fieldType) => {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const { url } = await res.json();
  return url;
}}`,
  },

  // ── Selection ──────────────────────────────────────────────────────────────
  {
    prop: 'selectionActions',
    description: 'Render prop for custom bulk actions shown when rows are selected. Receives selected row IDs and a clear-selection function.',
    category: 'data',
    type: '(selectedIds: string[], clearSelection: () => void) => ReactNode',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Renders custom action buttons inside the selection badge in the toolbar when rows are selected. Appears after the built-in delete button.',
    consumedBy: ['MonkeyTable', 'TableView', 'GridToolbar'],
    example: `selectionActions={(ids, clear) => <button onClick={() => { doSomething(ids); clear(); }}>Process</button>}`,
  },

  // ── Grouping ──────────────────────────────────────────────────────────────
  {
    prop: 'groupBy',
    description: "Field ID to group rows by (single column). Omit or null for no grouping.",
    category: 'data',
    type: 'string | null',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: "Groups rows by the specified field value. Shows collapsible group headers with row counts and select-all checkboxes. Column header context menu shows 'Group by this column' when onGroupByChange is provided.",
    consumedBy: ['MonkeyTable', 'TableView', 'Grid'],
    example: `groupBy="Status"`,
  },
  {
    prop: 'groupCollapsed',
    description: 'Default collapsed state for groups.',
    category: 'data',
    type: 'boolean',
    default: false,
    status: 'implemented',
    visibility: 'public',
    affects: 'When true, all groups start collapsed. Users can expand individually by clicking the group header.',
    consumedBy: ['Grid'],
    example: `groupBy="Status" groupCollapsed`,
  },
  {
    prop: 'groupOrder',
    description: "Group display order. 'auto' (default) uses SingleSelect option order or alphabetical. 'asc'/'desc' sort by group value. 'count-desc'/'count-asc' sort by group size. Or pass string[] for explicit order.",
    category: 'data',
    type: "'auto' | 'asc' | 'desc' | 'count-asc' | 'count-desc' | string[]",
    default: 'auto',
    status: 'implemented',
    visibility: 'public',
    affects: "Controls the sequence of group headers when groupBy is set. For SingleSelect/MultiSelect fields, 'auto' matches the option definition order — highest priority first, etc.",
    consumedBy: ['Grid'],
    example: `groupOrder={['High', 'Medium', 'Low']}`,
  },
  {
    prop: 'onGroupByChange',
    description: 'Called when user changes grouping via column header menu.',
    category: 'data',
    type: '(fieldId: string | null) => void',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: "Enables the 'Group by this column' option in column header context menus. Pass null to remove grouping.",
    consumedBy: ['MonkeyTable', 'TableView', 'Grid'],
    example: `onGroupByChange={(fieldId) => setGroupBy(fieldId)}`,
  },

  // ── Row Coloring ───────────────────────────────────────────────────────────
  {
    prop: 'colorBy',
    description: "Field ID whose value determines each row's background tint. Uses SingleSelect option colors and sensible Boolean defaults (green/red).",
    category: 'data',
    type: 'string | null',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: "Colors each row's background based on the selected field value. Best with SingleSelect (uses option colors), MultiSelect (uses first value's color), and Boolean fields. Works alongside grouping.",
    consumedBy: ['MonkeyTable', 'TableView', 'Grid'],
    example: `colorBy="Status"`,
  },
  {
    prop: 'onColorByChange',
    description: 'Called when user changes row coloring via column header menu.',
    category: 'data',
    type: '(fieldId: string | null) => void',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: "Enables the 'Color rows by this column' option in column header context menus. Pass null to remove coloring.",
    consumedBy: ['MonkeyTable', 'TableView', 'Grid'],
    example: `onColorByChange={(fieldId) => setColorBy(fieldId)}`,
  },
  {
    prop: 'colorByMap',
    description: 'Optional per-value color overrides for row coloring, keyed by stringified value.',
    category: 'data',
    type: 'Record<string, string>',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: "Overrides the default color mapping for specific values. Use to customize Boolean colors or override SingleSelect defaults.",
    consumedBy: ['MonkeyTable', 'TableView', 'Grid'],
    example: `colorByMap={{ 'true': '#fef3c7', 'false': '#fee2e2' }}`,
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  {
    prop: 'height',
    description: "Container height mode. 'auto' fits content exactly (no scrollbar for small tables). A number sets fixed pixel height and defaults ghostGrid to true. A CSS string like '100%' fills the parent (default).",
    category: 'layout',
    type: "'auto' | number | string",
    default: '100%',
    status: 'implemented',
    visibility: 'public',
    affects: "Sets the outer container height. 'auto' computes intrinsic height from header + rows + footer — pair with maxHeight to cap. A fixed number enables ghostGrid by default to fill empty space. CSS strings ('100%', '50vh') fill the parent container.",
    consumedBy: ['MonkeyTable'],
    example: `height="auto"  // or height={400} or height="50vh"`,
  },
  {
    prop: 'maxHeight',
    description: "Maximum height in pixels. Useful with height='auto' to cap growth, or with height='100%' to limit fluid containers. Ignored when height is a fixed number.",
    category: 'layout',
    type: 'number',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: "Caps the container height. With 'auto': limits computed height — scrollbar appears when content exceeds this. With CSS strings: applied as CSS max-height.",
    consumedBy: ['MonkeyTable'],
    example: `height="auto" maxHeight={600}`,
  },
  {
    prop: 'columnFit',
    description: "Column sizing strategy. 'auto' (default) sizes each column to fit its widest content. 'fill' distributes container width evenly. 'fixed' uses 180px per column.",
    category: 'layout',
    type: "'auto' | 'fill' | 'fixed'",
    default: 'auto',
    status: 'implemented',
    visibility: 'public',
    affects: "'auto' measures header label and data values to size each column (default cap 320px). 'fill' divides container width evenly. 'fixed' uses 180px. Per-column width/minWidth/maxWidth always override.",
    consumedBy: ['Grid'],
    example: `columnFit="auto"`,
  },
  {
    prop: 'autoFitMin',
    description: "Minimum column width in 'auto' mode. Per-column minWidth overrides.",
    category: 'layout',
    type: 'number',
    default: 60,
    status: 'implemented',
    visibility: 'public',
    affects: "Floor for auto-computed column widths. Useful for very narrow data columns (IDs, counts) that would otherwise be tighter than readable.",
    consumedBy: ['Grid'],
    example: `autoFitMin={80}`,
  },
  {
    prop: 'autoFitMax',
    description: "Maximum column width in 'auto' mode. Per-column maxWidth overrides.",
    category: 'layout',
    type: 'number',
    default: 320,
    status: 'implemented',
    visibility: 'public',
    affects: "Cap for auto-computed column widths. Prevents one long-text column (JSON, survey answer) from dominating the table. Content beyond this is truncated with a fade indicator.",
    consumedBy: ['Grid'],
    example: `autoFitMax={400}`,
  },
  {
    prop: 'rowHeight',
    description: 'Row height preset.',
    category: 'layout',
    type: "'short' | 'medium' | 'tall' | 'extra-tall' | 'fit'",
    default: 'medium',
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'TableDisplaySettings.rowHeight',
    affects: "Controls the pixel height of each row. short=32px, medium=44px, tall=64px, extra-tall=88px, fit=auto-size to content.",
    consumedBy: ['Grid', 'GridCell', 'RowActions'],
    example: 'rowHeight="tall"',
  },
  {
    prop: 'showRowNumbers',
    description: 'Show row number column.',
    category: 'layout',
    type: 'boolean',
    default: false,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'TableDisplaySettings.showRowNumbers',
    affects: 'Adds a row number column (1, 2, 3...) to the left of the checkbox column.',
    consumedBy: ['Grid', 'RowActions'],
    example: 'showRowNumbers',
  },
  {
    prop: 'compactMode',
    description: 'Reduce padding and font sizes for denser display.',
    category: 'layout',
    type: 'boolean',
    default: false,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.defaultCompactMode',
    affects: 'Grid reads settings.defaultCompactMode and uses COMPACT_ROW_HEIGHTS (short=24, medium=32, tall=48, extra-tall=64). GridCell applies compact padding (2px/8px vs 10px/16px) and font (12px vs 14px). GridHeader uses smaller icons (12px vs 14px) and gap (4px vs 6px). RowActions uses tighter padding and smaller checkboxes (12px vs 14px).',
    consumedBy: ['Grid', 'GridCell', 'GridHeader', 'RowActions'],
    example: 'compactMode',
  },

  {
    prop: 'ghostGrid',
    description: "Show faint ghost rows/columns to fill the viewport, spreadsheet-style. true auto-fills based on container size. Pass { rows, columns } for explicit counts. Defaults to true when height is a fixed number.",
    category: 'layout',
    type: 'boolean | { rows?: number; columns?: number }',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: "Renders light placeholder cells beyond the actual data to fill the visible area. Ghost column headers are clickable (creates a new Text column). Ghost row cells are clickable (creates a new row). Uses ResizeObserver in auto mode to track container size. Automatically enabled when height is a fixed pixel value (override with ghostGrid={false}).",
    consumedBy: ['MonkeyTable', 'TableView', 'Grid'],
    example: `ghostGrid={true}`,
  },

  // ── Permissions ───────────────────────────────────────────────────────────
  {
    prop: 'editable',
    description: 'Master switch — allow any editing.',
    category: 'permissions',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.readOnly (inverted)',
    affects: 'When false: hides add-row button, disables cell editing, hides create/delete field options, disables row delete.',
    consumedBy: ['TableView'],
    example: 'editable={false}',
  },
  {
    prop: 'allowCreateField',
    description: 'Allow adding new columns.',
    category: 'permissions',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.allowCreateField',
    affects: 'Controls whether the "+" column button appears at the end of the header row.',
    consumedBy: ['TableView', 'Grid'],
    example: 'allowCreateField={false}',
  },
  {
    prop: 'allowDeleteField',
    description: 'Allow deleting columns.',
    category: 'permissions',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.allowDeleteField',
    affects: 'Controls whether "Delete column" appears in the column header context menu.',
    consumedBy: ['TableView'],
    example: 'allowDeleteField={false}',
  },
  {
    prop: 'allowCreateRecord',
    description: 'Allow adding new rows.',
    category: 'permissions',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.allowCreateRecord',
    affects: 'Controls whether add-row button appears in toolbar and after last row. Also controls "Duplicate row" in context menu.',
    consumedBy: ['TableView'],
    example: 'allowCreateRecord={false}',
  },
  {
    prop: 'allowColumnReorder',
    description: 'Allow reordering columns via drag-and-drop.',
    category: 'permissions',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.allowColumnReorder',
    affects: 'When false, column drag handles are hidden and onColumnsReorder is not passed to Grid.',
    consumedBy: ['TableView', 'Grid'],
    example: 'allowColumnReorder={false}',
  },
  {
    prop: 'allowMultiColumnDrag',
    description: 'Allow dragging multiple selected columns at once.',
    category: 'permissions',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.allowMultiColumnDrag',
    affects: 'When true, selecting multiple column headers and dragging moves them all together.',
    consumedBy: ['Grid'],
    example: 'allowMultiColumnDrag={false}',
  },
  {
    prop: 'confirmBeforeDelete',
    description: 'Show confirmation dialog before deleting rows/columns.',
    category: 'permissions',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.confirmBeforeDelete',
    affects: 'TableView checks this setting before row delete, column delete, and bulk delete. When true, a styled ConfirmDialog modal is shown with cancel/confirm buttons. When false, deletions proceed immediately.',
    consumedBy: ['TableView', 'ConfirmDialog', 'SettingsPanel'],
    example: 'confirmBeforeDelete={false}',
  },

  // ── Toolbar ───────────────────────────────────────────────────────────────
  {
    prop: 'showToolbar',
    description: 'Show the toolbar above the grid.',
    category: 'toolbar',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.showToolbar',
    affects: 'When false, hides the entire toolbar (search, filters, row height, add row, selection count).',
    consumedBy: ['TableView'],
    example: 'showToolbar={false}',
  },
  {
    prop: 'showSearch',
    description: 'Show the search input in the toolbar.',
    category: 'toolbar',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.showSearch',
    affects: 'When false, hides the search input. When search is active, matching cells are highlighted with a yellow background via SearchContext. The search query is shared across Grid and GridCell for cell-level highlighting.',
    consumedBy: ['TableView', 'GridToolbar', 'SearchProvider', 'GridCell'],
    example: 'showSearch={false}',
  },
  {
    prop: 'showFilters',
    description: 'Show the filter button in the toolbar.',
    category: 'toolbar',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.showFilters',
    affects: 'When false, hides the filter toggle button and prevents the filter panel from opening.',
    consumedBy: ['TableView', 'GridToolbar'],
    example: 'showFilters={false}',
  },
  {
    prop: 'showRowHeightControl',
    description: 'Show the row height dropdown in the toolbar.',
    category: 'toolbar',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.showRowHeightControl',
    affects: 'When false, hides the row height picker dropdown.',
    consumedBy: ['TableView', 'GridToolbar'],
    example: 'showRowHeightControl={false}',
  },
  {
    prop: 'showRowNumbersControl',
    description: 'Show the row numbers toggle in the toolbar.',
    category: 'toolbar',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.showRowNumbersControl',
    affects: 'When false, hides the row numbers toggle button.',
    consumedBy: ['TableView', 'GridToolbar'],
    example: 'showRowNumbersControl={false}',
  },
  {
    prop: 'showAddRowButton',
    description: 'Show the add-row button in the toolbar.',
    category: 'toolbar',
    type: 'boolean',
    default: true,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.showAddRowButton',
    affects: 'When false, hides the "Add row" button in the toolbar. Rows can still be added via context menu if allowCreateRecord is true.',
    consumedBy: ['TableView', 'GridToolbar'],
    example: 'showAddRowButton={false}',
  },

  // ── Locale & Formatting ───────────────────────────────────────────────────
  {
    prop: 'locale',
    description: 'BCP 47 locale tag for formatting (dates, numbers, currency).',
    category: 'locale',
    type: 'string',
    default: 'en-US',
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.locale',
    affects: 'I18nProvider reads from settings and builds locale-aware formatters. NumberRenderer uses Intl.NumberFormat(locale) for decimal/percentage/currency. DateRenderer uses Intl.DateTimeFormat(locale) when dateDisplayFormat="locale". All locale-aware formatting flows through useI18n() hook. Also used as fallback to derive language (first subtag) when language prop is not set.',
    consumedBy: ['I18nProvider', 'NumberRenderer', 'DateRenderer', 'useI18n'],
    example: 'locale="es-CO"',
  },
  {
    prop: 'language',
    description: 'UI language override — controls which translation bundle is loaded.',
    category: 'locale',
    type: 'string',
    default: 'en',
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.language',
    affects: 'Selects the i18n string bundle for all UI labels (toolbar buttons, context menus, empty states, editor labels). Defaults to primary subtag of locale. Bundled languages: en, es.',
    consumedBy: ['I18nProvider', 'useI18n'],
    example: 'language="es"',
  },
  {
    prop: 'dateDisplayFormat',
    description: 'Default date display format across the table.',
    category: 'locale',
    type: "'iso' | 'locale' | 'relative'",
    default: 'iso',
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.dateDisplayFormat',
    affects: "Controls how DateRenderer displays dates: 'iso' = 2024-03-15, 'locale' = locale-formatted via Intl.DateTimeFormat, 'relative' = '3 days ago'. Field-level options.dateFormat takes priority when set.",
    consumedBy: ['DateRenderer'],
    example: 'dateDisplayFormat="locale"',
  },
  {
    prop: 'numberDecimalPlaces',
    description: 'Default decimal places for number fields.',
    category: 'locale',
    type: 'number',
    default: 2,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.numberDecimalPlaces',
    affects: 'Fallback precision for NumberRenderer when field.options.precision is not set. Priority: field options → this setting → 2. Displayed in SettingsPanel Formatting tab.',
    consumedBy: ['NumberRenderer', 'SettingsPanel'],
    example: 'numberDecimalPlaces={0}',
  },
  {
    prop: 'numberThousandsSeparator',
    description: 'Show thousands separator in number fields by default.',
    category: 'locale',
    type: 'boolean',
    default: false,
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.numberThousandsSeparator',
    affects: 'Fallback for NumberRenderer when field.options.thousandsSeparator is not set. Priority: field options → this setting → false. Displayed in SettingsPanel Formatting tab.',
    consumedBy: ['NumberRenderer', 'SettingsPanel'],
    example: 'numberThousandsSeparator',
  },
  {
    prop: 'currencyCode',
    description: 'ISO 4217 currency code for currency-formatted number fields.',
    category: 'locale',
    type: 'string',
    default: 'USD',
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.currencyCode',
    affects: "Fallback currency code for NumberRenderer when field.options.currencyCode is not set. Used with Intl.NumberFormat when format is 'currency'. Priority: field options → this setting → 'USD'.",
    consumedBy: ['NumberRenderer', 'SettingsPanel'],
    example: 'currencyCode="EUR"',
  },
  {
    prop: 'currencyDisplay',
    description: 'How to display currency (symbol, code, name).',
    category: 'locale',
    type: "'symbol' | 'narrowSymbol' | 'code' | 'name'",
    default: 'symbol',
    status: 'implemented',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.currencyDisplay',
    affects: "Fallback currency display for NumberRenderer when field.options.currencyDisplay is not set. Controls Intl.NumberFormat: 'symbol'=$, 'code'=USD, 'name'=US dollars. Priority: field options → this setting → 'symbol'.",
    consumedBy: ['NumberRenderer', 'SettingsPanel'],
    example: 'currencyDisplay="code"',
  },

  // ── Translations ────────────────────────────────────────────────────────
  {
    prop: 'translations',
    description: 'Partial string overrides for UI labels.',
    category: 'locale',
    type: 'Partial<I18nStrings>',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Merges with the built-in language bundle via I18nProvider. Allows overriding any UI string without changing language.',
    consumedBy: ['I18nProvider', 'useI18n'],
    example: `translations={{ 'toolbar.addRow': 'New entry', 'grid.empty': 'No data yet' }}`,
  },

  // ── Advanced ──────────────────────────────────────────────────────────────
  {
    prop: 'functionsEndpoint',
    description: 'URL for server-side computed field functions.',
    category: 'advanced',
    type: 'string | null',
    default: null,
    status: 'wired',
    visibility: 'public',
    mapsTo: 'MonkeyTabSettings.functionsEndpoint',
    affects: 'When set, Computed field type sends HTTP POST to this endpoint to evaluate formulas. Without it, computed fields show "No functions endpoint configured".',
    consumedBy: [],
    notes: 'Only relevant when using Computed field type. The FormulaBuilder and recomputeRow logic use this endpoint.',
    example: 'functionsEndpoint="https://api.example.com/functions"',
  },
  {
    prop: 'functions',
    description: 'Custom computed functions — registered on mount, unregistered on unmount.',
    category: 'advanced',
    type: 'FunctionDef[]',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Registers custom functions into the global functionRegistry. Available in the formula builder dropdown and for Computed field evaluation. Cleaned up on unmount.',
    consumedBy: ['MonkeyTable', 'functionRegistry'],
    example: `functions={[{ name: 'calculateTax', category: 'number', description: 'Price × tax rate', inputTypes: ['Number', 'Number'], compute: ([price, rate]) => price * rate }]}`,
  },
  {
    prop: 'constraints',
    description: 'Custom field constraints — registered on mount, unregistered on unmount.',
    category: 'advanced',
    type: 'FieldTypeConstraint[]',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Registers custom validation constraints into the global constraintRegistry. Available for field-level validation. Cleaned up on unmount.',
    consumedBy: ['MonkeyTable', 'constraintRegistry'],
    example: `constraints={[{ name: 'postalCode', label: 'Postal Code', description: '5-digit postal code', appliesTo: ['Text'], validate: (v) => /^\\d{5}$/.test(String(v)) ? null : '5-digit code required' }]}`,
  },
  {
    prop: 'renderers',
    description: 'Custom type-level renderers — keyed by FieldType, overrides built-in renderers.',
    category: 'advanced',
    type: 'Record<string, CellRenderer>',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Registers custom cell renderers in the componentRegistry, keyed by field type. Original renderers are saved and restored on unmount. GridCell picks up overrides automatically.',
    consumedBy: ['MonkeyTable', 'componentRegistry', 'GridCell'],
    example: `renderers={{ Rating: ({ value }) => <MyStarComponent rating={value as number} /> }}`,
  },
  {
    prop: 'editors',
    description: 'Custom type-level editors — keyed by FieldType, overrides built-in editors.',
    category: 'advanced',
    type: 'Record<string, CellEditor>',
    default: undefined,
    status: 'implemented',
    visibility: 'public',
    affects: 'Registers custom cell editors in the componentRegistry, keyed by field type. Original editors are saved and restored on unmount. GridCell picks up overrides automatically.',
    consumedBy: ['MonkeyTable', 'componentRegistry', 'GridCell'],
    example: `editors={{ Color: ({ value, onSave }) => <MyColorPicker value={value} onSave={onSave} /> }}`,
  },
];

// =============================================================================
// Query helpers
// =============================================================================

/**
 * Get all options with a specific lifecycle status.
 */
export function getOptionsByStatus(status: OptionLifecycle): OptionEntry[] {
  return OPTIONS_CATALOG.filter((o) => o.status === status);
}

/**
 * Get all options in a category.
 */
export function getOptionsByCategory(category: OptionCategory): OptionEntry[] {
  return OPTIONS_CATALOG.filter((o) => o.category === category);
}

/**
 * Summary counts for progress tracking.
 */
export function getOptionsSummary(): Record<OptionLifecycle, number> {
  const summary: Record<OptionLifecycle, number> = { implemented: 0, wired: 0, planned: 0 };
  for (const o of OPTIONS_CATALOG) {
    summary[o.status]++;
  }
  return summary;
}

/**
 * Get a simplified map for quick AI agent / CLI consumption.
 * Groups options by category with status and description.
 */
export function getOptionsOverview(): Record<OptionCategory, Array<{ prop: string; status: OptionLifecycle; description: string; default: unknown }>> {
  const overview: Record<string, Array<{ prop: string; status: OptionLifecycle; description: string; default: unknown }>> = {};
  for (const o of OPTIONS_CATALOG) {
    if (!overview[o.category]) overview[o.category] = [];
    overview[o.category].push({
      prop: o.prop,
      status: o.status,
      description: o.description,
      default: o.default,
    });
  }
  return overview as Record<OptionCategory, Array<{ prop: string; status: OptionLifecycle; description: string; default: unknown }>>;
}

/**
 * Get detailed info for a single option (for CLI `monkeytab options <prop>`).
 */
export function getOptionDetail(prop: string): OptionEntry | undefined {
  return OPTIONS_CATALOG.find((o) => o.prop === prop);
}
