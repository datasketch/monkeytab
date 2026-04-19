/**
 * MonkeyTableFromConfig — façade that accepts a flat JSON config and forwards
 * everything non-serializable (handlers, presence, custom renderers, ref) as
 * ordinary React props.
 *
 *   <MonkeyTableFromConfig
 *     config={{ columns, rows, settings }}
 *     onChange={handle}
 *   />
 */
import { forwardRef } from 'react';
import type { ForwardedRef } from 'react';
import { MonkeyTable, type MonkeyTableHandle, type MonkeyTableProps } from './MonkeyTable.tsx';
import { resolveConfig, type MonkeyTableConfig } from './config.ts';

/**
 * Anything that can't live in JSON: React handlers, presence data, custom
 * function/constraint/renderer/editor registrations, selection actions,
 * upload hook, column lifecycle callbacks. These stay as component props.
 */
export type MonkeyTableRuntimeProps = Pick<MonkeyTableProps,
  | 'onChange' | 'onRowsChange' | 'onSelectionChange' | 'onRowClick'
  | 'onCellChange' | 'onActiveCellChange'
  | 'onRowCreate' | 'onCellSave' | 'onRowDelete' | 'onHookError'
  | 'onGroupByChange' | 'onColorByChange' | 'onSortChange' | 'onPageChange'
  | 'onColumnRename' | 'onColumnDelete' | 'onColumnCreate'
  | 'onColumnChangeType' | 'onColumnUpdateOptions'
  | 'onUpload'
  | 'rowKey'
  | 'selectionActions'
  | 'presence'
  | 'functions' | 'constraints' | 'renderers' | 'editors'
>;

export interface MonkeyTableFromConfigProps extends MonkeyTableRuntimeProps {
  config: MonkeyTableConfig;
}

function MonkeyTableFromConfigInner(
  { config, ...runtime }: MonkeyTableFromConfigProps,
  ref: ForwardedRef<MonkeyTableHandle>,
) {
  const resolved = resolveConfig(config);
  // Runtime `rowKey` (including the function form) takes precedence over any
  // string in the config — lets consumers escalate from JSON to code gradually.
  return <MonkeyTable ref={ref} {...resolved} {...runtime} />;
}

export const MonkeyTableFromConfig = forwardRef<MonkeyTableHandle, MonkeyTableFromConfigProps>(
  MonkeyTableFromConfigInner,
);
MonkeyTableFromConfig.displayName = 'MonkeyTableFromConfig';
