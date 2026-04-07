# Changelog

All notable changes to `@datasketch/monkeytab`.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/datasketch/monkeytab/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/datasketch/monkeytab/releases/tag/v0.2.0
