/**
 * @monkeytab/browser
 * Browser-only MonkeyTab library — no server required.
 */

// Main public API
export { MonkeyTable, type MonkeyTableProps, type MonkeyTableColumn, type CellRendererFn, type MonkeyTableHandle } from './MonkeyTable.tsx';

// Building blocks for advanced use
export { BrowserClient } from './BrowserClient.ts';
export { TableView, type TableViewProps } from './TableView.tsx';

// Re-export context from UI package
export { MonkeyTabClientProvider, useClient } from '../ui/client/ClientContext.tsx';
export type { ExtendedClient, FetchOptions, FunctionInfo, ValidateFieldTypeResult } from '../ui/client/types.ts';

// Re-export i18n for consumers who want custom translations
export { useI18n, type I18nStrings, type I18nContextValue } from '../ui/i18n/index.ts';

// Realtime / multiplayer — consumer-owned WS, hook pushes events into the cache
export { useMonkeyTabSync } from '../ui/hooks/useRealtimeSync.ts';
export { usePresence, usePresenceAtCell } from '../ui/client/PresenceContext.tsx';

// Re-export Grid and PaginationBar for advanced usage
export { Grid, type RowHeightOption, type CellRenderer } from '../ui/components/grid/Grid.tsx';
export { PaginationBar, type PaginationBarProps } from '../ui/components/grid/PaginationBar.tsx';

// Re-export core types for consumers
export type {
  FieldType,
  FieldSpec,
  FieldOptions,
  TableSpec,
  Row,
  Value,
  LinkValue,
  Attachment,
  BaseSpec,
  BaseSummary,
  MonkeyTabSettings,
  TableDisplaySettings,
  SelectOption,
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
  AdapterInfo,
  AdapterCapabilities,
  FilterGroup,
  FilterCondition,
  SortSpec,
  RemoteChangeEvent,
  RowCreatedEvent,
  RowUpdatedEvent,
  RowDeletedEvent,
  PresenceUser,
} from '@monkeytab/core';

// Options catalog for lifecycle tracking
export {
  OPTIONS_CATALOG,
  getOptionsByStatus,
  getOptionsByCategory,
  getOptionsSummary,
  getOptionsOverview,
  getOptionDetail,
  type OptionEntry,
  type OptionLifecycle,
  type OptionCategory,
} from './options-catalog.ts';

// Embed API — read-only embeddable table with view config
export {
  EmbedMonkeyTable,
  type EmbedMonkeyTableProps,
  type EmbedDataResponse,
  type TableViewConfig,
  type EmbedFilter,
  configToParams,
  paramsToConfig,
} from './embed/index.ts';

// Field type catalog for AI agent consumption
export {
  FIELD_TYPE_CATALOG,
  getFieldTypeInfo,
  getFieldTypesByCategory,
  getFieldTypeSummaryMap,
  type FieldTypeCatalogEntry,
} from './field-type-catalog.ts';
