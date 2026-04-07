/**
 * Shared in-memory query helpers.
 * Used by MemoryAdapter, JsonAdapter, CsvAdapter, and any other adapter
 * that keeps rows in memory.
 */

import type { Row, Value, Pagination } from './types.ts';
import type { FilterGroup, FilterCondition } from './client.ts';

// =============================================================================
// Filter
// =============================================================================

export function applyFilter(rows: Row[], filter: FilterGroup): Row[] {
  return rows.filter((row) => {
    const results = filter.conditions.map((cond) => {
      if ('conjunction' in cond) {
        return applyFilter([row], cond as FilterGroup).length > 0;
      }
      return evaluateCondition(row, cond as FilterCondition);
    });

    return filter.conjunction === 'and'
      ? results.every(Boolean)
      : results.some(Boolean);
  });
}

function evaluateCondition(row: Row, cond: FilterCondition): boolean {
  const value = row.fields[cond.fieldId];

  switch (cond.operator) {
    case 'is_empty':
      return value == null || value === '' || (Array.isArray(value) && value.length === 0);
    case 'is_not_empty':
      return value != null && value !== '' && !(Array.isArray(value) && value.length === 0);

    case 'eq':
      return value === cond.value;
    case 'neq':
      return value !== cond.value;

    case 'lt':
      return typeof value === 'number' && typeof cond.value === 'number' && value < cond.value;
    case 'lte':
      return typeof value === 'number' && typeof cond.value === 'number' && value <= cond.value;
    case 'gt':
      return typeof value === 'number' && typeof cond.value === 'number' && value > cond.value;
    case 'gte':
      return typeof value === 'number' && typeof cond.value === 'number' && value >= cond.value;

    case 'contains':
      return typeof value === 'string' && typeof cond.value === 'string' && value.toLowerCase().includes(cond.value.toLowerCase());
    case 'does_not_contain':
      return typeof value === 'string' && typeof cond.value === 'string' && !value.toLowerCase().includes(cond.value.toLowerCase());
    case 'starts_with':
      return typeof value === 'string' && typeof cond.value === 'string' && value.toLowerCase().startsWith(cond.value.toLowerCase());
    case 'ends_with':
      return typeof value === 'string' && typeof cond.value === 'string' && value.toLowerCase().endsWith(cond.value.toLowerCase());

    case 'is_any_of':
      return Array.isArray(cond.value) && (cond.value as string[]).includes(value as string);
    case 'is_none_of':
      return Array.isArray(cond.value) && !(cond.value as string[]).includes(value as string);

    case 'has_any_of': {
      const arr = value as string[];
      const targets = cond.value as string[];
      return Array.isArray(value) && Array.isArray(cond.value) && targets.some((v) => arr.includes(v));
    }
    case 'has_all_of': {
      const arr = value as string[];
      const targets = cond.value as string[];
      return Array.isArray(value) && Array.isArray(cond.value) && targets.every((v) => arr.includes(v));
    }
    case 'has_none_of': {
      const arr = value as string[];
      const targets = cond.value as string[];
      return Array.isArray(value) && Array.isArray(cond.value) && !targets.some((v) => arr.includes(v));
    }

    default:
      return true;
  }
}

// =============================================================================
// Search
// =============================================================================

export function applySearch(rows: Row[], search: string): Row[] {
  const term = search.toLowerCase();
  return rows.filter((row) =>
    Object.values(row.fields).some((v) => {
      if (v == null) return false;
      if (typeof v === 'string') return v.toLowerCase().includes(term);
      if (typeof v === 'number') return String(v).includes(term);
      return false;
    })
  );
}

// =============================================================================
// Sort
// =============================================================================

import type { SortSpec } from './client.ts';

export function applySort(rows: Row[], sort: SortSpec[]): Row[] {
  return [...rows].sort((a, b) => {
    for (const spec of sort) {
      const av = a.fields[spec.fieldId];
      const bv = b.fields[spec.fieldId];
      const cmp = compareValues(av, bv);
      if (cmp !== 0) return spec.direction === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}

export function compareValues(a: Value, b: Value): number {
  // nulls sort last
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return (a ? 1 : 0) - (b ? 1 : 0);
  }

  // fallback: convert to string
  return String(a).localeCompare(String(b));
}

// =============================================================================
// Pagination
// =============================================================================

export function applyPagination(
  rows: Row[],
  offset: number,
  limit: number,
): { rows: Row[]; pagination: Pagination } {
  const total = rows.length;
  const paginatedRows = rows.slice(offset, offset + limit);
  return {
    rows: paginatedRows,
    pagination: {
      offset,
      limit,
      total,
      hasMore: offset + limit < total,
    },
  };
}
