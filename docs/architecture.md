# Architecture

How `@datasketch/monkeytab` is structured under the hood.

This is a high-level overview for contributors. If you just want to use the package, see [BROWSER.md](../BROWSER.md).

## The big picture

```
┌────────────────────────────────────────┐
│           Your React App                │
├────────────────────────────────────────┤
│         <MonkeyTable>                   │
│  ┌──────────────────────────────────┐  │
│  │   TableView (UI shell)            │  │
│  │   ┌──────────────────────────┐   │  │
│  │   │  Grid (TanStack Table)    │   │  │
│  │   │  ┌────────┐ ┌────────┐    │   │  │
│  │   │  │GridCell│ │GridCell│    │   │  │
│  │   │  └────────┘ └────────┘    │   │  │
│  │   └──────────────────────────┘   │  │
│  └──────────────────────────────────┘  │
│           │                             │
│           ▼                             │
│  ┌──────────────────────────────────┐  │
│  │        BrowserClient              │  │
│  │  (wraps an Adapter as a Client)   │  │
│  └──────────────────────────────────┘  │
│           │                             │
│           ▼                             │
│  ┌──────────────────────────────────┐  │
│  │        MemoryAdapter              │  │
│  │  (in-memory data store)           │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

`<MonkeyTable>` is **self-contained**. When you mount it, it creates its own MemoryAdapter, BrowserClient, React Query client, and i18n provider. You don't need to wire anything up — just pass `columns` and `rows`.

## Packages

| Package | Purpose |
|---|---|
| `@monkeytab/core` | Types, the Adapter interface, registries (functions, constraints, components), query utilities |
| `@monkeytab/ui` | React components — Grid, GridCell, GridHeader, all renderers and editors |
| `@datasketch/monkeytab` | The published npm package — bundles core, ui, and the memory adapter into a single ESM file |
| `@monkeytab/adapter-memory` | In-memory adapter (the default for the browser package) |
| `@monkeytab/adapter-json` | JSON file adapter |
| `@monkeytab/adapter-csv` | CSV file adapter |
| `@monkeytab/adapter-folder` | Folder-based adapter |

The `@monkeytab/*` packages are internal workspace identifiers — they're bundled into `@datasketch/monkeytab` and not published separately.

## The Adapter interface

The Adapter is the boundary between the UI and any data source. Adapters implement read and write operations against bases, tables, fields, and records.

```typescript
interface Adapter {
  info(): AdapterInfo;
  capabilities(): AdapterCapabilities;

  // Read
  listBases(): Promise<BaseSpec[]>;
  getBase(baseId: string): Promise<BaseSpec>;
  getTable(baseId: string, tableId: string): Promise<TableSpec>;
  queryRecords(baseId: string, tableId: string, query: QueryArgs): Promise<QueryResult>;
  getRecord(baseId: string, tableId: string, recordId: string): Promise<Row>;

  // Write (optional, depending on capabilities)
  createRecord?(baseId: string, tableId: string, fields: Record<string, Value>): Promise<Row>;
  updateRecord?(baseId: string, tableId: string, recordId: string, fields: Record<string, Value>): Promise<Row>;
  deleteRecord?(baseId: string, tableId: string, recordId: string): Promise<void>;

  // Schema (optional)
  createField?, updateField?, deleteField?
  createTable?, deleteTable?

  // Ordering (optional)
  updateColumnOrder?, updateRowOrder?
}
```

The MemoryAdapter (used by the npm package) implements all of these. Other adapters (JSON, CSV, folder) implement subsets based on what their backend supports.

## Data model

```
Base → Tables → Fields + Records
```

- A **Base** is a collection of related tables (like a database)
- A **Table** has a list of **Fields** (typed columns) and a list of **Records** (rows)
- A **Field** has an `id`, `type`, and type-specific `options`
- A **Record** is `{ id, fields: { [fieldId]: value }, createdAt, updatedAt }`

For the browser package, there's exactly one Base and one Table at runtime — `<MonkeyTable>` creates them internally from your `columns` and `rows` props.

## State management

- **Server state** (queries, mutations) — TanStack Query
- **UI state** (selection, editing, undo) — Zustand stores, scoped per `<MonkeyTable>` instance via React Context
- **Settings** — stored in the adapter, read via the `useSettings()` hook

## Component registry

Renderers and editors are stored in a global registry. Each field type has a default renderer and editor, and consumers can override them via the `renderers` and `editors` props.

```
ComponentRegistry
├─ Text       → TextRenderer    + TextEditor
├─ Number     → NumberRenderer  + NumberEditor
├─ Boolean    → BoolRenderer    + BoolEditor
├─ Date       → DateRenderer    + DateEditor
├─ ...
└─ Computed   → ComputedRenderer (read-only, no editor)
```

Custom renderers/editors registered via props are scoped to a specific `<MonkeyTable>` instance — they're registered on mount and unregistered on unmount.

## Function registry

Computed field functions are registered in a similar registry. The built-in set covers math, text, date, and logic operations. Add your own via the `functions` prop.

## Build system

The package is built with [Vite](https://vitejs.dev/) in library mode.

- Entry: `src/browser/index.ts`
- Output: `dist/monkeytab.js` (ESM, ~140 KB gzipped)
- Externals: `react`, `react-dom`, `react/jsx-runtime`, `react/jsx-dev-runtime`
- Type declarations: `src/browser/types.d.ts`, copied to `dist/index.d.ts` at build time

To build the package:

```bash
npm install
npm run build
```

## Testing

Run the example app to manually verify changes:

```bash
cd examples/browser-standalone
npm install
npm run dev
```

Each adapter has its own test suite that exercises the full Adapter interface.

## Where to start contributing

- **New field type**: see [CONTRIBUTING.md → Adding a New Field Type](../CONTRIBUTING.md#adding-a-new-field-type)
- **New adapter**: see [CONTRIBUTING.md → Adding a New Adapter](../CONTRIBUTING.md#adding-a-new-adapter)
- **Bug fix or small feature**: open an issue first to discuss, then submit a PR
- **Documentation**: improvements to README, BROWSER, EXTENDING, or this file are always welcome
