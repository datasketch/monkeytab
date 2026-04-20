# `@datasketch/monkeytab` — API Reference

The complete props reference for the `<MonkeyTable>` React component.

## Install

```bash
npm install @datasketch/monkeytab
```

React 18 or 19 is required as a peer dependency.

## Quick Start

```tsx
import { MonkeyTable } from '@datasketch/monkeytab';

function App() {
  return (
    <MonkeyTable
      columns={[
        { id: 'Name' },
        { id: 'Age', type: 'Number' },
        { id: 'Active', type: 'Boolean' },
      ]}
      rows={[
        { Name: 'Alice', Age: 30, Active: true },
        { Name: 'Bob', Age: 25, Active: false },
      ]}
      onChange={(rows) => console.log('Updated:', rows)}
      height="auto"
    />
  );
}
```

---

## `<MonkeyTable>` Props

### Data

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `MonkeyTableColumn[]` | *required* | Column definitions (id, type, options) |
| `rows` | `Record<string, Value>[]` | *required* | Row data — each row is a `{ columnId: value }` mapping |
| `onChange` | `(rows) => void` | — | Fires after any mutation. Receives the full denormalized row array. |
| `onRowsChange` | `(rows: Row[]) => void` | — | Same trigger as `onChange` but receives full Row objects with ids/timestamps |
| `onCellChange` | `(rowId, fieldId, newValue, oldValue) => void` | — | Granular per-cell change callback. Fires synchronously on every cell edit. Use for PATCH-style API persistence. |
| `onSelectionChange` | `(ids: string[]) => void` | — | Fires on every checkbox toggle |
| `selectedRowIds` | `string[]` | — | Controlled selection — set externally |
| `onRowClick` | `(row) => void` | — | Fires when a row body is clicked (not checkboxes) |
| `onUpload` | `(file: File, fieldType: string) => Promise<string>` | — | File upload handler — return permanent URL. Without it, files become base64 data URLs. |

### Sorting

| Prop | Type | Default | Description |
|---|---|---|---|
| `sortBy` | `string \| null` | — | Controlled sort field |
| `sortDirection` | `'asc' \| 'desc' \| null` | — | Controlled sort direction |
| `onSortChange` | `(fieldId, direction) => void` | — | Fires when user changes sort. Use for server-side sorting. |

### Selection Actions

| Prop | Type | Default | Description |
|---|---|---|---|
| `selectionActions` | `(ids: string[], clear: () => void) => ReactNode` | — | Render prop for custom bulk actions when rows are selected |

### Grouping

| Prop | Type | Default | Description |
|---|---|---|---|
| `groupBy` | `string \| null` | — | Field ID to group rows by. Omit for no grouping |
| `groupCollapsed` | `boolean` | `false` | Start groups collapsed |
| `onGroupByChange` | `(fieldId: string \| null) => void` | — | Fires when user changes grouping via column menu |
| `groupOrder` | `'auto' \| 'asc' \| 'desc' \| 'count-asc' \| 'count-desc' \| string[]` | `'auto'` | Group display order. `'auto'` uses SingleSelect option order, or alphabetical |

### Row Coloring

| Prop | Type | Default | Description |
|---|---|---|---|
| `colorBy` | `string \| null` | — | Field ID whose value tints each row (SingleSelect colors, Boolean green/red) |
| `onColorByChange` | `(fieldId: string \| null) => void` | — | Fires when user changes coloring via column menu |
| `colorByMap` | `Record<string, string>` | — | Optional per-value color overrides |

### Pagination

| Prop | Type | Default | Description |
|---|---|---|---|
| `totalRows` | `number` | — | Total row count from server. When set, enables pagination UI. |
| `page` | `number` | `1` | Current page (1-based). Controlled. |
| `pageSize` | `number` | `500` | Rows per page |
| `onPageChange` | `(page: number) => void` | — | Fires on page navigation |
| `paginationMode` | `'simple' \| 'load-more'` | `'simple'` | UI style |
| `paginationLoading` | `boolean` | `false` | Shows loading state during fetch |

### Layout

