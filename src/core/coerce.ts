/**
 * Field type coercion module for MonkeyTab.
 * Handles conversion of values when changing field types.
 */

import type { FieldType, Value, Row, SelectOption } from './types.ts';

// Reuse boolean detection patterns from infer.ts
const BOOLEAN_TRUE = new Set(['true', 'yes', '1']);
const BOOLEAN_FALSE = new Set(['false', 'no', '0']);
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

const SELECT_COLORS = [
  '#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0', '#f3e5f5',
  '#e0f7fa', '#fff9c4', '#fbe9e7', '#e8eaf6', '#f1f8e9',
];

export interface CoercionResult {
  value: Value;
  lossless: boolean;
}

export interface TypeChangeValidation {
  compatible: number;
  incompatible: number;
  total: number;
  warnings: string[];
  samples: Array<{
    rowId: string;
    currentValue: Value;
    convertedValue: Value;
    lossless: boolean;
  }>;
}

/**
 * Coerce a single value from one field type to another.
 */
export function coerceValue(value: Value, fromType: FieldType, toType: FieldType): CoercionResult {
  // Same type — no conversion needed
  if (fromType === toType) return { value, lossless: true };

  // Null/empty values convert to null
  if (value === null || value === undefined) return { value: null, lossless: true };

  // Dispatch based on target type
  switch (toType) {
    case 'Text':
      return toText(value, fromType);
    case 'Number':
      return toNumber(value, fromType);
    case 'Boolean':
      return toBoolean(value, fromType);
    case 'Date':
      return toDate(value, fromType);
    case 'SingleSelect':
      return toSingleSelect(value, fromType);
    case 'MultiSelect':
      return toMultiSelect(value, fromType);
    default:
      // Attachment, Image, and other types — null with warning
      return { value: null, lossless: false };
  }
}

/**
 * Validate a type change across all rows, returning compatibility stats and samples.
 */
export function validateTypeChange(
  rows: Row[],
  fieldId: string,
  fromType: FieldType,
  toType: FieldType,
): TypeChangeValidation {
  let compatible = 0;
  let incompatible = 0;
  const warnings: string[] = [];
  const samples: TypeChangeValidation['samples'] = [];
  const maxSamples = 5;

  for (const row of rows) {
    const currentValue = row.fields[fieldId] ?? null;

    // Skip null/empty — always compatible
    if (currentValue === null || currentValue === undefined || currentValue === '') {
      compatible++;
      continue;
    }

    const result = coerceValue(currentValue, fromType, toType);
    if (result.lossless) {
      compatible++;
    } else if (result.value !== null) {
      compatible++; // Converted but with some loss
      if (samples.length < maxSamples) {
        samples.push({
          rowId: row.id,
          currentValue,
          convertedValue: result.value,
          lossless: false,
        });
      }
    } else {
      incompatible++;
      if (samples.length < maxSamples) {
        samples.push({
          rowId: row.id,
          currentValue,
          convertedValue: null,
          lossless: false,
        });
      }
    }
  }

  if (incompatible > 0) {
    warnings.push(`${incompatible} value(s) cannot be converted and will be set to empty.`);
  }

  const lossySamples = samples.filter((s) => !s.lossless && s.convertedValue !== null);
  if (lossySamples.length > 0) {
    warnings.push(`Some values will be approximated during conversion.`);
  }

  return {
    compatible,
    incompatible,
    total: rows.length,
    warnings,
    samples,
  };
}

/**
 * Generate SingleSelect options from a set of string values.
 */
export function generateSelectOptions(values: Set<string>): SelectOption[] {
  return Array.from(values).map((val, i) => ({
    value: val,
    label: val,
    color: SELECT_COLORS[i % SELECT_COLORS.length],
  }));
}

// =============================================================================
// Conversion functions
// =============================================================================

