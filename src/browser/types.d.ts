/**
 * @datasketch/monkeytab — Type declarations
 *
 * Hand-crafted public API types for npm consumers.
 */

import type { ReactElement } from 'react';

// =============================================================================
// I18n — String catalog for translation overrides
// =============================================================================

/**
 * All user-facing string keys in MonkeyTab (288 keys).
 * Use `Partial<I18nStrings>` with the `translations` prop to override any label.
 * Interpolation uses `{paramName}` placeholders.
 */
export interface I18nStrings {
  // Toolbar
  'toolbar.search.placeholder': string;
  'toolbar.filter': string;
  'toolbar.rowNumbers': string;
  'toolbar.showRowNumbers': string;
  'toolbar.addRow': string;
  'toolbar.addRows': string;
  'toolbar.adding': string;
  'toolbar.delete': string;
  'toolbar.deleteSelected': string;
  'toolbar.records': string;
  'toolbar.selected': string;
  'toolbar.rowHeight.short': string;
  'toolbar.rowHeight.medium': string;
  'toolbar.rowHeight.tall': string;
  'toolbar.rowHeight.extraTall': string;
  'toolbar.rowHeight.fit': string;
  // Grid
  'grid.empty': string;
  'grid.editing': string;
  'grid.loading': string;
  'grid.loadingTable': string;
  'grid.tableNotFound': string;
  'grid.saving': string;
  'grid.showing': string;
  // Column
  'column.rename': string;
  'column.customize': string;
  'column.changeType': string;
  'column.sortAZ': string;
  'column.sortZA': string;
  'column.hide': string;
  'column.delete': string;
  'column.options': string;
  'column.back': string;
  'column.validating': string;
  'column.deleteConfirm': string;
  'column.renamePrompt': string;
  'column.hiddenCount': string;
  'column.hiddenHeader': string;
  'column.convert.title': string;
  'column.convert.message': string;
  'column.convert.compatible': string;
  'column.convert.incompatible': string;
  'column.convert.cancel': string;
  'column.convert.confirm': string;
  'column.convert.confirmPrompt': string;
  // Row
  'row.dragToReorder': string;
  'row.select': string;
  'row.options': string;
  'row.view': string;
  'row.duplicate': string;
  'row.insert': string;
  'row.delete': string;
  'row.deleteConfirm': string;
  // Undo / redo
  'undo.cellEdit': string;
  'redo.cellEdit': string;
  'undo.rowCreate': string;
  'redo.rowCreate': string;
  'undo.rowDelete': string;
  'redo.rowDelete': string;
  'undo.fieldCreate': string;
  'redo.fieldCreate': string;
  'undo.fieldDelete': string;
  'redo.fieldDelete': string;
  // Context menu
  'context.clearCell': string;
  'context.copy': string;
  'context.back': string;
  // Copy formats
  'copy.value': string;
  'copy.url': string;
  'copy.label': string;
  'copy.both': string;
  'copy.markdown': string;
  'copy.displayText': string;
  'copy.email': string;
  'copy.mailto': string;
  'copy.number': string;
  'copy.tel': string;
  'copy.names': string;
  'copy.json': string;
  // Editors (shared)
  'editor.cancel': string;
  'editor.done': string;
  'editor.save': string;
  'editor.escapeToCancel': string;
  'editor.uploading': string;
  'editor.uploadError': string;
  // Text editor
  'editor.text.title': string;
  'editor.text.charCount': string;
  // Date editor
  'editor.date.placeholder': string;
  'editor.date.openPicker': string;
  // Bool
  'bool.yes': string;
  'bool.no': string;
  // Select
  'select.clear': string;
  'select.clearAll': string;
  'select.placeholder': string;
  'select.selected': string;
  // Image editor
  'editor.image.header': string;
  'editor.image.urlPlaceholder': string;
  'editor.image.remove': string;
  'editor.image.copyUrl': string;
  'editor.image.openTab': string;
  'editor.image.choose': string;
  'editor.image.addMore': string;
  'editor.image.constraints': string;
  'editor.image.loadError': string;
  // Audio editor
  'editor.audio.header': string;
  'editor.audio.urlPlaceholder': string;
  'editor.audio.remove': string;
  'editor.audio.choose': string;
  'editor.audio.addMore': string;
  'editor.audio.constraints': string;
  // Video editor
  'editor.video.header': string;
  'editor.video.urlPlaceholder': string;
  'editor.video.pasteUrl': string;
  'editor.video.addButton': string;
  'editor.video.openLink': string;
  'editor.video.uploadFile': string;
  'editor.video.remove': string;
  'editor.video.choose': string;
  'editor.video.addMore': string;
  'editor.video.constraints': string;
  // Attachment editor
  'editor.attachment.header': string;
  'editor.attachment.fileBadge': string;
  'editor.attachment.choose': string;
  'editor.attachment.constraints': string;
  // URL editor
  'editor.url.placeholder': string;
  'editor.url.labelPlaceholder': string;
  'editor.url.addLabel': string;
  // Color editor
  'editor.color.placeholder': string;
  'editor.color.presets': string;
  // Rating editor
  'editor.rating.instruction': string;
  // Date renderer
  'renderer.date.invalid': string;
  // Filter
  'filter.title': string;
  'filter.where': string;
  'filter.and': string;
  'filter.or': string;
  'filter.apply': string;
  'filter.clearAll': string;
  'filter.add': string;
  'filter.remove': string;
  'filter.valuePlaceholder': string;
  'filter.true': string;
  'filter.false': string;
  'filter.op.equals': string;
  'filter.op.notEquals': string;
  'filter.op.lt': string;
  'filter.op.lte': string;
  'filter.op.gt': string;
  'filter.op.gte': string;
  'filter.op.contains': string;
  'filter.op.notContains': string;
  'filter.op.startsWith': string;
  'filter.op.endsWith': string;
  'filter.op.isEmpty': string;
  'filter.op.isNotEmpty': string;
  'filter.op.isAnyOf': string;
  'filter.op.isNoneOf': string;
  // Pagination
  'pagination.showing': string;
  'pagination.showingAll': string;
  'pagination.previous': string;
  'pagination.next': string;
  'pagination.page': string;
  'pagination.loadMore': string;
  'pagination.loading': string;
  'pagination.rowCount': string;
  // Sort (type-aware)
  'column.sortAsc.Number': string;
  'column.sortDesc.Number': string;
  'column.sortAsc.Date': string;
  'column.sortDesc.Date': string;
  'column.sortAsc.Boolean': string;
  'column.sortDesc.Boolean': string;
  'column.sortAsc.Rating': string;
  'column.sortDesc.Rating': string;
  'column.sortNone': string;
  // Formula
  'formula.title.add': string;
  'formula.title.edit': string;
  'formula.fieldName': string;
  'formula.function': string;
  'formula.inputs': string;
  'formula.parameters': string;
  'formula.loading': string;
  'formula.namePlaceholder': string;
  'formula.selectColumn': string;
  'formula.addField': string;
  'formula.update': string;
  'formula.category.text': string;
  'formula.category.number': string;
  'formula.category.date': string;
  'formula.category.logic': string;
  'formula.input': string;
  // Record detail
  'record.title': string;
  'record.close': string;
  'record.empty': string;
  'record.created': string;
  'record.updated': string;
  // Settings
  'settings.title': string;
  'settings.tab.general': string;
  'settings.tab.display': string;
  'settings.tab.formatting': string;
  'settings.tab.defaults': string;
  'settings.readOnly': string;
  'settings.readOnly.desc': string;
  'settings.allowCreateTable': string;
  'settings.allowCreateTable.desc': string;
  'settings.allowDeleteTable': string;
  'settings.allowDeleteTable.desc': string;
  'settings.allowCreateField': string;
  'settings.allowCreateField.desc': string;
  'settings.allowDeleteField': string;
  'settings.allowDeleteField.desc': string;
  'settings.allowCreateRecord': string;
  'settings.allowCreateRecord.desc': string;
  'settings.confirmBeforeDelete': string;
  'settings.confirmBeforeDelete.desc': string;
  'settings.allowColumnReorder': string;
  'settings.allowColumnReorder.desc': string;
  'settings.allowMultiColumnDrag': string;
  'settings.allowMultiColumnDrag.desc': string;
  'settings.defaultRowHeight': string;
  'settings.defaultRowHeight.desc': string;
  'settings.showRowNumbers': string;
  'settings.showRowNumbers.desc': string;
  'settings.compactMode': string;
  'settings.compactMode.desc': string;
  'settings.dateDisplayFormat': string;
  'settings.dateDisplayFormat.desc': string;
  'settings.dateFormat.iso': string;
  'settings.dateFormat.locale': string;
  'settings.dateFormat.relative': string;
  'settings.numberDecimalPlaces': string;
  'settings.numberDecimalPlaces.desc': string;
  'settings.thousandsSeparator': string;
  'settings.thousandsSeparator.desc': string;
  'settings.defaultColumns': string;
  'settings.defaultColumns.desc': string;
  'settings.defaultRows': string;
  'settings.defaultRows.desc': string;
  'settings.defaultFieldType': string;
  'settings.defaultFieldType.desc': string;
  // Add field
  'addField.title': string;
  'addField.header': string;
  'addField.placeholder': string;
  'addField.typeLabel': string;
  'addField.submit': string;
  'addField.computed': string;
  // Field type labels
  'fieldType.Text': string;
  'fieldType.Number': string;
  'fieldType.Boolean': string;
  'fieldType.Date': string;
  'fieldType.SingleSelect': string;
  'fieldType.MultiSelect': string;
  'fieldType.Attachment': string;
  'fieldType.Image': string;
  'fieldType.Audio': string;
  'fieldType.Video': string;
  'fieldType.Color': string;
  'fieldType.Rating': string;
  'fieldType.Email': string;
  'fieldType.URL': string;
  'fieldType.Phone': string;
  'fieldType.Computed': string;
  // Index signature for forward-compatibility
  [key: string]: string;
}

