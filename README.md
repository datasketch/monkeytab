# MonkeyTab

[![npm version](https://img.shields.io/npm/v/@datasketch/monkeytab.svg?color=blue)](https://www.npmjs.com/package/@datasketch/monkeytab)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/datasketch/monkeytab/actions/workflows/ci.yml/badge.svg)](https://github.com/datasketch/monkeytab/actions/workflows/ci.yml)

**An embeddable, editable React table for your data.**

```bash
npm install @datasketch/monkeytab
```

```tsx
import { MonkeyTable } from '@datasketch/monkeytab';

function App() {
  return (
    <MonkeyTable
      columns={[
        { id: 'Name' },
        { id: 'Score', type: 'Number', options: { precision: 1 } },
        { id: 'Status', type: 'SingleSelect', options: {
          options: [
            { value: 'active', label: 'Active', color: '#22c55e' },
            { value: 'done', label: 'Done', color: '#3b82f6' },
          ],
        }},
        { id: 'Due', type: 'Date' },
        { id: 'Approved', type: 'Boolean' },
      ]}
      rows={[
        { Name: 'Alpha', Score: 9.5, Status: 'active', Due: '2026-03-15', Approved: true },
        { Name: 'Beta', Score: 7.2, Status: 'done', Due: '2026-04-01', Approved: false },
      ]}
      onChange={(rows) => console.log('Updated:', rows)}
      height={500}
    />
  );
}
```

React 18 or 19 is required as a peer dependency.

---

## Why MonkeyTab

Most React table libraries are headless primitives — you assemble the UI yourself. MonkeyTab is the opposite: a single component you drop into your app, with batteries included.

- **Spreadsheet-like editing** — click to select, double-click to edit, Tab/arrows to navigate, Cmd+C/V to copy/paste
- **Type-aware columns** — Text, Number, Boolean, Date, SingleSelect, MultiSelect, Email, URL, Phone, Image, Attachment, Rating, Color, Computed
- **Sort, filter, search** out of the box — no setup required
- **Pagination & ghost grid** — handle large datasets with simple or load-more pagination
- **Range selection** — Shift+Arrow to select cells, Cmd+C copies as TSV (paste into Excel/Sheets)
- **i18n** — English and Spanish bundled, full string overrides via `translations` prop
- **Extensible** — register custom field types, computed functions, validators, and cell renderers

## Features

| Feature | Notes |
|---|---|
| Cell editing | All field types have inline editors |
| Sort | Click headers to toggle, type-aware labels |
| Filter | Filter builder with per-type operators |
| Search | Full-text across all visible columns |
| Pagination | Simple (Previous/Next) or load-more (infinite scroll) |
| Virtualization | Built on TanStack Table — handles 100k+ rows smoothly |
| Range selection | Shift+Arrow for rectangular selection, copy as TSV |
| Multi-cell paste | Paste TSV from clipboard, fills from active cell |
| Per-column options | `editable`, `width`, `sortable`, `align` per column |
| Read-only mode | `editable={false}` for view-only tables |
| Custom renderers | Register your own cell renderer for any field type |
| Custom functions | Add your own computed field functions |

## Documentation

- [BROWSER.md](./BROWSER.md) — Full props reference and field type guide
- [EXTENDING.md](./EXTENDING.md) — How to add custom renderers, editors, functions, and constraints
- [docs/architecture.md](./docs/architecture.md) — How MonkeyTab is structured under the hood
- [CONTRIBUTING.md](./CONTRIBUTING.md) — How to contribute

## Examples

A minimal example app lives in [`examples/browser-standalone/`](./examples/browser-standalone/). To run it:

```bash
git clone https://github.com/datasketch/monkeytab.git
cd monkeytab/examples/browser-standalone
npm install
npm run dev
```

## License

[MIT](./LICENSE)
