/**
 * Built-in functions registry for computed fields.
 * Each function takes input values and optional params, returns a computed Value.
 */

import type { FieldType, Value } from './types.ts';

export interface FunctionDef {
  name: string;
  category: 'text' | 'number' | 'date' | 'logic';
  description: string;
  inputTypes: FieldType[];
  params?: Array<{ name: string; type: string; default?: unknown }>;
  compute: (inputs: Value[], params?: Record<string, unknown>) => Value;
}

// =============================================================================
// Text Functions
// =============================================================================

const toUpperCase: FunctionDef = {
  name: 'toUpperCase',
  category: 'text',
  description: 'Convert text to UPPER CASE',
  inputTypes: ['Text'],
  compute: ([val]) => (typeof val === 'string' ? val.toUpperCase() : val),
};

const toLowerCase: FunctionDef = {
  name: 'toLowerCase',
  category: 'text',
  description: 'Convert text to lower case',
  inputTypes: ['Text'],
  compute: ([val]) => (typeof val === 'string' ? val.toLowerCase() : val),
};

const toTitleCase: FunctionDef = {
  name: 'toTitleCase',
  category: 'text',
  description: 'Convert text to Title Case',
  inputTypes: ['Text'],
  compute: ([val]) => {
    if (typeof val !== 'string') return val;
    return val.replace(/\b\w/g, (c) => c.toUpperCase());
  },
};

const trim: FunctionDef = {
  name: 'trim',
  category: 'text',
  description: 'Remove leading and trailing whitespace',
  inputTypes: ['Text'],
  compute: ([val]) => (typeof val === 'string' ? val.trim() : val),
};

const concat: FunctionDef = {
  name: 'concat',
  category: 'text',
  description: 'Join multiple values into one text string',
  inputTypes: ['Text', 'Text'],
  params: [{ name: 'separator', type: 'string', default: '' }],
  compute: (inputs, params) => {
    const sep = String(params?.separator ?? '');
    return inputs
      .map((v) => (v === null || v === undefined ? '' : String(v)))
      .join(sep);
  },
};

const left: FunctionDef = {
  name: 'left',
  category: 'text',
  description: 'Get the first N characters',
  inputTypes: ['Text'],
  params: [{ name: 'count', type: 'number', default: 1 }],
  compute: ([val], params) => {
    if (typeof val !== 'string') return val;
    const count = Number(params?.count ?? 1);
    return val.slice(0, count);
  },
};

const right: FunctionDef = {
  name: 'right',
  category: 'text',
  description: 'Get the last N characters',
  inputTypes: ['Text'],
  params: [{ name: 'count', type: 'number', default: 1 }],
  compute: ([val], params) => {
    if (typeof val !== 'string') return val;
    const count = Number(params?.count ?? 1);
    return val.slice(-count);
  },
};

const replace: FunctionDef = {
  name: 'replace',
  category: 'text',
  description: 'Replace occurrences of a pattern',
  inputTypes: ['Text'],
  params: [
    { name: 'find', type: 'string', default: '' },
    { name: 'replacement', type: 'string', default: '' },
  ],
  compute: ([val], params) => {
    if (typeof val !== 'string') return val;
    const find = String(params?.find ?? '');
    const replacement = String(params?.replacement ?? '');
    return val.replaceAll(find, replacement);
  },
};

const template: FunctionDef = {
  name: 'template',
  category: 'text',
  description: 'Format values using a template string (use {0}, {1}, etc.)',
  inputTypes: ['Text'],
  params: [{ name: 'template', type: 'string', default: '{0}' }],
  compute: (inputs, params) => {
    let tmpl = String(params?.template ?? '{0}');
    for (let i = 0; i < inputs.length; i++) {
      tmpl = tmpl.replaceAll(`{${i}}`, inputs[i] === null ? '' : String(inputs[i]));
    }
    return tmpl;
  },
};

// =============================================================================
// Number Functions
// =============================================================================

const add: FunctionDef = {
  name: 'add',
  category: 'number',
  description: 'Add two numbers',
  inputTypes: ['Number', 'Number'],
  compute: ([a, b]) => {
    const na = typeof a === 'number' ? a : Number(a);
    const nb = typeof b === 'number' ? b : Number(b);
    if (isNaN(na) || isNaN(nb)) return null;
    return na + nb;
  },
};

const subtract: FunctionDef = {
  name: 'subtract',
  category: 'number',
  description: 'Subtract second number from first',
  inputTypes: ['Number', 'Number'],
  compute: ([a, b]) => {
    const na = typeof a === 'number' ? a : Number(a);
    const nb = typeof b === 'number' ? b : Number(b);
    if (isNaN(na) || isNaN(nb)) return null;
    return na - nb;
  },
};

