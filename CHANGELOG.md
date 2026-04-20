# Changelog

All notable changes to `@datasketch/monkeytab`.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] — 2026-04-19

### New
- **Column coloring (`column.color`)** — three shapes, same prop. Pass a CSS color string to tint a whole column (every cell + the header) with a soft blend — good for flagging a non-editable column or grouping related columns visually. Pass a `ColorRule[]` (`{ when: { op, value/values, field? }, color }`) for JSON-serializable Google-Sheets-style conditional formatting; rules evaluate top-down and the first match wins. Operators include `equals`/`notEquals`, `lt`/`lte`/`gt`/`gte`, `contains`/`notContains`, `empty`/`notEmpty`, and `in`/`notIn`; each can optionally compare a different field. For anything the rule array can't express (palettes, numeric interpolation, cross-field math), pass a `(row, value, fieldId) => string | undefined` function instead — prop-API only. The evaluator is exported as `evaluateColorRules(rules, row, value)` so the same rules can be reused outside the grid. See [BROWSER.md → Column coloring](./BROWSER.md#column-coloring-columncolor).

### Fixed
- **Header overflow fade now tints with the column** — when a column uses `color` to tint its header, the right-edge fade gradient blends into the tinted background instead of showing a strip of default gray. Symmetric with the row-background fade that already respected `colorBy`.

## [0.5.0] — 2026-04-19

### New
- **`<MonkeyTableFromConfig>` + `resolveConfig()`** — describe a whole table as one JSON blob (`{ columns, rows, settings }`) and render it with a single component. The settings bucket mirrors the flat `<MonkeyTable>` props exactly; anything not serializable (handlers, custom renderers/editors, per-column `render`/`icon`) stays as ordinary React props on the wrapper. Use `resolveConfig(config)` to get the same props object if you'd rather keep using `<MonkeyTable>` directly. Useful for persisting user layouts, embedding tables in REST payloads, or having an LLM emit a table from a row sample. See [BROWSER.md → Config-driven API](./BROWSER.md#config-driven-api).

## [0.4.0] — 2026-04-18

### New
- **Async CRUD hooks** — `onRowCreate`, `onCellSave`, `onRowDelete` props on `<MonkeyTable>`. Return a promise to persist to your backend; optimistic updates roll back automatically on reject. `onHookError`, `errorToast`, and `showCellSaveStatus` control failure UX. Required columns (`required: true`) show a red asterisk + red left border.
- **Draft row lifecycle** — "Add row" creates a local-only draft; promoted via `onRowCreate` once required fields are filled. Unfilled required cells block promotion.
- **Realtime multiplayer** — Transport-agnostic multiplayer built on three primitives: `MonkeyTableHandle.applyRemoteChange` (imperative ref for applying remote edits), `useMonkeyTabSync` hook (subscribe your transport to local changes), and `presence` prop (renders a `PresenceBar` + cell cursor outlines). `onActiveCellChange` broadcasts your cursor. Bring your own WebSocket / BroadcastChannel / whatever.
- **Column-lifecycle callbacks** — `onColumnRename`, `onColumnDelete`, `onColumnCreate`, `onColumnChangeType`, `onColumnUpdateOptions`. Each gates its matching header-menu entry (provide the hook, get the UI). Schema-side counterpart to the row CRUD hooks.
- **Rich-text popup** — Write/Preview toggle, B / I / Code / Link / Strike toolbar, ⌘/Ctrl+B/I/E/K shortcuts for Text cells. New `textPopup` prop for global popup sizing; per-column `popupWidth` / `popupMinHeight` / `popupMaxHeight` overrides.
- **Grouped add-row** — "+ Add row" button per group header, inheriting the group's values.
- **Column header double-click rename.**
- **`rowKey` prop** — custom row identity function for clients whose rows don't have a stable `id`.

### Changed
- Native `confirm()` replaced with a styled `ConfirmDialog` everywhere — fixes a double-confirm when `confirmBeforeDelete` is on.
- Toolbar "Add Row" hides while rows are selected to prevent misclicks next to bulk actions.

### Fixed
- Select field option shape in docs — was `{ choices: [...] }`, should be `{ options: [{ value, label, color? }] }`.

## [0.3.0] — 2026-04-16

