/**
 * BrowserClient wraps a MemoryAdapter to implement ExtendedClient.
 * No HTTP — everything runs in-process in the browser.
 */

import type { MemoryAdapter } from '@monkeytab/adapter-memory';
import type {
  BaseSummary,
  BaseSpec,
  TableSpec,
  FieldSpec,
  Row,
  Value,
  FieldType,
  FieldOptions,
  AdapterInfo,
  QueryResult,
  MonkeyTabSettings,
  TableDisplaySettings,
  TrashedTable,
} from '@monkeytab/core';
import { validateTypeChange, listFunctions as coreListFunctions, computeFunction as coreComputeFunction } from '@monkeytab/core';
import type { ExtendedClient, FetchOptions, FunctionInfo, ValidateFieldTypeResult } from '../ui/client/types.ts';

export class BrowserClient implements ExtendedClient {
  constructor(private adapter: MemoryAdapter) {}

  // =========================================================================
  // Info
  // =========================================================================

  async getInfo(_options?: FetchOptions): Promise<AdapterInfo> {
    return this.adapter.info();
  }

  // =========================================================================
  // Base Operations
  // =========================================================================

  async listBases(_options?: FetchOptions): Promise<BaseSummary[]> {
    return this.adapter.listBases();
  }

  async getBase(baseId: string, _options?: FetchOptions): Promise<BaseSpec> {
    return this.adapter.getBase(baseId);
  }

  async createBase(args: { label: string }): Promise<BaseSpec> {
    return this.adapter.createBase({ label: args.label });
  }

  async updateBase(args: { baseId: string; label: string }): Promise<BaseSpec> {
    return this.adapter.updateBase(args.baseId, { label: args.label });
  }

  async deleteBase(baseId: string): Promise<{ id: string }> {
    await this.adapter.deleteBase(baseId);
    return { id: baseId };
  }

  // =========================================================================
  // Table Operations
  // =========================================================================

  async getTable(baseId: string, tableId: string, _options?: FetchOptions): Promise<TableSpec> {
    return this.adapter.getTable(baseId, tableId);
  }

  async createTable(args: { baseId: string; label: string; fields?: Array<{ label: string; type: FieldType; options?: FieldOptions }> }): Promise<TableSpec> {
    return this.adapter.createTable(args.baseId, { label: args.label, fields: args.fields });
  }

  async renameTable(args: { baseId: string; tableId: string; label: string }): Promise<void> {
    await this.adapter.updateTable(args.baseId, args.tableId, { label: args.label });
  }

  async deleteTable(args: { baseId: string; tableId: string }): Promise<{ id: string }> {
    await this.adapter.deleteTable(args.baseId, args.tableId);
    return { id: args.tableId };
  }

  // =========================================================================
  // Field Operations
  // =========================================================================

  async createField(args: { baseId: string; tableId: string; label: string; type: FieldType; options?: FieldOptions }): Promise<FieldSpec> {
    return this.adapter.createField(args.baseId, args.tableId, {
      label: args.label,
      type: args.type,
      options: args.options,
    });
  }

  async renameField(args: { baseId: string; tableId: string; fieldId: string; label: string }): Promise<void> {
    await this.adapter.updateField(args.baseId, args.tableId, args.fieldId, { label: args.label });
  }

  async deleteField(args: { baseId: string; tableId: string; fieldId: string }): Promise<void> {
    await this.adapter.deleteField(args.baseId, args.tableId, args.fieldId);
  }

  async updateFieldOptions(args: { baseId: string; tableId: string; fieldId: string; options: FieldOptions }): Promise<void> {
    await this.adapter.updateField(args.baseId, args.tableId, args.fieldId, { options: args.options });
  }

  // =========================================================================
  // Record Operations
  // =========================================================================

  async query(
    args: { baseId: string; tableId: string; offset?: number; limit?: number; sort?: Array<{ fieldId: string; direction: 'asc' | 'desc' }>; filter?: unknown; search?: string; fields?: string[] },
    _options?: FetchOptions,
  ): Promise<QueryResult> {
    return this.adapter.queryRecords(args.baseId, args.tableId, {
      offset: args.offset,
      limit: args.limit,
      sort: args.sort,
      filter: args.filter as any,
      search: args.search,
      fields: args.fields,
    });
  }

