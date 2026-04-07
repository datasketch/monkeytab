import { create } from 'zustand';

export interface CellPosition {
  rowId: string;
  fieldId: string;
}

interface SelectionState {
  activeCell: CellPosition | null;
  setActiveCell: (cell: CellPosition | null) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  activeCell: null,

  setActiveCell: (cell) => set({ activeCell: cell }),

  clearSelection: () => set({ activeCell: null }),
}));

export function isCellSelected(
  activeCell: CellPosition | null,
  rowId: string,
  fieldId: string
): boolean {
  return activeCell?.rowId === rowId && activeCell?.fieldId === fieldId;
}
