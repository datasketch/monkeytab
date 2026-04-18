import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useClient } from '../client/ClientContext.tsx';
import { useCrudHooks } from '../client/CrudHooksContext.tsx';
import type { Value, Row, QueryResult, TableSpec, BaseSpec, FieldOptions, FieldType, MonkeyTabSettings, TableDisplaySettings } from '@monkeytab/core';

// =============================================================================
// Record Mutations
// =============================================================================

export function useUpdateRecord(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();
  const hooks = useCrudHooks();

  return useMutation({
    mutationFn: async ({ recordId, fieldId, value, oldValue }: { recordId: string; fieldId: string; value: Value; oldValue?: Value }) => {
      // Consumer persists first. Rejection propagates to onError, which rolls back the optimistic write.
      if (hooks.onCellSave) {
        await hooks.onCellSave(recordId, fieldId, value, oldValue ?? null);
      }
      return client.updateRecord({
        baseId,
        tableId,
        recordId,
        fields: { [fieldId]: value },
        oldValue,
      });
    },

    onMutate: async ({ recordId, fieldId, value }) => {
      await queryClient.cancelQueries({ queryKey: ['rows', baseId, tableId] });

      // Snapshot every rows query (any offset/limit/search/filter/sort combination)
      // so we can roll back on reject.
      const snapshots = queryClient.getQueriesData<QueryResult>({ queryKey: ['rows', baseId, tableId] });

      queryClient.setQueriesData<QueryResult>(
        { queryKey: ['rows', baseId, tableId] },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rows: prev.rows.map((row) =>
              row.id === recordId ? { ...row, fields: { ...row.fields, [fieldId]: value } } : row,
            ),
          };
        },
      );

      return { snapshots };
    },

    onError: (err, _variables, context) => {
      if (context?.snapshots) {
        for (const [key, data] of context.snapshots) {
          queryClient.setQueryData(key, data);
        }
      }
      hooks.onHookError?.('update', err);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rows', baseId, tableId] });
    },
  });
}

export function useCreateRecord(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();
  const hooks = useCrudHooks();

  return useMutation({
    mutationFn: async (fields: Record<string, Value>) => {
      // Consumer-backed create: call their hook to get the DB id (and any enriched fields).
      if (hooks.onRowCreate) {
        const result = await hooks.onRowCreate({ fields });
        const mergedFields = { ...fields, ...(result.fields ?? {}) };
        return client.createRecord({ baseId, tableId, fields: mergedFields, id: result.id });
      }
      return client.createRecord({ baseId, tableId, fields });
    },

    onMutate: async (fields) => {
      // Required-field guard: any declared required column must have a present value
      // (not null/undefined/''/[]). Lives here so both route and MonkeyTable paths inherit.
      const tableSpec = queryClient.getQueryData<TableSpec>(['table', baseId, tableId]);
      if (tableSpec) {
        const required = tableSpec.fields.filter((f) => f.required);
        for (const field of required) {
          const v = fields[field.id];
          const missing =
            v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
          if (missing) {
            const err = new Error(`Required field missing: ${field.id}`);
            hooks.onHookError?.('create', err);
            throw err;
          }
        }
      }

      // Optimistic pending row — gives consumers a visual in-flight state.
      // Only used when onRowCreate is wired; otherwise the adapter path is fast enough
      // that onSuccess append is indistinguishable from optimistic.
      if (!hooks.onRowCreate) return { tempId: null as string | null };

      await queryClient.cancelQueries({ queryKey: ['rows', baseId, tableId] });
      const tempId = `__pending-${Math.random().toString(36).slice(2, 10)}`;
      const snapshots = queryClient.getQueriesData<QueryResult>({ queryKey: ['rows', baseId, tableId] });
      const now = new Date().toISOString();
      const pendingRow: Row = { id: tempId, fields, createdAt: now, updatedAt: now, pending: true };
      queryClient.setQueriesData<QueryResult>(
        { queryKey: ['rows', baseId, tableId] },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rows: [...prev.rows, pendingRow],
            pagination: {
              ...prev.pagination,
              total: prev.pagination.total + 1,
            },
          };
        },
      );
      return { tempId, snapshots };
    },

    onSuccess: (newRow, _vars, context) => {
      if (!newRow) {
        queryClient.invalidateQueries({ queryKey: ['rows', baseId, tableId] });
        return;
      }
      const tempId = context?.tempId;
      queryClient.setQueriesData<QueryResult>(
        { queryKey: ['rows', baseId, tableId] },
        (prev) => {
          if (!prev) return prev;
          if (tempId) {
            // Swap the temp pending row for the real one
            return { ...prev, rows: prev.rows.map((r) => (r.id === tempId ? newRow : r)) };
          }
          return {
            ...prev,
            rows: [...prev.rows, newRow],
            pagination: {
              ...prev.pagination,
              total: prev.pagination.total + 1,
            },
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['rows', baseId, tableId] });
    },

    onError: (err, _vars, context) => {
      // Roll back the optimistic pending row if we added one.
      if (context?.snapshots) {
        for (const [key, data] of context.snapshots) {
          queryClient.setQueryData(key, data);
        }
      }
      hooks.onHookError?.('create', err);
    },
  });
}

