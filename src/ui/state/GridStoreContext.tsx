/**
 * GridStoreContext — provides per-instance Zustand stores for Grid.
 *
 * Without this, selection/editing/undo stores are global singletons,
 * causing multiple <MonkeyTable> instances on the same page to share
 * state (selecting a cell in one table highlights the same position
 * in the other).
 *
 * Each <GridStoreProvider> creates fresh store instances scoped to
 * its subtree.
 */

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { createStore, useStore, type StoreApi } from 'zustand';
import type { Value } from '@monkeytab/core';

// ---------------------------------------------------------------------------
// Selection store
// ---------------------------------------------------------------------------

export interface CellPosition {
  rowId: string;
  fieldId: string;
}

interface SelectionState {
  activeCell: CellPosition | null;
  /** Anchor cell for range selection (where Shift+Arrow started) */
  anchorCell: CellPosition | null;
  setActiveCell: (cell: CellPosition | null) => void;
  /** Extend range selection — sets activeCell as focus, keeps anchor */
  extendSelection: (cell: CellPosition) => void;
  clearSelection: () => void;
}

function createSelectionStore() {
  return createStore<SelectionState>((set) => ({
    activeCell: null,
    anchorCell: null,
    setActiveCell: (cell) => set({ activeCell: cell, anchorCell: null }),
    extendSelection: (cell) => set((state) => ({
      activeCell: cell,
      anchorCell: state.anchorCell ?? state.activeCell,
    })),
    clearSelection: () => set({ activeCell: null, anchorCell: null }),
  }));
}

// ---------------------------------------------------------------------------
// Editing store
// ---------------------------------------------------------------------------

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

function createEditingStore() {
  return createStore<EditingState>((set, get) => ({
    editingCell: null,
    startEditing: (rowId, fieldId, originalValue) =>
      set({ editingCell: { rowId, fieldId, originalValue } }),
    stopEditing: () => set({ editingCell: null }),
    isEditing: (rowId, fieldId) => {
      const { editingCell } = get();
      return editingCell?.rowId === rowId && editingCell?.fieldId === fieldId;
    },
  }));
}

// ---------------------------------------------------------------------------
// Undo store
// ---------------------------------------------------------------------------

const MAX_HISTORY = 50;

export type UndoAction =
  | { type: 'cell_edit'; rowId: string; fieldId: string; oldValue: Value; newValue: Value }
  | { type: 'row_create'; rowId: string; fields: Record<string, Value> }
  | { type: 'row_delete'; rowId: string; fields: Record<string, Value> }
  | { type: 'field_create'; fieldId: string; fieldName: string; fieldType: string }
  | { type: 'field_delete'; fieldId: string; fieldName: string; fieldType: string };

interface UndoState {
  past: UndoAction[];
  future: UndoAction[];
  currentTableId: string | null;
  push: (action: UndoAction) => void;
  undo: () => UndoAction | null;
  redo: () => UndoAction | null;
  setTable: (tableId: string) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function createUndoStore() {
  return createStore<UndoState>((set, get) => ({
    past: [],
    future: [],
    currentTableId: null,
    push: (action) =>
      set((state) => ({
        past: [...state.past.slice(-(MAX_HISTORY - 1)), action],
        future: [],
      })),
    undo: () => {
      const { past } = get();
      if (past.length === 0) return null;
      const action = past[past.length - 1];
      set((state) => ({
        past: state.past.slice(0, -1),
        future: [action, ...state.future],
      }));
      return action;
    },
    redo: () => {
      const { future } = get();
      if (future.length === 0) return null;
      const action = future[0];
      set((state) => ({
        past: [...state.past, action],
        future: state.future.slice(1),
      }));
      return action;
    },
    setTable: (tableId) => {
      const { currentTableId } = get();
      if (currentTableId !== tableId) {
        set({ past: [], future: [], currentTableId: tableId });
      }
    },
    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  }));
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface GridStores {
  selection: StoreApi<SelectionState>;
  editing: StoreApi<EditingState>;
  undo: StoreApi<UndoState>;
}

const GridStoreContext = createContext<GridStores | null>(null);

export function GridStoreProvider({ children }: { children: ReactNode }) {
  const storesRef = useRef<GridStores | null>(null);
  if (!storesRef.current) {
    storesRef.current = {
      selection: createSelectionStore(),
      editing: createEditingStore(),
      undo: createUndoStore(),
    };
  }
  return (
    <GridStoreContext.Provider value={storesRef.current}>
      {children}
    </GridStoreContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks — drop-in replacements for the old global store hooks
// ---------------------------------------------------------------------------

function useGridStores(): GridStores {
  const stores = useContext(GridStoreContext);
  if (!stores) {
    throw new Error('Grid stores must be used within a <GridStoreProvider>');
  }
  return stores;
}

// Selection
export function useSelectionStore<T>(selector: (state: SelectionState) => T): T {
  const { selection } = useGridStores();
  return useStore(selection, selector);
}

// Editing
export function useEditingStore<T>(selector: (state: EditingState) => T): T {
  const { editing } = useGridStores();
  return useStore(editing, selector);
}

// Undo — returns the full store API (methods are called directly, not via selector)
export function useUndoStore(): UndoState {
  const { undo } = useGridStores();
  return useStore(undo);
}

// Utility (unchanged)
export function isCellSelected(
  activeCell: CellPosition | null,
  rowId: string,
  fieldId: string,
): boolean {
  return activeCell?.rowId === rowId && activeCell?.fieldId === fieldId;
}

/**
 * Check if a cell is within a rectangular range selection.
 * Requires ordered row IDs and field IDs to determine position.
 */
export function isCellInRange(
  anchor: CellPosition | null,
  focus: CellPosition | null,
  rowId: string,
  fieldId: string,
  rowIds: string[],
  fieldIds: string[],
): boolean {
  if (!anchor || !focus) return false;

  const anchorRow = rowIds.indexOf(anchor.rowId);
  const focusRow = rowIds.indexOf(focus.rowId);
  const cellRow = rowIds.indexOf(rowId);
  if (anchorRow === -1 || focusRow === -1 || cellRow === -1) return false;

  const anchorCol = fieldIds.indexOf(anchor.fieldId);
  const focusCol = fieldIds.indexOf(focus.fieldId);
  const cellCol = fieldIds.indexOf(fieldId);
  if (anchorCol === -1 || focusCol === -1 || cellCol === -1) return false;

  const minRow = Math.min(anchorRow, focusRow);
  const maxRow = Math.max(anchorRow, focusRow);
  const minCol = Math.min(anchorCol, focusCol);
  const maxCol = Math.max(anchorCol, focusCol);

  return cellRow >= minRow && cellRow <= maxRow && cellCol >= minCol && cellCol <= maxCol;
}
