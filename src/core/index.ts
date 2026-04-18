/**
 * @monkeytab/core browser-safe exports.
 * Same as index.ts but without mt-config.ts (Deno-only file operations).
 */

// Types
export type {
  BaseSummary,
  BaseSpec,
  TableSpec,
  FieldSpec,
  FieldType,
  SelectOption,
  Value,
  LinkValue,
  Row,
  FieldOptions,
  TextFieldOptions,
  NumberFieldOptions,
  BooleanFieldOptions,
  DateFieldOptions,
  SingleSelectFieldOptions,
  MultiSelectFieldOptions,
  AttachmentFieldOptions,
  ImageFieldOptions,
  AudioFieldOptions,
  VideoFieldOptions,
  ColorFieldOptions,
  RatingFieldOptions,
  ComputedFieldOptions,
  FieldTypeOptionsMap,
  TypedFieldSpec,
  Attachment,
  Pagination,
  ApiResponse,
  ApiError,
  AdapterInfo,
  AdapterCapabilities,
  TrashedTable,
  MonkeyTabSettings,
  TableDisplaySettings,
  RowHeight,
  ErrorCode,
  BaseFieldType,
  FieldTypeDefinition,
} from './types.ts';

export { DEFAULT_SETTINGS, mergeSettings } from './types.ts';

// Client
export type {
  Client,
  QueryArgs,
  SortSpec,
  FilterOperator,
  FilterCondition,
  FilterGroup,
  CreateBaseArgs,
  UpdateBaseArgs,
  CreateTableArgs,
  RenameTableArgs,
  DeleteTableArgs,
  CreateFieldArgs,
  CreateRecordArgs,
  UpdateRecordArgs,
  DeleteRecordArgs,
  GetRecordArgs,
  RenameFieldArgs,
  DeleteFieldArgs,
  UpdateFieldOptionsArgs,
  UpdateColumnOrderArgs,
  UpdateRowOrderArgs,
} from './client.ts';

export { ClientError, NotFoundError, ValidationError } from './client.ts';

// Adapter
export type {
  Adapter,
  QueryParams,
  QueryResult,
  CreateBaseInput,
  UpdateBaseInput,
  CreateTableInput,
  UpdateTableInput,
  CreateFieldInput,
  UpdateFieldInput,
  View,
  CreateViewInput,
  UpdateViewInput,
  AdapterExtension,
} from './adapter.ts';

export { AdapterError } from './adapter.ts';

// Query utilities
export {
  applyFilter,
  applySearch,
  applySort,
  applyPagination,
  compareValues,
} from './query-utils.ts';

// Type inference
export type { InferredField } from './infer.ts';
export { inferFields } from './infer.ts';

// Type coercion
export type { CoercionResult, TypeChangeValidation } from './coerce.ts';
export { coerceValue, validateTypeChange, generateSelectOptions } from './coerce.ts';

// Functions (computed fields)
export type { FunctionDef } from './functions.ts';
export { FunctionRegistry, functionRegistry, BUILT_IN_FUNCTIONS, computeFunction, listFunctions, getFunction, recomputeRow, recomputeAllRows } from './functions.ts';

// Constraints
export type { FieldTypeConstraint, ConstraintConfig, ConstraintViolation } from './constraints.ts';
export { ConstraintRegistry, constraintRegistry, BUILT_IN_CONSTRAINTS } from './constraints.ts';

// Realtime / multiplayer
export type {
  RemoteChangeEvent,
  RowCreatedEvent,
  RowUpdatedEvent,
  RowDeletedEvent,
  PresenceUser,
} from './realtime.ts';
