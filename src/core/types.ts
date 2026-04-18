/**
 * Core domain types for MonkeyTab
 */

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

// Field Type Options - Each field type has its own configuration schema

export interface TextFieldOptions {
  maxLength?: number;
  multiline?: boolean;
  placeholder?: string;
  richText?: boolean;  // Enable markdown rendering
  json?: boolean;      // Render value as formatted JSON
  /** Popup editor width (pixels or any CSS length string like "50vw"). */
  popupWidth?: number | string;
  /** Popup textarea min height (pixels or CSS length). */
  popupMinHeight?: number | string;
  /** Popup textarea max height (pixels or CSS length). */
  popupMaxHeight?: number | string;
}

export interface NumberFieldOptions {
  precision?: number; // Decimal places
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
  /** Color tint for true state icon (default: '#22c55e') */
  trueColor?: string;
  /** Color tint for false state icon (default: '#d1d5db') */
  falseColor?: string;
}

export interface DateFieldOptions {
  format?: 'date' | 'datetime' | 'time';
  dateFormat?: string; // e.g., 'YYYY-MM-DD', 'MM/DD/YYYY'
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
  maxFileSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types or extensions
}

export interface ImageFieldOptions {
  maxImages?: number;
  maxFileSize?: number; // in bytes
  displaySize?: 'small' | 'medium' | 'large'; // thumbnail size in grid
}

export interface AudioFieldOptions {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
}

export interface VideoFieldOptions {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
}

export interface ColorFieldOptions {
  format?: 'hex' | 'rgb' | 'hsl';
}

export interface RatingFieldOptions {
  max?: number; // default 5
  icon?: 'star' | 'heart' | 'circle';
}

export interface ComputedFieldOptions {
  functionName: string;
  inputFieldIds: string[];
  params?: Record<string, unknown>;
}

// Union type for all field options
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

// Map field types to their options
export interface FieldTypeOptionsMap {
  Text: TextFieldOptions;
  Number: NumberFieldOptions;
  Boolean: BooleanFieldOptions;
  Date: DateFieldOptions;
  SingleSelect: SingleSelectFieldOptions;
  MultiSelect: MultiSelectFieldOptions;
  Attachment: AttachmentFieldOptions;
  Image: ImageFieldOptions;
  Email: TextFieldOptions;
  URL: TextFieldOptions;
  Phone: TextFieldOptions;
  Audio: AudioFieldOptions;
  Video: VideoFieldOptions;
  Color: ColorFieldOptions;
  Rating: RatingFieldOptions;
  Computed: ComputedFieldOptions;
}

// =============================================================================
// Base & Table Schema
// =============================================================================

export interface BaseSummary {
  id: string;
  label: string;
  tableCount: number;
}

export interface BaseSpec {
  id: string;
  label: string;
  tables: TableSpec[];
}

export interface TableSpec {
  id: string;
  label: string;
  fields: FieldSpec[];
  primaryFieldId?: string;
  columnOrder?: string[]; // Field IDs in display order (if not set, use fields array order)
  rowOrder?: string[]; // Row IDs in display order for manual sorting (if not set, use default order)
  display?: TableDisplaySettings;
}

export interface FieldSpec {
  id: string;
  label: string;
  type: FieldType;
  options?: FieldOptions;
  /** When true, a new row cannot be created with this field missing.
   *  Missing = null, undefined, empty string, or empty array. `0` and `false` count as present. */
  required?: boolean;
}

// Helper type to get strongly-typed field with specific options
export interface TypedFieldSpec<T extends FieldType> {
  id: string;
  label: string;
  type: T;
  options?: FieldTypeOptionsMap[T];
  required?: boolean;
}

// =============================================================================
// Values & Rows
// =============================================================================

/** A URL with an optional display label */
export interface LinkValue {
  url: string;
  label?: string;
}

export type Value = string | number | boolean | null | string[] | Attachment[] | LinkValue; // string[] for MultiSelect, Attachment[] for Attachment/Image, LinkValue for URL fields

export interface Row {
  id: string;
  fields: Record<string, Value>;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
  /** UI-only transient flag: true while a consumer-supplied async hook is in flight.
   *  Never persisted by adapters; set by useCreateRecord while onRowCreate is pending. */
  pending?: boolean;
  /** UI-only transient flag: true while the row exists only in the local cache
   *  (user clicked Add but hasn't filled in required fields yet).
   *  Never persisted by adapters; cleared once onRowCreate resolves. */
  draft?: boolean;
}

// =============================================================================
// Pagination & Response Envelope
// =============================================================================

