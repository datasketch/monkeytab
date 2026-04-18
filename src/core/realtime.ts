/**
 * Realtime / multiplayer types.
 *
 * MonkeyTab stays transport-agnostic: the consumer owns the WebSocket (or SSE,
 * or BroadcastChannel, or any other channel) and pushes events into the grid
 * via `useMonkeyTabSync`. These types describe the *protocol* — the shape of
 * events and presence — not the transport.
 */

import type { Row, Value } from './types.ts';

// =============================================================================
// Remote change events — inbound cache updates
// =============================================================================

/** Another client created a row. The consumer supplies the full Row. */
export interface RowCreatedEvent {
  type: 'row.created';
  baseId?: string;
  tableId?: string;
  row: Row;
}

/** Another client updated one or more fields on a row. */
export interface RowUpdatedEvent {
  type: 'row.updated';
  baseId?: string;
  tableId?: string;
  rowId: string;
  /** Partial — only the fields that changed. */
  fields: Record<string, Value>;
  /** Optional ISO timestamp so consumers can tie-break echoes / out-of-order delivery. */
  updatedAt?: string;
}

/** Another client deleted a row. */
export interface RowDeletedEvent {
  type: 'row.deleted';
  baseId?: string;
  tableId?: string;
  rowId: string;
}

/** Union of all inbound row events. */
export type RemoteChangeEvent = RowCreatedEvent | RowUpdatedEvent | RowDeletedEvent;

// =============================================================================
// Presence — who else is viewing / editing this table
// =============================================================================

/**
 * A single collaborator currently connected to the table.
 * Consumers build this list from their own auth + socket layer and pass it in.
 */
export interface PresenceUser {
  /** Stable id for the connected user/session. */
  userId: string;
  /** Display name shown in the presence bar. */
  name?: string;
  /** Hex color used for the avatar bubble and cursor outline. */
  color?: string;
  /** Optional avatar image URL. */
  avatarUrl?: string;
  /** Where in the grid this user is focused, if known. */
  cursor?: {
    rowId: string;
    fieldId?: string;
  };
}
