/**
 * In-memory adapter implementing the Adapter interface.
 * All data lives in Maps — no persistence. Suitable for dev, testing,
 * and as the base for CSV/JSON file adapters that load into memory.
 */

import type {
  Adapter,
  QueryParams,
  QueryResult,
  CreateBaseInput,
  UpdateBaseInput,
  CreateTableInput,
  UpdateTableInput,
  CreateFieldInput,
  UpdateFieldInput,
  CreateViewInput,
  UpdateViewInput,
  View,
  AdapterExtension,
  AdapterInfo,
  BaseSpec,
  BaseSummary,
  TableSpec,
  FieldSpec,
  FieldType,
  Row,
  Value,
  FieldOptions,
  Attachment,
  MonkeyTabSettings,
} from '@monkeytab/core';

import { AdapterError, applyFilter, applySearch, applySort, applyPagination, mergeSettings, coerceValue, generateSelectOptions, recomputeRow, recomputeAllRows } from '@monkeytab/core';

import type { SampleData } from './seed.ts';

// =============================================================================
// MemoryAdapter
// =============================================================================

export class MemoryAdapter implements Adapter {
  private bases: Map<string, BaseSpec>;
  private rows: Map<string, Row[]>;
  private files: Map<string, { data: Uint8Array; filename: string; mimeType: string; size: number; createdAt: string }>;
  private views: Map<string, View[]>;
  private nextId: number = 1000;
  private settings: MonkeyTabSettings = {};

  constructor(private seedData?: SampleData) {
    this.bases = new Map();
    this.rows = new Map();
    this.files = new Map();
    this.views = new Map();
  }

  private getMergedSettings(): Required<MonkeyTabSettings> {
    return mergeSettings(this.settings);
  }

