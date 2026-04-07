/**
 * MonkeyTable — Browser Standalone Example
 *
 * Shows how to embed an editable table with no server.
 */

import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { MonkeyTable } from '@monkeytab/browser';
import type { Value } from '@monkeytab/browser';

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

const TABS = [
  { id: 'editable', label: 'Editable' },
  { id: 'columns', label: 'Column Options' },
  { id: 'empty', label: 'Empty Table' },
  { id: 'readonly', label: 'Read-Only' },
  { id: 'large', label: 'Large Dataset' },
  { id: 'pagination', label: 'Pagination' },
] as const;

type TabId = typeof TABS[number]['id'];

function App() {
  const [tab, setTab] = useState<TabId>('editable');
  const [log, setLog] = useState<string[]>([]);
  const [language, setLanguage] = useState('en');
  const [compactMode, setCompactMode] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [ghostGrid, setGhostGrid] = useState(true);

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
              className={`tab ${tab === t.id ? 'tab-active' : ''}`}
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
              />
            </div>
            {log.length > 0 && (
              <div className="log">
                <pre>{log.join('\n')}</pre>
              </div>
            )}
          </div>
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
