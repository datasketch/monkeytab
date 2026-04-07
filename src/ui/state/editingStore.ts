import { create } from 'zustand';
import type { Value } from '@monkeytab/core';

export interface EditingCell {
  rowId: string;
  fieldId: string;
  originalValue: Value;
}

interface EditingState {
  editingCell: EditingCell | null;
  startEditing: (rowId: string, fieldId: string, originalValue: Value) => void;
  stopEditing: () => void;
  isEditing: (rowId: string, fieldId: string) => boolean;
}

export const useEditingStore = create<EditingState>((set, get) => ({
  editingCell: null,

  startEditing: (rowId, fieldId, originalValue) =>
    set({
      editingCell: { rowId, fieldId, originalValue },
    }),

  stopEditing: () => set({ editingCell: null }),

  isEditing: (rowId, fieldId) => {
    const { editingCell } = get();
    return editingCell?.rowId === rowId && editingCell?.fieldId === fieldId;
  },
}));