| Prop | Type | Default | Description |
|---|---|---|---|
| `height` | `'auto' \| number \| string` | `'100%'` | `'auto'` fits content, number = fixed pixels (ghost rows on), string = CSS |
| `maxHeight` | `number` | — | Max height in px. Caps `'auto'` growth or fluid containers |
| `columnFit` | `'auto' \| 'fill' \| 'fixed'` | `'auto'` | `'auto'` fits content, `'fill'` distributes container width, `'fixed'` uses 180px per column |
| `autoFitMin` | `number` | `60` | Minimum column width in `'auto'` mode |
| `autoFitMax` | `number` | `320` | Maximum column width in `'auto'` mode |
| `rowHeight` | `RowHeightOption` | `'medium'` | `'short'` \| `'medium'` \| `'tall'` \| `'extra-tall'` \| `'fit'` |
| `showRowNumbers` | `boolean` | `false` | Show row number column |
| `compactMode` | `boolean` | `false` | Denser layout — smaller fonts, tighter padding |
| `ghostGrid` | `boolean \| { rows?: number, columns?: number }` | — | Show faint placeholder cells to fill the viewport. Defaults to `true` when `height` is a number |

### Permissions

| Prop | Type | Default | Description |
|---|---|---|---|
| `editable` | `boolean` | `true` | Master switch — enable cell editing, row/column CRUD |
| `allowCreateField` | `boolean` | `true` | Allow adding new columns |
| `allowDeleteField` | `boolean` | `true` | Allow deleting columns |
| `allowCreateRecord` | `boolean` | `true` | Allow adding new rows |
| `allowColumnReorder` | `boolean` | `true` | Enable drag-and-drop column reorder |
| `allowMultiColumnDrag` | `boolean` | `true` | Enable selecting and dragging multiple columns |
| `confirmBeforeDelete` | `boolean` | `true` | Show confirmation dialog before destructive actions |

### Toolbar

| Prop | Type | Default | Description |
|---|---|---|---|
| `showToolbar` | `boolean` | `true` | Show the toolbar above the grid |
| `showSearch` | `boolean` | `true` | Show the search input |
| `showFilters` | `boolean` | `true` | Show the filter button |
| `showRowHeightControl` | `boolean` | `true` | Show the row height dropdown |
| `showRowNumbersControl` | `boolean` | `true` | Show the row numbers toggle |
| `showAddRowButton` | `boolean` | `true` | Show the add-row button |

### Locale & Formatting

| Prop | Type | Default | Description |
|---|---|---|---|
| `locale` | `string` | `'en-US'` | BCP 47 locale tag (e.g. `'es-CO'`, `'ja-JP'`) |
| `language` | `string` | — | UI language override — defaults to locale primary subtag |
| `dateDisplayFormat` | `'iso' \| 'locale' \| 'relative'` | `'iso'` | How dates are displayed |
| `numberDecimalPlaces` | `number` | `2` | Default decimal places for numbers |
| `numberThousandsSeparator` | `boolean` | `false` | Show thousands separator (1,000) |
| `currencyCode` | `string` | `'USD'` | ISO 4217 currency code |
| `currencyDisplay` | `'symbol' \| 'narrowSymbol' \| 'code' \| 'name'` | `'symbol'` | How to display currency |
| `translations` | `Partial<I18nStrings>` | — | Override any UI string |

### Registry Extensions

| Prop | Type | Default | Description |
|---|---|---|---|
| `functions` | `FunctionDef[]` | — | Custom computed functions — registered on mount |
| `constraints` | `FieldTypeConstraint[]` | — | Custom field constraints |
| `renderers` | `Record<string, Component>` | — | Override built-in cell renderers |
| `editors` | `Record<string, Component>` | — | Override built-in cell editors |

See [EXTENDING.md](./EXTENDING.md) for usage details.

---

## `MonkeyTableColumn`

