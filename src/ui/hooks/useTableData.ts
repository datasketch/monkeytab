import { useQuery } from '@tanstack/react-query';
import { useClient } from '../client/ClientContext.tsx';
import type { BaseSummary, BaseSpec, TableSpec, QueryResult, Row, AdapterInfo, MonkeyTabSettings, TrashedTable, FilterGroup, SortSpec } from '@monkeytab/core';

export function useBases() {
  const client = useClient();
  return useQuery<BaseSummary[]>({
    queryKey: ['bases'],
    queryFn: ({ signal }) => client.listBases({ signal }),
  });
}

export function useBase(baseId: string) {
  const client = useClient();
  return useQuery<BaseSpec>({
    queryKey: ['base', baseId],
    queryFn: ({ signal }) => client.getBase(baseId, { signal }),
    enabled: !!baseId,
  });
}

export function useTable(baseId: string, tableId: string) {
  const client = useClient();
  return useQuery<TableSpec>({
    queryKey: ['table', baseId, tableId],
    queryFn: ({ signal }) => client.getTable(baseId, tableId, { signal }),
    enabled: !!baseId && !!tableId,
  });
}

export function useTableRows(
  baseId: string,
  tableId: string,
  options?: { offset?: number; limit?: number; search?: string; filter?: FilterGroup; sort?: SortSpec[] }
) {
  const client = useClient();
  return useQuery<QueryResult>({
    queryKey: ['rows', baseId, tableId, options?.offset ?? 0, options?.limit ?? 100, options?.search, options?.filter, options?.sort],
    queryFn: ({ signal }) =>
      client.query(
        {
          baseId,
          tableId,
          offset: options?.offset,
          limit: options?.limit,
          search: options?.search,
          filter: options?.filter,
          sort: options?.sort,
        },
        { signal },
      ),
    enabled: !!baseId && !!tableId,
  });
}

export function useRecord(baseId: string, tableId: string, recordId: string) {
  const client = useClient();
  return useQuery<Row>({
    queryKey: ['record', baseId, tableId, recordId],
    queryFn: ({ signal }) => client.getRecord({ baseId, tableId, recordId }, { signal }),
    enabled: !!baseId && !!tableId && !!recordId,
  });
}

export function useAdapterInfo() {
  const client = useClient();
  return useQuery<AdapterInfo>({
    queryKey: ['info'],
    queryFn: ({ signal }) => client.getInfo({ signal }),
    staleTime: Infinity,
  });
}

export function useSettings() {
  const client = useClient();
  return useQuery<MonkeyTabSettings>({
    queryKey: ['settings'],
    queryFn: ({ signal }) => client.getSettings({ signal }),
  });
}

export function useTrash(baseId: string) {
  const client = useClient();
  return useQuery<TrashedTable[]>({
    queryKey: ['trash', baseId],
    queryFn: ({ signal }) => client.listTrash(baseId, { signal }),
    enabled: !!baseId,
  });
}
