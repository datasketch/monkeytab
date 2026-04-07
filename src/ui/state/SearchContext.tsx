import { createContext, useContext } from 'react';

const SearchContext = createContext<string>('');

export const SearchProvider = SearchContext.Provider;

/** Returns the current search query (empty string if none). */
export function useSearchQuery(): string {
  return useContext(SearchContext);
}

/**
 * Check if a cell value matches the current search query.
 * Mirrors the logic in core/query-utils.ts applySearch().
 */
export function cellMatchesSearch(value: unknown, query: string): boolean {
  if (!query) return false;
  const term = query.toLowerCase();
  if (value == null) return false;
  if (typeof value === 'string') return value.toLowerCase().includes(term);
  if (typeof value === 'number') return String(value).includes(term);
  if (typeof value === 'boolean') return String(value).toLowerCase().includes(term);
  if (Array.isArray(value)) return value.some((v) => cellMatchesSearch(v, query));
  if (typeof value === 'object' && 'url' in value) {
    const link = value as { url: string; label?: string };
    return link.url.toLowerCase().includes(term) || (link.label?.toLowerCase().includes(term) ?? false);
  }
  return false;
}
