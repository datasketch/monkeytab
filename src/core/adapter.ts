/**
 * Adapter interface for MonkeyTab
 * The central contract between the server and any data backend.
 * Read methods are required; write methods are optional (capability-gated).
 */

import type {
  AdapterInfo,
  BaseSpec,
  BaseSummary,
  TableSpec,
  FieldSpec,
  FieldType,
  FieldOptions,
  Row,
  RowHeight,
  Value,
  Pagination,
  Attachment,
  TrashedTable,
  MonkeyTabSettings,
  TableDisplaySettings,
} from './types.ts';

import type { SortSpec, FilterGroup } from './client.ts';

// =============================================================================
// Adapter Interface
// =============================================================================

export interface Adapter {
  // --- Identity & Lifecycle ---

  /** Adapter metadata, capabilities, extensions */
  info(): AdapterInfo;

  /** Called once on startup. Open connections, load data. */
  initialize?(): Promise<void>;

  /** Called on shutdown. Close connections, flush writes. */
  shutdown?(): Promise<void>;

  // --- Read (required) ---

  /** List all bases */
  listBases(): Promise<BaseSummary[]>;

  /** Get a base with its tables */
  getBase(baseId: string): Promise<BaseSpec>;

  /** Get a table schema */
  getTable(baseId: string, tableId: string): Promise<TableSpec>;

  /** Query records with pagination, sort, filter, search */
  queryRecords(baseId: string, tableId: string, params: QueryParams): Promise<QueryResult>;

  /** Get a single record by ID */
  getRecord(baseId: string, tableId: string, recordId: string): Promise<Row>;

  // --- Write (optional — check capabilities.readOnly) ---

  /** Create a new base */
  createBase?(input: CreateBaseInput): Promise<BaseSpec>;

  /** Update a base (rename) */
  updateBase?(baseId: string, input: UpdateBaseInput): Promise<BaseSpec>;

  /** Delete a base and all its data */
  deleteBase?(baseId: string): Promise<void>;

  /** Create a new table */
  createTable?(baseId: string, input: CreateTableInput): Promise<TableSpec>;

  /** Update table metadata (label, columnOrder, primaryFieldId, display prefs) */
  updateTable?(baseId: string, tableId: string, input: UpdateTableInput): Promise<TableSpec>;

  /** Delete a table and all its records */
  deleteTable?(baseId: string, tableId: string): Promise<void>;

  /** Create a new field in a table */
  createField?(baseId: string, tableId: string, input: CreateFieldInput): Promise<FieldSpec>;

  /** Update a field (label, options) */
  updateField?(baseId: string, tableId: string, fieldId: string, input: UpdateFieldInput): Promise<FieldSpec>;

  /** Delete a field and its data from all records */
  deleteField?(baseId: string, tableId: string, fieldId: string): Promise<void>;

  /** Create a new record */
  createRecord?(baseId: string, tableId: string, fields: Record<string, Value>): Promise<Row>;

  /** Update a record (partial field update) */
  updateRecord?(baseId: string, tableId: string, recordId: string, fields: Record<string, Value>): Promise<Row>;

  /** Delete a record */
  deleteRecord?(baseId: string, tableId: string, recordId: string): Promise<void>;

  /** Update column display order */
  updateColumnOrder?(baseId: string, tableId: string, fieldIds: string[]): Promise<void>;

  /** Update row display order */
  updateRowOrder?(baseId: string, tableId: string, rowIds: string[]): Promise<void>;

  // --- Bulk Operations (optional — server loops single-record calls if absent) ---

  /** Create multiple records in one call */
  bulkCreateRecords?(baseId: string, tableId: string, records: Record<string, Value>[]): Promise<Row[]>;

  /** Update multiple records in one call */
  bulkUpdateRecords?(baseId: string, tableId: string, records: Array<{ id: string; fields: Record<string, Value> }>): Promise<Row[]>;

  /** Delete multiple records in one call. Returns count of deleted records. */
  bulkDeleteRecords?(baseId: string, tableId: string, ids: string[]): Promise<number>;

  // --- Views (optional — check capabilities.views) ---

  /** List views for a table */
  listViews?(baseId: string, tableId: string): Promise<View[]>;

  /** Get a single view */
  getView?(baseId: string, tableId: string, viewId: string): Promise<View>;

  /** Create a view */
  createView?(baseId: string, tableId: string, input: CreateViewInput): Promise<View>;

  /** Update a view */
  updateView?(baseId: string, tableId: string, viewId: string, input: UpdateViewInput): Promise<View>;

  /** Delete a view */
  deleteView?(baseId: string, tableId: string, viewId: string): Promise<void>;

  // --- Files (optional — check capabilities.files) ---

  /** Upload a file */
  uploadFile?(file: Uint8Array, filename: string, mimeType: string): Promise<Attachment>;

  /** Download a file */
  getFile?(fileId: string): Promise<{ data: Uint8Array; mimeType: string; filename: string }>;

