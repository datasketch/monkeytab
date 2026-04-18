import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryResult, RemoteChangeEvent, Row } from '@monkeytab/core';

/**
 * Consumer-facing hook for pushing remote change events into the grid's cache.
 *
 * Usage — open a WebSocket in your own code, then on each message call
 * `applyRemoteChange(event)`. MonkeyTab handles cache invalidation / patching
 * under the rows query key used by the grid.
 *
 * ```tsx
 * function MyTable() {
 *   const { applyRemoteChange } = useMonkeyTabSync();
 *   useEffect(() => {
 *     const ws = new WebSocket('wss://api.example.com/realtime');
 *     ws.onmessage = (e) => applyRemoteChange(JSON.parse(e.data));
 *     return () => ws.close();
 *   }, [applyRemoteChange]);
 *   return <MonkeyTable ... />;
 * }
 * ```
 *
 * Transport-agnostic: the source could be WebSocket, SSE, BroadcastChannel,
 * polling, anything. MonkeyTab only cares about the `RemoteChangeEvent` shape.
 */
export function useMonkeyTabSync() {
  const queryClient = useQueryClient();

  const applyRemoteChange = useCallback(
    (event: RemoteChangeEvent) => {
      // MonkeyTable wraps a single base/table, so we target all rows queries.
      // When baseId/tableId are provided we could narrow further, but the
      // prefix match already handles that since the cache only has one table.
      queryClient.setQueriesData<QueryResult>(
        { queryKey: ['rows'] },
        (prev) => {
          if (!prev) return prev;
          return applyEventToQueryResult(prev, event);
        },
      );
    },
    [queryClient],
  );

  return { applyRemoteChange };
}

function applyEventToQueryResult(prev: QueryResult, event: RemoteChangeEvent): QueryResult {
  switch (event.type) {
    case 'row.created': {
      // Skip if the row already exists (echo suppression: consumer may have just written it).
      if (prev.rows.some((r) => r.id === event.row.id)) return prev;
      return {
        ...prev,
        rows: [...prev.rows, event.row],
        pagination: { ...prev.pagination, total: prev.pagination.total + 1 },
      };
    }
    case 'row.updated': {
      let touched = false;
      const rows = prev.rows.map((row) => {
        if (row.id !== event.rowId) return row;
        touched = true;
        return {
          ...row,
          fields: { ...row.fields, ...event.fields },
          updatedAt: event.updatedAt ?? row.updatedAt,
        } as Row;
      });
      if (!touched) return prev;
      return { ...prev, rows };
    }
    case 'row.deleted': {
      const rows = prev.rows.filter((row) => row.id !== event.rowId);
      if (rows.length === prev.rows.length) return prev;
      return {
        ...prev,
        rows,
        pagination: { ...prev.pagination, total: Math.max(0, prev.pagination.total - 1) },
      };
    }
    default:
      return prev;
  }
}