/**
 * Add a draft row to the local cache. Does NOT call any consumer hook or adapter.
 * Used for the Add-row flow when required fields exist or onRowCreate is wired —
 * the row only gets persisted once the user fills in required fields and a cell edit
 * triggers promotion via usePromoteDraftRow.
 */
export function useCreateDraftRow(baseId: string, tableId: string) {
  const queryClient = useQueryClient();

  return (fields: Record<string, Value>): string => {
    const tempId = `__draft-${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();
    const draftRow: Row = { id: tempId, fields, createdAt: now, updatedAt: now, draft: true };

    queryClient.setQueriesData<QueryResult>(
      { queryKey: ['rows', baseId, tableId] },
      (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rows: [...prev.rows, draftRow],
          pagination: {
            ...prev.pagination,
            total: prev.pagination.total + 1,
          },
        };
      },
    );

    return tempId;
  };
}

/**
 * Promote a draft row: optimistically update its field value, then attempt to
 * persist via onRowCreate (if wired) or the adapter directly. On required-field
 * violation, fires onHookError('create', ...) and leaves the row in draft state
 * with the user's input preserved. On onRowCreate failure, same — the row stays
 * draft with the user's edits intact.
 */
export function usePromoteDraftRow(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();
  const hooks = useCrudHooks();

  return useMutation({
    mutationFn: async ({ rowId, fieldId, value }: { rowId: string; fieldId: string; value: Value }) => {
      // Merge the incoming cell value with the row's current fields.
      const rowsQueries = queryClient.getQueriesData<QueryResult>({ queryKey: ['rows', baseId, tableId] });
      let current: Row | undefined;
      for (const [, data] of rowsQueries) {
        if (!data) continue;
        const found = data.rows.find((r) => r.id === rowId);
        if (found) { current = found; break; }
      }
      const mergedFields: Record<string, Value> = { ...(current?.fields ?? {}), [fieldId]: value };

      // Required-field check — stay draft if any required field is missing.
      const tableSpec = queryClient.getQueryData<TableSpec>(['table', baseId, tableId]);
      if (tableSpec) {
        const missing: string[] = [];
        for (const field of tableSpec.fields) {
          if (!field.required) continue;
          const v = mergedFields[field.id];
          if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
            missing.push(field.id);
          }
        }
        if (missing.length > 0) {
          const err = new Error(`Required field${missing.length > 1 ? 's' : ''} missing: ${missing.join(', ')}`);
          (err as { missingFields?: string[] }).missingFields = missing;
          throw err;
        }
      }

      // All required filled — attempt promotion.
      if (hooks.onRowCreate) {
        const result = await hooks.onRowCreate({ fields: mergedFields });
        const finalFields = { ...mergedFields, ...(result.fields ?? {}) };
        return client.createRecord({ baseId, tableId, fields: finalFields, id: result.id });
      }
      return client.createRecord({ baseId, tableId, fields: mergedFields });
    },

    onMutate: async ({ rowId, fieldId, value }) => {
      await queryClient.cancelQueries({ queryKey: ['rows', baseId, tableId] });

      // Optimistically update the draft row's field and mark it pending (if we'll call onRowCreate).
      // Keep draft:true for now — onSuccess swaps with real row; onError leaves it draft with the edit preserved.
      queryClient.setQueriesData<QueryResult>(
        { queryKey: ['rows', baseId, tableId] },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rows: prev.rows.map((row) =>
              row.id === rowId
                ? { ...row, fields: { ...row.fields, [fieldId]: value } }
                : row,
            ),
          };
        },
      );
      return {};
    },

    onSuccess: (newRow, { rowId: tempId }) => {
      if (!newRow) {
        queryClient.invalidateQueries({ queryKey: ['rows', baseId, tableId] });
        return;
      }
      queryClient.setQueriesData<QueryResult>(
        { queryKey: ['rows', baseId, tableId] },
        (prev) => {
          if (!prev) return prev;
          return { ...prev, rows: prev.rows.map((r) => (r.id === tempId ? newRow : r)) };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['rows', baseId, tableId] });
    },

    onError: (err) => {
      // Stay draft; user's edit is preserved from onMutate. Just surface the error.
      hooks.onHookError?.('create', err);
    },
  });
}

export function useDeleteRecord(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();
  const hooks = useCrudHooks();

  return useMutation({
    mutationFn: async (recordId: string) => {
      if (hooks.onRowDelete) {
        await hooks.onRowDelete(recordId);
      }
      return client.deleteRecord({ baseId, tableId, recordId });
    },

    onMutate: async (recordId) => {
      await queryClient.cancelQueries({ queryKey: ['rows', baseId, tableId] });

      const snapshots = queryClient.getQueriesData<QueryResult>({ queryKey: ['rows', baseId, tableId] });

      queryClient.setQueriesData<QueryResult>(
        { queryKey: ['rows', baseId, tableId] },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rows: prev.rows.filter((row) => row.id !== recordId),
            pagination: {
              ...prev.pagination,
              total: Math.max(0, prev.pagination.total - 1),
            },
          };
        },
      );

      return { snapshots };
    },

    onError: (err, _variables, context) => {
      if (context?.snapshots) {
        for (const [key, data] of context.snapshots) {
          queryClient.setQueryData(key, data);
        }
      }
      hooks.onHookError?.('delete', err);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rows', baseId, tableId] });
    },
  });
}

// =============================================================================
// Base Mutations
// =============================================================================

export function useCreateBase() {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async (label: string) => {
      return client.createBase({ label });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bases'] });
    },
  });
}

export function useUpdateBase() {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async ({ baseId, label }: { baseId: string; label: string }) => {
      return client.updateBase({ baseId, label });
    },

    onMutate: async ({ baseId, label }) => {
      await queryClient.cancelQueries({ queryKey: ['bases'] });
      const previousBases = queryClient.getQueryData<Array<{ id: string; label: string; tableCount: number }>>(['bases']);

      if (previousBases) {
        queryClient.setQueryData(
          ['bases'],
          previousBases.map((b) => (b.id === baseId ? { ...b, label } : b))
        );
      }

      return { previousBases };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousBases) {
        queryClient.setQueryData(['bases'], context.previousBases);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bases'] });
    },
  });
}

export function useDeleteBase() {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async (baseId: string) => {
      return client.deleteBase(baseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bases'] });
    },
  });
}

// =============================================================================
// Table Mutations
// =============================================================================

export function useRenameTable(baseId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async ({ tableId, label }: { tableId: string; label: string }) => {
      return client.renameTable({ baseId, tableId, label });
    },

    onMutate: async ({ tableId, label }) => {
      await queryClient.cancelQueries({ queryKey: ['base', baseId] });

      const previousData = queryClient.getQueryData<BaseSpec>(['base', baseId]);

      if (previousData) {
        const newTables = previousData.tables.map((table) =>
          table.id === tableId ? { ...table, label } : table
        );
        queryClient.setQueryData<BaseSpec>(['base', baseId], {
          ...previousData,
          tables: newTables,
        });
      }

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['base', baseId], context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['base', baseId] });
    },
  });
}

export function useCreateTable(baseId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async ({ label, fields }: { label: string; fields?: Array<{ label: string; type: FieldType; options?: FieldOptions }> }) => {
      return client.createTable({ baseId, label, fields });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base', baseId] });
      queryClient.invalidateQueries({ queryKey: ['bases'] });
    },
  });
}

export function useDeleteTable(baseId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async (tableId: string) => {
      return client.deleteTable({ baseId, tableId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base', baseId] });
      queryClient.invalidateQueries({ queryKey: ['bases'] });
      queryClient.invalidateQueries({ queryKey: ['trash', baseId] });
    },
  });
}

// =============================================================================
// Field/Schema Mutations
// =============================================================================

export function useCreateField(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async ({ label, type, options }: { label: string; type: FieldType; options?: FieldOptions }) => {
      return client.createField({ baseId, tableId, label, type, options });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', baseId, tableId] });
      queryClient.invalidateQueries({ queryKey: ['rows', baseId, tableId] });
      queryClient.invalidateQueries({ queryKey: ['base', baseId] });
    },
  });
}

export function useRenameField(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async ({ fieldId, label }: { fieldId: string; label: string }) => {
      return client.renameField({ baseId, tableId, fieldId, label });
    },

    onMutate: async ({ fieldId, label }) => {
      await queryClient.cancelQueries({ queryKey: ['table', baseId, tableId] });

      const previousData = queryClient.getQueryData<TableSpec>(['table', baseId, tableId]);

      if (previousData) {
        const newFields = previousData.fields.map((field) =>
          field.id === fieldId ? { ...field, label } : field
        );
        queryClient.setQueryData<TableSpec>(['table', baseId, tableId], {
          ...previousData,
          fields: newFields,
        });
      }

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['table', baseId, tableId], context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['table', baseId, tableId] });
      queryClient.invalidateQueries({ queryKey: ['base', baseId] });
    },
  });
}

export function useDeleteField(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async (fieldId: string) => {
      return client.deleteField({ baseId, tableId, fieldId });
    },

    onMutate: async (fieldId) => {
      await queryClient.cancelQueries({ queryKey: ['table', baseId, tableId] });

      const previousData = queryClient.getQueryData<TableSpec>(['table', baseId, tableId]);

      if (previousData) {
        const newFields = previousData.fields.filter((field) => field.id !== fieldId);
        queryClient.setQueryData<TableSpec>(['table', baseId, tableId], {
          ...previousData,
          fields: newFields,
        });
      }

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['table', baseId, tableId], context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['table', baseId, tableId] });
      queryClient.invalidateQueries({ queryKey: ['base', baseId] });
      queryClient.invalidateQueries({ queryKey: ['rows', baseId, tableId] });
    },
  });
}

export function useUpdateFieldOptions(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async ({ fieldId, options }: { fieldId: string; options: FieldOptions }) => {
      return client.updateFieldOptions({ baseId, tableId, fieldId, options });
    },

    onMutate: async ({ fieldId, options }) => {
      await queryClient.cancelQueries({ queryKey: ['table', baseId, tableId] });

      const previousData = queryClient.getQueryData<TableSpec>(['table', baseId, tableId]);

      if (previousData) {
        const newFields = previousData.fields.map((field) =>
          field.id === fieldId
            ? { ...field, options: { ...field.options, ...options } }
            : field
        );
        queryClient.setQueryData<TableSpec>(['table', baseId, tableId], {
          ...previousData,
          fields: newFields,
        });
      }

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['table', baseId, tableId], context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['table', baseId, tableId] });
      queryClient.invalidateQueries({ queryKey: ['base', baseId] });
    },
  });
}

// =============================================================================
// Ordering Mutations
// =============================================================================

export function useUpdateColumnOrder(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async (columnOrder: string[]) => {
      return client.updateColumnOrder({ baseId, tableId, columnOrder });
    },

    onMutate: async (columnOrder) => {
      await queryClient.cancelQueries({ queryKey: ['table', baseId, tableId] });

      const previousData = queryClient.getQueryData<TableSpec>(['table', baseId, tableId]);

      if (previousData) {
        queryClient.setQueryData<TableSpec>(['table', baseId, tableId], {
          ...previousData,
          columnOrder,
        });
      }

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['table', baseId, tableId], context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['table', baseId, tableId] });
      queryClient.invalidateQueries({ queryKey: ['base', baseId] });
    },
  });
}

export function useUpdateRowOrder(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async (rowOrder: string[]) => {
      return client.updateRowOrder({ baseId, tableId, rowOrder });
    },

    onMutate: async (rowOrder) => {
      await queryClient.cancelQueries({ queryKey: ['table', baseId, tableId] });

      const previousData = queryClient.getQueryData<TableSpec>(['table', baseId, tableId]);

      if (previousData) {
        queryClient.setQueryData<TableSpec>(['table', baseId, tableId], {
          ...previousData,
          rowOrder,
        });
      }

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['table', baseId, tableId], context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['table', baseId, tableId] });
      queryClient.invalidateQueries({ queryKey: ['base', baseId] });
    },
  });
}

// =============================================================================
// Settings Mutations
// =============================================================================

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async (settings: Partial<MonkeyTabSettings>) => {
      return client.updateSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useUpdateTableDisplay(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async (display: TableDisplaySettings) => {
      return client.updateTableDisplay(baseId, tableId, display);
    },

    onMutate: async (display) => {
      await queryClient.cancelQueries({ queryKey: ['table', baseId, tableId] });

      const previousData = queryClient.getQueryData<TableSpec>(['table', baseId, tableId]);

      if (previousData) {
        queryClient.setQueryData<TableSpec>(['table', baseId, tableId], {
          ...previousData,
          display: { ...previousData.display, ...display },
        });
      }

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['table', baseId, tableId], context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['table', baseId, tableId] });
    },
  });
}

// =============================================================================
// Trash Mutations
// =============================================================================

export function useRestoreTable(baseId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async (trashId: string) => {
      return client.restoreTable(baseId, trashId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base', baseId] });
      queryClient.invalidateQueries({ queryKey: ['bases'] });
      queryClient.invalidateQueries({ queryKey: ['trash', baseId] });
    },
  });
}

export function useEmptyTrash(baseId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async () => {
      return client.emptyTrash(baseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash', baseId] });
    },
  });
}

// =============================================================================
// Field Type Change Mutation
// =============================================================================

export function useUpdateFieldType(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async ({ fieldId, type }: { fieldId: string; type: FieldType }) => {
      return client.updateFieldType({ baseId, tableId, fieldId, type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', baseId, tableId] });
      queryClient.invalidateQueries({ queryKey: ['rows', baseId, tableId] });
      queryClient.invalidateQueries({ queryKey: ['base', baseId] });
    },
  });
}