```typescript
interface MonkeyTableColumn {
  id: string;                              // column key (used in row data)
  label?: string;                          // display label — defaults to id
  type?: FieldType;                        // defaults to 'Text'
  options?: FieldOptions;                  // type-specific options
  icon?: ReactNode;                        // custom column header icon
  render?: CellRendererFn;                 // custom cell renderer for this column
  hidden?: boolean;                        // hide column but keep data accessible
  editable?: boolean;                      // per-column read-only override
  width?: number;                          // initial width in pixels (default: 180)
  minWidth?: number;                       // minimum width (default: 80)
  maxWidth?: number;                       // maximum width (default: 600)
  sortable?: boolean;                      // can this column be sorted (default: true)
  align?: 'left' | 'center' | 'right';     // cell text alignment
  color?: string | CellColorFn;            // column color — static string or per-cell fn
}

type CellColorFn = (
  row: Record<string, Value>,
  value: Value,
  fieldId: string,
) => string | undefined;
```

### Column coloring (`column.color`)

Three shapes, from simplest to most flexible:

- **Static** (`string`) — any CSS color. Every cell in the column plus the header gets a soft tint of that color. Good for marking a non-editable column, flagging a column that needs attention, or grouping related columns visually.
- **Rule array** (`ColorRule[]`) — JSON-serializable conditional formatting. Each rule is `{ when: ColorCondition, color: string }`. Rules evaluate top-down; first match wins. Header stays default in this mode. Works in the JSON config form.
- **Function** (`CellColorFn`) — `(row, value, fieldId) => string | undefined`. For anything the rule array can't express: palettes, numeric interpolation, cross-field math. Header stays default. Prop-API only (functions aren't JSON-serializable).

Tints always blend with `color-mix(… 30%, white)` so dark colors stay readable, and compose cleanly with the row-level `colorBy` tint and the in-search yellow highlight.

```tsx
<MonkeyTable
  columns={[
    { id: 'Name' },
    // Static: the whole "CreatedAt" column + header reads as a read-only band.
    { id: 'CreatedAt', type: 'Date', editable: false, color: '#f1f5f9' },
    // Rule array: red < 50, green ≥ 90, else untouched. Also works in JSON config.
    {
      id: 'Score',
      type: 'Number',
      color: [
        { when: { op: 'lt', value: 50 }, color: '#fee2e2' },
        { when: { op: 'gte', value: 90 }, color: '#dcfce7' },
      ],
    },
    // Function: same effect but with a mid-range yellow band, and arbitrary logic.
    {
      id: 'Priority',
      color: (_row, value) => {
        if (value === 'P0') return '#fecaca';
        if (value === 'P1') return '#fed7aa';
        return undefined;
      },
    },
  ]}
  rows={rows}
/>
```

**Rule operators.** `ColorCondition` is a tagged union keyed by `op`:

| op | value(s) | Matches when |
|---|---|---|
| `equals` / `notEquals` | `value: unknown` | strict `===` / `!==` |
| `lt` / `lte` / `gt` / `gte` | `value: number` | numeric comparison (non-numeric cells never match) |
| `contains` / `notContains` | `value: string` | case-insensitive substring on string cells |
| `empty` / `notEmpty` | — | `null`, `undefined`, `""`, or `[]` |
| `in` / `notIn` | `values: unknown[]` | value is / isn't one of the list |

Every operator accepts an optional `field: string` to compare against a **different** column's value instead of the cell's own — useful for "tint the `Status` cell when `Owner` is empty":

```ts
color: [
  { when: { op: 'empty', field: 'Owner' }, color: '#fef3c7' },
]
```

For callers who want to reuse the same evaluator outside the grid (e.g., in a summary widget), `evaluateColorRules(rules, row, value)` is exported too:

```ts
import { evaluateColorRules } from '@datasketch/monkeytab';
const tint = evaluateColorRules(col.color as ColorRule[], row, row.Score);
```

In the JSON config form (`<MonkeyTableFromConfig>`), `string` and `ColorRule[]` are both accepted. The function form stays prop-API-only.

---

## Field Types