  private checkReadOnly(): void {
    if (this.getMergedSettings().readOnly) {
      throw AdapterError.readOnly();
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}-${++this.nextId}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  private rowKey(baseId: string, tableId: string): string {
    return `${baseId}:${tableId}`;
  }

  /** Replace all rows for a table in-place (used to sync external data changes). */
  replaceRows(baseId: string, tableId: string, rows: Row[]): void {
    this.rows.set(this.rowKey(baseId, tableId), rows);
  }

  /** Update the table's fields and column order in-place (used to sync external column changes). */
  replaceFields(baseId: string, tableId: string, fields: FieldSpec[], columnOrder?: string[]): void {
    const table = this.requireTable(baseId, tableId);
    table.fields = fields;
    table.columnOrder = columnOrder ?? fields.map((f) => f.id);
  }

  private requireBase(baseId: string): BaseSpec {
    const base = this.bases.get(baseId);
    if (!base) throw AdapterError.notFound('Base', baseId);
    return base;
  }

  private requireTable(baseId: string, tableId: string): TableSpec {
    const base = this.requireBase(baseId);
    const table = base.tables.find((t) => t.id === tableId);
    if (!table) throw AdapterError.notFound('Table', tableId);
    return table;
  }

  private requireRows(baseId: string, tableId: string): Row[] {
    const key = this.rowKey(baseId, tableId);
    const rows = this.rows.get(key);
    if (!rows) throw AdapterError.notFound('Table', tableId);
    return rows;
  }

  // ===========================================================================
  // Identity & Lifecycle
  // ===========================================================================

  info(): AdapterInfo {
    return {
      label: 'memory',
      version: '0.1.0',
      capabilities: {
        sort: true,
        filter: true,
        search: true,
        files: true,
        persist: false,
        readOnly: false,
        views: true,
        trash: false,
        bulk: true,
      },
    };
  }

  async initialize(): Promise<void> {
    if (this.seedData) {
      this.bases = new Map(this.seedData.bases.map((b) => [b.id, b]));
      this.rows = this.seedData.rows;
    }
  }

  async shutdown(): Promise<void> {
    this.bases.clear();
    this.rows.clear();
    this.files.clear();
    this.views.clear();
  }

  // ===========================================================================
  // Read — Bases
  // ===========================================================================

  async listBases(): Promise<BaseSummary[]> {
    return Array.from(this.bases.values()).map((base) => ({
      id: base.id,
      label: base.label,
      tableCount: base.tables.length,
    }));
  }

  async getBase(baseId: string): Promise<BaseSpec> {
    return this.requireBase(baseId);
  }

  // ===========================================================================
  // Read — Tables
  // ===========================================================================

  async getTable(baseId: string, tableId: string): Promise<TableSpec> {
    return this.requireTable(baseId, tableId);
  }

  // ===========================================================================
  // Read — Records
  // ===========================================================================

  async queryRecords(baseId: string, tableId: string, params: QueryParams): Promise<QueryResult> {
    this.requireTable(baseId, tableId);
    let rows = this.requireRows(baseId, tableId);

    if (params.search) rows = applySearch(rows, params.search);
    if (params.filter) rows = applyFilter(rows, params.filter);
    if (params.sort && params.sort.length > 0) rows = applySort(rows, params.sort);

    return applyPagination(rows, params.offset ?? 0, params.limit ?? 100);
  }

  async getRecord(baseId: string, tableId: string, recordId: string): Promise<Row> {
    const rows = this.requireRows(baseId, tableId);
    const row = rows.find((r) => r.id === recordId);
    if (!row) throw AdapterError.notFound('Record', recordId);
    return row;
  }

  // ===========================================================================
  // Write — Bases
  // ===========================================================================

  async createBase(input: CreateBaseInput): Promise<BaseSpec> {
    const id = this.generateId('base');
    const base: BaseSpec = { id, label: input.label, tables: [] };
    this.bases.set(id, base);
    return base;
  }

  async updateBase(baseId: string, input: UpdateBaseInput): Promise<BaseSpec> {
    const base = this.requireBase(baseId);
    if (input.label !== undefined) base.label = input.label;
    return base;
  }

  async deleteBase(baseId: string): Promise<void> {
    const base = this.requireBase(baseId);
    for (const table of base.tables) {
      this.rows.delete(this.rowKey(baseId, table.id));
    }
    this.bases.delete(baseId);
  }

  // ===========================================================================
  // Write — Tables
  // ===========================================================================

  async createTable(baseId: string, input: CreateTableInput): Promise<TableSpec> {
    this.checkReadOnly();
    const s = this.getMergedSettings();
    if (!s.allowCreateTable) throw AdapterError.readOnly();

    const base = this.requireBase(baseId);
    const tableId = this.generateId('table');

    let fields: FieldSpec[];
    if (input.fields && input.fields.length > 0) {
      fields = input.fields.map((f) => ({
        id: this.generateId('field'),
        label: f.label,
        type: f.type,
        options: f.options,
      }));
    } else {
      // Use settings defaults for new table columns
      const colCount = s.newTableColumns;
      const defaultType = s.newTableDefaultFieldType;
      fields = [];
      fields.push({ id: this.generateId('field'), label: 'Name', type: 'Text' as FieldType });
      for (let i = 1; i < colCount; i++) {
        fields.push({
          id: this.generateId('field'),
          label: `Field ${i + 1}`,
          type: defaultType,
        });
      }
    }

    const table: TableSpec = {
      id: tableId,
      label: input.label,
      fields,
      primaryFieldId: fields[0].id,
      columnOrder: fields.map((f) => f.id),
    };

    base.tables.push(table);

    // Create default empty rows based on settings
    const rows: Row[] = [];
    const rowCount = s.newTableRows;
    for (let i = 0; i < rowCount; i++) {
      const fieldValues: Record<string, Value> = {};
      for (const field of fields) {
        fieldValues[field.id] = null;
      }
      rows.push({
        id: this.generateId('rec'),
        fields: fieldValues,
        createdAt: this.now(),
        updatedAt: this.now(),
      });
    }

    this.rows.set(this.rowKey(baseId, tableId), rows);
    return table;
  }

  async updateTable(baseId: string, tableId: string, input: UpdateTableInput): Promise<TableSpec> {
    const table = this.requireTable(baseId, tableId);

    if (input.label !== undefined) table.label = input.label;
    if (input.primaryFieldId !== undefined) table.primaryFieldId = input.primaryFieldId;
    if (input.columnOrder !== undefined) {
      const fieldIds = new Set(table.fields.map((f) => f.id));
      for (const id of input.columnOrder) {
        if (!fieldIds.has(id)) {
          throw AdapterError.invalidOrder(`Unknown field ID in columnOrder: ${id}`);
        }
      }
      table.columnOrder = input.columnOrder;
    }
    if (input.display !== undefined) {
      table.display = { ...table.display, ...input.display };
    }

    return table;
  }

  async deleteTable(baseId: string, tableId: string): Promise<void> {
    const base = this.requireBase(baseId);
    const tableIndex = base.tables.findIndex((t) => t.id === tableId);
    if (tableIndex === -1) throw AdapterError.notFound('Table', tableId);

    base.tables.splice(tableIndex, 1);
    this.rows.delete(this.rowKey(baseId, tableId));
  }

  // ===========================================================================
  // Write — Fields
  // ===========================================================================

  async createField(baseId: string, tableId: string, input: CreateFieldInput): Promise<FieldSpec> {
    const table = this.requireTable(baseId, tableId);

    const field: FieldSpec = {
      id: this.generateId('field'),
      label: input.label,
      type: input.type,
      options: input.options,
    };

    table.fields.push(field);

    if (table.columnOrder) {
      table.columnOrder.push(field.id);
    } else {
      table.columnOrder = table.fields.map((f) => f.id);
    }

    // If computed field, compute values for all existing rows
    if (field.type === 'Computed') {
      const rows = this.rows.get(this.rowKey(baseId, tableId));
      if (rows) {
        recomputeAllRows(rows, table.fields);
      }
    }

    return field;
  }

  async updateField(baseId: string, tableId: string, fieldId: string, input: UpdateFieldInput): Promise<FieldSpec> {
    const table = this.requireTable(baseId, tableId);
    const field = table.fields.find((f) => f.id === fieldId);
    if (!field) throw AdapterError.notFound('Field', fieldId);

    // Handle type change with coercion
    if (input.type !== undefined && input.type !== field.type) {
      const fromType = field.type;
      const toType = input.type;
      const rows = this.rows.get(this.rowKey(baseId, tableId));

      if (rows) {
        // Collect unique string values for SingleSelect/MultiSelect options
        const selectValues = new Set<string>();

        for (const row of rows) {
          const oldValue = row.fields[fieldId] ?? null;
          const result = coerceValue(oldValue, fromType, toType);
          row.fields[fieldId] = result.value;

          // Collect values for select options
          const coerced = result.value;
          if ((toType === 'SingleSelect' || toType === 'MultiSelect') && coerced !== null) {
            if (Array.isArray(coerced)) {
              for (const v of coerced) selectValues.add(String(v));
            } else {
              selectValues.add(String(coerced));
            }
          }
        }

        // Auto-generate select options if converting to SingleSelect/MultiSelect
        if ((toType === 'SingleSelect' || toType === 'MultiSelect') && selectValues.size > 0) {
          field.options = { options: generateSelectOptions(selectValues) } as FieldOptions;
        } else {
          field.options = input.options;
        }
      }

      field.type = toType;
    }

    if (input.label !== undefined) field.label = input.label;
    if (input.options !== undefined && input.type === undefined) {
      field.options = { ...field.options, ...input.options } as FieldOptions;
    }

    return field;
  }

  async deleteField(baseId: string, tableId: string, fieldId: string): Promise<void> {
    const table = this.requireTable(baseId, tableId);
    const fieldIndex = table.fields.findIndex((f) => f.id === fieldId);
    if (fieldIndex === -1) throw AdapterError.notFound('Field', fieldId);

    table.fields.splice(fieldIndex, 1);

    if (table.columnOrder) {
      table.columnOrder = table.columnOrder.filter((id) => id !== fieldId);
    }

    // Remove field data from all rows
    const rows = this.rows.get(this.rowKey(baseId, tableId));
    if (rows) {
      for (const row of rows) {
        delete row.fields[fieldId];
      }
    }
  }

  // ===========================================================================
  // Write — Records
  // ===========================================================================

  async createRecord(baseId: string, tableId: string, fields: Record<string, Value>): Promise<Row> {
    const table = this.requireTable(baseId, tableId);
    const rows = this.requireRows(baseId, tableId);

    const timestamp = this.now();
    const newRow: Row = {
      id: this.generateId('rec'),
      fields,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Recompute computed fields
    recomputeRow(newRow, table.fields);

    rows.push(newRow);
    return newRow;
  }

  async updateRecord(baseId: string, tableId: string, recordId: string, fields: Record<string, Value>): Promise<Row> {
    const table = this.requireTable(baseId, tableId);
    const rows = this.requireRows(baseId, tableId);
    const row = rows.find((r) => r.id === recordId);
    if (!row) throw AdapterError.notFound('Record', recordId);

    row.fields = { ...row.fields, ...fields };
    row.updatedAt = this.now();

    // Recompute computed fields
    recomputeRow(row, table.fields);

    return row;
  }

  async deleteRecord(baseId: string, tableId: string, recordId: string): Promise<void> {
    const rows = this.requireRows(baseId, tableId);
    const rowIndex = rows.findIndex((r) => r.id === recordId);
    if (rowIndex === -1) throw AdapterError.notFound('Record', recordId);

    rows.splice(rowIndex, 1);
  }

  // ===========================================================================
  // Ordering
  // ===========================================================================

  async updateColumnOrder(baseId: string, tableId: string, fieldIds: string[]): Promise<void> {
    const table = this.requireTable(baseId, tableId);
    const validIds = new Set(table.fields.map((f) => f.id));
    for (const id of fieldIds) {
      if (!validIds.has(id)) {
        throw AdapterError.invalidOrder(`Unknown field ID in columnOrder: ${id}`);
      }
    }
    table.columnOrder = fieldIds;
  }

  async updateRowOrder(baseId: string, tableId: string, rowIds: string[]): Promise<void> {
    const table = this.requireTable(baseId, tableId);
    const rows = this.requireRows(baseId, tableId);
    const validIds = new Set(rows.map((r) => r.id));
    for (const id of rowIds) {
      if (!validIds.has(id)) {
        throw AdapterError.invalidOrder(`Unknown row ID in rowOrder: ${id}`);
      }
    }
    table.rowOrder = rowIds;
  }

  // ===========================================================================
  // Bulk Operations
  // ===========================================================================

  async bulkCreateRecords(baseId: string, tableId: string, records: Record<string, Value>[]): Promise<Row[]> {
    const table = this.requireTable(baseId, tableId);
    const rows = this.requireRows(baseId, tableId);
    const timestamp = this.now();

    const created: Row[] = [];
    for (const fields of records) {
      const newRow: Row = {
        id: this.generateId('rec'),
        fields,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      recomputeRow(newRow, table.fields);
      rows.push(newRow);
      created.push(newRow);
    }
    return created;
  }

  async bulkUpdateRecords(baseId: string, tableId: string, records: Array<{ id: string; fields: Record<string, Value> }>): Promise<Row[]> {
    const table = this.requireTable(baseId, tableId);
    const allRows = this.requireRows(baseId, tableId);
    const timestamp = this.now();

    const updated: Row[] = [];
    for (const { id, fields } of records) {
      const row = allRows.find((r) => r.id === id);
      if (!row) throw AdapterError.notFound('Record', id);
      row.fields = { ...row.fields, ...fields };
      row.updatedAt = timestamp;
      recomputeRow(row, table.fields);
      updated.push(row);
    }
    return updated;
  }

  async bulkDeleteRecords(baseId: string, tableId: string, ids: string[]): Promise<number> {
    this.requireTable(baseId, tableId);
    const rows = this.requireRows(baseId, tableId);
    let deleted = 0;

    for (const id of ids) {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) throw AdapterError.notFound('Record', id);
      rows.splice(idx, 1);
      deleted++;
    }
    return deleted;
  }

  // ===========================================================================
  // Views
  // ===========================================================================

  private viewKey(baseId: string, tableId: string): string {
    return `${baseId}:${tableId}`;
  }

  async listViews(baseId: string, tableId: string): Promise<View[]> {
    this.requireTable(baseId, tableId);
    return this.views.get(this.viewKey(baseId, tableId)) ?? [];
  }

  async getView(baseId: string, tableId: string, viewId: string): Promise<View> {
    this.requireTable(baseId, tableId);
    const views = this.views.get(this.viewKey(baseId, tableId)) ?? [];
    const view = views.find((v) => v.id === viewId);
    if (!view) throw AdapterError.notFound('View', viewId);
    return view;
  }

  async createView(baseId: string, tableId: string, input: CreateViewInput): Promise<View> {
    this.requireTable(baseId, tableId);
    const key = this.viewKey(baseId, tableId);
    const views = this.views.get(key) ?? [];

    const view: View = {
      id: this.generateId('view'),
      name: input.name,
      type: input.type ?? 'grid',
      tableId,
      isDefault: views.length === 0,
      filter: input.filter,
      sort: input.sort,
      fieldSelection: input.fieldSelection,
      fieldWidths: input.fieldWidths,
      rowHeight: input.rowHeight,
      showRowNumbers: input.showRowNumbers,
    };

    views.push(view);
    this.views.set(key, views);
    return view;
  }

  async updateView(baseId: string, tableId: string, viewId: string, input: UpdateViewInput): Promise<View> {
    this.requireTable(baseId, tableId);
    const views = this.views.get(this.viewKey(baseId, tableId)) ?? [];
    const view = views.find((v) => v.id === viewId);
    if (!view) throw AdapterError.notFound('View', viewId);

    if (input.name !== undefined) view.name = input.name;
    if (input.filter !== undefined) view.filter = input.filter ?? undefined;
    if (input.sort !== undefined) view.sort = input.sort ?? undefined;
    if (input.fieldSelection !== undefined) view.fieldSelection = input.fieldSelection ?? undefined;
    if (input.rowOrder !== undefined) view.rowOrder = input.rowOrder ?? undefined;
    if (input.fieldWidths !== undefined) view.fieldWidths = input.fieldWidths;
    if (input.rowHeight !== undefined) view.rowHeight = input.rowHeight;
    if (input.showRowNumbers !== undefined) view.showRowNumbers = input.showRowNumbers;

    return view;
  }

  async deleteView(baseId: string, tableId: string, viewId: string): Promise<void> {
    this.requireTable(baseId, tableId);
    const key = this.viewKey(baseId, tableId);
    const views = this.views.get(key) ?? [];
    const idx = views.findIndex((v) => v.id === viewId);
    if (idx === -1) throw AdapterError.notFound('View', viewId);
    views.splice(idx, 1);
    this.views.set(key, views);
  }

  // ===========================================================================
  // Files
  // ===========================================================================

  async uploadFile(file: Uint8Array, filename: string, mimeType: string): Promise<Attachment> {
    const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.files.set(id, {
      data: file,
      filename,
      mimeType,
      size: file.byteLength,
      createdAt: this.now(),
    });

    return {
      id,
      filename,
      url: `/api/files/${id}`,
      mimeType,
      size: file.byteLength,
      thumbnailUrl: mimeType.startsWith('image/') ? `/api/files/${id}/thumbnail` : undefined,
    };
  }

  async getFile(fileId: string): Promise<{ data: Uint8Array; mimeType: string; filename: string }> {
    const file = this.files.get(fileId);
    if (!file) throw AdapterError.notFound('File', fileId);
    return { data: file.data, mimeType: file.mimeType, filename: file.filename };
  }

  async getFileThumbnail(fileId: string): Promise<{ data: Uint8Array; mimeType: string }> {
    const file = this.files.get(fileId);
    if (!file) throw AdapterError.notFound('File', fileId);
    if (!file.mimeType.startsWith('image/')) {
      throw AdapterError.invalidInput('Not an image file');
    }
    // In memory adapter, thumbnail is the same as the original
    return { data: file.data, mimeType: file.mimeType };
  }

  async getFileInfo(fileId: string): Promise<Attachment & { createdAt: string }> {
    const file = this.files.get(fileId);
    if (!file) throw AdapterError.notFound('File', fileId);
    return {
      id: fileId,
      filename: file.filename,
      url: `/api/files/${fileId}`,
      mimeType: file.mimeType,
      size: file.size,
      thumbnailUrl: file.mimeType.startsWith('image/') ? `/api/files/${fileId}/thumbnail` : undefined,
      createdAt: file.createdAt,
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.files.has(fileId)) throw AdapterError.notFound('File', fileId);
    this.files.delete(fileId);
  }

  // ===========================================================================
  // Settings
  // ===========================================================================

  async getSettings(): Promise<MonkeyTabSettings> {
    return { ...this.settings };
  }

  async updateSettings(settings: Partial<MonkeyTabSettings>): Promise<MonkeyTabSettings> {
    this.settings = { ...this.settings, ...settings };
    return { ...this.settings };
  }

  // ===========================================================================
  // Extensions
  // ===========================================================================

  extensions(): AdapterExtension[] {
    return [];
  }
}
