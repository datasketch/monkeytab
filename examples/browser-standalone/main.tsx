/**
 * MonkeyTable — Browser Standalone Example
 *
 * Shows how to embed an editable table with no server.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MonkeyTable, type MonkeyTableHandle } from '@monkeytab/browser';
import type { Value, PresenceUser, RemoteChangeEvent } from '@monkeytab/browser';

// ---------------------------------------------------------------------------
// Example 1: Simple editable table
// ---------------------------------------------------------------------------

const COLUMNS = [
  { id: 'Name' },
  { id: 'Email', type: 'Email' as const },
  { id: 'Website', type: 'URL' as const },
  { id: 'Role', type: 'SingleSelect' as const, icon: React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
    React.createElement('circle', { cx: 8, cy: 5, r: 3 }),
    React.createElement('path', { d: 'M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6' }),
  ), options: { options: [
    { value: 'Engineer', label: 'Engineer', color: '#dbeafe' },
    { value: 'Designer', label: 'Designer', color: '#fce7f3' },
    { value: 'Manager', label: 'Manager', color: '#dcfce7' },
  ]}},
  { id: 'Salary', type: 'Number' as const },
  { id: 'Active', type: 'Boolean' as const },
  { id: 'Visible', type: 'Boolean' as const, options: {
    displayAs: 'icon' as const,
    trueIcon: 'https://api.iconify.design/lucide:eye.svg',
    falseIcon: 'https://api.iconify.design/lucide:eye-off.svg',
    trueLabel: 'Visible',
    falseLabel: 'Hidden',
  }},
  { id: 'Joined', type: 'Date' as const },
  { id: 'Avatar', type: 'Image' as const },
  { id: 'Color', type: 'Color' as const },
  { id: 'Rating', type: 'Rating' as const },
  { id: 'Metadata', type: 'Text' as const, options: { json: true } },
];

// ---------------------------------------------------------------------------
// Example 5: Column options showcase
// ---------------------------------------------------------------------------

const COLUMN_OPTIONS_COLUMNS = [
  { id: 'Product', width: 200, minWidth: 150, maxWidth: 300 },
  { id: 'SKU', width: 120, editable: false, sortable: false },
  { id: 'Category', type: 'SingleSelect' as const, width: 140, options: { options: [
    { value: 'Electronics', label: 'Electronics', color: '#dbeafe' },
    { value: 'Clothing', label: 'Clothing', color: '#fce7f3' },
    { value: 'Food', label: 'Food', color: '#dcfce7' },
    { value: 'Books', label: 'Books', color: '#fef3c7' },
  ]}},
  { id: 'Price', type: 'Number' as const, width: 110, align: 'right' as const, options: { precision: 2 } },
  { id: 'Stock', type: 'Number' as const, width: 90, align: 'center' as const, editable: false },
  { id: 'Available', type: 'Boolean' as const, width: 100, align: 'center' as const },
  { id: 'Notes', width: 250, minWidth: 150, maxWidth: 500 },
];

const COLUMN_OPTIONS_ROWS = [
  { Product: 'Wireless Headphones', SKU: 'WH-1001', Category: 'Electronics', Price: 79.99, Stock: 142, Available: true, Notes: 'Best seller Q1' },
  { Product: 'Cotton T-Shirt', SKU: 'CT-2050', Category: 'Clothing', Price: 24.50, Stock: 530, Available: true, Notes: '' },
  { Product: 'Organic Coffee Beans', SKU: 'OC-3010', Category: 'Food', Price: 18.75, Stock: 0, Available: false, Notes: 'Restock pending' },
  { Product: 'TypeScript Handbook', SKU: 'BK-4020', Category: 'Books', Price: 39.99, Stock: 87, Available: true, Notes: '2nd edition' },
  { Product: 'USB-C Cable', SKU: 'UC-1055', Category: 'Electronics', Price: 12.99, Stock: 1200, Available: true, Notes: '' },
  { Product: 'Running Shoes', SKU: 'RS-2080', Category: 'Clothing', Price: 129.00, Stock: 45, Available: true, Notes: 'Limited sizes' },
];

const INITIAL_ROWS = [
  { Name: 'Alice Chen', Email: 'alice@acme.com', Website: 'https://alicechen.dev', Role: 'Engineer', Salary: 95000, Active: true, Visible: true, Joined: '2022-03-15', Avatar: 'https://i.pravatar.cc/150?u=alice', Color: '#3b82f6', Rating: 5, Metadata: JSON.stringify({ department: 'Engineering', level: 'Senior', skills: ['TypeScript', 'React'] }) },
  { Name: 'Bob Smith', Email: 'bob@acme.com', Website: 'https://bobsmith.design', Role: 'Designer', Salary: 82000, Active: true, Visible: true, Joined: '2021-07-01', Avatar: 'https://i.pravatar.cc/150?u=bob', Color: '#ec4899', Rating: 4, Metadata: JSON.stringify({ department: 'Design', level: 'Mid', skills: ['Figma', 'CSS'] }) },
  { Name: 'Carol Wu', Email: 'carol@acme.com', Website: 'https://carolwu.io', Role: 'Manager', Salary: 110000, Active: true, Visible: false, Joined: '2020-11-20', Avatar: 'https://i.pravatar.cc/150?u=carol', Color: '#22c55e', Rating: 5, Metadata: JSON.stringify({ department: 'Engineering', level: 'Director', reports: 8 }) },
  { Name: 'Dan Lee', Email: 'dan@acme.com', Website: 'https://danlee.codes', Role: 'Engineer', Salary: 98000, Active: false, Visible: true, Joined: '2023-01-10', Avatar: 'https://i.pravatar.cc/150?u=dan', Color: '#f59e0b', Rating: 3, Metadata: JSON.stringify({ department: 'Engineering', level: 'Mid', skills: ['Go', 'Rust'] }) },
  { Name: 'Eve Park', Email: 'eve@acme.com', Website: 'https://evepark.dev', Role: 'Engineer', Salary: 91000, Active: true, Visible: false, Joined: '2022-09-05', Avatar: 'https://i.pravatar.cc/150?u=eve', Color: '#8b5cf6', Rating: 4, Metadata: JSON.stringify({ department: 'Engineering', level: 'Junior', skills: ['Python', 'SQL'] }) },
];

// ---------------------------------------------------------------------------
// Example 2: Read-only table
// ---------------------------------------------------------------------------

const METRICS_COLUMNS = [
  { id: 'Metric' },
  { id: 'Q1', type: 'Number' as const, options: { format: 'currency' as const, precision: 0 } },
  { id: 'Q2', type: 'Number' as const, options: { format: 'currency' as const, precision: 0 } },
  { id: 'Q3', type: 'Number' as const, options: { format: 'currency' as const, precision: 0 } },
  { id: 'Q4', type: 'Number' as const, options: { format: 'currency' as const, precision: 0 } },
  { id: 'YoY Growth', type: 'Number' as const, options: { format: 'percentage' as const, precision: 1 } },
];

const METRICS_ROWS = [
  { Metric: 'Revenue', Q1: 120000, Q2: 145000, Q3: 138000, Q4: 162000, 'YoY Growth': 0.124 },
  { Metric: 'Expenses', Q1: 98000, Q2: 102000, Q3: 95000, Q4: 110000, 'YoY Growth': 0.083 },
  { Metric: 'Headcount', Q1: 12, Q2: 14, Q3: 14, Q4: 16, 'YoY Growth': 0.333 },
  { Metric: 'NPS Score', Q1: 42, Q2: 48, Q3: 51, Q4: 55, 'YoY Growth': 0.31 },
];

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

// ---------------------------------------------------------------------------
// Example: i18n translation overrides
// ---------------------------------------------------------------------------

/** Override specific strings — e.g. for branding or custom wording. */
const CUSTOM_TRANSLATIONS: Record<string, string> = {
  'toolbar.addRow': 'New Row',
  'grid.loading': 'Fetching data...',
};

