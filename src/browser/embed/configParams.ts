/**
 * Serialize / deserialize TableViewConfig to URL search params.
 *
 * Param format:
 *   table=cities
 *   cols=city&cols=country&cols=pop  (repeated params — safe for names with commas)
 *   sort=pop|desc                    (field|direction — pipe delimiter)
 *   filter=pop|gt|1000000            (field|op|value, repeatable, pipe delimiter)
 *   search=tokyo
 *   page=2
 *   rowHeight=short
 *   compact=true
 *   rowNumbers=true
 *   ghostGrid=true
 *   height=500
 *   toolbar=false
 *   showSearch=false
 *   showFilters=false
 *   locale=es-CO
 *   lang=es
 */

import type { TableViewConfig, EmbedFilter } from './TableViewConfig.ts';

// Pipe delimiter — safe for field names (which may contain colons or commas)
// and ISO timestamp values (which contain colons).
const DELIM = '|';

// ---------------------------------------------------------------------------
// Config → URL params
// ---------------------------------------------------------------------------

export function configToParams(config: TableViewConfig): URLSearchParams {
  const p = new URLSearchParams();

  if (config.table) p.set('table', config.table);

  // Repeated params — each column is its own cols= entry
  if (config.columns?.length) {
    for (const col of config.columns) {
      p.append('cols', col);
    }
  }

  if (config.sort) p.set('sort', `${config.sort.field}${DELIM}${config.sort.direction}`);
  if (config.search) p.set('search', config.search);
  if (config.page && config.page > 1) p.set('page', String(config.page));

  if (config.filters?.length) {
    for (const f of config.filters) {
      const parts = [f.field, f.operator];
      if (f.value !== undefined) parts.push(String(f.value));
      p.append('filter', parts.join(DELIM));
    }
  }

  if (config.rowHeight) p.set('rowHeight', config.rowHeight);
  if (config.compact !== undefined) p.set('compact', String(config.compact));
  if (config.rowNumbers !== undefined) p.set('rowNumbers', String(config.rowNumbers));
  if (config.ghostGrid !== undefined) p.set('ghostGrid', String(config.ghostGrid));
  if (config.height) p.set('height', String(config.height));

  if (config.toolbar !== undefined) p.set('toolbar', String(config.toolbar));
  if (config.showSearch !== undefined) p.set('showSearch', String(config.showSearch));
  if (config.showFilters !== undefined) p.set('showFilters', String(config.showFilters));

  if (config.locale) p.set('locale', config.locale);
  if (config.language) p.set('lang', config.language);

  return p;
}

// ---------------------------------------------------------------------------
// URL params → Config
// ---------------------------------------------------------------------------

export function paramsToConfig(params: URLSearchParams): TableViewConfig {
  const config: TableViewConfig = {};

  const table = params.get('table');
  if (table) config.table = table;

  // Repeated params — collect all cols= entries
  const cols = params.getAll('cols');
  if (cols.length) config.columns = cols.map((s) => s.trim()).filter(Boolean);

  const sort = params.get('sort');
  if (sort) {
    const idx = sort.lastIndexOf(DELIM);
    if (idx !== -1) {
      const field = sort.slice(0, idx);
      const dir = sort.slice(idx + 1);
      if (field && (dir === 'asc' || dir === 'desc')) {
        config.sort = { field, direction: dir };
      }
    }
  }

  const search = params.get('search');
  if (search) config.search = search;

  const page = params.get('page');
  if (page) {
    const n = parseInt(page, 10);
    if (n > 0) config.page = n;
  }

  const filters = params.getAll('filter');
  if (filters.length) {
    config.filters = filters.map(parseFilterParam).filter(Boolean) as EmbedFilter[];
  }

  const rowHeight = params.get('rowHeight');
  if (rowHeight && ['short', 'medium', 'tall', 'extra-tall', 'fit'].includes(rowHeight)) {
    config.rowHeight = rowHeight as TableViewConfig['rowHeight'];
  }

  config.compact = parseBool(params, 'compact');
  config.rowNumbers = parseBool(params, 'rowNumbers');
  config.ghostGrid = parseBool(params, 'ghostGrid');
  config.toolbar = parseBool(params, 'toolbar');
  config.showSearch = parseBool(params, 'showSearch');
  config.showFilters = parseBool(params, 'showFilters');

  const height = params.get('height');
  if (height) {
    const n = parseInt(height, 10);
    if (n > 0) config.height = n;
  }

  const locale = params.get('locale');
  if (locale) config.locale = locale;

  const lang = params.get('lang');
  if (lang) config.language = lang;

  return config;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseBool(params: URLSearchParams, key: string): boolean | undefined {
  const v = params.get(key);
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return undefined;
}

const VALID_OPS = new Set([
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
  'contains', 'not_contains', 'is_empty', 'is_not_empty',
]);

function parseFilterParam(raw: string): EmbedFilter | null {
  // format: field|operator or field|operator|value
  // Split on first two pipes only — value may contain pipes
  const idx1 = raw.indexOf(DELIM);
  if (idx1 === -1) return null;
  const field = raw.slice(0, idx1);

  const rest = raw.slice(idx1 + 1);
  const idx2 = rest.indexOf(DELIM);

  let operator: string;
  let value: string | number | boolean | undefined;

  if (idx2 === -1) {
    operator = rest;
  } else {
    operator = rest.slice(0, idx2);
    const rawValue = rest.slice(idx2 + 1);
    // Parse typed values
    if (rawValue === 'true') value = true;
    else if (rawValue === 'false') value = false;
    else if (rawValue !== '' && !isNaN(Number(rawValue))) value = Number(rawValue);
    else value = rawValue;
  }

  if (!field || !VALID_OPS.has(operator)) return null;
  return { field, operator: operator as EmbedFilter['operator'], value };
}
