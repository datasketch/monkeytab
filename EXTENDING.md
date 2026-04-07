# Extending MonkeyTab

How to customize MonkeyTab beyond the built-in field types: custom computed functions, validators, cell renderers, and editors.

All extensions are passed as props to `<MonkeyTable>`. Registration happens automatically on mount and is cleaned up on unmount — no global state to worry about.

## Table of Contents

1. [Custom Computed Functions](#custom-computed-functions)
2. [Custom Field Constraints (Validators)](#custom-field-constraints)
3. [Custom Cell Renderers](#custom-cell-renderers)
4. [Custom Cell Editors](#custom-cell-editors)
5. [Per-Column Custom Renderer](#per-column-custom-renderer)
6. [Custom Translations (i18n)](#custom-translations)

---

## Custom Computed Functions

Computed fields derive their value from other columns using registered functions. The built-in registry includes math, text, date, and logic functions. You can add your own.

### The `FunctionDef` interface

```typescript
interface FunctionDef {
  name: string;                                          // unique identifier
  category: 'text' | 'number' | 'date' | 'logic';       // groups in the UI picker
  description: string;                                   // shown in the formula builder
  inputTypes: FieldType[];                               // expected column types
  params?: Array<{ name: string; type: string; default?: unknown }>;
  compute: (inputs: Value[], params?: Record<string, unknown>) => Value;
}
```

### Example: a `percent` function

```tsx
import { MonkeyTable } from '@datasketch/monkeytab';

const customFunctions = [{
  name: 'percent',
  category: 'number' as const,
  description: 'Calculate percentage (value / total * 100)',
  inputTypes: ['Number', 'Number'] as const,
  params: [{ name: 'decimals', type: 'number', default: 1 }],
  compute: ([value, total], params) => {
    const a = typeof value === 'number' ? value : Number(value);
    const b = typeof total === 'number' ? total : Number(total);
    if (isNaN(a) || isNaN(b) || b === 0) return null;
    const decimals = Number(params?.decimals ?? 1);
    const factor = Math.pow(10, decimals);
    return Math.round((a / b) * 100 * factor) / factor;
  },
}];

<MonkeyTable
  columns={columns}
  rows={rows}
  functions={customFunctions}
/>
```

The `percent` function will appear in the formula builder under the Number category. Users can then create computed columns that use it.

---

## Custom Field Constraints

Constraints validate cell values when a user edits them. The built-in constraints include common patterns (email format, URL format, etc.). Add your own for domain-specific validation.

### The `FieldTypeConstraint` interface

```typescript
interface FieldTypeConstraint {
  name: string;
  label: string;
  description: string;
  appliesTo: FieldType[];
  params?: Array<{ name: string; type: string; default?: unknown }>;
  validate: (
    value: Value,
    params: Record<string, unknown>,
    field: { id: string; type: FieldType },
  ) => string | null;  // null = valid, string = error message
}
```

### Example: 5-digit postal code

```tsx
const customConstraints = [{
  name: 'postalCode',
  label: 'Postal Code',
  description: '5-digit postal code',
  appliesTo: ['Text'] as const,
  validate: (value: Value) =>
    /^\d{5}$/.test(String(value ?? ''))
      ? null
      : '5-digit code required',
}];

<MonkeyTable
  columns={columns}
  rows={rows}
  constraints={customConstraints}
/>
```

When users edit a Text column that has the `postalCode` constraint applied, invalid values show the error message inline.

---

## Custom Cell Renderers

Renderers control how values are displayed in cells. You can override the built-in renderer for any field type.

### The `CellRendererProps` interface

```typescript
interface CellRendererProps {
  value: Value;
  field: FieldSpec;
  rowId: string;
  cellHeight?: number;
}
```

### Example: custom Rating with hearts

```tsx
import { MonkeyTable } from '@datasketch/monkeytab';

function HeartRating({ value }: { value: unknown }) {
  const n = typeof value === 'number' ? value : 0;
  return (
    <span style={{ fontSize: '14px' }}>
      {'❤️'.repeat(n)}{'🤍'.repeat(Math.max(0, 5 - n))}
    </span>
  );
}

<MonkeyTable
  columns={columns}
  rows={rows}
  renderers={{
    Rating: HeartRating,
  }}
/>
```

The custom renderer applies to **all** Rating columns in this `<MonkeyTable>` instance. The original renderer is restored when the component unmounts.

For per-column overrides (different renderers for different columns of the same type), use the `render` prop on the column definition instead — see [Per-Column Custom Renderer](#per-column-custom-renderer).

---

## Custom Cell Editors

Editors control the inline editing UI. You can override the built-in editor for any field type.

### The `CellEditorProps` interface

```typescript
interface CellEditorProps {
  value: Value;
  field: FieldSpec;
  rowId: string;
  onSave: (value: Value) => void;
  onCancel: () => void;
  onUpload?: (file: File, fieldType: string) => Promise<string>;
}
```

### Example: a slider editor for Number columns

```tsx
function SliderEditor({ value, field, onSave, onCancel }: CellEditorProps) {
  const [val, setVal] = useState(typeof value === 'number' ? value : 0);
  const opts = field.options as { min?: number; max?: number } | undefined;

  return (
    <div style={{ padding: 12, background: 'white', border: '1px solid #ccc' }}>
      <input
        type="range"
        min={opts?.min ?? 0}
        max={opts?.max ?? 100}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
      />
      <div>{val}</div>
      <button onClick={() => onSave(val)}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}

<MonkeyTable
  columns={columns}
  rows={rows}
  editors={{
    Number: SliderEditor,
  }}
/>
```

---

## Per-Column Custom Renderer

If you only want a custom renderer for one specific column (not all columns of that type), use the `render` prop on the column definition:

```tsx
<MonkeyTable
  columns={[
    { id: 'Status', type: 'Text' },
    {
      id: 'Health',
      type: 'Number',
      render: (value, row, fieldId) => {
        const n = typeof value === 'number' ? value : 0;
        const color = n > 80 ? '#22c55e' : n > 50 ? '#f59e0b' : '#ef4444';
        return (
          <span style={{ color, fontWeight: 600 }}>
            {n}% {n > 80 ? '✓' : n > 50 ? '⚠️' : '✗'}
          </span>
        );
      },
    },
  ]}
  rows={rows}
/>
```

The `render` function receives:
- `value` — the cell value
- `row` — the full denormalized row object (all fields)
- `fieldId` — this column's id

---

## Custom Translations

All UI strings are translatable. Override individual strings via the `translations` prop:

```tsx
<MonkeyTable
  columns={columns}
  rows={rows}
  language="es"
  translations={{
    'toolbar.addRow': 'Nueva fila',
    'toolbar.search.placeholder': 'Buscar productos...',
    'confirm.deleteRow': '¿Eliminar producto?',
  }}
/>
```

Translations are merged with the built-in language bundle (English and Spanish are bundled). You can override any of the ~290 string keys. For the full list, see the `I18nStrings` type exported from the package.

---

## Cleanup and Lifecycle

Custom `functions`, `constraints`, `renderers`, and `editors` are registered when `<MonkeyTable>` mounts and unregistered when it unmounts. You don't need to clean up manually.

If two `<MonkeyTable>` instances on the same page register the same custom function name, the second one wins while it's mounted, and the first is restored when the second unmounts.

---

## What's Built In

### Field types

`Text`, `Number`, `Boolean`, `Date`, `SingleSelect`, `MultiSelect`, `Email`, `URL`, `Phone`, `Image`, `Attachment`, `Rating`, `Color`, `Computed`

### Computed function categories

| Category | Examples |
|---|---|
| Math | sum, average, min, max, round, abs, percent |
| Text | concat, upper, lower, trim, length, replace, substring |
| Date | now, today, year, month, day, addDays, formatDate |
| Logic | if, and, or, not, equals, contains |

For the full list, install the package and check the formula builder UI in the demo example.

### Constraints

Email format, URL format, phone format, min/max length, min/max value, regex patterns. Use `constraints` prop to add domain-specific ones.