export interface Pagination {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// =============================================================================
// Error Codes
// =============================================================================

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'VALIDATION_ERROR'
  | 'INVALID_ORDER'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'CONFLICT'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'TYPE_COERCION_FAILED'
  | 'INTERNAL_ERROR'
  | 'READ_ONLY';

// =============================================================================
// Adapter Info
// =============================================================================

export interface AdapterInfo {
  label: string;
  version: string;
  capabilities: AdapterCapabilities;
  extensions?: string[];                    // IDs of registered extensions
  fieldTypes?: FieldTypeDefinition[];       // custom field type registrations
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
  bulk?: boolean;
}

// =============================================================================
// Custom Field Type Definitions
// =============================================================================

export type BaseFieldType = 'Text' | 'Number' | 'Boolean' | 'Date' | 'SingleSelect' | 'MultiSelect' | 'Attachment' | 'Image' | 'Email' | 'URL' | 'Phone' | 'Audio' | 'Video' | 'Color' | 'Rating';

export interface FieldTypeDefinition {
  type: string;                  // unique identifier, e.g. "Email", "Rating"
  label: string;                 // human-readable display name
  baseType: BaseFieldType;       // which base type to use for rendering fallback
  icon?: string;                 // icon identifier for the field type picker
  category?: string;             // grouping in field type picker
  description?: string;

  defaultOptions?: FieldOptions;

  supportsSort: boolean;
  supportsFilter: boolean;
  filterOperators?: string[];

  readOnly?: boolean;            // for system-populated fields
}

// =============================================================================
// Attachment Type
// =============================================================================

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  thumbnailUrl?: string;
}

// =============================================================================
// Trash
// =============================================================================

export interface TrashedTable {
  trashId: string;      // unique ID: "{timestamp}_{filename}"
  tableLabel: string;   // original table label
  fileName: string;     // original data file name
  deletedAt: string;    // ISO timestamp
}

// =============================================================================
// Settings
// =============================================================================

export type RowHeight = 'short' | 'medium' | 'tall' | 'extra-tall' | 'fit';

export interface MonkeyTabSettings {
  // Permissions
  readOnly?: boolean;
  allowCreateTable?: boolean;
  allowDeleteTable?: boolean;
  allowCreateField?: boolean;
  allowDeleteField?: boolean;
  allowCreateRecord?: boolean;
  allowColumnReorder?: boolean;
  allowMultiColumnDrag?: boolean;
  confirmBeforeDelete?: boolean;

  // Display
  defaultRowHeight?: RowHeight;
  defaultShowRowNumbers?: boolean;
  defaultCompactMode?: boolean;

  // Toolbar visibility
  showToolbar?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showRowHeightControl?: boolean;
  showRowNumbersControl?: boolean;
  showAddRowButton?: boolean;

  // Locale & formatting
  locale?: string;              // BCP 47 locale tag, e.g. 'en-US', 'es-CO', 'ja-JP'
  language?: string;            // UI language override (defaults to locale primary subtag)
  dateDisplayFormat?: 'iso' | 'locale' | 'relative';
  numberDecimalPlaces?: number;
  numberThousandsSeparator?: boolean;
  currencyCode?: string;        // ISO 4217 currency code, e.g. 'USD', 'EUR', 'COP'
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';

  // Multi-table defaults
  newTableColumns?: number;
  newTableRows?: number;
  newTableDefaultFieldType?: FieldType;

  // Advanced
  functionsEndpoint?: string | null;
}

export const DEFAULT_SETTINGS: Required<MonkeyTabSettings> = {
  // Permissions
  readOnly: false,
  allowCreateTable: true,
  allowDeleteTable: true,
  allowCreateField: true,
  allowDeleteField: true,
  allowCreateRecord: true,
  allowColumnReorder: true,
  allowMultiColumnDrag: true,
  confirmBeforeDelete: true,

  // Display
  defaultRowHeight: 'medium',
  defaultShowRowNumbers: false,
  defaultCompactMode: false,

  // Toolbar visibility
  showToolbar: true,
  showSearch: true,
  showFilters: true,
  showRowHeightControl: true,
  showRowNumbersControl: true,
  showAddRowButton: true,

  // Locale & formatting
  locale: 'en-US',
  language: 'en',
  dateDisplayFormat: 'iso',
  numberDecimalPlaces: 2,
  numberThousandsSeparator: false,
  currencyCode: 'USD',
  currencyDisplay: 'symbol',

  // Multi-table defaults
  newTableColumns: 4,
  newTableRows: 5,
  newTableDefaultFieldType: 'Text',

  // Advanced
  functionsEndpoint: null,
};

export function mergeSettings(saved: MonkeyTabSettings): Required<MonkeyTabSettings> {
  return { ...DEFAULT_SETTINGS, ...saved };
}

// =============================================================================
// Table Display Settings
// =============================================================================

export interface TableDisplaySettings {
  rowHeight?: RowHeight;
  showRowNumbers?: boolean;
  columnWidths?: Record<string, number>;
  hiddenColumns?: string[];
  sort?: { fieldId: string; direction: 'asc' | 'desc' };
}
