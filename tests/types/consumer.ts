/**
 * Public TypeScript API consumer test.
 *
 * This file is type-checked against the SHIPPED dist/index.d.ts (via
 * tests/types/tsconfig.json) by the type-compilation test in
 * tests/types/types.test.ts.
 *
 * It exists to verify that:
 *   1. The shipped types expose the symbols consumers need
 *   2. The shapes match what README/BROWSER.md document
 *   3. Hand-maintained dist/index.d.ts stays in sync with the source
 *
 * If this file stops compiling, the public type contract is broken —
 * either a type was removed/renamed in dist/index.d.ts, or the source
 * diverged from the hand-maintained type declarations.
 *
 * This file is NEVER executed at runtime — it's a type-level smoke
 * test only. The .ts (not .test.ts) name keeps vitest from picking
 * it up.
 */

import {
  MonkeyTable,
  type MonkeyTableProps,
  type MonkeyTableColumn,
  type FieldType,
  type FieldSpec,
  type Value,
  type SelectOption,
} from '@datasketch/monkeytab';

// ─── FieldType union covers the documented field types ──────────────────────
const _textType: FieldType = 'Text';
const _numberType: FieldType = 'Number';
const _booleanType: FieldType = 'Boolean';
const _dateType: FieldType = 'Date';
const _singleSelectType: FieldType = 'SingleSelect';
const _multiSelectType: FieldType = 'MultiSelect';

// ─── SelectOption shape ─────────────────────────────────────────────────────
const _option: SelectOption = {
  value: 'active',
  label: 'Active',
  color: '#22c55e',
};

// ─── Column construction matches the README example ────────────────────────
const _columns: MonkeyTableColumn[] = [
  { id: 'Name' },
  { id: 'Score', type: 'Number', options: { precision: 1 } },
  {
    id: 'Status',
    type: 'SingleSelect',
    options: {
      options: [
        { value: 'active', label: 'Active', color: '#22c55e' },
        { value: 'done', label: 'Done', color: '#3b82f6' },
      ],
    },
  },
  { id: 'Due', type: 'Date' },
  { id: 'Approved', type: 'Boolean' },
];

// ─── Per-column extras (editable, width, render, hidden, align) ────────────
const _columnsAdvanced: MonkeyTableColumn[] = [
  { id: 'A', editable: false, width: 200, sortable: false, align: 'right' },
  { id: 'B', minWidth: 80, maxWidth: 600 },
  { id: 'C', hidden: true },
];

// ─── MonkeyTableProps shape covers the documented props ────────────────────
const _props: MonkeyTableProps = {
  columns: _columns,
  rows: [
    { Name: 'Alpha', Score: 9.5, Status: 'active', Due: '2026-03-15', Approved: true },
  ],
  onChange: (rows) => {
    // rows callback receives Record<string, Value>[]
    void rows.length;
  },
  height: 500,
  editable: true,
  showToolbar: true,
  locale: 'en-US',
  rowHeight: 'medium',
};

// ─── FieldSpec is exported for adapter authors ──────────────────────────────
const _field: FieldSpec = {
  id: 'col-1',
  label: 'Column 1',
  type: 'Text',
};

// ─── Value union covers the documented primitive types ────────────────────
const _stringValue: Value = 'hello';
const _numberValue: Value = 42;
const _booleanValue: Value = true;
const _nullValue: Value = null;
const _arrayValue: Value = ['tag-a', 'tag-b'];

// ─── MonkeyTable is callable as a React component ─────────────────────────
type MonkeyTableComponent = typeof MonkeyTable;
const _component: MonkeyTableComponent = MonkeyTable;

// Suppress "declared but never read" errors by exporting everything.
// None of these are runtime values worth shipping; they only exist for
// the type checker.
export {
  _textType,
  _numberType,
  _booleanType,
  _dateType,
  _singleSelectType,
  _multiSelectType,
  _option,
  _columns,
  _columnsAdvanced,
  _props,
  _field,
  _stringValue,
  _numberValue,
  _booleanValue,
  _nullValue,
  _arrayValue,
  _component,
};
