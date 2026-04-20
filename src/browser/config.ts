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

// =============================================================================
// Column color rules (JSON-serializable conditional formatting)
// =============================================================================

/** One condition inside a color rule. Compares the cell value — or another
 *  field's value if `field` is set — against the condition operator.
 *  First rule whose condition matches wins; no rules match = no color. */
export type ColorCondition =
  /** Strict equality (===). Use for string / number / boolean comparisons. */
  | { op: 'equals'; value: unknown; field?: string }
  /** Strict inequality (!==). */
  | { op: 'notEquals'; value: unknown; field?: string }
  /** Numeric less-than. Non-numeric values never match. */
  | { op: 'lt'; value: number; field?: string }
  /** Numeric less-than-or-equal. */
  | { op: 'lte'; value: number; field?: string }
  /** Numeric greater-than. */
  | { op: 'gt'; value: number; field?: string }
  /** Numeric greater-than-or-equal. */
  | { op: 'gte'; value: number; field?: string }
  /** Substring match (case-insensitive) on string cells. */
  | { op: 'contains'; value: string; field?: string }
  /** Inverse of `contains`. */
  | { op: 'notContains'; value: string; field?: string }
  /** Value is null, undefined, empty string, or empty array. */
  | { op: 'empty'; field?: string }
  /** Value is present (inverse of `empty`). */
  | { op: 'notEmpty'; field?: string }
  /** Value strictly-equals one of the provided options. */
  | { op: 'in'; values: unknown[]; field?: string }
  /** Value does not strictly-equal any of the provided options. */
  | { op: 'notIn'; values: unknown[]; field?: string };

/** A single conditional-formatting rule: when this condition matches, tint
 *  the cell with this color. Rules evaluate top-down — first match wins. */
export interface ColorRule {
  when: ColorCondition;
  color: string;
}

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === 'string' && v === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function evaluateCondition(
  cond: ColorCondition,
  row: Record<string, Value>,
  cellValue: Value,
): boolean {
  const target: unknown = cond.field ? row[cond.field] ?? null : cellValue;
  switch (cond.op) {
    case 'equals': return target === cond.value;
    case 'notEquals': return target !== cond.value;
    case 'lt': return typeof target === 'number' && target < cond.value;
    case 'lte': return typeof target === 'number' && target <= cond.value;
    case 'gt': return typeof target === 'number' && target > cond.value;
    case 'gte': return typeof target === 'number' && target >= cond.value;
    case 'contains':
      return typeof target === 'string' && target.toLowerCase().includes(cond.value.toLowerCase());
    case 'notContains':
      return typeof target !== 'string' || !target.toLowerCase().includes(cond.value.toLowerCase());
    case 'empty': return isEmpty(target);
    case 'notEmpty': return !isEmpty(target);
    case 'in': return cond.values.includes(target);
    case 'notIn': return !cond.values.includes(target);
  }
}

/** Run a rule array top-down against a cell. Returns the first matching
 *  rule's color, or undefined when no rule matches. Safe to call with an
 *  empty or missing array — returns undefined. */
export function evaluateColorRules(
  rules: ColorRule[] | undefined | null,
  row: Record<string, Value>,
  value: Value,
): string | undefined {
  if (!rules || rules.length === 0) return undefined;
  for (const rule of rules) {
    if (evaluateCondition(rule.when, row, value)) return rule.color;
  }
  return undefined;
}

/**
 * Column shape the config supports. Drops the non-serializable fields
 * (`render`, `icon`) and narrows `color` to the JSON-safe forms (static
 * string or rule array) — the rest survives a JSON round-trip.
 */
export type MonkeyTableConfigColumn = Omit<MonkeyTableColumn, 'render' | 'icon' | 'color'> & {
  id: string;
  type?: FieldType;
  options?: FieldOptions;
  /** Column color — JSON-safe forms only:
   *  - `string` — static whole-column + header tint.
   *  - `ColorRule[]` — top-down list of `{ when, color }` rules; first match wins.
   *    Header stays default in this mode (same as the function form on the prop API).
   *  For fully-custom conditional logic, use the function form of `column.color`
   *  on `<MonkeyTable>` directly — functions aren't JSON-serializable. */
  color?: string | ColorRule[];
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