// =============================================================================
// Field Types & Options
// =============================================================================

export type FieldType =
  | 'Text'
  | 'Number'
  | 'Boolean'
  | 'Date'
  | 'SingleSelect'
  | 'MultiSelect'
  | 'Attachment'
  | 'Image'
  | 'Email'
  | 'URL'
  | 'Phone'
  | 'Audio'
  | 'Video'
  | 'Color'
  | 'Rating'
  | 'Computed';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

export interface TextFieldOptions {
  maxLength?: number;
  multiline?: boolean;
  placeholder?: string;
  richText?: boolean;
  json?: boolean;
}

export interface NumberFieldOptions {
  precision?: number;
  format?: 'decimal' | 'percentage' | 'currency';
  currencySymbol?: string;
  /** ISO 4217 currency code (e.g. 'USD', 'EUR', 'COP'). Used when format is 'currency'. */
  currencyCode?: string;
  /** How the currency is rendered. Used when format is 'currency'. */
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  min?: number;
  max?: number;
  thousandsSeparator?: boolean;
}

export interface BooleanFieldOptions {
  displayAs?: 'checkbox' | 'toggle' | 'yesno' | 'icon';
  trueLabel?: string;
  falseLabel?: string;
  /** Image URL for true state (used when displayAs is 'icon') */
  trueIcon?: string;
  /** Image URL for false state (used when displayAs is 'icon') */
  falseIcon?: string;
  /** Color for true state icon (default: '#22c55e') */
  trueColor?: string;
  /** Color for false state icon (default: '#d1d5db') */
  falseColor?: string;
}

