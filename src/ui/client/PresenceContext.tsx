import { createContext, useContext, type ReactNode } from 'react';
import type { PresenceUser } from '@monkeytab/core';

/**
 * Presence — who else is viewing/editing this table. Consumers build this
 * list from their auth + socket layer and pass it in via `MonkeyTable.presence`.
 * Empty list = no multiplayer UI rendered.
 */
const PresenceContext = createContext<PresenceUser[]>([]);

export function PresenceProvider({
  users,
  children,
}: {
  users: PresenceUser[];
  children: ReactNode;
}) {
  return <PresenceContext.Provider value={users}>{children}</PresenceContext.Provider>;
}

export function usePresence(): PresenceUser[] {
  return useContext(PresenceContext);
}

/** Resolve the presence users currently focused on a specific cell.
 *  Requires a concrete `fieldId` on the cursor — row-only cursors do not
 *  light up individual cells (they show in the presence bar only). */
export function usePresenceAtCell(rowId: string, fieldId: string): PresenceUser[] {
  const users = usePresence();
  return users.filter(
    (u) => u.cursor?.rowId === rowId && u.cursor.fieldId === fieldId,
  );
}
