import { useEffect, useRef } from 'react';
import { useSelectionStore } from '../../state/GridStoreContext.tsx';

/**
 * Forwards active-cell changes to a consumer callback. Must be rendered inside
 * a `GridStoreProvider`. Mounted by MonkeyTable when `onActiveCellChange` is set.
 */
export function ActiveCellBridge({
  onActiveCellChange,
}: {
  onActiveCellChange: (rowId: string | null, fieldId: string | null) => void;
}) {
  const activeCell = useSelectionStore((state) => state.activeCell);
  const callbackRef = useRef(onActiveCellChange);
  callbackRef.current = onActiveCellChange;

  useEffect(() => {
    callbackRef.current(activeCell?.rowId ?? null, activeCell?.fieldId ?? null);
  }, [activeCell?.rowId, activeCell?.fieldId]);

  return null;
}