export interface DateFieldOptions {
  format?: 'date' | 'datetime' | 'time';
  dateFormat?: string;
  includeTime?: boolean;
  use24Hour?: boolean;
}

export interface SingleSelectFieldOptions {
  options: SelectOption[];
}

export interface MultiSelectFieldOptions {
  options: SelectOption[];
  maxSelections?: number;
}

export interface AttachmentFieldOptions {
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
}

export interface AudioFieldOptions {
  maxFiles?: number;
  maxFileSize?: number;
}

export interface ImageFieldOptions {
  maxImages?: number;
  maxFileSize?: number;
  displaySize?: 'small' | 'medium' | 'large';
}

export interface VideoFieldOptions {
  maxFiles?: number;
  maxFileSize?: number;
}

export interface ColorFieldOptions {
  format?: 'hex' | 'rgb' | 'hsl';
}

export interface RatingFieldOptions {
  max?: number;
  icon?: 'star' | 'heart' | 'circle';
}

export interface ComputedFieldOptions {
  functionName: string;
  inputFieldIds: string[];
  params?: Record<string, unknown>;
}

export type FieldOptions =
  | TextFieldOptions
  | NumberFieldOptions
  | BooleanFieldOptions
  | DateFieldOptions
  | SingleSelectFieldOptions
  | MultiSelectFieldOptions
  | AttachmentFieldOptions
  | ImageFieldOptions
  | AudioFieldOptions
  | VideoFieldOptions
  | ColorFieldOptions
  | RatingFieldOptions
  | ComputedFieldOptions;

