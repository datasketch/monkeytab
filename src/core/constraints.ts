/**
 * Constraint registry for field-level value validation.
 * Each constraint defines a validation rule that can be attached to fields.
 * Built-in constraints are pre-loaded; external code can register custom ones.
 */

import type { FieldType, FieldSpec, Value } from './types.ts';

// =============================================================================
// Types
// =============================================================================

/** Definition of a constraint that can be registered in the ConstraintRegistry. */
export interface FieldTypeConstraint {
  /** Unique name (e.g. 'required', 'min', 'pattern') */
  name: string;
  /** Human-readable label (e.g. "Minimum Value") */
  label: string;
  /** Description of what this constraint checks */
  description: string;
  /** Which field types this constraint applies to */
  appliesTo: FieldType[];
  /** Parameter definitions for configuring the constraint */
  params?: Array<{ name: string; type: string; default?: unknown }>;
  /** Validate a value. Returns null if valid, error message string if invalid. */
  validate: (value: Value, params: Record<string, unknown>, field: FieldSpec) => string | null;
}

/** How a constraint is attached to a field (stored in field.options.constraints). */
export interface ConstraintConfig {
  /** Constraint name from the registry */
  name: string;
  /** Constraint-specific parameters */
  params?: Record<string, unknown>;
  /** Whether violation blocks saves ('error') or just warns ('warning'). Default: 'error'. */
  severity?: 'error' | 'warning';
}

/** Result of validating a value against a constraint. */
export interface ConstraintViolation {
  fieldId: string;
  constraintName: string;
  message: string;
  severity: 'error' | 'warning';
}

// =============================================================================
// Registry
// =============================================================================

/**
 * Runtime-extensible constraint registry.
 * Pre-loaded with built-in constraints. External code can register
 * additional constraints without modifying core.
 */
export class ConstraintRegistry {
  private constraints = new Map<string, FieldTypeConstraint>();

  /** Register a constraint (adds or overrides). */
  register(constraint: FieldTypeConstraint): void {
    this.constraints.set(constraint.name, constraint);
  }

  /** Remove a constraint by name. */
  unregister(name: string): void {
    this.constraints.delete(name);
  }

  /** Get a constraint definition by name. */
  get(name: string): FieldTypeConstraint | undefined {
    return this.constraints.get(name);
  }

  /** Check if a constraint is registered. */
  has(name: string): boolean {
    return this.constraints.has(name);
  }

  /** List all registered constraints. */
  list(): FieldTypeConstraint[] {
    return [...this.constraints.values()];
  }

  /** List constraints applicable to a specific field type. */
  listForType(fieldType: FieldType): FieldTypeConstraint[] {
    return this.list().filter((c) => c.appliesTo.includes(fieldType));
  }

  /**
   * Validate a single value against a list of constraint configs.
   * Returns an array of validation errors (empty if valid).
   */
  validateValue(value: Value, configs: ConstraintConfig[], field: FieldSpec): ConstraintViolation[] {
    const errors: ConstraintViolation[] = [];
    for (const config of configs) {
      const constraint = this.constraints.get(config.name);
      if (!constraint) continue;
      if (!constraint.appliesTo.includes(field.type)) continue;

      const message = constraint.validate(value, config.params ?? {}, field);
      if (message !== null) {
        errors.push({
          fieldId: field.id,
          constraintName: config.name,
          message,
          severity: config.severity ?? 'error',
        });
      }
    }
    return errors;
  }
}

// =============================================================================
// Built-in Constraints
// =============================================================================

const ALL_FIELD_TYPES: FieldType[] = [
  'Text', 'Number', 'Boolean', 'Date', 'SingleSelect', 'MultiSelect', 'Attachment', 'Image',
  'Email', 'URL', 'Phone', 'Audio', 'Video', 'Color', 'Rating', 'Computed',
];

const required: FieldTypeConstraint = {
  name: 'required',
  label: 'Required',
  description: 'Value must not be empty or null',
  appliesTo: ALL_FIELD_TYPES,
  validate: (value) => {
    if (value === null || value === undefined) return 'This field is required';
    if (typeof value === 'string' && value.trim() === '') return 'This field is required';
    if (Array.isArray(value) && value.length === 0) return 'This field is required';
    return null;
  },
};