| Type | Description | Key Options |
|---|---|---|
| `Text` | Plain text, multiline, markdown, or JSON | `multiline`, `richText`, `json`, `maxLength`, `placeholder` |
| `Number` | Numeric values with formatting | `precision`, `format` (`decimal`/`percentage`/`currency`), `min`, `max`, `currencySymbol`, `thousandsSeparator` |
| `Boolean` | Checkbox, toggle, yes/no, or icon | `displayAs` (`checkbox`/`toggle`/`yesno`/`icon`), `trueLabel`, `falseLabel`, `trueIcon`, `falseIcon`, `trueColor`, `falseColor` |
| `Date` | Date, datetime, or time | `format` (`date`/`datetime`/`time`), `dateFormat`, `use24Hour` |
| `SingleSelect` | Dropdown selection | `options: [{ value, label, color }]` |
| `MultiSelect` | Multiple selections | `options: [{ value, label, color }]`, `maxSelections` |
| `Image` | Image thumbnails with URL links | `maxImages`, `maxFileSize`, `displaySize` |
| `Attachment` | Generic file attachments | `maxFiles`, `maxFileSize`, `allowedTypes` |
| `Email` | Email address with mailto link | — |
| `URL` | Clickable URL with optional label | — |
| `Phone` | Phone number with tel link | — |
| `Color` | Color swatch + hex value | `format` (`hex`/`rgb`/`hsl`) |
| `Rating` | Star/heart/circle rating | `max`, `icon` |
| `Computed` | Derived from other fields | `functionName`, `inputFieldIds`, `params` |

---

## Config-driven API

If you'd rather describe a whole table as one JSON blob — for example to store
a user's table layout, serve a table from a REST endpoint, or have an LLM emit
it from a sample of rows — use `<MonkeyTableFromConfig>`.

```tsx
import { MonkeyTableFromConfig, type MonkeyTableConfig } from '@datasketch/monkeytab';

const config: MonkeyTableConfig = {
  columns: [
    { id: 'Name' },
    { id: 'Age', type: 'Number', options: { format: 'decimal' } },
    { id: 'Signup', type: 'Date', options: { dateFormat: 'iso' } },
    { id: 'Status', type: 'SingleSelect', options: {
      options: [
        { value: 'active', label: 'Active', color: '#22c55e' },
        { value: 'paused', label: 'Paused', color: '#f59e0b' },
      ],
    } },
    { id: 'Website', type: 'URL' },
  ],
  rows: [
    { Name: 'Alice', Age: 30, Signup: '2024-01-05', Status: 'active',  Website: 'https://example.com' },
    { Name: 'Bob',   Age: 25, Signup: '2024-02-10', Status: 'paused',  Website: 'https://example.org' },
  ],
  settings: {
    editable: true,
    height: 'auto',
    pageSize: 25,
    locale: 'en-US',
  },
};

<MonkeyTableFromConfig config={config} onChange={setRows} />
```

### Shape

```ts
interface MonkeyTableConfig {
  schemaVersion?: number;              // reserved for future migrators
  columns: MonkeyTableConfigColumn[];  // same as MonkeyTableColumn, minus render/icon
                                        //   and with color narrowed to string
  rows: Array<Record<string, Value>>;
  settings?: MonkeyTableConfigSettings;
}
```

`settings` is a flat bucket that mirrors the scalar/enum props documented
above — `editable`, `height`, `pageSize`, `locale`, `groupBy`, `sortBy`,
`dateDisplayFormat`, etc. Anything not serializable (React handlers, custom
renderers/editors, `render`/`icon` on a column, `functions`/`constraints`,
`presence`, conditional-coloring functions) stays as ordinary component props
on `<MonkeyTableFromConfig>`. Static `column.color` (CSS string) is allowed
in the config; the function form is prop-API-only.

### resolveConfig

If you'd rather keep using `<MonkeyTable>` directly, import `resolveConfig`
to turn a config into the flat prop object it consumes:

```tsx
import { MonkeyTable, resolveConfig } from '@datasketch/monkeytab';

const props = resolveConfig(config);
<MonkeyTable {...props} onChange={setRows} />
```