export interface FieldSpec {
  id: string;
  label: string;
  type: FieldType;
  options?: FieldOptions;
}

// =============================================================================
// Data Types
// =============================================================================

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  thumbnailUrl?: string;
}

export interface LinkValue {
  url: string;
  label?: string;
}

export type Value = string | number | boolean | null | string[] | Attachment[] | LinkValue;

export interface Row {
  id: string;
  fields: Record<string, Value>;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Schema Types
// =============================================================================

export interface TableSpec {
  id: string;
  label: string;
  fields: FieldSpec[];
  primaryFieldId?: string;
  columnOrder?: string[];
  rowOrder?: string[];
  display?: TableDisplaySettings;
}

export interface BaseSpec {
  id: string;
  label: string;
  tables: TableSpec[];
}

export interface BaseSummary {
  id: string;
  label: string;
  tableCount: number;
}

export interface TableDisplaySettings {
  rowHeight?: RowHeightOption;
  showRowNumbers?: boolean;
}

// =============================================================================
// Query Types
// =============================================================================

export interface FilterCondition {
  fieldId: string;
  operator: string;
  value?: Value;
}

export interface FilterGroup {
  conjunction: 'and' | 'or';
  conditions: (FilterCondition | FilterGroup)[];
}

export interface SortSpec {
  fieldId: string;
  direction: 'asc' | 'desc';
}

// =============================================================================
// Settings & Capabilities
// =============================================================================

export interface MonkeyTabSettings {
  // Permissions
  readOnly?: boolean;
  allowCreateField?: boolean;
  allowDeleteField?: boolean;
  allowCreateRecord?: boolean;
  allowColumnReorder?: boolean;
  allowMultiColumnDrag?: boolean;
  confirmBeforeDelete?: boolean;
  // Display
  defaultRowHeight?: RowHeightOption;
  defaultShowRowNumbers?: boolean;
  defaultCompactMode?: boolean;
  // Toolbar
  showToolbar?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showRowHeightControl?: boolean;
  showRowNumbersControl?: boolean;
  showAddRowButton?: boolean;
  // Locale & Formatting
  locale?: string;
  language?: string;
  dateDisplayFormat?: 'iso' | 'locale' | 'relative';
  numberDecimalPlaces?: number;
  numberThousandsSeparator?: boolean;
  currencyCode?: string;
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  // Advanced
  functionsEndpoint?: string | null;
}

export interface AdapterCapabilities {
  sort: boolean;
  filter: boolean;
  search: boolean;
  files: boolean;
  persist: boolean;
  readOnly: boolean;
  views: boolean;
  trash: boolean;
  bulk: boolean;
}

export interface AdapterInfo {
  label: string;
  version: string;
  capabilities: AdapterCapabilities;
}

// =============================================================================
// Component Props
// =============================================================================

export type RowHeightOption = 'short' | 'medium' | 'tall' | 'extra-tall' | 'fit';

// =============================================================================
// Registry Extension Types
// =============================================================================

/** Custom computed function definition for the functionRegistry */
export interface FunctionDef {
  name: string;
  category: 'text' | 'number' | 'date' | 'logic';
  description: string;
  inputTypes: FieldType[];
  params?: Array<{ name: string; type: string; default?: unknown }>;
  compute: (inputs: Value[], params?: Record<string, unknown>) => Value;
}

/** Custom field constraint definition for the constraintRegistry */
export interface FieldTypeConstraint {
  name: string;
  label: string;
  description: string;
  appliesTo: FieldType[];
  params?: Array<{ name: string; type: string; default?: unknown }>;
  validate: (value: Value, params: Record<string, unknown>, field: { id: string; type: FieldType }) => string | null;
}

/** Props received by custom cell renderers */
export interface CellRendererProps {
  value: Value;
  field: FieldSpec;
  rowId: string;
  cellHeight?: number;
}

/** Props received by custom cell editors */
export interface CellEditorProps {
  value: Value;
  field: FieldSpec;
  rowId: string;
  onSave: (value: Value) => void;
  onCancel: () => void;
  /** Consumer-provided file upload handler. Returns the permanent URL. */
  onUpload?: (file: File, fieldType: string) => Promise<string>;
}

/** Custom cell renderer function */
export type CellRendererFn = (value: Value, row: Record<string, Value>, fieldId: string) => React.ReactNode;

export interface MonkeyTableColumn {
  /** Column id (used as key in row data) */
  id: string;
  /** Display label — defaults to id if omitted */
  label?: string;
  /** Field type — defaults to 'Text' */
  type?: FieldType;
  /** Type-specific configuration (e.g., select options, number format) */
  options?: FieldOptions;
  /** Custom icon for the column header — overrides the default type icon */
  icon?: React.ReactNode;
  /** Custom renderer — replaces the default type-aware cell renderer */
  render?: CellRendererFn;
  /** Hide this column from display while keeping data accessible to renderers */
  hidden?: boolean;
  /** Per-column editable flag — false makes this column read-only even when the table is editable */
  editable?: boolean;
  /** Initial column width in pixels (default: 180) */
  width?: number;
  /** Minimum column width in pixels (default: 80) */
  minWidth?: number;
  /** Maximum column width in pixels (default: 600) */
  maxWidth?: number;
  /** Whether this column can be sorted (default: true) */
  sortable?: boolean;
  /** Cell text alignment (default: type-dependent) */
  align?: 'left' | 'center' | 'right';
}

export interface MonkeyTableProps {
  // Data
  columns: MonkeyTableColumn[];
  rows: Array<Record<string, Value>>;
  onChange?: (rows: Array<Record<string, Value>>) => void;
  onRowsChange?: (rows: Row[]) => void;
  /** Called when row checkbox selection changes */
  onSelectionChange?: (selectedRowIds: string[]) => void;
  /** Controlled selection — set selected row IDs externally */
  selectedRowIds?: string[];
  /** Called when a row is clicked (distinct from cell editing) */
  onRowClick?: (row: Record<string, Value>) => void;
  /** Called when a single cell value changes — fires with rowId, fieldId, new and old values */
  onCellChange?: (rowId: string, fieldId: string, newValue: Value, oldValue: Value) => void;
  // Sorting
  /** Controlled sort field */
  sortBy?: string | null;
  /** Controlled sort direction */
  sortDirection?: 'asc' | 'desc' | null;
  /** Called when user changes sort via column header click or menu */
  onSortChange?: (fieldId: string | null, direction: 'asc' | 'desc' | null) => void;
  // Pagination
  /** Total row count from the server. When set, enables pagination UI. */
  totalRows?: number;
  /** Current page (1-based). Controlled. */
  page?: number;
  /** Rows per page (default: 500) */
  pageSize?: number;
  /** Called when user navigates to a different page */
  onPageChange?: (page: number) => void;
  /** Pagination UI style (default: 'simple') */
  paginationMode?: 'simple' | 'load-more';
  /** Whether more data is being fetched */
  paginationLoading?: boolean;
  // Layout
  height?: string | number;
  rowHeight?: RowHeightOption;
  showRowNumbers?: boolean;
  compactMode?: boolean;
  /** Show faint ghost rows/columns to fill the viewport. true = auto, or { rows, columns } for explicit counts. */
  ghostGrid?: boolean | { rows?: number; columns?: number };
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
  // Locale & Formatting
  locale?: string;
  language?: string;
  dateDisplayFormat?: 'iso' | 'locale' | 'relative';
  numberDecimalPlaces?: number;
  numberThousandsSeparator?: boolean;
  currencyCode?: string;
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  // Translations
  translations?: Partial<I18nStrings>;
  // Advanced
  functionsEndpoint?: string | null;
  /** Called when a file is selected in file-type editors. Return the permanent URL after uploading. */
  onUpload?: (file: File, fieldType: string) => Promise<string>;

