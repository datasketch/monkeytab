import { createContext, useContext, type ReactNode } from 'react';
import type { Value } from '@monkeytab/core';

export type CrudHookKind = 'create' | 'update' | 'delete';

export interface CrudHooks {
  onRowCreate?: (draft: { fields: Record<string, Value> }) => Promise<{ id: string; fields?: Record<string, Value> }>;
  onCellSave?: (rowId: string, fieldId: string, newValue: Value, oldValue: Value) => Promise<void>;
  onRowDelete?: (rowId: string) => Promise<void>;
  onHookError?: (kind: CrudHookKind, err: unknown) => void;
  /** UI: render a per-cell saving indicator while async hooks are in flight. */
  showCellSaveStatus?: boolean;
}

const CrudHooksContext = createContext<CrudHooks>({});

export function CrudHooksProvider({ hooks, children }: { hooks: CrudHooks; children: ReactNode }) {
  return <CrudHooksContext.Provider value={hooks}>{children}</CrudHooksContext.Provider>;
}

export function useCrudHooks(): CrudHooks {
  return useContext(CrudHooksContext);
}