// ---------------------------------------------------------------------------
// Example: Registry extensions (functions, constraints, renderers)
// ---------------------------------------------------------------------------

/** Custom computed function — available in the formula builder */
const CUSTOM_FUNCTIONS = [
  {
    name: 'calculateTax',
    category: 'number' as const,
    description: 'Price × tax rate',
    inputTypes: ['Number' as const, 'Number' as const],
    compute: (inputs: Value[]) => (inputs[0] as number) * (inputs[1] as number),
  },
];

/** Custom field constraint — available for field-level validation */
const CUSTOM_CONSTRAINTS = [
  {
    name: 'postalCode',
    label: 'Postal Code',
    description: '5-digit postal code',
    appliesTo: ['Text' as const],
    validate: (value: Value) => /^\d{5}$/.test(String(value ?? '')) ? null : '5-digit code required',
  },
];

/** Custom renderer override — replaces the built-in Rating renderer */
const CUSTOM_RENDERERS = {
  Rating: ({ value }: { value: Value }) => {
    const n = typeof value === 'number' ? value : 0;
    return React.createElement('span', { style: { fontSize: '14px' } }, '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n)));
  },
};

// ---------------------------------------------------------------------------
// Example 3: Large dataset (30k+ rows) for sort & performance testing
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LARGE_ROW_COUNTS = [1_000, 5_000, 10_000, 30_000, 50_000];

function generateLargeRows(count: number): Array<Record<string, Value>> {
  const rand = mulberry32(42);
  const rows: Array<Record<string, Value>> = [];
  for (let i = 0; i < count; i++) {
    const n = i + 1;
    const isPrime = (() => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) { if (n % d === 0) return false; } return true; })();
    const isEven = n % 2 === 0;
    rows.push({
      '#': n,
      Name: numberName(n),
      Square: n * n,
      'Sqrt (2dp)': Math.round(Math.sqrt(n) * 100) / 100,
      'Mod 7': n % 7,
      Even: isEven,
      Prime: isPrime,
      Group: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'][Math.floor(rand() * 5)],
      Score: Math.round(rand() * 10000) / 100,
    });
  }
  return rows;
}

