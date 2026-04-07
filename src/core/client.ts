/**
 * Client interface for MonkeyTab
 * Implemented by HttpClient, MockClient, TauriClient, etc.
 */

import type {
  BaseSummary,
  BaseSpec,
  TableSpec,
  FieldSpec,
  FieldType,
  Row,
  Value,
  FieldOptions,
  AdapterInfo,
} from './types.ts';

import type { QueryResult } from './adapter.ts';

// =============================================================================
// Client Interface
// =============================================================================

export interface Client {
  // -------------------------------------------------------------------------
  // Info
  // -------------------------------------------------------------------------

  /** Get adapter info and capabilities */
  getInfo(): Promise<AdapterInfo>;

  // -------------------------------------------------------------------------
  // Base Operations
  // -------------------------------------------------------------------------

  /** List all bases */
  listBases(): Promise<BaseSummary[]>;

  /** Get a base with all its tables */
  getBase(baseId: string): Promise<BaseSpec>;

  /** Create a new base */
  createBase(args: CreateBaseArgs): Promise<BaseSpec>;

  /** Update a base (rename) */
  updateBase(args: UpdateBaseArgs): Promise<BaseSpec>;

  /** Delete a base */
  deleteBase(baseId: string): Promise<{ id: string }>;

  // -------------------------------------------------------------------------
  // Table Operations
  // -------------------------------------------------------------------------

  /** Get a specific table schema */
  getTable(baseId: string, tableId: string): Promise<TableSpec>;

  /** Create a new table */
  createTable(args: CreateTableArgs): Promise<TableSpec>;

  /** Rename a table */
  renameTable(args: RenameTableArgs): Promise<void>;

  /** Delete a table */
  deleteTable(args: DeleteTableArgs): Promise<{ id: string }>;

  // -------------------------------------------------------------------------
  // Field Operations
  // -------------------------------------------------------------------------

  /** Create a new field */
  createField(args: CreateFieldArgs): Promise<FieldSpec>;

  /** Rename a field */
  renameField(args: RenameFieldArgs): Promise<void>;

  /** Delete a field */
  deleteField(args: DeleteFieldArgs): Promise<void>;

  /** Update field options */
  updateFieldOptions(args: UpdateFieldOptionsArgs): Promise<void>;

  // -------------------------------------------------------------------------
  // Record Operations
  // -------------------------------------------------------------------------

  /** Query rows from a table */
  query(args: QueryArgs): Promise<QueryResult>;

  /** Get a single record */
  getRecord(args: GetRecordArgs): Promise<Row>;

  /** Create a new record */
  createRecord(args: CreateRecordArgs): Promise<Row>;

  /** Update an existing record */
  updateRecord(args: UpdateRecordArgs): Promise<Row>;

  /** Delete a record */
  deleteRecord(args: DeleteRecordArgs): Promise<{ id: string }>;

  // -------------------------------------------------------------------------
  // Ordering Operations
  // -------------------------------------------------------------------------

  /** Update column order */
  updateColumnOrder(args: UpdateColumnOrderArgs): Promise<void>;

  /** Update row order */
  updateRowOrder(args: UpdateRowOrderArgs): Promise<void>;
}

// =============================================================================
// Query Types
// =============================================================================

export interface QueryArgs {
  baseId: string;
  tableId: string;
  offset?: number;
  limit?: number;
  sort?: SortSpec[];
  filter?: FilterGroup;
  search?: string;
  fields?: string[];
}

// QueryResult is re-exported from adapter.ts (shared between Client and Adapter interfaces)
export type { QueryResult } from './adapter.ts';

export interface SortSpec {
  fieldId: string;
  direction: 'asc' | 'desc';
}

export type FilterOperator =
  | 'eq' | 'neq'
  | 'lt' | 'lte' | 'gt' | 'gte'
  | 'contains' | 'does_not_contain' | 'starts_with' | 'ends_with'
  | 'is_empty' | 'is_not_empty'
  | 'is_any_of' | 'is_none_of'
  | 'has_any_of' | 'has_all_of' | 'has_none_of';

export interface FilterCondition {
  fieldId: string;
  operator: FilterOperator;
  value?: Value;
}

export interface FilterGroup {
  conjunction: 'and' | 'or';
  conditions: (FilterCondition | FilterGroup)[];
}

// =============================================================================
// Base Args
// =============================================================================

export interface CreateBaseArgs {
  label: string;
}

export interface UpdateBaseArgs {
  baseId: string;
  label: string;
}

// =============================================================================
// Table Args
// =============================================================================

export interface CreateTableArgs {
  baseId: string;
  label: string;
  fields?: Array<{ label: string; type: FieldType; options?: FieldOptions }>;
}

export interface RenameTableArgs {
  baseId: string;
  tableId: string;
  label: string;
}

export interface DeleteTableArgs {
  baseId: string;
  tableId: string;
}

// =============================================================================
// Field Args
// =============================================================================

export interface CreateFieldArgs {
  baseId: string;
  tableId: string;
  label: string;
  type: FieldType;
  options?: FieldOptions;
}

export interface RenameFieldArgs {
  baseId: string;
  tableId: string;
  fieldId: string;
  label: string;
}

export interface DeleteFieldArgs {
  baseId: string;
  tableId: string;
  fieldId: string;
}

export interface UpdateFieldOptionsArgs {
  baseId: string;
  tableId: string;
  fieldId: string;
  options: FieldOptions;
}

// =============================================================================
// Record Args
// =============================================================================

export interface CreateRecordArgs {
  baseId: string;
  tableId: string;
  fields: Record<string, Value>;
}

export interface UpdateRecordArgs {
  baseId: string;
  tableId: string;
  recordId: string;
  fields: Record<string, Value>;
}

export interface DeleteRecordArgs {
  baseId: string;
  tableId: string;
  recordId: string;
}

export interface GetRecordArgs {
  baseId: string;
  tableId: string;
  recordId: string;
}

// =============================================================================
// Ordering Types
// =============================================================================

export interface UpdateColumnOrderArgs {
  baseId: string;
  tableId: string;
  columnOrder: string[];
}

export interface UpdateRowOrderArgs {
  baseId: string;
  tableId: string;
  rowOrder: string[];
}

// =============================================================================
// Error Types
// =============================================================================

export class ClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ClientError';
  }
}

export class NotFoundError extends ClientError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ClientError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}
