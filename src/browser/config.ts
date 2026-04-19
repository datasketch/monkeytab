/**
 * Config-driven MonkeyTable — flat JSON description of a full table.
 *
 * One config object → one working table. The shape mirrors MonkeyTable's
 * existing props 1:1; everything that can be JSON-serialized lives here, and
 * non-serializable pieces (React handlers, custom renderers, presence, etc.)
 * stay on the component wrapper.
 *
 * Usage:
 *   const config: MonkeyTableConfig = {
 *     columns: [{ id: 'Name' }, { id: 'Age', type: 'Number' }],
 *     rows: [{ Name: 'Alice', Age: 30 }],
 *     settings: { editable: true, height: 'auto' },
 *   };
 *   <MonkeyTableFromConfig config={config} onChange={handle} />
 */
import type { FieldType, FieldOptions, Value } from '@monkeytab/core';
import type { I18nStrings } from '../ui/i18n/index.ts';
import type { RowHeightOption } from '../ui/components/grid/Grid.tsx';
import type { TextPopupSize } from '../ui/components/editors/TextPopupContext.tsx';
import type { MonkeyTableColumn, MonkeyTableProps } from './MonkeyTable.tsx';

/**
 * Column shape the config supports. Drops the two non-serializable fields
 * (`render`, `icon`) from MonkeyTableColumn — the rest survives JSON round-trip.
 */
export type MonkeyTableConfigColumn = Omit<MonkeyTableColumn, 'render' | 'icon'> & {
  id: string;
  type?: FieldType;
  options?: FieldOptions;
};

/**
 * All scalar / enum props grouped into one bucket so consumers have a single
 * place to put "how should this table behave" settings. Keys mirror
 * MonkeyTableProps exactly — no renames, no nesting beyond what already exists.
 */
export interface MonkeyTableConfigSettings {
  // Row identity (function form is excluded — JSON only)
  rowKey?: string;

  // Grouping
  groupBy?: string | null;
  groupCollapsed?: boolean;
  groupOrder?: 'auto' | 'asc' | 'desc' | 'count-asc' | 'count-desc' | string[];

  // Row coloring
  colorBy?: string | null;
  colorByMap?: Record<string, string>;

  // Sorting (static / initial — the live callback is a runtime prop)
  sortBy?: string | null;
  sortDirection?: 'asc' | 'desc' | null;

  // Pagination
  totalRows?: number;
  page?: number;
  pageSize?: number;
  paginationMode?: 'simple' | 'load-more';
  paginationLoading?: boolean;

  // Layout
  ghostGrid?: boolean | { rows?: number; columns?: number };
  height?: 'auto' | number | string;
  maxHeight?: number;
  columnFit?: 'auto' | 'fill' | 'fixed';
  autoFitMin?: number;
  autoFitMax?: number;
  rowHeight?: RowHeightOption;
  showRowNumbers?: boolean;
  compactMode?: boolean;

  // Permissions
  editable?: boolean;
  allowCreateField?: boolean;
  allowDeleteField?: boolean;
  allowCreateRecord?: boolean;
  allowColumnReorder?: boolean;
  allowMultiColumnDrag?: boolean;
  confirmBeforeDelete?: boolean;

  // Toolbar
  showToolbar?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showRowHeightControl?: boolean;
  showRowNumbersControl?: boolean;
  showAddRowButton?: boolean;

  // Locale
  locale?: string;
  language?: string;
  dateDisplayFormat?: 'iso' | 'locale' | 'relative';
  numberDecimalPlaces?: number;
  numberThousandsSeparator?: boolean;
  currencyCode?: string;
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';

  // Translations
  translations?: Partial<I18nStrings>;

  // Advanced (serializable subset)
  functionsEndpoint?: string | null;
  textPopup?: TextPopupSize;

  // Controlled selection + UI bits
  selectedRowIds?: string[];
  errorToast?: boolean;
  showCellSaveStatus?: boolean;
}

/**
 * A fully-serializable MonkeyTable description. Round-trips through JSON.
 */
export interface MonkeyTableConfig {
  /** Optional version stamp — reserved for future migrators. */
  schemaVersion?: number;
  columns: MonkeyTableConfigColumn[];
  rows: Array<Record<string, Value>>;
  settings?: MonkeyTableConfigSettings;
}

/**
 * The subset of MonkeyTableProps that a config can produce. Used as the return
 * type of `resolveConfig` and as a key-set for runtime-prop extraction.
 */
export type ResolvedConfigProps =
  & Pick<MonkeyTableProps, 'columns' | 'rows'>
  & MonkeyTableConfigSettings;

/**
 * Turn a MonkeyTableConfig into the flat prop object MonkeyTable already
 * consumes. Pure function — no React, no side effects, safe to call anywhere.
 */
export function resolveConfig(config: MonkeyTableConfig): ResolvedConfigProps {
  const { columns, rows, settings } = config;
  return {
    columns,
    rows,
    ...(settings ?? {}),
  };
}