  // Registry Extensions
  /** Custom computed functions — registered on mount, unregistered on unmount */
  functions?: FunctionDef[];
  /** Custom field constraints — registered on mount, unregistered on unmount */
  constraints?: FieldTypeConstraint[];
  /** Custom type-level renderers — keyed by FieldType, overrides built-in renderers */
  renderers?: Record<string, (props: CellRendererProps) => ReactElement>;
  /** Custom type-level editors — keyed by FieldType, overrides built-in editors */
  editors?: Record<string, (props: CellEditorProps) => ReactElement>;
}

/**
 * Self-contained editable table component.
 * Accepts plain JSON columns + rows, handles virtualization/sort/filter/search internally.
 */
export declare function MonkeyTable(props: MonkeyTableProps): ReactElement;

// =============================================================================
// Advanced / Building Blocks
// =============================================================================

export interface TableViewProps {
  baseId: string;
  tableId: string;
  onNavigate?: (baseId: string, tableId: string) => void;
  onNavigateHome?: () => void;
}

export declare function TableView(props: TableViewProps): ReactElement;

export interface ExtendedClient {
  listBases(): Promise<BaseSummary[]>;
  getBase(baseId: string): Promise<BaseSpec>;
  getTable(baseId: string, tableId: string): Promise<TableSpec>;
  query(baseId: string, tableId: string, params?: Record<string, unknown>): Promise<{ rows: Row[]; total: number }>;
  getRecord(baseId: string, tableId: string, recordId: string): Promise<Row>;
  createRecord(baseId: string, tableId: string, fields: Record<string, Value>): Promise<Row>;
  updateRecord(baseId: string, tableId: string, recordId: string, fields: Record<string, Value>): Promise<Row>;
  deleteRecord(baseId: string, tableId: string, recordId: string): Promise<void>;
  createField(baseId: string, tableId: string, label: string, type: FieldType, options?: FieldOptions): Promise<FieldSpec>;
  updateField(baseId: string, tableId: string, fieldId: string, updates: Partial<FieldSpec>): Promise<FieldSpec>;
  deleteField(baseId: string, tableId: string, fieldId: string): Promise<void>;
  updateColumnOrder(baseId: string, tableId: string, fieldIds: string[]): Promise<void>;
  updateRowOrder(baseId: string, tableId: string, rowIds: string[]): Promise<void>;
  getSettings(): Promise<MonkeyTabSettings>;
  updateSettings(settings: Partial<MonkeyTabSettings>): Promise<MonkeyTabSettings>;
}

export declare class BrowserClient implements ExtendedClient {
  constructor(adapter: unknown);
  listBases(): Promise<BaseSummary[]>;
  getBase(baseId: string): Promise<BaseSpec>;
  getTable(baseId: string, tableId: string): Promise<TableSpec>;
  query(baseId: string, tableId: string, params?: Record<string, unknown>): Promise<{ rows: Row[]; total: number }>;
  getRecord(baseId: string, tableId: string, recordId: string): Promise<Row>;
  createRecord(baseId: string, tableId: string, fields: Record<string, Value>): Promise<Row>;
  updateRecord(baseId: string, tableId: string, recordId: string, fields: Record<string, Value>): Promise<Row>;
  deleteRecord(baseId: string, tableId: string, recordId: string): Promise<void>;
  createField(baseId: string, tableId: string, label: string, type: FieldType, options?: FieldOptions): Promise<FieldSpec>;
  updateField(baseId: string, tableId: string, fieldId: string, updates: Partial<FieldSpec>): Promise<FieldSpec>;
  deleteField(baseId: string, tableId: string, fieldId: string): Promise<void>;
  updateColumnOrder(baseId: string, tableId: string, fieldIds: string[]): Promise<void>;
  updateRowOrder(baseId: string, tableId: string, rowIds: string[]): Promise<void>;
  getSettings(): Promise<MonkeyTabSettings>;
  updateSettings(settings: Partial<MonkeyTabSettings>): Promise<MonkeyTabSettings>;
}

export declare function MonkeyTabClientProvider(props: {
  client: ExtendedClient;
  children: React.ReactNode;
}): ReactElement;

export declare function useClient(): ExtendedClient;

export interface GridProps {
  table: TableSpec;
  rows: Row[];
  rowHeight?: RowHeightOption;
  showRowNumbers?: boolean;
  onCellSave?: (rowId: string, fieldId: string, value: Value) => void;
  onRowDelete?: (rowId: string) => void;
  onRowDuplicate?: (rowId: string) => void;
  onRowView?: (rowId: string) => void;
  onRowClick?: (row: Row) => void;
  onAddRow?: (count?: number, afterRowId?: string) => void;
  onRowsReorder?: (rowIds: string[]) => void;
  onColumnsReorder?: (fieldIds: string[]) => void;
  onSelectionChange?: (selectedRowIds: string[]) => void;
  selectedRowIds?: string[];
  onColumnRename?: (fieldId: string, newLabel: string) => void;
  onColumnDelete?: (fieldId: string) => void;
  onCreateField?: (label: string, type: FieldType) => void;
  customRenderers?: Record<string, (value: Value, row: Row, fieldId: string) => React.ReactNode>;
}

export declare function Grid(props: GridProps): ReactElement;

// =============================================================================
// Pagination
// =============================================================================

export interface PaginationBarProps {
  totalRows: number;
  loadedRows: number;
  page: number;
  pageSize: number;
  mode: 'simple' | 'load-more';
  loading?: boolean;
  saving?: boolean;
  onPageChange: (page: number) => void;
}

export declare function PaginationBar(props: PaginationBarProps): ReactElement;

// =============================================================================
// Embed API
// =============================================================================

/** Serializable view configuration for embedding and permalinks. */
export interface TableViewConfig {
  // Data view
  table?: string;
  columns?: string[];
  sort?: { field: string; direction: 'asc' | 'desc' };
  filters?: EmbedFilter[];
  search?: string;
  page?: number;
  // Layout
  rowHeight?: RowHeightOption;
  compact?: boolean;
  rowNumbers?: boolean;
  ghostGrid?: boolean;
  height?: number;
  // Chrome
  toolbar?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  // Locale
  locale?: string;
  language?: string;
}

/** Simplified filter for URL serialization. */
export interface EmbedFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
  value?: string | number | boolean;
}