  /** Get file thumbnail (images only) */
  getFileThumbnail?(fileId: string): Promise<{ data: Uint8Array; mimeType: string }>;

  /** Get file metadata */
  getFileInfo?(fileId: string): Promise<Attachment & { createdAt: string }>;

  /** Delete a file */
  deleteFile?(fileId: string): Promise<void>;

  // --- Trash (optional — soft-delete with restore) ---

  /** List trashed tables */
  listTrash?(baseId: string): Promise<TrashedTable[]>;

  /** Restore a trashed table */
  restoreTable?(baseId: string, trashId: string): Promise<TableSpec>;

  /** Empty the trash */
  emptyTrash?(baseId: string): Promise<void>;

  // --- Settings (optional) ---

  /** Get application settings */
  getSettings?(): Promise<MonkeyTabSettings>;

  /** Update application settings (partial merge) */
  updateSettings?(settings: Partial<MonkeyTabSettings>): Promise<MonkeyTabSettings>;

  // --- Extensions ---

  /** Return registered extensions */
  extensions(): AdapterExtension[];
}

// =============================================================================
// Query Types (adapter-level)
// =============================================================================

export interface QueryParams {
  offset?: number;
  limit?: number;
  sort?: SortSpec[];
  filter?: FilterGroup;
  search?: string;
  fields?: string[];
}

export interface QueryResult {
  rows: Row[];
  pagination: Pagination;
}

// =============================================================================
// Input Types
// =============================================================================

export interface CreateBaseInput {
  label: string;
}

export interface UpdateBaseInput {
  label?: string;
}

export interface CreateTableInput {
  label: string;
  fields?: Array<{ label: string; type: FieldType; options?: FieldOptions }>;
}

export interface UpdateTableInput {
  label?: string;
  primaryFieldId?: string;
  columnOrder?: string[];
  display?: TableDisplaySettings;
}

export interface CreateFieldInput {
  label: string;
  type: FieldType;
  options?: FieldOptions;
}

export interface UpdateFieldInput {
  label?: string;
  type?: FieldType;
  options?: FieldOptions;
}

// =============================================================================
// View Types
// =============================================================================

export interface View {
  id: string;
  name: string;
  type: 'grid';
  tableId: string;
  isDefault: boolean;

  // Data selection
  filter?: FilterGroup;
  sort?: SortSpec[];
  search?: string;

  // Display configuration
  fieldSelection?: string[];
  rowOrder?: string[];
  fieldWidths?: Record<string, number>;
  rowHeight?: RowHeight;
  showRowNumbers?: boolean;
}

export interface CreateViewInput {
  name: string;
  type?: 'grid';
  filter?: FilterGroup;
  sort?: SortSpec[];
  fieldSelection?: string[];
  fieldWidths?: Record<string, number>;
  rowHeight?: RowHeight;
  showRowNumbers?: boolean;
}

export interface UpdateViewInput {
  name?: string;
  filter?: FilterGroup | null;
  sort?: SortSpec[] | null;
  fieldSelection?: string[] | null;
  rowOrder?: string[] | null;
  fieldWidths?: Record<string, number>;
  rowHeight?: RowHeight;
  showRowNumbers?: boolean;
}

// =============================================================================
// Extension Types
// =============================================================================

export interface AdapterExtension {
  id: string;
  name: string;
  description: string;
}

// =============================================================================
// AdapterError
// =============================================================================

export class AdapterError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AdapterError';
  }

  static notFound(resource: string, id: string): AdapterError {
    return new AdapterError('NOT_FOUND', `${resource} '${id}' not found`, 404);
  }

  static invalidInput(message: string, details?: unknown): AdapterError {
    return new AdapterError('INVALID_INPUT', message, 400, details);
  }

  static alreadyExists(resource: string, id: string): AdapterError {
    return new AdapterError('ALREADY_EXISTS', `${resource} '${id}' already exists`, 409);
  }

  static invalidOrder(message: string): AdapterError {
    return new AdapterError('INVALID_ORDER', message, 400);
  }

  static readOnly(): AdapterError {
    return new AdapterError('READ_ONLY', 'This adapter is read-only', 405);
  }

  static validationError(message: string, details?: unknown): AdapterError {
    return new AdapterError('VALIDATION_ERROR', message, 422, details);
  }

  static conflict(message: string, details?: unknown): AdapterError {
    return new AdapterError('CONFLICT', message, 409, details);
  }

  static fileTooLarge(message: string, details?: unknown): AdapterError {
    return new AdapterError('FILE_TOO_LARGE', message, 413, details);
  }

  static unsupportedFormat(message: string, details?: unknown): AdapterError {
    return new AdapterError('UNSUPPORTED_FORMAT', message, 415, details);
  }

  static typeCoercionFailed(message: string, details?: unknown): AdapterError {
    return new AdapterError('TYPE_COERCION_FAILED', message, 422, details);
  }

  static internalError(message: string, details?: unknown): AdapterError {
    return new AdapterError('INTERNAL_ERROR', message, 500, details);
  }
}