const multiply: FunctionDef = {
  name: 'multiply',
  category: 'number',
  description: 'Multiply two numbers',
  inputTypes: ['Number', 'Number'],
  compute: ([a, b]) => {
    const na = typeof a === 'number' ? a : Number(a);
    const nb = typeof b === 'number' ? b : Number(b);
    if (isNaN(na) || isNaN(nb)) return null;
    return na * nb;
  },
};

const divide: FunctionDef = {
  name: 'divide',
  category: 'number',
  description: 'Divide first number by second',
  inputTypes: ['Number', 'Number'],
  compute: ([a, b]) => {
    const na = typeof a === 'number' ? a : Number(a);
    const nb = typeof b === 'number' ? b : Number(b);
    if (isNaN(na) || isNaN(nb) || nb === 0) return null;
    return na / nb;
  },
};

const round: FunctionDef = {
  name: 'round',
  category: 'number',
  description: 'Round a number to N decimal places',
  inputTypes: ['Number'],
  params: [{ name: 'decimals', type: 'number', default: 0 }],
  compute: ([val], params) => {
    const n = typeof val === 'number' ? val : Number(val);
    if (isNaN(n)) return null;
    const decimals = Number(params?.decimals ?? 0);
    const factor = Math.pow(10, decimals);
    return Math.round(n * factor) / factor;
  },
};

const abs: FunctionDef = {
  name: 'abs',
  category: 'number',
  description: 'Absolute value of a number',
  inputTypes: ['Number'],
  compute: ([val]) => {
    const n = typeof val === 'number' ? val : Number(val);
    if (isNaN(n)) return null;
    return Math.abs(n);
  },
};

const textToNumber: FunctionDef = {
  name: 'textToNumber',
  category: 'number',
  description: 'Convert text to a number',
  inputTypes: ['Text'],
  compute: ([val]) => {
    if (val === null || val === undefined) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  },
};

// =============================================================================
// Date Functions
// =============================================================================

const formatDate: FunctionDef = {
  name: 'formatDate',
  category: 'date',
  description: 'Format a date value as text',
  inputTypes: ['Date'],
  params: [{ name: 'format', type: 'string', default: 'iso' }],
  compute: ([val], params) => {
    if (typeof val !== 'string') return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    const fmt = String(params?.format ?? 'iso');
    switch (fmt) {
      case 'iso':
        return d.toISOString().split('T')[0];
      case 'locale':
        return d.toLocaleDateString();
      case 'datetime':
        return d.toISOString();
      default:
        return d.toISOString().split('T')[0];
    }
  },
};

const year: FunctionDef = {
  name: 'year',
  category: 'date',
  description: 'Extract the year from a date',
  inputTypes: ['Date'],
  compute: ([val]) => {
    if (typeof val !== 'string') return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.getFullYear();
  },
};

const month: FunctionDef = {
  name: 'month',
  category: 'date',
  description: 'Extract the month from a date (1-12)',
  inputTypes: ['Date'],
  compute: ([val]) => {
    if (typeof val !== 'string') return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.getMonth() + 1;
  },
};

const daysBetween: FunctionDef = {
  name: 'daysBetween',
  category: 'date',
  description: 'Number of days between two dates',
  inputTypes: ['Date', 'Date'],
  compute: ([a, b]) => {
    if (typeof a !== 'string' || typeof b !== 'string') return null;
    const da = new Date(a);
    const db = new Date(b);
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
    return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
  },
};

const addDays: FunctionDef = {
  name: 'addDays',
  category: 'date',
  description: 'Add N days to a date',
  inputTypes: ['Date'],
  params: [{ name: 'days', type: 'number', default: 0 }],
  compute: ([val], params) => {
    if (typeof val !== 'string') return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    const days = Number(params?.days ?? 0);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  },
};

const now: FunctionDef = {
  name: 'now',
  category: 'date',
  description: 'Current date and time',
  inputTypes: [],
  compute: () => new Date().toISOString(),
};

// =============================================================================
// Logic Functions
// =============================================================================

const ifFn: FunctionDef = {
  name: 'if',
  category: 'logic',
  description: 'Return one value if condition is true, another if false',
  inputTypes: ['Boolean'],
  params: [
    { name: 'thenValue', type: 'string', default: 'Yes' },
    { name: 'elseValue', type: 'string', default: 'No' },
  ],
  compute: ([condition], params) => {
    const then = params?.thenValue ?? 'Yes';
    const else_ = params?.elseValue ?? 'No';
    return condition ? String(then) : String(else_);
  },
};