  async getRecord(args: { baseId: string; tableId: string; recordId: string }, _options?: FetchOptions): Promise<Row> {
    return this.adapter.getRecord(args.baseId, args.tableId, args.recordId);
  }

  async createRecord(args: { baseId: string; tableId: string; fields: Record<string, Value>; id?: string }): Promise<Row> {
    return this.adapter.createRecord(args.baseId, args.tableId, args.fields, args.id !== undefined ? { id: args.id } : undefined);
  }

  async updateRecord(args: { baseId: string; tableId: string; recordId: string; fields: Record<string, Value>; oldValue?: Value }): Promise<Row> {
    // oldValue is a UI-layer concern (hook rollback); adapter only needs fields.
    return this.adapter.updateRecord(args.baseId, args.tableId, args.recordId, args.fields);
  }

  async deleteRecord(args: { baseId: string; tableId: string; recordId: string }): Promise<{ id: string }> {
    await this.adapter.deleteRecord(args.baseId, args.tableId, args.recordId);
    return { id: args.recordId };
  }

  // =========================================================================
  // Ordering
  // =========================================================================

  async updateColumnOrder(args: { baseId: string; tableId: string; columnOrder: string[] }): Promise<void> {
    await this.adapter.updateColumnOrder(args.baseId, args.tableId, args.columnOrder);
  }

  async updateRowOrder(args: { baseId: string; tableId: string; rowOrder: string[] }): Promise<void> {
    await this.adapter.updateRowOrder(args.baseId, args.tableId, args.rowOrder);
  }

  // =========================================================================
  // Settings
  // =========================================================================

  async getSettings(_options?: FetchOptions): Promise<MonkeyTabSettings> {
    return this.adapter.getSettings();
  }

  async updateSettings(settings: Partial<MonkeyTabSettings>): Promise<MonkeyTabSettings> {
    return this.adapter.updateSettings(settings);
  }

  // =========================================================================
  // Table Display
  // =========================================================================

  async updateTableDisplay(baseId: string, tableId: string, display: TableDisplaySettings): Promise<TableSpec> {
    return this.adapter.updateTable(baseId, tableId, { display });
  }

  // =========================================================================
  // Trash (not supported by MemoryAdapter — return empty/no-op)
  // =========================================================================

  async listTrash(_baseId: string, _options?: FetchOptions): Promise<TrashedTable[]> {
    return [];
  }

  async restoreTable(_baseId: string, _trashId: string): Promise<TableSpec> {
    throw new Error('Trash not supported in browser mode');
  }

  async emptyTrash(_baseId: string): Promise<void> {
    // no-op
  }

  // =========================================================================
  // Field Type Change
  // =========================================================================

  async updateFieldType(args: { baseId: string; tableId: string; fieldId: string; type: FieldType }): Promise<void> {
    await this.adapter.updateField(args.baseId, args.tableId, args.fieldId, { type: args.type });
  }

  async validateFieldType(args: { baseId: string; tableId: string; fieldId: string; type: FieldType }): Promise<ValidateFieldTypeResult> {
    const table = await this.adapter.getTable(args.baseId, args.tableId);
    const field = table.fields.find((f) => f.id === args.fieldId);
    if (!field) throw new Error(`Field not found: ${args.fieldId}`);

    const result = await this.adapter.queryRecords(args.baseId, args.tableId, { limit: 10000 });
    return validateTypeChange(result.rows, args.fieldId, field.type, args.type);
  }

  // =========================================================================
  // Functions (Computed Fields)
  // =========================================================================

  async listFunctions(): Promise<FunctionInfo[]> {
    return coreListFunctions().map((fn) => ({
      name: fn.name,
      category: fn.category,
      description: fn.description,
      inputTypes: fn.inputTypes,
      params: fn.params,
    }));
  }

  async computeFunction(args: { functionName: string; inputs: unknown[]; params?: Record<string, unknown> }): Promise<unknown> {
    return coreComputeFunction(args.functionName, args.inputs as Value[], args.params);
  }
}
