# Getting started

Get a working `<MonkeyTable>` in your React app in under five minutes.

## Install

```bash
npm install @datasketch/monkeytab
```

React 18 or 19 is required as a peer dependency.

## Your first table

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
      height={400}
    />
  );
}
```

That's it. You now have an editable table with:

- Click-to-select cells
- Double-click to edit
- Tab and arrow key navigation
- Sort by clicking column headers
- Search and filter via the toolbar
- Add and remove rows
- A working data model with `onChange` for persistence

## Next steps

- [Column types](/guides/columns) — what each of the 14 field types does
- [Editing](/guides/editing) — keyboard shortcuts and copy/paste
- [Sorting and pagination](/guides/sorting-pagination) — server-side and client-side
- [Extending](/guides/extending) — custom renderers, editors, computed functions
- [API reference](/reference/browser) — full props list
