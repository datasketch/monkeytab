import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useClient } from '../client/ClientContext.tsx';
import type { Value, Row, QueryResult, TableSpec, BaseSpec, FieldOptions, FieldType, MonkeyTabSettings, TableDisplaySettings } from '@monkeytab/core';

// =============================================================================
// Record Mutations
// =============================================================================

export function useUpdateRecord(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async ({ recordId, fieldId, value }: { recordId: string; fieldId: string; value: Value }) => {
      return client.updateRecord({
        baseId,
        tableId,
        recordId,
        fields: { [fieldId]: value },
      });
    },

    onMutate: async ({ recordId, fieldId, value }) => {
      await queryClient.cancelQueries({ queryKey: ['rows', baseId, tableId] });

      const previousData = queryClient.getQueryData<QueryResult>(['rows', baseId, tableId, 0, 100]);

      if (previousData) {
        const newRows = previousData.rows.map((row) => {
          if (row.id === recordId) {
            return {
              ...row,
              fields: { ...row.fields, [fieldId]: value },
            };
          }
          return row;
        });

        queryClient.setQueryData<QueryResult>(['rows', baseId, tableId, 0, 100], {
          ...previousData,
          rows: newRows,
        });
      }

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['rows', baseId, tableId, 0, 100], context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rows', baseId, tableId] });
    },
  });
}

export function useCreateRecord(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async (fields: Record<string, Value>) => {
      return client.createRecord({ baseId, tableId, fields });
    },

    onSuccess: (newRow) => {
      // Optimistically append the new row to cache
      const previousData = queryClient.getQueryData<QueryResult>(['rows', baseId, tableId, 0, 100]);
      if (previousData && newRow) {
        queryClient.setQueryData<QueryResult>(['rows', baseId, tableId, 0, 100], {
          rows: [...previousData.rows, newRow],
          pagination: {
            ...previousData.pagination,
            total: previousData.pagination.total + 1,
          },
        });
      }
      queryClient.invalidateQueries({ queryKey: ['rows', baseId, tableId] });
    },
  });
}

export function useDeleteRecord(baseId: string, tableId: string) {
  const queryClient = useQueryClient();
  const client = useClient();

  return useMutation({
    mutationFn: async (recordId: string) => {
      return client.deleteRecord({ baseId, tableId, recordId });
    },

    onMutate: async (recordId) => {
      await queryClient.cancelQueries({ queryKey: ['rows', baseId, tableId] });

      const previousData = queryClient.getQueryData<QueryResult>(['rows', baseId, tableId, 0, 100]);

      if (previousData) {
        const newRows = previousData.rows.filter((row) => row.id !== recordId);
        queryClient.setQueryData<QueryResult>(['rows', baseId, tableId, 0, 100], {
          rows: newRows,
          pagination: {
            ...previousData.pagination,
            total: previousData.pagination.total - 1,
          },
        });
      }

      return { previousData };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['rows', baseId, tableId, 0, 100], context.previousData);
      }
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