const isEmpty: FunctionDef = {
  name: 'isEmpty',
  category: 'logic',
  description: 'Check if a value is empty or null',
  inputTypes: ['Text'],
  compute: ([val]) => val === null || val === undefined || val === '',
};

const isNotEmpty: FunctionDef = {
  name: 'isNotEmpty',
  category: 'logic',
  description: 'Check if a value is not empty',
  inputTypes: ['Text'],
  compute: ([val]) => val !== null && val !== undefined && val !== '',
};

const andFn: FunctionDef = {
  name: 'and',
  category: 'logic',
  description: 'True if all inputs are true',
  inputTypes: ['Boolean', 'Boolean'],
  compute: (inputs) => inputs.every((v) => !!v),
};

const orFn: FunctionDef = {
  name: 'or',
  category: 'logic',
  description: 'True if any input is true',
  inputTypes: ['Boolean', 'Boolean'],
  compute: (inputs) => inputs.some((v) => !!v),
};

// =============================================================================
// Registry
// =============================================================================

export const BUILT_IN_FUNCTIONS: FunctionDef[] = [
  // Text
  toUpperCase, toLowerCase, toTitleCase, trim, concat, left, right, replace, template,
  // Number
  add, subtract, multiply, divide, round, abs, textToNumber,
  // Date
  formatDate, year, month, daysBetween, addDays, now,
  // Logic
  ifFn, isEmpty, isNotEmpty, andFn, orFn,
];

/**
 * Runtime-extensible function registry for computed fields.
 * Pre-loaded with built-in functions. External code can register
 * additional functions without modifying core.
 */
export class FunctionRegistry {
  private functions = new Map<string, FunctionDef>();

  /** Register a function (adds or overrides). */
  register(fn: FunctionDef): void {
    this.functions.set(fn.name, fn);
  }

  /** Remove a function by name. */
  unregister(name: string): void {
    this.functions.delete(name);
  }

  /** Get a function definition by name. */
  get(name: string): FunctionDef | undefined {
    return this.functions.get(name);
  }

  /** List all registered functions. */
  list(): FunctionDef[] {
    return [...this.functions.values()];
  }

  /** List functions filtered by category. */
  listByCategory(category: FunctionDef['category']): FunctionDef[] {
    return this.list().filter((fn) => fn.category === category);
  }

  /** Compute a function by name with given inputs and params. Returns null if not found. */
  compute(name: string, inputs: Value[], params?: Record<string, unknown>): Value {
    const fn = this.functions.get(name);
    if (!fn) return null;
    return fn.compute(inputs, params);
  }

  /** Check if a function is registered. */
  has(name: string): boolean {
    return this.functions.has(name);
  }
}

/** Global function registry, pre-loaded with all built-in functions. */
export const functionRegistry = new FunctionRegistry();
for (const fn of BUILT_IN_FUNCTIONS) functionRegistry.register(fn);

// ---------------------------------------------------------------------------
// Backward-compatible wrappers (delegate to functionRegistry)
// ---------------------------------------------------------------------------

/**
 * Compute a function by name with given inputs and params.
 */
export function computeFunction(
  name: string,
  inputs: Value[],
  params?: Record<string, unknown>,
): Value {
  return functionRegistry.compute(name, inputs, params);
}

/**
 * List all available functions.
 */
export function listFunctions(): FunctionDef[] {
  return functionRegistry.list();
}

/**
 * Get a function definition by name.
 */
export function getFunction(name: string): FunctionDef | undefined {
  return functionRegistry.get(name);
}

// =============================================================================
// Helpers for adapter-level recomputation
// =============================================================================

import type { Row, FieldSpec, ComputedFieldOptions } from './types.ts';

/**
 * Recompute all computed fields for a single row.
 */
export function recomputeRow(row: Row, fields: FieldSpec[]): void {
  for (const field of fields) {
    if (field.type !== 'Computed' || !field.options) continue;
    const opts = field.options as ComputedFieldOptions;
    const inputs: Value[] = opts.inputFieldIds.map((id) => row.fields[id] ?? null);
    row.fields[field.id] = computeFunction(opts.functionName, inputs, opts.params);
  }
}

/**
 * Recompute all computed fields for all rows.
 */
export function recomputeAllRows(rows: Row[], fields: FieldSpec[]): void {
  for (const row of rows) {
    recomputeRow(row, fields);
  }
}