const min: FieldTypeConstraint = {
  name: 'min',
  label: 'Minimum Value',
  description: 'Number must be greater than or equal to a minimum',
  appliesTo: ['Number'],
  params: [{ name: 'min', type: 'number' }],
  validate: (value, params) => {
    if (value === null || value === undefined) return null; // skip empty (use 'required' for that)
    const n = typeof value === 'number' ? value : Number(value);
    if (isNaN(n)) return null;
    const minVal = Number(params.min);
    if (isNaN(minVal)) return null;
    return n < minVal ? `Value must be at least ${minVal}` : null;
  },
};

const max: FieldTypeConstraint = {
  name: 'max',
  label: 'Maximum Value',
  description: 'Number must be less than or equal to a maximum',
  appliesTo: ['Number'],
  params: [{ name: 'max', type: 'number' }],
  validate: (value, params) => {
    if (value === null || value === undefined) return null;
    const n = typeof value === 'number' ? value : Number(value);
    if (isNaN(n)) return null;
    const maxVal = Number(params.max);
    if (isNaN(maxVal)) return null;
    return n > maxVal ? `Value must be at most ${maxVal}` : null;
  },
};

const minLength: FieldTypeConstraint = {
  name: 'minLength',
  label: 'Minimum Length',
  description: 'Text must have at least N characters',
  appliesTo: ['Text'],
  params: [{ name: 'minLength', type: 'number' }],
  validate: (value, params) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string') return null;
    const minLen = Number(params.minLength);
    if (isNaN(minLen)) return null;
    return value.length < minLen ? `Must be at least ${minLen} characters` : null;
  },
};

const maxLength: FieldTypeConstraint = {
  name: 'maxLength',
  label: 'Maximum Length',
  description: 'Text must have at most N characters',
  appliesTo: ['Text'],
  params: [{ name: 'maxLength', type: 'number' }],
  validate: (value, params) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return null;
    const maxLen = Number(params.maxLength);
    if (isNaN(maxLen)) return null;
    return value.length > maxLen ? `Must be at most ${maxLen} characters` : null;
  },
};

const pattern: FieldTypeConstraint = {
  name: 'pattern',
  label: 'Pattern',
  description: 'Text must match a regular expression',
  appliesTo: ['Text'],
  params: [
    { name: 'pattern', type: 'string' },
    { name: 'flags', type: 'string', default: '' },
    { name: 'message', type: 'string', default: '' },
  ],
  validate: (value, params) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string') return null;
    const pat = String(params.pattern ?? '');
    if (!pat) return null;
    try {
      const regex = new RegExp(pat, String(params.flags ?? ''));
      if (!regex.test(value)) {
        return String(params.message || `Value does not match pattern: ${pat}`);
      }
    } catch {
      return `Invalid pattern: ${pat}`;
    }
    return null;
  },
};

const enumConstraint: FieldTypeConstraint = {
  name: 'enum',
  label: 'Allowed Values',
  description: 'Value must be one of a predefined set',
  appliesTo: ['Text', 'Number'],
  params: [{ name: 'values', type: 'array' }],
  validate: (value, params) => {
    if (value === null || value === undefined) return null;
    const allowed = params.values;
    if (!Array.isArray(allowed) || allowed.length === 0) return null;
    if (!allowed.includes(value)) {
      return `Value must be one of: ${allowed.join(', ')}`;
    }
    return null;
  },
};

const minDate: FieldTypeConstraint = {
  name: 'minDate',
  label: 'Earliest Date',
  description: 'Date must be on or after a minimum date',
  appliesTo: ['Date'],
  params: [{ name: 'min', type: 'string' }],
  validate: (value, params) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const minD = new Date(String(params.min));
    if (isNaN(minD.getTime())) return null;
    return d < minD ? `Date must be on or after ${String(params.min)}` : null;
  },
};

const maxDate: FieldTypeConstraint = {
  name: 'maxDate',
  label: 'Latest Date',
  description: 'Date must be on or before a maximum date',
  appliesTo: ['Date'],
  params: [{ name: 'max', type: 'string' }],
  validate: (value, params) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const maxD = new Date(String(params.max));
    if (isNaN(maxD.getTime())) return null;
    return d > maxD ? `Date must be on or before ${String(params.max)}` : null;
  },
};

export const BUILT_IN_CONSTRAINTS: FieldTypeConstraint[] = [
  required,
  min,
  max,
  minLength,
  maxLength,
  pattern,
  enumConstraint,
  minDate,
  maxDate,
];

/** Global constraint registry, pre-loaded with all built-in constraints. */
export const constraintRegistry = new ConstraintRegistry();
for (const c of BUILT_IN_CONSTRAINTS) constraintRegistry.register(c);
