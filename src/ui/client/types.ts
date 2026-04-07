/**
 * ExtendedClient interface — the full client contract used by UI hooks.
 * Both httpClient and BrowserClient implement this interface.
 */

import type {
  Client,
  BaseSummary,
  BaseSpec,
  TableSpec,
  FieldSpec,
  Row,
  Value,
  FieldType,
  FieldOptions,
  AdapterInfo,
  QueryArgs,
  QueryResult,
  CreateBaseArgs,
  UpdateBaseArgs,
  CreateTableArgs,
  RenameTableArgs,
  DeleteTableArgs,
  CreateFieldArgs,
  RenameFieldArgs,
  DeleteFieldArgs,
  UpdateFieldOptionsArgs,
  CreateRecordArgs,
  UpdateRecordArgs,
  DeleteRecordArgs,
  GetRecordArgs,
  UpdateColumnOrderArgs,
  UpdateRowOrderArgs,
  MonkeyTabSettings,
  TableDisplaySettings,
  TrashedTable,
} from '@monkeytab/core';

/** Options that can be passed to read methods for cancellation support */
export interface FetchOptions {
  signal?: AbortSignal;
}

export interface FunctionInfo {
  name: string;
  category: string;
  description: string;
  inputTypes: string[];
  params?: Array<{ name: string; type: string; default?: unknown }>;
}

export interface ValidateFieldTypeResult {
  compatible: number;
  incompatible: number;
  total: number;
  warnings: string[];
  samples: Array<{ rowId: string; currentValue: unknown; convertedValue: unknown; lossless: boolean }>;
}

/**
 * The full client interface used by the UI layer.
 * Extends the core Client interface with settings, trash, field type change,
 * functions, and display operations.
 */
export interface ExtendedClient {
  // Core Client methods (with optional FetchOptions for AbortSignal)
  getInfo(options?: FetchOptions): Promise<AdapterInfo>;
  listBases(options?: FetchOptions): Promise<BaseSummary[]>;
  getBase(baseId: string, options?: FetchOptions): Promise<BaseSpec>;
  createBase(args: CreateBaseArgs): Promise<BaseSpec>;
  updateBase(args: UpdateBaseArgs): Promise<BaseSpec>;
  deleteBase(baseId: string): Promise<{ id: string }>;

  getTable(baseId: string, tableId: string, options?: FetchOptions): Promise<TableSpec>;
  createTable(args: CreateTableArgs): Promise<TableSpec>;
  renameTable(args: RenameTableArgs): Promise<void>;
  deleteTable(args: DeleteTableArgs): Promise<{ id: string }>;

  createField(args: CreateFieldArgs): Promise<FieldSpec>;
  renameField(args: RenameFieldArgs): Promise<void>;
  deleteField(args: DeleteFieldArgs): Promise<void>;
  updateFieldOptions(args: UpdateFieldOptionsArgs): Promise<void>;

  query(args: QueryArgs, options?: FetchOptions): Promise<QueryResult>;
  getRecord(args: GetRecordArgs, options?: FetchOptions): Promise<Row>;
  createRecord(args: CreateRecordArgs): Promise<Row>;
  updateRecord(args: UpdateRecordArgs): Promise<Row>;
  deleteRecord(args: DeleteRecordArgs): Promise<{ id: string }>;

  updateColumnOrder(args: UpdateColumnOrderArgs): Promise<void>;
  updateRowOrder(args: UpdateRowOrderArgs): Promise<void>;

  // Extended methods
  getSettings(options?: FetchOptions): Promise<MonkeyTabSettings>;
  updateSettings(settings: Partial<MonkeyTabSettings>): Promise<MonkeyTabSettings>;
  updateTableDisplay(baseId: string, tableId: string, display: TableDisplaySettings): Promise<TableSpec>;

  listTrash(baseId: string, options?: FetchOptions): Promise<TrashedTable[]>;
  restoreTable(baseId: string, trashId: string): Promise<TableSpec>;
  emptyTrash(baseId: string): Promise<void>;

  updateFieldType(args: { baseId: string; tableId: string; fieldId: string; type: FieldType }): Promise<void>;
  validateFieldType(args: { baseId: string; tableId: string; fieldId: string; type: FieldType }): Promise<ValidateFieldTypeResult>;

  listFunctions(): Promise<FunctionInfo[]>;
  computeFunction(args: { functionName: string; inputs: unknown[]; params?: Record<string, unknown> }): Promise<unknown>;
}