/** Convert a number 1–99999 to a readable English name. */
function numberName(n: number): string {
  const ones = ['','one','two','three','four','five','six','seven','eight','nine',
    'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  if (n === 0) return 'zero';
  if (n >= 100000) return String(n);
  let s = '';
  if (n >= 1000) {
    const t = Math.floor(n / 1000);
    s += numberName(t) + ' thousand';
    n %= 1000;
    if (n > 0) s += ' ';
  }
  if (n >= 100) {
    s += ones[Math.floor(n / 100)] + ' hundred';
    n %= 100;
    if (n > 0) s += ' and ';
  }
  if (n >= 20) {
    s += tens[Math.floor(n / 10)];
    if (n % 10 > 0) s += '-' + ones[n % 10];
  } else if (n > 0) {
    s += ones[n];
  }
  return s;
}

const LARGE_COLUMNS = [
  { id: '#', type: 'Number' as const },
  { id: 'Name' },
  { id: 'Square', type: 'Number' as const },
  { id: 'Sqrt (2dp)', type: 'Number' as const, options: { precision: 2 } },
  { id: 'Mod 7', type: 'Number' as const },
  { id: 'Even', type: 'Boolean' as const },
  { id: 'Prime', type: 'Boolean' as const },
  { id: 'Group', type: 'SingleSelect' as const, options: { options: [
    { value: 'Alpha', label: 'Alpha', color: '#dbeafe' },
    { value: 'Bravo', label: 'Bravo', color: '#fce7f3' },
    { value: 'Charlie', label: 'Charlie', color: '#dcfce7' },
    { value: 'Delta', label: 'Delta', color: '#fef3c7' },
    { value: 'Echo', label: 'Echo', color: '#e0e7ff' },
  ]}},
  { id: 'Score', type: 'Number' as const, options: { precision: 2 } },
];

function LargeDatasetExample({ locale, language }: { locale: string; language: string }) {
  const [rowCount, setRowCount] = useState(30_000);

  const rows = useMemo(() => {
    const t0 = performance.now();
    const data = generateLargeRows(rowCount);
    const ms = (performance.now() - t0).toFixed(0);
    console.log(`Generated ${rowCount.toLocaleString()} rows in ${ms}ms`);
    return data;
  }, [rowCount]);

  return (
    <div className="example">
      <h2>Large Dataset — {rowCount.toLocaleString()} rows</h2>
      <div className="desc" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Performance test: sort by clicking column headers, filter, search.</span>
        <label style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          Rows:
          <select
            value={rowCount}
            onChange={(e) => setRowCount(Number(e.target.value))}
            style={{ padding: '2px 6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            {LARGE_ROW_COUNTS.map((n) => (
              <option key={n} value={n}>{n.toLocaleString()}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="table-container" style={{ height: '500px' }}>
        <MonkeyTable
          columns={LARGE_COLUMNS}
          rows={rows}
          pageSize={rowCount}
          editable={false}
          height="100%"
          rowHeight="short"
          showRowNumbers
          locale={locale}
          language={language}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Example 4: Simulated pagination
// ---------------------------------------------------------------------------

const ALL_PAGINATED_ROWS = Array.from({ length: 150 }, (_, i) => ({
  Id: i + 1,
  Name: `Item ${i + 1}`,
  Value: Math.round(Math.random() * 1000) / 10,
  Status: ['active', 'done', 'pending'][i % 3],
}));

const PAGINATED_COLUMNS = [
  { id: 'Id', type: 'Number' as const },
  { id: 'Name', type: 'Text' as const },
  { id: 'Value', type: 'Number' as const, options: { precision: 1 } },
  { id: 'Status', type: 'SingleSelect' as const, options: { options: [
    { value: 'active', label: 'Active', color: '#22c55e' },
    { value: 'done', label: 'Done', color: '#3b82f6' },
    { value: 'pending', label: 'Pending', color: '#f59e0b' },
  ]}},
];

function PaginationExample({ locale, language }: { locale: string; language: string }) {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<'simple' | 'load-more'>('simple');

  // Simulate server-side pagination
  const start = (page - 1) * PAGE_SIZE;
  const pageRows = mode === 'simple'
    ? ALL_PAGINATED_ROWS.slice(start, start + PAGE_SIZE)
    : ALL_PAGINATED_ROWS.slice(0, page * PAGE_SIZE);

  return (
    <div className="example">
      <h2>Paginated Table</h2>
      <div className="desc">
        Server-side pagination with <code>totalRows</code>, <code>page</code>, and <code>onPageChange</code>.
        <label style={{ marginLeft: '16px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          Mode:
          <select
            value={mode}
            onChange={(e) => { setMode(e.target.value as 'simple' | 'load-more'); setPage(1); }}
            style={{ padding: '2px 6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="simple">Simple (Previous/Next)</option>
            <option value="load-more">Load More</option>
          </select>
        </label>
      </div>
      <div className="table-container">
        <MonkeyTable
          columns={PAGINATED_COLUMNS}
          rows={pageRows}
          totalRows={ALL_PAGINATED_ROWS.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          paginationMode={mode}
          editable={false}
          height="100%"
          rowHeight="short"
          locale={locale}
          language={language}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Example 6: Empty table variations
// ---------------------------------------------------------------------------

const EMPTY_COLUMNS = [
  { id: 'Name' },
  { id: 'Email', type: 'Email' as const },
  { id: 'Role', type: 'SingleSelect' as const, options: { options: [
    { value: 'Admin', label: 'Admin', color: '#dbeafe' },
    { value: 'Editor', label: 'Editor', color: '#dcfce7' },
    { value: 'Viewer', label: 'Viewer', color: '#fef3c7' },
  ]}},
  { id: 'Active', type: 'Boolean' as const },
];

type EmptyVariant = 'with-columns' | 'no-columns' | 'no-toolbar' | 'bare';

const EMPTY_VARIANTS: { id: EmptyVariant; label: string }[] = [
  { id: 'with-columns', label: 'With columns' },
  { id: 'no-columns', label: 'No columns' },
  { id: 'no-toolbar', label: 'No toolbar' },
  { id: 'bare', label: 'Bare (no toolbar, no row #)' },
];

function EmptyTableExample({ locale, language, ghostGrid, compactMode }: { locale: string; language: string; ghostGrid: boolean; compactMode: boolean }) {
  const [variant, setVariant] = useState<EmptyVariant>('with-columns');

  const showToolbar = variant !== 'no-toolbar' && variant !== 'bare';
  const showRowNumbers = variant !== 'bare';
  const cols = variant === 'no-columns' ? [] as typeof EMPTY_COLUMNS : EMPTY_COLUMNS;

  return (
    <div className="example" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 200px)' }}>
      <h2>Empty Table</h2>
      <div className="desc" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span>Zero rows — tests loading state, ghost grid fill, and add-row UX.</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {EMPTY_VARIANTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVariant(v.id)}
              style={{
                padding: '3px 10px',
                fontSize: '12px',
                fontWeight: variant === v.id ? 600 : 400,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: variant === v.id ? '#111827' : '#d1d5db',
                background: variant === v.id ? '#111827' : 'white',
                color: variant === v.id ? 'white' : '#374151',
                cursor: 'pointer',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="table-container" style={{ flex: 1, height: 'auto' }}>
        <MonkeyTable
          columns={cols}
          rows={[]}
          ghostGrid={ghostGrid}
          height="100%"
          rowHeight="medium"
          showRowNumbers={showRowNumbers}
          showToolbar={showToolbar}
          compactMode={compactMode}
          locale={locale}
          language={language}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Example 7: Height modes comparison
// ---------------------------------------------------------------------------

const HEIGHT_COLUMNS = [
  { id: 'Organization' },
  { id: 'Slug' },
  { id: 'Status', type: 'SingleSelect' as const, options: { options: [
    { value: 'Synced', label: 'Synced', color: '#dcfce7' },
    { value: 'Pending', label: 'Pending', color: '#fef3c7' },
    { value: 'Error', label: 'Error', color: '#fecaca' },
  ]}},
  { id: 'Filter' },
  { id: 'Link', type: 'URL' as const },
];

const HEIGHT_ROWS_3 = [
  { Organization: 'test', Slug: 'test', Status: 'Synced', Filter: "filter(org_slug == 'test')", Link: '/test/db/news-articles' },
  { Organization: 'testorg', Slug: 'testorg', Status: 'Synced', Filter: "filter(org_slug == 'testorg')", Link: '/testorg/db/news-articles' },
  { Organization: 'acme', Slug: 'acme', Status: 'Pending', Filter: "filter(org_slug == 'acme')", Link: '/acme/db/news-articles' },
];

const HEIGHT_ROWS_1 = [HEIGHT_ROWS_3[0]];

type HeightMode = 'auto' | 'auto-capped' | 'fixed-400' | 'fixed-400-no-ghost' | 'fill';

const HEIGHT_MODES: { id: HeightMode; label: string; code: string }[] = [
  { id: 'auto', label: 'auto', code: 'height="auto"' },
  { id: 'auto-capped', label: 'auto + maxHeight', code: 'height="auto" maxHeight={300}' },
  { id: 'fixed-400', label: '400px (ghost on)', code: 'height={400}' },
  { id: 'fixed-400-no-ghost', label: '400px (ghost off)', code: 'height={400} ghostGrid={false}' },
  { id: 'fill', label: '100% (fill parent)', code: 'height="100%"' },
];

function HeightModeTable({ rows, mode, locale, language, compactMode }: {
  rows: Array<Record<string, Value>>;
  mode: HeightMode;
  locale: string;
  language: string;
  compactMode: boolean;
}) {
  const heightProps = (() => {
    switch (mode) {
      case 'auto': return { height: 'auto' as const };
      case 'auto-capped': return { height: 'auto' as const, maxHeight: 300 };
      case 'fixed-400': return { height: 400 };
      case 'fixed-400-no-ghost': return { height: 400, ghostGrid: false as const };
      case 'fill': return { height: '100%' };
    }
  })();

  const needsContainer = mode === 'fill';

  const table = (
    <MonkeyTable
      columns={HEIGHT_COLUMNS}
      rows={rows}
      editable={false}
      showToolbar={false}
      compactMode={compactMode}
      locale={locale}
      language={language}
      {...heightProps}
    />
  );

  if (needsContainer) {
    return <div style={{ height: '300px', border: '1px dashed #d1d5db', borderRadius: '6px' }}>{table}</div>;
  }
  return table;
}

function HeightModesExample({ locale, language, compactMode }: { locale: string; language: string; compactMode: boolean }) {
  const [mode, setMode] = useState<HeightMode>('auto');

  const currentMode = HEIGHT_MODES.find((m) => m.id === mode)!;

  return (
    <div className="example">
      <h2>Height Modes</h2>
      <div className="desc" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span>Compare how different <code>height</code> modes handle 0, 1, and 3 rows.</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {HEIGHT_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                padding: '3px 10px',
                fontSize: '12px',
                fontWeight: mode === m.id ? 600 : 400,
                borderRadius: '4px',
                border: '1px solid',
                borderColor: mode === m.id ? '#111827' : '#d1d5db',
                background: mode === m.id ? '#111827' : 'white',
                color: mode === m.id ? 'white' : '#374151',
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '16px', padding: '6px 12px', background: '#f9fafb', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px', color: '#6b7280' }}>
        {'<MonkeyTable '}{currentMode.code}{' />'}
        {mode === 'fill' && <span style={{ color: '#9ca3af' }}> (inside a 300px container)</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {([
          { label: '0 rows (empty)', rows: [] as Array<Record<string, Value>> },
          { label: '1 row', rows: HEIGHT_ROWS_1 },
          { label: '3 rows', rows: HEIGHT_ROWS_3 },
        ]).map((scenario) => (
          <div key={scenario.label}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              {scenario.label}
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
              <HeightModeTable
                rows={scenario.rows}
                mode={mode}
                locale={locale}
                language={language}
                compactMode={compactMode}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Example: Async CRUD hooks — round-trip editing against a fake async DB.
//
// This tab exercises:
//   • Click Add → draft row appears locally (red border on empty required cells)
//   • Fill Title → draft promotes via onRowCreate, DB id replaces the grid's temp id
//   • Edit Title with other required-missing? → stays draft, onHookError('create')
//   • onCellSave awaits persist on a persisted row; reject rolls back to oldValue
//   • onRowDelete awaits persist; reject puts the row back
//   • showCellSaveStatus shows a per-cell saving border
//   • errorToast shows an inline error message
// ---------------------------------------------------------------------------

const ASYNC_CRUD_COLUMNS = [
  { id: 'Title', type: 'Text' as const, required: true },
  { id: 'Status', type: 'SingleSelect' as const, options: {
    options: [
      { value: 'open', label: 'Open', color: '#3b82f6' },
      { value: 'done', label: 'Done', color: '#10b981' },
    ],
  }},
  { id: 'Priority', type: 'Number' as const },
];

function AsyncCrudExample() {
  // Fake async DB — persists across re-renders.
  const db = useMemo(() => {
    const m = new Map<string, Record<string, Value>>();
    m.set('db-1', { id: 'db-1', Title: 'Write docs', Status: 'open', Priority: 1 });
    m.set('db-2', { id: 'db-2', Title: 'Ship feature', Status: 'done', Priority: 2 });
    return m;
  }, []);

  const [rows, setRows] = useState<Array<Record<string, Value>>>(() => [...db.values()]);
  const [forceReject, setForceReject] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const append = (msg: string) =>
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleRowCreate = async ({ fields }: { fields: Record<string, Value> }) => {
    await delay(400);
    const id = `db-${crypto.randomUUID().slice(0, 8)}`;
    const full = { id, ...fields };
    db.set(id, full);
    setRows([...db.values()]);
    append(`onRowCreate → assigned id ${id}`);
    return { id, fields: full };
  };

  const handleCellSave = async (rowId: string, fieldId: string, newValue: Value, oldValue: Value) => {
    append(`onCellSave ${rowId}.${fieldId}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
    await delay(400);
    if (forceReject) {
      append(`onCellSave rejected (force-reject enabled) — grid will roll back`);
      throw new Error('Forced rejection');
    }
    const row = db.get(rowId);
    if (!row) throw new Error(`Row not found: ${rowId}`);
    db.set(rowId, { ...row, [fieldId]: newValue });
    setRows([...db.values()]);
  };

  const handleRowDelete = async (rowId: string) => {
    await delay(400);
    if (forceReject) {
      append(`onRowDelete rejected (force-reject enabled) — grid will restore the row`);
      throw new Error('Forced rejection');
    }
    db.delete(rowId);
    setRows([...db.values()]);
    append(`onRowDelete ${rowId}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={forceReject} onChange={(e) => setForceReject(e.target.checked)} />
          Force reject (update/delete) — exercises rollback
        </label>
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          Click <b>Add row</b>, fill in <b>Title</b>* (required), then edit cells. Each hook runs against a fake DB with a 400 ms delay.
        </span>
      </div>
      <div style={{ height: 'calc(100% - 200px)' }}>
        <MonkeyTable
          columns={ASYNC_CRUD_COLUMNS}
          rows={rows}
          rowKey="id"
          height="100%"
          onRowCreate={handleRowCreate}
          onCellSave={handleCellSave}
          onRowDelete={handleRowDelete}
          onHookError={(kind, err) => append(`onHookError [${kind}]: ${err instanceof Error ? err.message : String(err)}`)}
          errorToast
          showCellSaveStatus
        />
      </div>
      <div style={{ padding: 8, background: '#0f172a', color: '#cbd5e1', fontFamily: 'monospace', fontSize: 12, maxHeight: 180, overflow: 'auto' }}>
        {log.length === 0 ? <div style={{ opacity: 0.5 }}>Hook activity will appear here…</div> : log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Example: Multiplayer — two peers share a BroadcastChannel (no backend)
// ---------------------------------------------------------------------------

const MP_COLUMNS = [
  { id: 'Task' },
  { id: 'Status', type: 'SingleSelect' as const, options: { options: [
    { value: 'todo', label: 'To do', color: '#dbeafe' },
    { value: 'doing', label: 'Doing', color: '#fef3c7' },
    { value: 'done', label: 'Done', color: '#dcfce7' },
  ]}},
  { id: 'Owner' },
];

const MP_INITIAL_ROWS = [
  { id: 'task-1', Task: 'Draft proposal', Status: 'doing', Owner: 'Alice' },
  { id: 'task-2', Task: 'Review PR #42', Status: 'todo', Owner: 'Bob' },
];

interface Peer {
  seat: 'A' | 'B';
  name: string;
  color: string;
}

const PEERS: Peer[] = [
  { seat: 'A', name: 'Alice', color: '#2563eb' },
  { seat: 'B', name: 'Bob',   color: '#dc2626' },
];

function MultiplayerExample() {
  // Each peer owns its own rows state (simulating two browser tabs).
  const [rowsA, setRowsA] = useState<Array<Record<string, Value>>>(MP_INITIAL_ROWS);
  const [rowsB, setRowsB] = useState<Array<Record<string, Value>>>(MP_INITIAL_ROWS);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12, padding: 12 }}>
      <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
        Two independent <b>MonkeyTable</b> instances each open their own <code>BroadcastChannel</code> (same name).
        Edit on the left — watch the right update in real time (and vice versa). No server involved.
        Click a cell to broadcast your cursor; the other peer sees a colored outline and an avatar.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0 }}>
        {PEERS.map((peer) => (
          <PeerTable
            key={peer.seat}
            peer={peer}
            otherPeer={PEERS.find((p) => p.seat !== peer.seat)!}
            rows={peer.seat === 'A' ? rowsA : rowsB}
            setRows={peer.seat === 'A' ? setRowsA : setRowsB}
          />
        ))}
      </div>
    </div>
  );
}

function PeerTable({
  peer,
  otherPeer,
  rows,
  setRows,
}: {
  peer: Peer;
  otherPeer: Peer;
  rows: Array<Record<string, Value>>;
  setRows: React.Dispatch<React.SetStateAction<Array<Record<string, Value>>>>;
}) {
  const tableRef = useRef<MonkeyTableHandle>(null);

  // Each peer gets its OWN BroadcastChannel instance (same name). BroadcastChannel
  // does not deliver messages to the same instance that sent them — even within a
  // single tab — so using one shared object would swallow every message. Lazy-init
  // via ref; no cleanup (StrictMode would close the channel prematurely).
  const channelRef = useRef<BroadcastChannel | null>(null);
  if (!channelRef.current) channelRef.current = new BroadcastChannel('monkeytab-mp-demo');
  const channel = channelRef.current;

  // Presence: whoever `otherPeer` has told us about — we track their cursor.
  const [otherCursor, setOtherCursor] = useState<{ rowId: string; fieldId?: string } | null>(null);

  // Subscribe to remote messages from the other peer.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data.from === peer.seat) return; // defensive — own posts aren't echoed anyway
      if (e.data.kind === 'change') {
        const event: RemoteChangeEvent = e.data.event;
        tableRef.current?.applyRemoteChange(event);
        // Also update our local `rows` so the table re-seeds correctly on prop change.
        setRows((prev) => applyToLocalRows(prev, event));
      } else if (e.data.kind === 'cursor') {
        setOtherCursor(e.data.cursor);
      }
    };
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
  }, [channel, peer.seat, setRows]);

  const presence: PresenceUser[] = otherCursor
    ? [{ userId: otherPeer.seat, name: otherPeer.name, color: otherPeer.color, cursor: otherCursor }]
    : [{ userId: otherPeer.seat, name: otherPeer.name, color: otherPeer.color }];

  const broadcastChange = (event: RemoteChangeEvent) => {
    channel.postMessage({ from: peer.seat, kind: 'change', event });
  };

  const broadcastCursor = (rowId: string, fieldId?: string) => {
    channel.postMessage({ from: peer.seat, kind: 'cursor', cursor: { rowId, fieldId } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: `2px solid ${peer.color}`, borderRadius: 6, overflow: 'hidden', minHeight: 0 }}>
      <div style={{ padding: '6px 10px', background: peer.color, color: '#fff', fontWeight: 600, fontSize: 13 }}>
        {peer.name}'s view (seat {peer.seat})
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <MonkeyTable
          ref={tableRef}
          columns={MP_COLUMNS}
          rows={rows}
          rowKey="id"
          height="100%"
          presence={presence}
          onActiveCellChange={(rowId, fieldId) => {
            if (rowId && fieldId) broadcastCursor(rowId, fieldId);
          }}
          onRowCreate={async ({ fields }) => {
            const id = `task-${crypto.randomUUID().slice(0, 8)}`;
            const row = { id, fields, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            setRows((prev) => [...prev, { id, ...fields }]);
            broadcastChange({ type: 'row.created', row });
            return { id };
          }}
          onCellSave={async (rowId, fieldId, value) => {
            setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [fieldId]: value } : r)));
            broadcastChange({ type: 'row.updated', rowId, fields: { [fieldId]: value }, updatedAt: new Date().toISOString() });
          }}
          onRowDelete={async (rowId) => {
            setRows((prev) => prev.filter((r) => r.id !== rowId));
            broadcastChange({ type: 'row.deleted', rowId });
          }}
        />
      </div>
    </div>
  );
}

function applyToLocalRows(
  prev: Array<Record<string, Value>>,
  event: RemoteChangeEvent,
): Array<Record<string, Value>> {
  switch (event.type) {
    case 'row.created':
      if (prev.some((r) => r.id === event.row.id)) return prev;
      return [...prev, { id: event.row.id, ...event.row.fields }];
    case 'row.updated':
      return prev.map((r) => (r.id === event.rowId ? { ...r, ...event.fields } : r));
    case 'row.deleted':
      return prev.filter((r) => r.id !== event.rowId);
    default:
      return prev;
  }
}

const TABS: Array<{ id: string; label: string; private?: boolean }> = [
  { id: 'editable', label: 'Editable' },
  { id: 'async-crud', label: 'Async CRUD' },
  { id: 'multiplayer', label: 'Multiplayer' },
  { id: 'height', label: 'Height Modes' },
  { id: 'columns', label: 'Column Options' },
  { id: 'empty', label: 'Empty Table' },
  { id: 'readonly', label: 'Read-Only' },
  { id: 'large', label: 'Large Dataset' },
  { id: 'pagination', label: 'Pagination' },
];

type TabId = string;

function App() {
  const [tab, setTab] = useState<TabId>('editable');
  const [log, setLog] = useState<string[]>([]);
  const [language, setLanguage] = useState('en');
  const [compactMode, setCompactMode] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [ghostGrid, setGhostGrid] = useState(true);
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [colorBy, setColorBy] = useState<string | null>(null);

  const locale = language === 'es' ? 'es-CO' : 'en-US';

  const handleSortChange = (fieldId: string | null, direction: 'asc' | 'desc' | null) => {
    setSortBy(fieldId);
    setSortDirection(direction);
    const msg = `[${new Date().toLocaleTimeString()}] Sort: ${fieldId ?? 'none'} ${direction ?? ''}`;
    setLog((prev) => [msg, ...prev].slice(0, 20));
  };

  const handleChange = (rows: Array<Record<string, Value>>) => {
    const msg = `[${new Date().toLocaleTimeString()}] ${rows.length} rows — last edit: ${JSON.stringify(rows[0])}`;
    setLog((prev) => [msg, ...prev].slice(0, 20));
  };

  return (
    <div>
      {/* Top bar: tabs + controls */}
      <div className="topbar">
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'tab-active' : ''}${t.private ? ' tab-private' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="controls">
          <label style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
          <label style={{ fontSize: '14px', color: '#374151', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />
            Compact
          </label>
          <label style={{ fontSize: '14px', color: '#374151', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={ghostGrid} onChange={(e) => setGhostGrid(e.target.checked)} />
            Ghost grid
          </label>
          <label style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Group:
            <select
              value={groupBy ?? ''}
              onChange={(e) => setGroupBy(e.target.value || null)}
              style={{ padding: '2px 6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="">None</option>
              <option value="Role">Role</option>
              <option value="Active">Active</option>
            </select>
          </label>
          <label style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Color:
            <select
              value={colorBy ?? ''}
              onChange={(e) => setColorBy(e.target.value || null)}
              style={{ padding: '2px 6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="">None</option>
              {COLUMNS
                .filter((c) => (['SingleSelect', 'MultiSelect', 'Boolean'] as string[]).includes(c.type as string))
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.id}</option>
                ))}
            </select>
          </label>
          {tab === 'editable' && (
            <>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                Sort: {sortBy ? `${sortBy} (${sortDirection})` : 'none'}
              </span>
              {sortBy && (
                <button
                  onClick={() => handleSortChange(null, null)}
                  style={{ padding: '4px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', color: '#374151' }}
                >
                  Clear sort
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab panels */}
      <div className="tab-panel">
        {tab === 'editable' && (
          <div className="example">
            <h2>Editable Table</h2>
            <div className="desc">Click cells to edit. Add/delete rows. Drag columns to reorder. Try the filter and search.</div>
            <div className="table-container">
              <MonkeyTable
                columns={COLUMNS}
                rows={INITIAL_ROWS}
                onChange={handleChange}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                ghostGrid={ghostGrid}
                height="100%"
                rowHeight="medium"
                showRowNumbers
                compactMode={compactMode}
                locale={locale}
                language={language}
                translations={language === 'en' ? CUSTOM_TRANSLATIONS : undefined}
                functions={CUSTOM_FUNCTIONS}
                constraints={CUSTOM_CONSTRAINTS}
                renderers={CUSTOM_RENDERERS}
                onUpload={async (file: File, _fieldType: string) => {
                  await new Promise(r => setTimeout(r, 1000));
                  return URL.createObjectURL(file);
                }}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                colorBy={colorBy}
                onColorByChange={setColorBy}
                selectionActions={(ids, clear) => (
                  <button
                    onClick={() => { alert(`Processing ${ids.length} rows: ${ids.join(', ')}`); clear(); }}
                    style={{
                      padding: '4px 8px',
                      background: '#dbeafe',
                      color: '#1d4ed8',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Process
                  </button>
                )}
              />
            </div>
            {log.length > 0 && (
              <div className="log">
                <pre>{log.join('\n')}</pre>
              </div>
            )}
          </div>
        )}

        {tab === 'height' && (
          <HeightModesExample locale={locale} language={language} compactMode={compactMode} />
        )}

        {tab === 'columns' && (
          <div className="example" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 200px)' }}>
            <h2>Column Options</h2>
            <div className="desc">
              Per-column <code>width</code>, <code>minWidth</code>, <code>maxWidth</code>, <code>align</code>, <code>editable</code>, and <code>sortable</code>.
              SKU and Stock are read-only. SKU is not sortable. Price and Stock are right/center-aligned.
            </div>
            <div className="table-container" style={{ flex: 1, height: 'auto' }}>
              <MonkeyTable
                columns={COLUMN_OPTIONS_COLUMNS}
                rows={COLUMN_OPTIONS_ROWS}
                ghostGrid={ghostGrid}
                height="100%"
                rowHeight="medium"
                showRowNumbers
                compactMode={compactMode}
                locale={locale}
                language={language}
              />
            </div>
          </div>
        )}

        {tab === 'empty' && (
          <EmptyTableExample locale={locale} language={language} ghostGrid={ghostGrid} compactMode={compactMode} />
        )}

        {tab === 'readonly' && (
          <div className="example">
            <h2>Read-Only Table</h2>
            <div className="desc">Set <code>editable=false</code> to display data without mutation controls.</div>
            <div className="table-container">
              <MonkeyTable
                columns={METRICS_COLUMNS}
                rows={METRICS_ROWS}
                editable={false}
                height="100%"
                rowHeight="short"
                locale={locale}
                language={language}
              />
            </div>
          </div>
        )}

        {tab === 'large' && (
          <LargeDatasetExample locale={locale} language={language} />
        )}

        {tab === 'pagination' && (
          <PaginationExample locale={locale} language={language} />
        )}

        {tab === 'async-crud' && (
          <AsyncCrudExample />
        )}

        {tab === 'multiplayer' && (
          <MultiplayerExample />
        )}

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