### New
- **`selectionActions` render prop** — Custom bulk-action buttons in the toolbar when rows are selected.
- **Row grouping** — `groupBy` / `groupCollapsed` / `onGroupByChange` with collapsible headers, row counts, and select-all-in-group checkboxes. Context menu adds "Group by this column".
- **`groupOrder` prop** — Control group display order: `'auto'` (default, uses SingleSelect option order), `'asc'`, `'desc'`, `'count-asc'`, `'count-desc'`, or explicit `string[]`.
- **Row coloring** — `colorBy` / `onColorByChange` / `colorByMap` tints rows by a field value. Uses SingleSelect option colors and Boolean defaults (pastel green/red).
- **`columnFit` prop** — `'auto'` (new default, sizes to content), `'fill'` (distributes container width), `'fixed'` (180px per column).
- **`autoFitMin` / `autoFitMax`** — Tune auto column-width bounds (defaults 60 / 320).

### Changed
- Default column width is now content-aware (`columnFit="auto"`) instead of fixed 180px.
- Cell overflow fade inherits the row's background color instead of always fading to white.
- Column header type icon auto-hides when the column is too narrow to show it with the label.

### Fixed
- Horizontal overflow when tables are inside flex parents (side-by-side panels).
- Email / URL / Phone cells now fade like other types instead of showing `...` ellipsis.

## [0.2.1] — 2026-04-15

### New
- **`height="auto"` mode** — fits content exactly, no scrollbar for small tables. Pair with `maxHeight` to cap growth.
- **`maxHeight` prop** — caps container height for `auto` or fluid (`100%`) layouts.

### Changed
- **`ghostGrid` defaults to `true`** when `height` is a fixed pixel value — empty space is filled with placeholder rows instead of blank white area.

### Fixed
- **`ResizeObserver` guard** — ghost grid no longer throws in SSR/jsdom environments.

## [0.2.0] — 2026-04-07

First public release.

### Added

#### Core component
- `<MonkeyTable>` React component — embeddable, editable table that runs entirely in the browser
- 14 built-in field types: Text, Number, Boolean, Date, SingleSelect, MultiSelect, Email, URL, Phone, Image, Attachment, Rating, Color, Computed
- Inline cell editing with type-aware editors
- Spreadsheet-style keyboard navigation (arrows, Tab, Enter, Escape)
- Cell selection with copy-paste (Cmd+C / Cmd+V)
- Range selection — Shift+Arrow extends a rectangular selection
- Multi-cell paste from TSV (Excel/Google Sheets clipboard format)
- Header range selection with Shift+Click, copy header labels with Cmd+C
- Drag-and-drop column reorder
- Resizable columns
- Search across all visible columns
- Filter builder with per-type operators
- Type-aware sorting (1→9 for numbers, oldest→newest for dates, etc.)
- Pagination — `simple` (Previous/Next) or `load-more` (infinite scroll) modes
- Ghost grid — fill viewport with faint placeholder cells
- Virtualized rendering — handles 100k+ rows smoothly via TanStack Table
- Computed fields with built-in math, text, date, and logic functions

#### Per-column options
- `editable: false` — make individual columns read-only with lock icon
- `width`, `minWidth`, `maxWidth` — column sizing
- `sortable` — disable sort per column
- `align` — cell text alignment

#### Sorting and pagination
- `sortBy` / `sortDirection` / `onSortChange` — controlled sorting for server-side queries
- `totalRows` / `page` / `pageSize` / `onPageChange` — controlled pagination

#### Selection
- `onSelectionChange` — fires on every checkbox toggle
- `selectedRowIds` — controlled selection state
- `onRowClick` — fires when a row body is clicked
- `onCellChange` — granular per-cell change callback

#### Internationalization
- English and Spanish string bundles included
- `locale`, `language`, `translations` props
- Locale-aware number, date, and currency formatting

#### Extensibility
- `functions` prop — register custom computed functions
- `constraints` prop — register custom field validators
- `renderers` prop — override built-in cell renderers
- `editors` prop — override built-in cell editors
- Per-column `render` function for one-off custom renderers

#### File handling
- `onUpload` prop — bring your own file upload (S3, Cloudinary, etc.)
- Drag-and-drop and paste support for Image cells

[Unreleased]: https://github.com/datasketch/monkeytab/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/datasketch/monkeytab/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/datasketch/monkeytab/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/datasketch/monkeytab/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/datasketch/monkeytab/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/datasketch/monkeytab/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/datasketch/monkeytab/releases/tag/v0.2.0