The two forms are interchangeable — `<MonkeyTableFromConfig>` is a thin
forwardRef wrapper that does exactly this internally.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `↑↓←→` | Move active cell |
| `Tab` / `Shift+Tab` | Move right/left |
| `Shift+↑↓←→` | Extend selection range |
| `Enter` | Edit active cell (or add row when on last) |
| `Shift+Enter` | Insert new row |
| `Escape` | Cancel editing / clear selection |
| `Cmd+C` / `Ctrl+C` | Copy cell or range as TSV |
| `Cmd+V` / `Ctrl+V` | Paste TSV (multi-cell paste from clipboard) |
| `Cmd+Z` / `Ctrl+Z` | Undo |
| `Cmd+Shift+Z` / `Ctrl+Shift+Z` | Redo |

## Header Interactions

| Action | Result |
|---|---|
| Click column header | Toggle sort (asc → desc → none) |
| Cmd/Ctrl + Click | Select column for drag |
| Shift + Click | Select header range, copy labels with Cmd+C |
| Right-click / ⋮ menu | Open column context menu (rename, change type, hide, sort, delete) |

---

## Examples

### Editable table with change tracking

```tsx
<MonkeyTable
  columns={[
    { id: 'Task' },
    { id: 'Priority', type: 'SingleSelect', options: {
      options: [
        { value: 'high', label: 'High', color: '#fee2e2' },
        { value: 'medium', label: 'Medium', color: '#fef9c3' },
        { value: 'low', label: 'Low', color: '#dcfce7' },
      ]
    }},
    { id: 'Done', type: 'Boolean' },
  ]}
  rows={[
    { Task: 'Write docs', Priority: 'high', Done: false },
    { Task: 'Fix bug #42', Priority: 'medium', Done: true },
  ]}
  onChange={(rows) => console.log(rows)}
  height={300}
  showRowNumbers
/>
```

### Read-only table with compact mode

```tsx
<MonkeyTable
  columns={[
    { id: 'Metric' },
    { id: 'Q1', type: 'Number', options: { precision: 0, thousandsSeparator: true } },
    { id: 'Q2', type: 'Number', options: { precision: 0, thousandsSeparator: true } },
  ]}
  rows={[
    { Metric: 'Revenue', Q1: 120000, Q2: 145000 },
    { Metric: 'Expenses', Q1: 98000, Q2: 102000 },
  ]}
  editable={false}
  compactMode
  height={200}
  rowHeight="short"
/>
```

### Per-column options

```tsx
<MonkeyTable
  columns={[
    { id: 'Id', type: 'Number', editable: false, width: 80, sortable: false, align: 'center' },
    { id: 'Name', type: 'Text', width: 250, minWidth: 150, maxWidth: 400 },
    { id: 'Price', type: 'Number', align: 'right', width: 120 },
    { id: 'Notes', type: 'Text' },
  ]}
  rows={rows}
  editable
/>
```

### Server-side pagination and sorting

```tsx
const [page, setPage] = useState(1);
const [sortField, setSortField] = useState<string | null>(null);
const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);
const { data, total, isLoading } = useFetchRows({ page, sortField, sortDir });

<MonkeyTable
  columns={columns}
  rows={data}
  totalRows={total}
  page={page}
  pageSize={100}
  onPageChange={setPage}
  paginationMode="simple"
  paginationLoading={isLoading}
  sortBy={sortField}
  sortDirection={sortDir}
  onSortChange={(field, dir) => {
    setSortField(field);
    setSortDir(dir);
    setPage(1);  // reset to first page on sort change
  }}
/>
```

### Spanish locale with custom translations

```tsx
<MonkeyTable
  columns={columns}
  rows={rows}
  locale="es-CO"
  language="es"
  dateDisplayFormat="locale"
  currencyCode="COP"
  translations={{ 'toolbar.addRow': 'Nueva fila' }}
  onChange={handleChange}
/>
```

### Custom file upload

```tsx
<MonkeyTable
  columns={[
    { id: 'Name' },
    { id: 'Photo', type: 'Image' },
    { id: 'Resume', type: 'Attachment' },
  ]}
  rows={rows}
  onUpload={async (file, fieldType) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const { url } = await res.json();
    return url;
  }}
/>
```
