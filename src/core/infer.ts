/**
 * Type inference utility for MonkeyTab.
 * Infers field types from raw row data. Used by CSV and JSON adapters
 * when importing data without an existing schema.
 */

import type { FieldType, FieldOptions, SelectOption } from './types.ts';

export interface InferredField {
  label: string;
  type: FieldType;
  options?: FieldOptions;
}

const SELECT_COLORS = [
  '#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0', '#f3e5f5',
  '#e0f7fa', '#fff9c4', '#fbe9e7', '#e8eaf6', '#f1f8e9',
  '#ede7f6', '#e0f2f1', '#fff8e1', '#ffebee', '#e1f5fe',
  '#f9fbe7', '#fce4ec', '#e0e0e0', '#efebe9', '#eceff1',
];

/**
 * Infer field types from an array of raw row objects.
 * Samples up to `sampleSize` rows (default 100).
 */
export function inferFields(
  rows: Record<string, unknown>[],
  options?: { sampleSize?: number },
): InferredField[] {
  if (rows.length === 0) return [];

  const sampleSize = options?.sampleSize ?? 100;
  const sample = rows.slice(0, sampleSize);

  // Collect all column names preserving first-seen order
  const columnNames: string[] = [];
  const seen = new Set<string>();
  for (const row of sample) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columnNames.push(key);
      }
    }
  }

  return columnNames.map((colName) => {
    const values = sample
      .map((row) => row[colName])
      .filter((v) => v != null && v !== '');

    if (values.length === 0) {
      return { label: colName, type: 'Text' as FieldType };
    }

    // Check boolean-like
    if (isBoolean(values)) {
      return { label: colName, type: 'Boolean' as FieldType };
    }

    // Check date
    if (isDate(values)) {
      return { label: colName, type: 'Date' as FieldType };
    }

    // Check number
    if (isNumber(values)) {
      return { label: colName, type: 'Number' as FieldType };
    }

    // Check SingleSelect: small unique set
    const stringValues = values.map(String);
    const unique = new Set(stringValues);
    if (unique.size < 20 && unique.size < stringValues.length * 0.5) {
      const selectOptions: SelectOption[] = Array.from(unique).map((val, i) => ({
        value: val,
        label: val,
        color: SELECT_COLORS[i % SELECT_COLORS.length],
      }));
      return {
        label: colName,
        type: 'SingleSelect' as FieldType,
        options: { options: selectOptions },
      };
    }

    return { label: colName, type: 'Text' as FieldType };
  });
}

const BOOLEAN_TRUE = new Set(['true', 'yes', '1']);
const BOOLEAN_FALSE = new Set(['false', 'no', '0']);

function isBoolean(values: unknown[]): boolean {
  return values.every((v) => {
    if (typeof v === 'boolean') return true;
    if (typeof v === 'number') return v === 0 || v === 1;
    if (typeof v === 'string') {
      const lower = v.toLowerCase();
      return BOOLEAN_TRUE.has(lower) || BOOLEAN_FALSE.has(lower);
    }
    return false;
  });
}

// ISO 8601 date pattern: YYYY-MM-DD with optional time component
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

function isDate(values: unknown[]): boolean {
  return values.every((v) => {
    if (typeof v !== 'string') return false;
    if (!ISO_DATE_REGEX.test(v)) return false;
    const d = new Date(v);
    return !isNaN(d.getTime());
  });
}

function isNumber(values: unknown[]): boolean {
  return values.every((v) => {
    if (typeof v === 'number') return true;
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed === '') return false;
      return !isNaN(Number(trimmed));
    }
    return false;
  });
}