function toText(value: Value, fromType: FieldType): CoercionResult {
  switch (fromType) {
    case 'Number':
      return { value: String(value), lossless: true };
    case 'Boolean':
      return { value: value ? 'true' : 'false', lossless: true };
    case 'Date':
      return { value: String(value), lossless: true };
    case 'SingleSelect':
      return { value: String(value), lossless: true };
    case 'MultiSelect':
      if (Array.isArray(value)) {
        return { value: (value as string[]).join(', '), lossless: false };
      }
      return { value: String(value), lossless: true };
    default:
      return { value: value !== null ? String(value) : null, lossless: value !== null };
  }
}

function toNumber(value: Value, fromType: FieldType): CoercionResult {
  switch (fromType) {
    case 'Text': {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return { value: null, lossless: true };
        const num = Number(trimmed);
        if (!isNaN(num)) return { value: num, lossless: true };
        return { value: null, lossless: false };
      }
      return { value: null, lossless: false };
    }
    case 'Boolean':
      return { value: value ? 1 : 0, lossless: true };
    case 'Date': {
      if (typeof value === 'string') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return { value: d.getTime(), lossless: false };
      }
      return { value: null, lossless: false };
    }
    case 'SingleSelect': {
      if (typeof value === 'string') {
        const num = Number(value);
        if (!isNaN(num)) return { value: num, lossless: true };
      }
      return { value: null, lossless: false };
    }
    default:
      return { value: null, lossless: false };
  }
}

function toBoolean(value: Value, fromType: FieldType): CoercionResult {
  switch (fromType) {
    case 'Text': {
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (BOOLEAN_TRUE.has(lower)) return { value: true, lossless: true };
        if (BOOLEAN_FALSE.has(lower)) return { value: false, lossless: true };
        if (lower === '') return { value: null, lossless: true };
        // Non-empty string that isn't boolean-like → truthy
        return { value: true, lossless: false };
      }
      return { value: null, lossless: false };
    }
    case 'Number':
      return { value: value !== 0, lossless: true };
    case 'Date':
      // Has date → true, else false
      return { value: value !== null, lossless: false };
    case 'SingleSelect':
      return { value: value !== null && value !== '', lossless: false };
    default:
      return { value: null, lossless: false };
  }
}

function toDate(value: Value, fromType: FieldType): CoercionResult {
  switch (fromType) {
    case 'Text': {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return { value: null, lossless: true };
        if (ISO_DATE_REGEX.test(trimmed)) {
          const d = new Date(trimmed);
          if (!isNaN(d.getTime())) return { value: d.toISOString(), lossless: true };
        }
        // Try more lenient parsing
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return { value: d.toISOString(), lossless: false };
        return { value: null, lossless: false };
      }
      return { value: null, lossless: false };
    }
    case 'Number': {
      // Treat as timestamp
      if (typeof value === 'number') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return { value: d.toISOString(), lossless: false };
      }
      return { value: null, lossless: false };
    }
    default:
      return { value: null, lossless: false };
  }
}

function toSingleSelect(value: Value, fromType: FieldType): CoercionResult {
  switch (fromType) {
    case 'Text':
    case 'Number':
    case 'Date':
      return { value: String(value), lossless: true };
    case 'Boolean':
      return { value: value ? 'true' : 'false', lossless: true };
    case 'MultiSelect':
      if (Array.isArray(value) && value.length > 0) {
        return { value: (value as string[])[0], lossless: value.length === 1 };
      }
      return { value: null, lossless: true };
    default:
      return { value: null, lossless: false };
  }
}

function toMultiSelect(value: Value, fromType: FieldType): CoercionResult {
  switch (fromType) {
    case 'Text': {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return { value: [], lossless: true };
        // Split by comma
        return { value: trimmed.split(',').map((s) => s.trim()).filter(Boolean), lossless: false };
      }
      return { value: [], lossless: false };
    }
    case 'SingleSelect':
      if (value !== null && value !== '') {
        return { value: [String(value)], lossless: true };
      }
      return { value: [], lossless: true };
    case 'Number':
    case 'Boolean':
    case 'Date':
      return { value: [String(value)], lossless: false };
    default:
      return { value: [], lossless: false };
  }
}