/** Shape of the JSON response from the data URL. */
export interface EmbedDataResponse {
  columns: MonkeyTableColumn[];
  rows: Array<Record<string, Value>>;
  totalRows?: number;
}

export interface EmbedMonkeyTableProps {
  /** URL to fetch table data from. Response must match EmbedDataResponse. */
  dataUrl?: string;
  /** Optional auth token — sent as Bearer token in Authorization header */
  authToken?: string;
  /** Transform the fetch response before rendering */
  transformResponse?: (data: unknown) => EmbedDataResponse;
  /** Inline columns — used when dataUrl is not provided */
  columns?: MonkeyTableColumn[];
  /** Inline rows — used when dataUrl is not provided */
  rows?: Array<Record<string, Value>>;
  /** View configuration */
  config?: TableViewConfig;
  /** Read config from the current page's URL search params */
  readParamsFromURL?: boolean;
  /** Called when data fetch fails */
  onError?: (error: Error) => void;
  /** Called when data is loaded successfully */
  onLoad?: (data: EmbedDataResponse) => void;
}

/** Read-only embed component. Fetches data from a URL or accepts inline data. */
export declare function EmbedMonkeyTable(props: EmbedMonkeyTableProps): ReactElement;

/** Serialize a TableViewConfig to URL search params. */
export declare function configToParams(config: TableViewConfig): URLSearchParams;

/** Parse URL search params back to a TableViewConfig. */
export declare function paramsToConfig(params: URLSearchParams): TableViewConfig;
