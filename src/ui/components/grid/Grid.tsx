import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnOrderState,
  type ColumnSizingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TableSpec, Row, FieldSpec, Value, FieldOptions, FieldType } from '@monkeytab/core';
import { useSelectionStore, useEditingStore, isCellInRange } from '../../state/GridStoreContext.tsx';
import { GridCell } from './GridCell.tsx';
import { GridHeader, sortLabelKey } from './GridHeader.tsx';
import { RowActions } from './RowActions.tsx';
import { FormulaBuilder } from '../computed/FormulaBuilder.tsx';
import { FieldTypeIcon } from '../../icons/FieldTypeIcon.tsx';
import { useSearchQuery } from '../../state/SearchContext.tsx';
import { useI18n } from '../../i18n/index.ts';
import { useSettings } from '../../hooks/useTableData.ts';

/** Serialize a cell value to a plain string for clipboard. */
function valueToClipboardText(val: Value): string {
  if (val == null) return '';
  if (typeof val === 'object' && !Array.isArray(val) && 'url' in val) {
    const link = val as { url: string; label?: string };
    return link.label ? `${link.label} (${link.url})` : link.url;
  }
  if (Array.isArray(val)) return JSON.stringify(val);
  return String(val);
}

/** Copy format option for the context menu. */
interface CopyFormat {
  label: string;
  text: string;
}

/** Return the available copy formats for a given field type and value. */
function getCopyFormats(fieldType: string, val: Value, t: (key: string, params?: Record<string, string | number>) => string): CopyFormat[] {
  if (val == null) return [{ label: t('copy.value'), text: '' }];

  // URL / Email / Phone with { url, label } object
  if (typeof val === 'object' && !Array.isArray(val) && 'url' in val) {
    const link = val as { url: string; label?: string };
    const formats: CopyFormat[] = [
      { label: t('copy.url'), text: link.url },
    ];
    if (link.label) {
      formats.push({ label: t('copy.label'), text: link.label });
      formats.push({ label: t('copy.both'), text: `${link.label} (${link.url})` });
    }
    formats.push({ label: t('copy.markdown'), text: link.label ? `[${link.label}](${link.url})` : link.url });
    return formats;
  }

  // URL-type fields with plain string values
  if (fieldType === 'URL' && typeof val === 'string') {
    const url = val;
    const display = url.replace(/^https?:\/\//, '');
    return [
      { label: t('copy.url'), text: url },
      { label: t('copy.displayText'), text: display },
      { label: t('copy.markdown'), text: `[${display}](${url})` },
    ];
  }

  // Email — offer mailto and plain
  if (fieldType === 'Email' && typeof val === 'string') {
    return [
      { label: t('copy.email'), text: val },
      { label: t('copy.mailto'), text: `mailto:${val}` },
    ];
  }

  // Phone — offer tel and plain
  if (fieldType === 'Phone' && typeof val === 'string') {
    return [
      { label: t('copy.number'), text: val },
      { label: t('copy.tel'), text: `tel:${val.replace(/\s/g, '')}` },
    ];
  }

  // Attachment arrays — offer JSON and file names
  if (fieldType === 'Attachment' && Array.isArray(val)) {
    const names = val
      .map((v) => (typeof v === 'object' && v && 'name' in v ? (v as { name: string }).name : String(v)))
      .join(', ');
    return [
      { label: t('copy.names'), text: names },
      { label: t('copy.json'), text: JSON.stringify(val) },
    ];
  }

  // Multi-select arrays — offer comma-separated and JSON
  if (Array.isArray(val)) {
    const csv = val.map(String).join(', ');
    return [
      { label: t('copy.value'), text: csv },
      { label: t('copy.json'), text: JSON.stringify(val) },
    ];
  }

  // Single format for simple types
  return [{ label: t('copy.value'), text: String(val) }];
}

export type RowHeightOption = 'short' | 'medium' | 'tall' | 'extra-tall' | 'fit';

export const ROW_HEIGHTS: Record<Exclude<RowHeightOption, 'fit'>, number> = {
  'short': 32,
  'medium': 44,
  'tall': 64,
  'extra-tall': 88,
};

const COMPACT_ROW_HEIGHTS: Record<Exclude<RowHeightOption, 'fit'>, number> = {
  'short': 24,
  'medium': 28,
  'tall': 40,
  'extra-tall': 60,
};

/** Custom cell renderer function — receives value, full row, and field ID */
export type CellRenderer = (value: Value, row: Row, fieldId: string) => React.ReactNode;

interface GridProps {
  table: TableSpec;
  rows: Row[];
  rowHeight?: RowHeightOption;
  showRowNumbers?: boolean;
  onCellSave?: (rowId: string, fieldId: string, value: Value) => void;
  onRowDelete?: (rowId: string) => void;
  onRowDuplicate?: (rowId: string) => void;
  onRowView?: (rowId: string) => void;
  onRowClick?: (row: Row) => void;
  onAddRow?: (count?: number, afterRowId?: string) => void;
  onRowsReorder?: (rowIds: string[]) => void;
  onColumnsReorder?: (fieldIds: string[]) => void;
  onSelectionChange?: (selectedRowIds: string[]) => void;
  /** Controlled selection — when provided, Grid uses this instead of internal state */
  selectedRowIds?: string[];
  onColumnRename?: (fieldId: string, newLabel: string) => void;
  onColumnDelete?: (fieldId: string) => void;
  onColumnUpdateOptions?: (fieldId: string, options: FieldOptions) => void;
  onColumnChangeType?: (fieldId: string, newType: FieldType) => void;
  onColumnValidateType?: (fieldId: string, newType: FieldType) => Promise<{
    compatible: number;
    incompatible: number;
    total: number;
    warnings: string[];
  }>;
  onCreateField?: (label: string, type: FieldType) => void;
  onCreateComputedField?: (label: string, options: import('@monkeytab/core').ComputedFieldOptions) => void;
  /** Called when user changes sort via column header or context menu */
  onSortChange?: (fieldId: string | null, direction: 'asc' | 'desc' | null) => void;
  allowMultiColumnDrag?: boolean;
  /** Custom renderers per field ID — overrides the default type-aware renderer */
  customRenderers?: Record<string, CellRenderer>;
  /** Custom icons per field ID — overrides the default type icon in the column header */
  customIcons?: Record<string, React.ReactNode>;
  /** Per-column editable overrides (fieldId → boolean) */
  columnEditable?: Record<string, boolean>;
  /** Per-column initial width (fieldId → pixels) */
  columnWidth?: Record<string, number>;
  /** Per-column minimum width (fieldId → pixels) */
  columnMinWidth?: Record<string, number>;
  /** Per-column maximum width (fieldId → pixels) */
  columnMaxWidth?: Record<string, number>;
  /** Per-column sortable flag (fieldId → boolean) */
  columnSortable?: Record<string, boolean>;
  /** Per-column text alignment (fieldId → 'left'|'center'|'right') */
  columnAlign?: Record<string, 'left' | 'center' | 'right'>;
  /** Consumer-provided file upload handler — passed to file-type editors */
  onUpload?: (file: File, fieldType: string) => Promise<string>;
  /** Show a subtle loading indicator inside the grid */
  loading?: boolean;
  /** Show faint ghost rows/columns to fill the viewport, spreadsheet-style */
  ghostGrid?: boolean | { rows?: number; columns?: number };
  /** Column sizing strategy — 'auto' (default) fits content, 'fill' distributes width, 'fixed' uses 180px */
  columnFit?: 'auto' | 'fill' | 'fixed';
  /** Min column width in 'auto' mode (default: 60) */
  autoFitMin?: number;
  /** Max column width in 'auto' mode (default: 320) */
  autoFitMax?: number;
  /** Field ID to group rows by (single column) */
  groupBy?: string | null;
  /** Default collapsed state for groups (default: false = expanded) */
  groupCollapsed?: boolean;
  /** Called when user changes grouping via column header menu */
  onGroupByChange?: (fieldId: string | null) => void;
  /** Group display order */
  groupOrder?: 'auto' | 'asc' | 'desc' | 'count-asc' | 'count-desc' | string[];
  /** Field ID whose value determines each row's background tint */
  colorBy?: string | null;
  /** Called when user changes coloring via column header menu */
  onColorByChange?: (fieldId: string | null) => void;
  /** Optional per-value color overrides */
  colorByMap?: Record<string, string>;
}

export function Grid({
  table,
  rows,
  rowHeight = 'medium',
  showRowNumbers = false,
  onCellSave,
  onRowDelete,
  onRowDuplicate,
  onRowView,
  onRowClick,
  onAddRow,
  onRowsReorder,
  onColumnsReorder,
  onSelectionChange,
  selectedRowIds,
  onColumnRename,
  onColumnDelete,
  onColumnUpdateOptions,
  onColumnChangeType,
  onColumnValidateType,
  onCreateField,
  onCreateComputedField,
  onSortChange,
  allowMultiColumnDrag = true,
  customRenderers,
  customIcons,
  columnEditable,
  columnWidth,
  columnMinWidth,
  columnMaxWidth,
  columnSortable,
  columnAlign,
  onUpload,
  loading = false,
  ghostGrid,
  columnFit,
  autoFitMin = 60,
  autoFitMax = 320,
  groupBy,
  groupCollapsed = false,
  onGroupByChange,
  groupOrder = 'auto',
  colorBy,
  onColorByChange,
  colorByMap,
}: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchQuery = useSearchQuery();
  const { data: settings } = useSettings();
  const isCompact = settings?.defaultCompactMode ?? false;
  const activeCell = useSelectionStore((state) => state.activeCell);
  const anchorCell = useSelectionStore((state) => state.anchorCell);
  const setActiveCell = useSelectionStore((state) => state.setActiveCell);
  const extendSelection = useSelectionStore((state) => state.extendSelection);
  const clearSelection = useSelectionStore((state) => state.clearSelection);

  const editingCell = useEditingStore((state) => state.editingCell);
  const startEditing = useEditingStore((state) => state.startEditing);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    target:
      | { type: 'cell'; rowId: string; fieldId: string }
      | { type: 'row'; rowId: string }
      | { type: 'column'; fieldId: string };
  } | null>(null);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [sortingInProgress, setSortingInProgress] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Column order state (for drag reordering)
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

  // Column sizing state (for resizing)
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  // Row selection state — supports controlled mode via selectedRowIds prop
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set());
  const isControlledSelection = selectedRowIds !== undefined;
  const selectedRows = isControlledSelection ? new Set(selectedRowIds) : internalSelectedRows;
  const setSelectedRows = isControlledSelection
    ? (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
        // In controlled mode, we don't update internal state — just fire onSelectionChange
        const next = typeof updater === 'function' ? updater(selectedRows) : updater;
        onSelectionChange?.(Array.from(next));
      }
    : setInternalSelectedRows;

  // Column selection state (for multi-column drag and header copy)
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [columnAnchor, setColumnAnchor] = useState<string | null>(null);

  // Row order state (for reordering via drag-and-drop)
  const [rowOrder, setRowOrder] = useState<string[]>([]);

  // Track where to insert a newly created row
  const pendingInsertAfterRef = useRef<string | null>(null);

  // Ghost grid: track container size to auto-calculate ghost row/column counts
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ghostGrid || !containerRef.current || typeof ResizeObserver === 'undefined') return;
    const el = containerRef.current;
    const ro = new ResizeObserver(([entry]) => {
      setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ghostGrid]);

  // Clear initial loading state after a brief spinner flash
  useEffect(() => {
    if (!initialLoad) return;
    const timer = setTimeout(() => setInitialLoad(false), 150);
    return () => clearTimeout(timer);
  }, [initialLoad]);

  // Initialize column order when table changes
  useEffect(() => {
    setColumnOrder(table.fields.map((f) => f.id));
  }, [table.fields]);

  // Initialize row order when rows change, respecting pending inserts
  useEffect(() => {
    const newIds = rows.map((r) => r.id);
    const afterId = pendingInsertAfterRef.current;

    if (afterId) {
      pendingInsertAfterRef.current = null;
      // Find new row IDs not in current rowOrder
      const existing = new Set(rowOrder);
      const newRowIds = newIds.filter((id) => !existing.has(id));

      if (newRowIds.length > 0) {
        // Keep current order, remove stale IDs, insert new rows after target
        const validIds = new Set(newIds);
        const filtered = rowOrder.filter((id) => validIds.has(id));
        const afterIdx = filtered.indexOf(afterId);
        if (afterIdx !== -1) {
          filtered.splice(afterIdx + 1, 0, ...newRowIds);
        } else {
          filtered.push(...newRowIds);
        }
        setRowOrder(filtered);
        onRowsReorder?.(filtered);
        return;
      }
    }

    setRowOrder(newIds);
  }, [rows]);

  // Notify parent of selection changes (uncontrolled mode only)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isControlledSelection) {
      onSelectionChange?.(Array.from(selectedRows));
    }
  }, [internalSelectedRows]); // intentionally omit onSelectionChange to avoid infinite loops

  // Drag state for column reordering
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [columnDropPosition, setColumnDropPosition] = useState<'before' | 'after' | null>(null);

  // Auto-scroll during column drag
  const autoScrollIntervalRef = useRef<number | null>(null);
  const autoScrollDirectionRef = useRef<'left' | 'right' | null>(null);

  const startAutoScroll = useCallback((direction: 'left' | 'right') => {
    // Already scrolling in this direction
    if (autoScrollIntervalRef.current !== null && autoScrollDirectionRef.current === direction) return;
    // Stop existing scroll if direction changed
    if (autoScrollIntervalRef.current !== null) {
      clearInterval(autoScrollIntervalRef.current);
    }
    autoScrollDirectionRef.current = direction;
    autoScrollIntervalRef.current = window.setInterval(() => {
      if (containerRef.current) {
        containerRef.current.scrollLeft += direction === 'right' ? 8 : -8;
      }
    }, 16);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current !== null) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
      autoScrollDirectionRef.current = null;
    }
  }, []);

  // Drag state for row reordering
  const [draggedRow, setDraggedRow] = useState<string | null>(null);
  const [dragOverRow, setDragOverRow] = useState<string | null>(null);
  const [rowDropPosition, setRowDropPosition] = useState<'before' | 'after' | null>(null);

  // Fill handle drag state
  const [fillDrag, setFillDrag] = useState<{
    sourceRowId: string;
    fieldId: string;
    targetRowIds: string[];
  } | null>(null);
  const fillDragRef = useRef(fillDrag);
  fillDragRef.current = fillDrag;

  // Build field and row indices for navigation (using visible fields only)
  const visibleFields = useMemo(
    () => table.fields.filter((f) => columnVisibility[f.id] !== false),
    [table.fields, columnVisibility]
  );
  const fieldIds = useMemo(() => visibleFields.map((f) => f.id), [visibleFields]);
  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);

  // Compute input field IDs for the currently selected computed field
  const activeComputedInputIds = useMemo(() => {
    if (!activeCell) return [];
    const field = table.fields.find((f) => f.id === activeCell.fieldId);
    if (field?.type === 'Computed' && field.options && 'inputFieldIds' in field.options) {
      return field.options.inputFieldIds || [];
    }
    return [];
  }, [activeCell, table.fields]);

  // Sort handler for GridHeader
  const handleSort = useCallback((fieldId: string, direction: 'asc' | 'desc' | null) => {
    setSortingInProgress(true);
    if (direction === null) {
      setSorting([]);
      onSortChange?.(null, null);
    } else {
      setSorting([{ id: fieldId, desc: direction === 'desc' }]);
      onSortChange?.(fieldId, direction);
    }
    // Clear after React re-render settles
    setTimeout(() => setSortingInProgress(false), 150);
  }, [onSortChange]);

  // Hide column handler
  const handleHide = useCallback((fieldId: string) => {
    setColumnVisibility((prev) => ({ ...prev, [fieldId]: false }));
  }, []);

  // Unhide column handler
  const handleUnhide = useCallback((fieldId: string) => {
    setColumnVisibility((prev) => ({ ...prev, [fieldId]: true }));
  }, []);

  // Get list of hidden columns
  const hiddenColumns = useMemo(
    () => table.fields.filter((f) => columnVisibility[f.id] === false),
    [table.fields, columnVisibility]
  );

  // Get current sort state for a field
  const getSortDirection = useCallback(
    (fieldId: string): 'asc' | 'desc' | null => {
      const sortState = sorting.find((s) => s.id === fieldId);
      if (!sortState) return null;
      return sortState.desc ? 'desc' : 'asc';
    },
    [sorting]
  );

  // Column header click:
  //   Plain click → toggle sort
  //   Ctrl/Cmd+Click → multi-select for column drag
  //   Shift+Click → select header range (for copy)
  const handleColumnClick = useCallback((fieldId: string, e: React.MouseEvent) => {
    if (e.shiftKey && columnAnchor) {
      // Shift+Click: select range from anchor to this column
      const startIdx = fieldIds.indexOf(columnAnchor);
      const endIdx = fieldIds.indexOf(fieldId);
      if (startIdx !== -1 && endIdx !== -1) {
        const min = Math.min(startIdx, endIdx);
        const max = Math.max(startIdx, endIdx);
        setSelectedColumns(new Set(fieldIds.slice(min, max + 1)));
      }
      clearSelection(); // clear cell selection when selecting headers
    } else if (e.ctrlKey || e.metaKey) {
      // Multi-select for column drag
      if (!allowMultiColumnDrag) return;
      setSelectedColumns((prev) => {
        const next = new Set(prev);
        if (next.has(fieldId)) next.delete(fieldId);
        else next.add(fieldId);
        return next;
      });
      setColumnAnchor(fieldId);
    } else {
      // Toggle sort: none → asc → desc → none (skip if not sortable)
      if (columnSortable?.[fieldId] === false) return;
      const current = getSortDirection(fieldId);
      if (current === null) {
        handleSort(fieldId, 'asc');
      } else if (current === 'asc') {
        handleSort(fieldId, 'desc');
      } else {
        handleSort(fieldId, null);
      }
      // Set this as anchor for potential Shift+Click
      setColumnAnchor(fieldId);
      setSelectedColumns(new Set());
    }
  }, [allowMultiColumnDrag, getSortDirection, handleSort, columnAnchor, fieldIds, clearSelection, columnSortable]);

  // Column drag handlers
  const handleDragStart = useCallback((fieldId: string) => {
    if (!allowMultiColumnDrag) {
      setSelectedColumns(new Set());
      setDraggedColumn(fieldId);
      return;
    }
    if (selectedColumns.has(fieldId)) {
      setDraggedColumn(fieldId);
    } else {
      setSelectedColumns(new Set([fieldId]));
      setDraggedColumn(fieldId);
    }
  }, [selectedColumns, allowMultiColumnDrag]);

  const handleColumnDragOver = useCallback((fieldId: string, e: React.DragEvent) => {
    if (draggedColumn && draggedColumn !== fieldId) {
      // Determine if dropping before or after based on mouse position
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;
      const newPosition = e.clientX < midpoint ? 'before' : 'after';

      // Only update state if values changed to avoid re-renders
      setDragOverColumn((prev) => prev === fieldId ? prev : fieldId);
      setColumnDropPosition((prev) => prev === newPosition ? prev : newPosition);
    }
  }, [draggedColumn]);

  // Handle auto-scroll at container level during column drag
  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    if (!draggedColumn || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const edgeThreshold = 40;
    if (e.clientX < containerRect.left + edgeThreshold) {
      startAutoScroll('left');
    } else if (e.clientX > containerRect.right - edgeThreshold) {
      startAutoScroll('right');
    } else {
      stopAutoScroll();
    }
  }, [draggedColumn, startAutoScroll, stopAutoScroll]);

  const handleDragEnd = useCallback(() => {
    stopAutoScroll();
    if (draggedColumn && dragOverColumn && draggedColumn !== dragOverColumn) {
      setColumnOrder((prev) => {
        const columnsToMove = selectedColumns.size > 0 && selectedColumns.has(draggedColumn)
          ? prev.filter((id) => selectedColumns.has(id))
          : [draggedColumn];

        const remaining = prev.filter((id) => !columnsToMove.includes(id));

        let dropIndex = remaining.indexOf(dragOverColumn);
        if (dropIndex === -1) dropIndex = remaining.length;
        if (columnDropPosition === 'after') dropIndex++;

        const newOrder = [
          ...remaining.slice(0, dropIndex),
          ...columnsToMove,
          ...remaining.slice(dropIndex),
        ];

        onColumnsReorder?.(newOrder);
        return newOrder;
      });
    }
    setDraggedColumn(null);
    setDragOverColumn(null);
    setColumnDropPosition(null);
  }, [draggedColumn, dragOverColumn, columnDropPosition, onColumnsReorder, stopAutoScroll, selectedColumns]);

  // Row selection handlers
  const handleRowSelect = useCallback((rowId: string, selected: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(rows.map((r) => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [rows]);

  // Row drag handlers
  const handleRowDragStart = useCallback((rowId: string) => {
    // If dragged row is part of selection, drag them all; otherwise single drag
    if (!selectedRows.has(rowId)) {
      setSelectedRows(new Set([rowId]));
    }
    setDraggedRow(rowId);
  }, [selectedRows]);

  const handleRowDragOver = useCallback((rowId: string, e: React.DragEvent) => {
    if (draggedRow && draggedRow !== rowId) {
      // Determine if dropping before or after based on mouse position
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const newPosition = e.clientY < midpoint ? 'before' : 'after';

      // Only update state if values changed to avoid re-renders
      setDragOverRow((prev) => prev === rowId ? prev : rowId);
      setRowDropPosition((prev) => prev === newPosition ? prev : newPosition);
    }
  }, [draggedRow]);

  const handleRowDragEnd = useCallback(() => {
    if (draggedRow && dragOverRow && draggedRow !== dragOverRow) {
      setRowOrder((prev) => {
        const rowsToMove = selectedRows.size > 0 && selectedRows.has(draggedRow)
          ? prev.filter((id) => selectedRows.has(id))
          : [draggedRow];

        const remaining = prev.filter((id) => !rowsToMove.includes(id));

        let dropIndex = remaining.indexOf(dragOverRow);
        if (dropIndex === -1) dropIndex = remaining.length;
        if (rowDropPosition === 'after') dropIndex++;

        const newOrder = [
          ...remaining.slice(0, dropIndex),
          ...rowsToMove,
          ...remaining.slice(dropIndex),
        ];

        onRowsReorder?.(newOrder);
        return newOrder;
      });
    }
    setDraggedRow(null);
    setDragOverRow(null);
    setRowDropPosition(null);
  }, [draggedRow, dragOverRow, rowDropPosition, onRowsReorder, selectedRows]);

  // Fill handle start
  const handleFillStart = useCallback((sourceRowId: string, fieldId: string) => {
    setFillDrag({ sourceRowId, fieldId, targetRowIds: [] });

    const handleMouseMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;
      const td = el.closest('td[data-row-id][data-field-id]') as HTMLElement | null;
      if (!td) return;
      const hoveredFieldId = td.dataset.fieldId;
      const hoveredRowId = td.dataset.rowId;
      if (hoveredFieldId !== fieldId || !hoveredRowId) return;

      const sourceIdx = rowIds.indexOf(sourceRowId);
      const hoverIdx = rowIds.indexOf(hoveredRowId);
      if (sourceIdx === -1 || hoverIdx === -1) return;

      const minIdx = Math.min(sourceIdx, hoverIdx);
      const maxIdx = Math.max(sourceIdx, hoverIdx);
      const targets: string[] = [];
      for (let i = minIdx; i <= maxIdx; i++) {
        if (rowIds[i] !== sourceRowId) targets.push(rowIds[i]);
      }
      setFillDrag((prev) => prev ? { ...prev, targetRowIds: targets } : null);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      const drag = fillDragRef.current;
      if (drag && drag.targetRowIds.length > 0 && onCellSave) {
        const sourceRow = rows.find((r) => r.id === drag.sourceRowId);
        if (sourceRow) {
          const sourceValue = sourceRow.fields[drag.fieldId];
          for (const targetRowId of drag.targetRowIds) {
            onCellSave(targetRowId, drag.fieldId, sourceValue);
          }
        }
      }
      setFillDrag(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [rowIds, rows, onCellSave]);

  const isFixedHeight = rowHeight !== 'fit';
  const heightMap = isCompact ? COMPACT_ROW_HEIGHTS : ROW_HEIGHTS;
  const cellHeight = isFixedHeight ? heightMap[rowHeight] : (isCompact ? 28 : 44); // fallback minHeight for fit mode

  // 'fill' mode: distribute available container width evenly across visible columns
  const fillWidth = useMemo(() => {
    if (columnFit !== 'fill' || containerSize.width <= 0) return null;
    const actionsColWidth = showRowNumbers ? 70 : 50;
    const visibleCount = table.fields.filter(f => columnVisibility[f.id] !== false).length;
    if (visibleCount === 0) return null;
    return Math.max(80, Math.floor((containerSize.width - actionsColWidth) / visibleCount));
  }, [columnFit, containerSize.width, table.fields, columnVisibility, showRowNumbers]);

  // 'auto' mode: size each column to fit the widest content (header + data values)
  // Uses canvas measureText for real pixel width + type-aware rules for non-text renderers.
  const autoFitWidths = useMemo(() => {
    if (columnFit === 'fill' || columnFit === 'fixed') return null;
    if (typeof document === 'undefined') return null; // SSR guard

    // Create offscreen canvas for text measurement.
    // Guard against jsdom (which throws "Not implemented" on getContext).
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      const canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
    } catch {
      return null;
    }
    if (!ctx) return null;

    const fontSize = isCompact ? 12 : 14;
    const cellFont = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const headerFont = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

    // Chrome constants (measured from actual component styles)
    // Header: drag handle (22) + content padding (12) + type icon+gap (20) + menu button (22) + resize handle (5) + fade buffer (12)
    const HEADER_CHROME = isCompact ? 80 : 93;
    const CELL_PADDING = isCompact ? 20 : 32; // horizontal padding + borders

    // Type-specific minimum widths (for non-text renderers)
    const THUMBNAIL_SIZE = cellHeight; // images render as square thumbnails at row height
    const TYPE_MIN_WIDTH: Partial<Record<string, number>> = {
      Image: THUMBNAIL_SIZE + CELL_PADDING,
      Attachment: THUMBNAIL_SIZE + CELL_PADDING,
      Audio: 180, // audio player needs room
      Video: 180,
      Boolean: 60, // just an icon
      Rating: 140, // 5 stars
      Color: 140, // swatch + hex value
      Date: 120,
    };

    // Types that render strings differently than the raw value
    const STRING_RENDERED_TYPES = new Set(['Text', 'Number', 'Email', 'URL', 'Phone', 'Computed']);

    const widths: Record<string, number> = {};
    for (const field of table.fields) {
      // Header width: type icon + label + menu + sort indicator
      ctx.font = headerFont;
      const headerTextW = ctx.measureText(field.label).width;
      const headerW = Math.ceil(headerTextW) + HEADER_CHROME;

      // Data width: depends on field type
      let dataW = 0;

      const typeMinW = TYPE_MIN_WIDTH[field.type];
      if (typeMinW) {
        // Type has a minimum based on its rendering (thumbnail, icon, pill, etc.)
        dataW = typeMinW;
      }

      if (STRING_RENDERED_TYPES.has(field.type)) {
        // Measure the widest string value
        ctx.font = cellFont;
        let maxTextW = 0;
        const sampleSize = Math.min(rows.length, 200); // cap samples for perf
        for (let i = 0; i < sampleSize; i++) {
          const val = rows[i].fields[field.id];
          if (val == null) continue;
          const str = typeof val === 'string' ? val : String(val);
          const w = ctx.measureText(str).width;
          if (w > maxTextW) maxTextW = w;
        }
        dataW = Math.max(dataW, Math.ceil(maxTextW) + CELL_PADDING);
      } else if (field.type === 'SingleSelect' || field.type === 'MultiSelect') {
        // Pills: measure the widest option value with pill padding
        ctx.font = cellFont;
        let maxTextW = 0;
        const sampleSize = Math.min(rows.length, 200);
        for (let i = 0; i < sampleSize; i++) {
          const val = rows[i].fields[field.id];
          if (val == null) continue;
          const values = Array.isArray(val) ? val : [val];
          for (const v of values) {
            const w = ctx.measureText(String(v)).width;
            if (w > maxTextW) maxTextW = w;
          }
        }
        // Pill has internal padding (~16px) + cell padding
        dataW = Math.max(dataW, Math.ceil(maxTextW) + 16 + CELL_PADDING);
      } else if (field.type === 'Date') {
        // Dates render in a fixed format
        ctx.font = cellFont;
        const sampleW = ctx.measureText('2024-12-31 14:30').width;
        dataW = Math.max(dataW, Math.ceil(sampleW) + CELL_PADDING);
      }

      // Take the larger of header vs data, clamp to sensible bounds
      // Per-column min/max override the global autoFitMin/autoFitMax
      const minW = columnMinWidth?.[field.id] ?? autoFitMin;
      const maxW = columnMaxWidth?.[field.id] ?? autoFitMax;
      widths[field.id] = Math.max(minW, Math.min(maxW, Math.max(headerW, dataW)));
    }
    return widths;
  }, [columnFit, table.fields, rows, isCompact, cellHeight, columnMinWidth, columnMaxWidth, autoFitMin, autoFitMax]);

  const columns = useMemo(() => {
    const helper = createColumnHelper<Row>();

    return table.fields.map((field) =>
      helper.accessor((row) => row.fields[field.id], {
        id: field.id,
        header: () => (
          <GridHeader
            field={field}
            customIcon={customIcons?.[field.id]}
            sortDirection={getSortDirection(field.id)}
            isInputToComputed={activeComputedInputIds.includes(field.id)}
            isCompact={isCompact}
            isLocked={columnEditable?.[field.id] === false}
            onRename={onColumnRename}
            onSort={columnSortable?.[field.id] === false ? undefined : handleSort}
            onHide={handleHide}
            onDelete={onColumnDelete}
            onUpdateOptions={onColumnUpdateOptions}
            onChangeType={onColumnChangeType}
            onValidateType={onColumnValidateType}
          />
        ),
        cell: () => null, // We render cells directly
        sortingFn: 'auto',
        size: columnSizing[field.id] || columnWidth?.[field.id] || autoFitWidths?.[field.id] || fillWidth || 180,
        minSize: columnMinWidth?.[field.id] ?? 80,
        maxSize: columnMaxWidth?.[field.id] ?? 600,
      })
    ) as ColumnDef<Row, unknown>[];
  }, [
    table.fields,
    activeComputedInputIds,
    onColumnRename,
    onColumnDelete,
    onColumnUpdateOptions,
    onColumnChangeType,
    onColumnValidateType,
    getSortDirection,
    handleSort,
    handleHide,
    columnSizing,
    autoFitWidths,
    fillWidth,
  ]);

  const reactTable = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnOrder,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
  });

  // Ordered rows for rendering (respects drag-and-drop row order)
  const orderedRows = useMemo(() =>
    rowOrder
      .map((rowId) => reactTable.getRowModel().rows.find((r) => r.id === rowId))
      .filter(Boolean) as NonNullable<ReturnType<typeof reactTable.getRowModel>['rows'][number]>[],
    [rowOrder, reactTable.getRowModel().rows],
  );

  // ── Grouping ──────────────────────────────────────────────────────────
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(
    // If groupCollapsed is true, start with all groups collapsed (lazily populated on first render)
  ));

  // ── Row coloring ──────────────────────────────────────────────────────
  // Build a value → color map from the colorBy field's options
  const rowColorMap = useMemo(() => {
    if (!colorBy) return null;
    const field = table.fields.find(f => f.id === colorBy);
    if (!field) return null;

    const map: Record<string, string> = {};
    // SingleSelect / MultiSelect: read colors from options
    if ((field.type === 'SingleSelect' || field.type === 'MultiSelect') && field.options && 'options' in field.options) {
      const opts = (field.options as { options: Array<{ value: string; color?: string }> }).options;
      for (const opt of opts) {
        if (opt.color) map[opt.value] = opt.color;
      }
    }
    // Boolean: sensible defaults (pastel green/red)
    if (field.type === 'Boolean') {
      map['true'] = '#dcfce7';
      map['false'] = '#fee2e2';
    }
    // Apply user overrides
    if (colorByMap) Object.assign(map, colorByMap);
    return map;
  }, [colorBy, table.fields, colorByMap]);

  const getRowColor = useCallback((row: Row): string | undefined => {
    if (!colorBy || !rowColorMap) return undefined;
    const val = row.fields[colorBy];
    if (val == null) return undefined;
    // MultiSelect: use the first value's color
    const key = Array.isArray(val) ? String(val[0]) : String(val);
    return rowColorMap[key];
  }, [colorBy, rowColorMap]);

  type RenderItem =
    | { type: 'group-header'; groupValue: string; count: number; fieldId: string; rowIds: string[] }
    | { type: 'row'; row: typeof orderedRows[number]; originalIndex: number };

  const renderItems: RenderItem[] = useMemo(() => {
    if (!groupBy) return orderedRows.map((row, i) => ({ type: 'row' as const, row, originalIndex: i }));

    const groups = new Map<string, typeof orderedRows>();
    for (const row of orderedRows) {
      const val = String(row.original.fields[groupBy] ?? '');
      const key = val || '(empty)';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    // On first render with groupCollapsed=true, collapse all
    if (groupCollapsed && collapsedGroups.size === 0 && groups.size > 0) {
      setCollapsedGroups(new Set(groups.keys()));
    }

    // Order the groups according to groupOrder
    let orderedKeys = Array.from(groups.keys());
    if (Array.isArray(groupOrder)) {
      // Explicit list — put listed values first in the given order, then the rest (insertion order)
      const priority = new Map(groupOrder.map((v, i) => [v, i]));
      orderedKeys.sort((a, b) => {
        const ai = priority.has(a) ? priority.get(a)! : Infinity;
        const bi = priority.has(b) ? priority.get(b)! : Infinity;
        if (ai !== bi) return ai - bi;
        return a.localeCompare(b);
      });
    } else if (groupOrder === 'asc') {
      orderedKeys.sort((a, b) => a.localeCompare(b));
    } else if (groupOrder === 'desc') {
      orderedKeys.sort((a, b) => b.localeCompare(a));
    } else if (groupOrder === 'count-desc') {
      orderedKeys.sort((a, b) => groups.get(b)!.length - groups.get(a)!.length);
    } else if (groupOrder === 'count-asc') {
      orderedKeys.sort((a, b) => groups.get(a)!.length - groups.get(b)!.length);
    } else {
      // 'auto' — use SingleSelect/MultiSelect option order when available
      const field = table.fields.find(f => f.id === groupBy);
      if (field && (field.type === 'SingleSelect' || field.type === 'MultiSelect') && field.options && 'options' in field.options) {
        const opts = (field.options as { options: Array<{ value: string }> }).options;
        const priority = new Map(opts.map((o, i) => [o.value, i]));
        orderedKeys.sort((a, b) => {
          const ai = priority.has(a) ? priority.get(a)! : Infinity;
          const bi = priority.has(b) ? priority.get(b)! : Infinity;
          if (ai !== bi) return ai - bi;
          return a.localeCompare(b);
        });
      } else {
        // Fallback for non-select fields: alphabetical
        orderedKeys.sort((a, b) => a.localeCompare(b));
      }
    }

    const items: RenderItem[] = [];
    for (const value of orderedKeys) {
      const groupRows = groups.get(value)!;
      items.push({
        type: 'group-header',
        groupValue: value,
        count: groupRows.length,
        fieldId: groupBy,
        rowIds: groupRows.map(r => r.original.id),
      });
      if (!collapsedGroups.has(value)) {
        items.push(...groupRows.map((row, i) => ({ type: 'row' as const, row, originalIndex: i })));
      }
    }
    return items;
  }, [orderedRows, groupBy, collapsedGroups, groupCollapsed, groupOrder, table.fields]);

  const toggleGroup = useCallback((groupValue: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupValue)) next.delete(groupValue);
      else next.add(groupValue);
      return next;
    });
  }, []);

  // Virtual row rendering for performance with large datasets
  const rowVirtualizer = useVirtualizer({
    count: renderItems.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (index) => renderItems[index]?.type === 'group-header' ? 36 : cellHeight,
    overscan: 20,
  });

  // Ghost grid: compute how many extra rows/columns to render
  const ghostCounts = useMemo(() => {
    if (!ghostGrid) return { rows: 0, columns: 0 };
    if (typeof ghostGrid === 'object') {
      return { rows: ghostGrid.rows ?? 0, columns: ghostGrid.columns ?? 0 };
    }
    // Auto-calculate based on container size
    // Use container height if available, otherwise estimate from viewport
    const effectiveHeight = containerSize.height > 0
      ? containerSize.height
      : (typeof window !== 'undefined' ? window.innerHeight * 0.6 : 400);
    const headerHeight = 44;
    const dataHeight = renderItems.length * cellHeight;
    const availableHeight = effectiveHeight - headerHeight;
    // Always show at least a few ghost rows to fill the visible area
    const ghostRows = Math.max(3, Math.ceil((availableHeight - dataHeight) / cellHeight));

    const visibleFields = table.fields.filter(
      (f) => columnVisibility[f.id] !== false,
    );
    const actionsColWidth = showRowNumbers ? 70 : 50;
    const effectiveWidth = containerSize.width > 0
      ? containerSize.width
      : (typeof window !== 'undefined' ? window.innerWidth * 0.8 : 800);
    const usedWidth = actionsColWidth + visibleFields.reduce(
      (sum, f) => sum + (columnSizing[f.id] || columnWidth?.[f.id] || 180),
      0,
    );
    const defaultGhostColWidth = 180;
    const ghostCols = Math.max(0, Math.ceil((effectiveWidth - usedWidth) / defaultGhostColWidth));

    return { rows: ghostRows, columns: ghostCols };
  }, [ghostGrid, containerSize, renderItems.length, cellHeight, table.fields, columnVisibility, columnSizing, columnWidth, showRowNumbers]);

  const navigate = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right', extend = false) => {
      if (!activeCell) return;

      const rowIndex = rowIds.indexOf(activeCell.rowId);
      const fieldIndex = fieldIds.indexOf(activeCell.fieldId);

      if (rowIndex === -1 || fieldIndex === -1) return;

      let newRowIndex = rowIndex;
      let newFieldIndex = fieldIndex;

      switch (direction) {
        case 'up':
          newRowIndex = Math.max(0, rowIndex - 1);
          break;
        case 'down':
          newRowIndex = Math.min(rowIds.length - 1, rowIndex + 1);
          break;
        case 'left':
          newFieldIndex = Math.max(0, fieldIndex - 1);
          break;
        case 'right':
          newFieldIndex = Math.min(fieldIds.length - 1, fieldIndex + 1);
          break;
      }

      if (newRowIndex !== rowIndex || newFieldIndex !== fieldIndex) {
        const newCell = { rowId: rowIds[newRowIndex], fieldId: fieldIds[newFieldIndex] };
        if (extend) {
          extendSelection(newCell);
        } else {
          setActiveCell(newCell);
        }
        // Scroll virtualized row into view
        if (newRowIndex !== rowIndex) {
          rowVirtualizer.scrollToIndex(newRowIndex, { align: 'auto' });
        }
      }
    },
    [activeCell, rowIds, fieldIds, setActiveCell, extendSelection, rowVirtualizer]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle if we're editing
      if (editingCell) return;

      // Copy selected column headers (works even without cell selection)
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedColumns.size > 0 && !activeCell) {
        e.preventDefault();
        const orderedSelected = fieldIds.filter((id) => selectedColumns.has(id));
        const labels = orderedSelected.map((id) => {
          const f = table.fields.find((f) => f.id === id);
          return f?.label ?? id;
        });
        navigator.clipboard.writeText(labels.join('\t')).catch(() => {});
        return;
      }

      if (!activeCell) return;

      const mod = e.metaKey || e.ctrlKey;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          navigate('up', e.shiftKey);
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigate('down', e.shiftKey);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigate('left', e.shiftKey);
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigate('right', e.shiftKey);
          break;
        case 'Tab':
          e.preventDefault();
          navigate(e.shiftKey ? 'left' : 'right');
          break;
        case 'Escape':
          clearSelection();
          setSelectedColumns(new Set());
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Enter: add new row
            onAddRow?.();
          } else {
            // Skip editing for computed or non-editable columns
            const activeField = table.fields.find((f) => f.id === activeCell.fieldId);
            if (activeField?.type === 'Computed') break;
            if (columnEditable?.[activeCell.fieldId] === false) break;
            if (!onCellSave) break;
            // Start editing the active cell
            const row = rows.find((r) => r.id === activeCell.rowId);
            if (row) {
              const value = row.fields[activeCell.fieldId];
              startEditing(activeCell.rowId, activeCell.fieldId, value);
            }
          }
          break;
        case 'c':
          if (mod) {
            e.preventDefault();
            if (anchorCell) {
              // Range copy — build TSV from selected rectangle
              const anchor = anchorCell;
              const focus = activeCell;
              const r1 = rowIds.indexOf(anchor.rowId);
              const r2 = rowIds.indexOf(focus.rowId);
              const c1 = fieldIds.indexOf(anchor.fieldId);
              const c2 = fieldIds.indexOf(focus.fieldId);
              const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
              const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
              const lines: string[] = [];
              for (let ri = minR; ri <= maxR; ri++) {
                const row = rows.find((r) => r.id === rowIds[ri]);
                if (!row) continue;
                const cells: string[] = [];
                for (let ci = minC; ci <= maxC; ci++) {
                  cells.push(valueToClipboardText(row.fields[fieldIds[ci]]));
                }
                lines.push(cells.join('\t'));
              }
              navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
            } else {
              // Single cell copy
              const row = rows.find((r) => r.id === activeCell.rowId);
              if (row) {
                const val = row.fields[activeCell.fieldId];
                navigator.clipboard.writeText(valueToClipboardText(val)).catch(() => {});
              }
            }
          }
          break;
        case 'v':
          if (mod && onCellSave) {
            e.preventDefault();
            navigator.clipboard.readText().then((text) => {
              const tsvRows = text.split('\n').map((line) => line.split('\t'));
              const startRowIdx = rowIds.indexOf(activeCell.rowId);
              const startColIdx = fieldIds.indexOf(activeCell.fieldId);
              if (startRowIdx === -1 || startColIdx === -1) return;

              for (let ri = 0; ri < tsvRows.length; ri++) {
                const targetRowIdx = startRowIdx + ri;
                if (targetRowIdx >= rowIds.length) break;
                const targetRowId = rowIds[targetRowIdx];

                for (let ci = 0; ci < tsvRows[ri].length; ci++) {
                  const targetColIdx = startColIdx + ci;
                  if (targetColIdx >= fieldIds.length) break;
                  const targetFieldId = fieldIds[targetColIdx];

                  // Skip non-editable columns
                  const field = table.fields.find((f) => f.id === targetFieldId);
                  if (!field || field.type === 'Computed') continue;
                  if (columnEditable?.[targetFieldId] === false) continue;

                  const cellText = tsvRows[ri][ci];
                  let value: Value;
                  switch (field.type) {
                    case 'Number': {
                      const n = parseFloat(cellText);
                      value = isNaN(n) ? null : n;
                      break;
                    }
                    case 'Boolean':
                      value = cellText === 'true' || cellText === '1';
                      break;
                    case 'MultiSelect':
                      try { value = JSON.parse(cellText); if (!Array.isArray(value)) value = [cellText]; }
                      catch { value = [cellText]; }
                      break;
                    default:
                      value = cellText;
                  }
                  onCellSave(targetRowId, targetFieldId, value);
                }
              }
            }).catch(() => {});
          }
          break;
      }
    },
    [activeCell, anchorCell, editingCell, navigate, clearSelection, rows, startEditing, onAddRow, table.fields, onCellSave, columnEditable, rowIds, fieldIds, selectedColumns]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  // Clear column selection when a cell is clicked
  useEffect(() => {
    if (activeCell) {
      setSelectedColumns(new Set());
    }
  }, [activeCell]);

  // Focus the grid when a cell is selected
  useEffect(() => {
    if (activeCell && containerRef.current && !editingCell) {
      containerRef.current.focus();
    }
  }, [activeCell, editingCell]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onDragOver={handleContainerDragOver}
      style={{
        position: 'relative',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'auto',
        outline: 'none',
        flex: 1,
        minHeight: 0, // Important for flex children to allow shrinking
      }}
    >
      {/* Loading indicator */}
      {(loading || sortingInProgress || initialLoad) && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.6)',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: '32px', height: '32px',
            border: '3px solid #e5e7eb', borderTopColor: '#9ca3af',
            borderRadius: '50%',
            animation: 'mt-spin 0.6s linear infinite',
          }} />
          <style>{`@keyframes mt-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          {reactTable.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} style={{ background: '#f9fafb' }}>
              {/* Row actions header with select-all and row number label */}
              <th
                style={{
                  padding: isCompact ? '4px 4px' : '8px 4px',
                  width: showRowNumbers ? '70px' : '50px',
                  borderBottom: '2px solid #e5e7eb',
                  borderRight: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  verticalAlign: 'middle',
                  position: 'sticky',
                  left: 0,
                  zIndex: 12,
                  boxShadow: '2px 0 4px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {/* Spacer matching drag handle width in body rows */}
                  {onRowsReorder && (
                    <span style={{ padding: '2px', fontSize: '10px', visibility: 'hidden' }}>⋮⋮</span>
                  )}
                  {/* Select all checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedRows.size > 0 && selectedRows.size === rows.length}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = selectedRows.size > 0 && selectedRows.size < rows.length;
                      }
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{
                      width: '14px',
                      height: '14px',
                      cursor: 'pointer',
                      margin: 0,
                    }}
                    title="Select all rows"
                  />
                  {showRowNumbers && (
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, minWidth: '20px', textAlign: 'right' }}>#</span>
                  )}
                </div>
              </th>
              {headerGroup.headers.map((header) => {
                const fieldId = header.column.id;
                const isDraggingThis = draggedColumn === fieldId;
                const isDragOverThis = dragOverColumn === fieldId;
                const showDropBefore = isDragOverThis && columnDropPosition === 'before';
                const showDropAfter = isDragOverThis && columnDropPosition === 'after';
                const isColumnSelected = selectedColumns.has(fieldId);
                const isDimmed = (draggedColumn && isColumnSelected && selectedColumns.size > 1) || isDraggingThis;

                return (
                  <th
                    key={header.id}
                    onClick={(e) => handleColumnClick(fieldId, e)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, target: { type: 'column', fieldId } });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      handleColumnDragOver(fieldId, e);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDragEnd();
                    }}
                    style={{
                      padding: 0,
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: isCompact ? '12px' : '14px',
                      borderBottom: '2px solid #e5e7eb',
                      borderRight: '1px solid #e5e7eb',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      background: isColumnSelected ? '#eff6ff' : '#f9fafb',
                      boxShadow: isColumnSelected ? 'inset 0 -3px 0 #2563eb' : undefined,
                      width: header.getSize(),
                      minWidth: header.column.columnDef.minSize,
                      maxWidth: header.column.columnDef.maxSize,
                      opacity: isDimmed ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative' }}>
                      {/* Drop indicator - before */}
                      {showDropBefore && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '3px',
                            background: '#2563eb',
                            borderRadius: '2px',
                            zIndex: 10,
                          }}
                        />
                      )}
                      {/* Drag handle */}
                      {onColumnsReorder && (
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', fieldId);

                          // Create custom drag ghost
                          const count = allowMultiColumnDrag && selectedColumns.has(fieldId) ? selectedColumns.size : 1;
                          const ghost = document.createElement('div');
                          ghost.style.position = 'absolute';
                          ghost.style.top = '-1000px';
                          ghost.style.left = '-1000px';
                          ghost.style.pointerEvents = 'none';

                          if (count > 1) {
                            for (let i = count - 1; i >= 0; i--) {
                              const card = document.createElement('div');
                              card.style.width = '80px';
                              card.style.height = '28px';
                              card.style.background = '#eff6ff';
                              card.style.border = '1px solid #2563eb';
                              card.style.borderRadius = '4px';
                              card.style.position = 'absolute';
                              card.style.top = `${i * 4}px`;
                              card.style.left = `${i * 4}px`;
                              card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                              ghost.appendChild(card);
                            }
                            const badge = document.createElement('div');
                            badge.textContent = String(count);
                            badge.style.position = 'absolute';
                            badge.style.top = '4px';
                            badge.style.left = '30px';
                            badge.style.fontSize = '14px';
                            badge.style.fontWeight = '600';
                            badge.style.color = '#2563eb';
                            ghost.appendChild(badge);
                            ghost.style.width = `${80 + (count - 1) * 4}px`;
                            ghost.style.height = `${28 + (count - 1) * 4}px`;
                          } else {
                            const card = document.createElement('div');
                            card.style.width = '80px';
                            card.style.height = '28px';
                            card.style.background = '#f9fafb';
                            card.style.border = '1px solid #d1d5db';
                            card.style.borderRadius = '4px';
                            card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                            ghost.appendChild(card);
                            ghost.style.width = '80px';
                            ghost.style.height = '28px';
                          }

                          document.body.appendChild(ghost);
                          e.dataTransfer.setDragImage(ghost, 40, 14);
                          requestAnimationFrame(() => document.body.removeChild(ghost));

                          handleDragStart(fieldId);
                        }}
                        onDragEnd={handleDragEnd}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 4px 0 8px',
                          cursor: 'grab',
                          color: '#9ca3af',
                          fontSize: '10px',
                          userSelect: 'none',
                        }}
                        title="Drag to reorder column"
                      >
                        ⋮⋮
                      </div>
                      )}
                      {/* Content area - NOT draggable */}
                      <div style={{ flex: 1, minWidth: 0, padding: isCompact ? '6px 6px 6px 4px' : '12px 8px 12px 4px' }}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                      {/* Resize handle - not draggable */}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        style={{
                          width: '6px',
                          cursor: 'col-resize',
                          background: header.column.getIsResizing() ? '#2563eb' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (!header.column.getIsResizing()) {
                            e.currentTarget.style.background = '#d1d5db';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!header.column.getIsResizing()) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      />
                      {/* Drop indicator - after */}
                      {showDropAfter && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '3px',
                            background: '#2563eb',
                            borderRadius: '2px',
                            zIndex: 10,
                          }}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
              {/* Ghost column headers */}
              {ghostCounts.columns > 0 && Array.from({ length: ghostCounts.columns }, (_, i) => (
                <th
                  key={`ghost-col-${i}`}
                  className="mt-ghost-cell mt-ghost-header"
                  onDoubleClick={onCreateField ? () => onCreateField(`Column ${table.fields.length + i + 1}`, 'Text') : undefined}
                  style={{
                    padding: isCompact ? '4px 8px' : '8px 12px',
                    borderBottom: '2px solid #e9ecef',
                    borderRight: '1px solid #e9ecef',
                    background: '#fafbfc',
                    width: '180px',
                    minWidth: '180px',
                    cursor: onCreateField ? 'cell' : undefined,
                  }}
                />
              ))}
              {/* Add field column */}
              {onCreateField && !ghostGrid && (
                <th
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                    background: '#f9fafb',
                    width: '44px',
                    verticalAlign: 'middle',
                  }}
                >
                  <AddFieldButton onCreateField={onCreateField} onCreateComputedField={onCreateComputedField} fields={table.fields} />
                </th>
              )}
              {/* Hidden columns indicator */}
              {hiddenColumns.length > 0 && (
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 500,
                    fontSize: '13px',
                    borderBottom: '2px solid #e5e7eb',
                    background: '#f9fafb',
                    color: '#6b7280',
                    width: '120px',
                  }}
                >
                  <HiddenColumnsMenu
                    hiddenColumns={hiddenColumns}
                    onUnhide={handleUnhide}
                  />
                </th>
              )}
            </tr>
          ))}
        </thead>
        <tbody>
          {/* Spacer row for virtual scroll offset */}
          {rowVirtualizer.getVirtualItems().length > 0 && (
            <tr style={{ height: rowVirtualizer.getVirtualItems()[0].start }}>
              <td colSpan={100} style={{ padding: 0, border: 'none' }} />
            </tr>
          )}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = renderItems[virtualRow.index];

              // ── Group header row ──
              if (item.type === 'group-header') {
                const totalCols = (showRowNumbers ? 1 : 1) + table.fields.filter(f => columnVisibility[f.id] !== false).length + ghostCounts.columns;
                const isCollapsed = collapsedGroups.has(item.groupValue);
                const allSelected = item.rowIds.every(id => selectedRows.has(id));
                const someSelected = !allSelected && item.rowIds.some(id => selectedRows.has(id));
                return (
                  <tr
                    key={`group-${item.groupValue}`}
                    data-index={virtualRow.index}
                    style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}
                  >
                    <td
                      colSpan={totalCols + 1}
                      style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600, color: '#374151' }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => { if (el) el.indeterminate = someSelected; }}
                          onChange={() => {
                            setSelectedRows((prev) => {
                              const next = new Set(prev);
                              if (allSelected) {
                                item.rowIds.forEach(id => next.delete(id));
                              } else {
                                item.rowIds.forEach(id => next.add(id));
                              }
                              return next;
                            });
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span
                          onClick={() => toggleGroup(item.groupValue)}
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                          {isCollapsed ? '▶' : '▼'}{' '}
                          {item.groupValue}
                        </span>
                        <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '12px' }}>
                          ({item.count})
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              }

              // ── Regular data row ──
              const row = item.row;
              const rowIndex = virtualRow.index;
              const rowId = row.original.id;
              const isDragOverThis = dragOverRow === rowId;
              const showDropBefore = isDragOverThis && rowDropPosition === 'before';
              const showDropAfter = isDragOverThis && rowDropPosition === 'after';

              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    handleRowDragOver(rowId, e);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleRowDragEnd();
                  }}
                  style={(() => {
                    const rowColor = getRowColor(row.original);
                    const softened = rowColor ? `color-mix(in srgb, ${rowColor} 30%, white)` : null;
                    // Effective background: search highlight > row color > white
                    const effectiveBg = searchQuery ? '#fefce8' : (softened ?? 'white');
                    return {
                      position: 'relative',
                      ...(onRowClick && { cursor: 'pointer' }),
                      ...(isFixedHeight && {
                        height: cellHeight,
                        maxHeight: cellHeight,
                      }),
                      ...(softened && { background: softened }),
                      ...(searchQuery && { background: '#fefce8' }),
                      // Expose the effective row background so cell fade gradients blend into it
                      ['--mt-row-bg' as any]: effectiveBg,
                    };
                  })()}
                >
                  {/* Drop indicator - before row */}
                  {showDropBefore && (
                    <td
                      colSpan={100}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        height: '3px',
                        background: '#2563eb',
                        borderRadius: '2px',
                        zIndex: 10,
                        padding: 0,
                      }}
                    />
                  )}
                  <RowActions
                    rowId={rowId}
                    rowIndex={rowIndex}
                    showRowNumbers={showRowNumbers}
                    isSelected={selectedRows.has(rowId)}
                    isCompact={isCompact}
                    height={cellHeight}
                    onSelect={handleRowSelect}
                    onDelete={onRowDelete}
                    onView={onRowView}
                    onDuplicate={onRowDuplicate}
                    onAddRow={onAddRow ? () => { pendingInsertAfterRef.current = rowId; onAddRow(1, rowId); } : undefined}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, target: { type: 'row', rowId } });
                    }}
                    onDragStart={onRowsReorder ? handleRowDragStart : undefined}
                    onDragOver={(id) => {}}
                    onDragEnd={handleRowDragEnd}
                    isDragging={draggedRow === rowId || (!!draggedRow && selectedRows.has(rowId) && selectedRows.has(draggedRow))}
                    isDragOver={false}
                    selectedRowCount={selectedRows.has(rowId) ? selectedRows.size : 1}
                  />
                  {row.getVisibleCells().map((cell) => {
                    const field = table.fields.find((f) => f.id === cell.column.id)!;
                    const isComputed = field.type === 'Computed';
                    const isColumnEditable = columnEditable?.[field.id] !== false;
                    const cellEditable = !isComputed && isColumnEditable;
                    const cellRowId = row.original.id;
                    const inRange = isCellInRange(anchorCell, activeCell, cellRowId, field.id, rowIds, fieldIds);
                    return (
                      <GridCell
                        key={cell.id}
                        rowId={cellRowId}
                        field={field}
                        value={row.original.fields[field.id]}
                        row={row.original}
                        customRenderer={customRenderers?.[field.id]}
                        isCompact={isCompact}
                        isInRange={inRange}
                        align={columnAlign?.[field.id]}
                        onSave={cellEditable ? onCellSave : undefined}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, target: { type: 'cell', rowId: cellRowId, fieldId: field.id } });
                        }}
                        onFillStart={cellEditable ? handleFillStart : undefined}
                        isFillTarget={fillDrag?.fieldId === field.id && fillDrag.targetRowIds.includes(cellRowId)}
                        isColumnSelected={selectedColumns.has(field.id)}
                        height={cellHeight}
                        width={cell.column.getSize()}
                        fixedHeight={isFixedHeight}
                        allFields={isComputed ? table.fields : undefined}
                        onUpload={onUpload}
                      />
                    );
                  })}
                  {/* Ghost column cells for real rows */}
                  {ghostCounts.columns > 0 && Array.from({ length: ghostCounts.columns }, (_, gi) => (
                    <td
                      key={`ghost-${rowId}-${gi}`}
                      className="mt-ghost-cell"
                      onDoubleClick={onCreateField ? () => onCreateField(`Column ${table.fields.length + gi + 1}`, 'Text') : undefined}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        borderRight: '1px solid #e9ecef',
                        height: cellHeight,
                        minWidth: '120px',
                        cursor: onCreateField ? 'cell' : undefined,
                      }}
                    />
                  ))}
                  {/* Drop indicator - after row */}
                  {showDropAfter && (
                    <td
                      colSpan={100}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: '3px',
                        background: '#2563eb',
                        borderRadius: '2px',
                        zIndex: 10,
                        padding: 0,
                      }}
                    />
                  )}
                </tr>
              );
            })}
          {/* Spacer row for virtual scroll end padding */}
          {rowVirtualizer.getVirtualItems().length > 0 && (
            <tr style={{ height: rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems().at(-1)?.end ?? 0) }}>
              <td colSpan={100} style={{ padding: 0, border: 'none' }} />
            </tr>
          )}
          {/* Ghost rows */}
          {ghostCounts.rows > 0 && Array.from({ length: ghostCounts.rows }, (_, gi) => {
            const ghostRowIndex = rows.length + gi;
            const visibleFields = table.fields.filter((f) => columnVisibility[f.id] !== false);
            const totalCols = visibleFields.length + ghostCounts.columns;
            return (
              <tr key={`ghost-row-${gi}`} style={{ height: cellHeight }}>
                {/* Ghost row-actions cell (row number area) */}
                <td
                  className="mt-ghost-cell"
                  style={{
                    width: showRowNumbers ? '70px' : '50px',
                    borderBottom: '1px solid #e9ecef',
                    borderRight: '1px solid #e9ecef',
                    background: '#fafbfc',
                    padding: isCompact ? '2px 4px' : '4px 8px',
                    fontSize: '12px',
                    color: '#d1d5db',
                    textAlign: 'center',
                    userSelect: 'none',
                  }}
                >
                  {showRowNumbers ? ghostRowIndex + 1 : ''}
                </td>
                {/* Ghost data cells (real columns + ghost columns) */}
                {Array.from({ length: totalCols }, (_, ci) => {
                  const isRealColumn = ci < visibleFields.length;
                  const isGhostColumn = !isRealColumn;
                  return (
                  <td
                    key={ci}
                    className="mt-ghost-cell"
                    onDoubleClick={
                      isRealColumn && onAddRow ? () => onAddRow(1)
                      : isGhostColumn && onCreateField ? () => onCreateField(`Column ${table.fields.length + ci - visibleFields.length + 1}`, 'Text')
                      : undefined
                    }
                    style={{
                      borderBottom: '1px solid #e9ecef',
                      borderRight: '1px solid #e9ecef',
                      background: '#fafbfc',
                      minWidth: '120px',
                      cursor: (isRealColumn && onAddRow) || (isGhostColumn && onCreateField) ? 'cell' : undefined,
                    }}
                  />
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Context menu */}
      {contextMenu && (
        <GridContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          table={table}
          rows={rows}
          onClose={closeContextMenu}
          onCellSave={onCellSave}
          onRowDelete={onRowDelete}
          onRowDuplicate={onRowDuplicate}
          onRowView={onRowView}
          onAddRow={onAddRow ? (count, afterRowId) => { if (afterRowId) pendingInsertAfterRef.current = afterRowId; onAddRow(count, afterRowId); } : undefined}
          onColumnRename={onColumnRename}
          onColumnDelete={onColumnDelete}
          onColumnHide={handleHide}
          onSort={handleSort}
          sortDirection={'fieldId' in contextMenu.target ? getSortDirection(contextMenu.target.fieldId) : null}
          onColumnChangeType={onColumnChangeType}
          onColumnValidateType={onColumnValidateType}
          columnEditable={columnEditable}
          onGroupByChange={onGroupByChange}
          groupBy={groupBy}
          onColorByChange={onColorByChange}
          colorBy={colorBy}
        />
      )}
    </div>
  );
}

// =============================================================================
// Context Menu
// =============================================================================

function GridContextMenu({
  x,
  y,
  target,
  table,
  rows,
  onClose,
  onCellSave,
  onRowDelete,
  onRowDuplicate,
  onRowView,
  onAddRow,
  onColumnRename,
  onColumnDelete,
  onColumnHide,
  onSort,
  sortDirection,
  onColumnChangeType,
  onColumnValidateType,
  columnEditable,
  onGroupByChange,
  groupBy,
  onColorByChange,
  colorBy,
}: {
  x: number;
  y: number;
  target:
    | { type: 'cell'; rowId: string; fieldId: string }
    | { type: 'row'; rowId: string }
    | { type: 'column'; fieldId: string };
  table: TableSpec;
  rows: Row[];
  onClose: () => void;
  onCellSave?: (rowId: string, fieldId: string, value: Value) => void;
  columnEditable?: Record<string, boolean>;
  onRowDelete?: (rowId: string) => void;
  onRowDuplicate?: (rowId: string) => void;
  onRowView?: (rowId: string) => void;
  onAddRow?: (count?: number, afterRowId?: string) => void;
  onColumnRename?: (fieldId: string, newLabel: string) => void;
  onColumnDelete?: (fieldId: string) => void;
  onColumnHide?: (fieldId: string) => void;
  onSort?: (fieldId: string, direction: 'asc' | 'desc' | null) => void;
  sortDirection?: 'asc' | 'desc' | null;
  onColumnChangeType?: (fieldId: string, newType: FieldType) => void;
  onGroupByChange?: (fieldId: string | null) => void;
  groupBy?: string | null;
  onColorByChange?: (fieldId: string | null) => void;
  colorBy?: string | null;
  onColumnValidateType?: (fieldId: string, newType: FieldType) => Promise<{
    compatible: number;
    incompatible: number;
    total: number;
    warnings: string[];
  }>;
}) {
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  const [typePickerMode, setTypePickerMode] = useState(false);
  const [typeValidating, setTypeValidating] = useState(false);
  const [copyFormatMode, setCopyFormatMode] = useState<CopyFormat[] | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = () => onClose();
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const [pos, setPos] = useState({ left: x, top: y });
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let left = x;
      let top = y;
      if (x + rect.width > window.innerWidth - 8) left = x - rect.width;
      if (y + rect.height > window.innerHeight - 8) top = y - rect.height;
      if (left < 4) left = 4;
      if (top < 4) top = 4;
      setPos({ left, top });
    }
  }, [x, y]);

  type MenuItem = { label: string; icon?: string; action: () => void; danger?: boolean } | { divider: true };
  const items: MenuItem[] = [];

  if (target.type === 'cell') {
    const field = table.fields.find((f) => f.id === target.fieldId);
    const row = rows.find((r) => r.id === target.rowId);
    // Cell-level actions
    if (onCellSave && field && row && field.type !== 'Computed' && columnEditable?.[target.fieldId] !== false) {
      items.push({
        label: t('context.clearCell'),
        icon: '\u232b',
        action: () => { onCellSave(target.rowId, target.fieldId, null); onClose(); },
      });
    }
    // Copy value — show submenu if multiple formats available
    if (row && field) {
      const val = row.fields[target.fieldId];
      const formats = getCopyFormats(field.type, val, t);
      if (formats.length === 1) {
        items.push({
          label: formats[0].label,
          icon: '\u2398',
          action: () => {
            navigator.clipboard.writeText(formats[0].text);
            onClose();
          },
        });
      } else {
        items.push({
          label: t('context.copy'),
          icon: '\u2398',
          action: () => { setCopyFormatMode(formats); },
        });
      }
    }
    items.push({ divider: true });
    // Row actions for the cell's row
    if (onRowView) {
      items.push({ label: t('row.view'), icon: '\u25ce', action: () => { onRowView(target.rowId); onClose(); } });
    }
    if (onRowDuplicate) {
      items.push({ label: t('row.duplicate'), icon: '\u2750', action: () => { onRowDuplicate(target.rowId); onClose(); } });
    }
    if (onAddRow) {
      items.push({ label: t('row.insert'), icon: '+', action: () => { onAddRow(1, target.rowId); onClose(); } });
    }
    if (onRowDelete) {
      items.push({ divider: true });
      items.push({ label: t('row.delete'), icon: '\u2715', action: () => { if (confirm(t('row.deleteConfirm'))) { onRowDelete(target.rowId); } onClose(); }, danger: true });
    }
  } else if (target.type === 'row') {
    if (onRowView) {
      items.push({ label: t('row.view'), icon: '\u25ce', action: () => { onRowView(target.rowId); onClose(); } });
    }
    if (onRowDuplicate) {
      items.push({ label: t('row.duplicate'), icon: '\u2750', action: () => { onRowDuplicate(target.rowId); onClose(); } });
    }
    if (onAddRow) {
      items.push({ label: t('row.insert'), icon: '+', action: () => { onAddRow(1, target.rowId); onClose(); } });
    }
    if (onRowDelete) {
      items.push({ divider: true });
      items.push({ label: t('row.delete'), icon: '\u2715', action: () => { if (confirm(t('row.deleteConfirm'))) { onRowDelete(target.rowId); } onClose(); }, danger: true });
    }
  } else if (target.type === 'column') {
    const field = table.fields.find((f) => f.id === target.fieldId);
    if (onColumnRename && field) {
      items.push({ label: t('column.rename'), action: () => {
        const newLabel = prompt(t('column.renamePrompt'), field.label);
        if (newLabel && newLabel.trim() && newLabel.trim() !== field.label) {
          onColumnRename(target.fieldId, newLabel.trim());
        }
        onClose();
      }});
    }
    if (onColumnChangeType && field) {
      items.push({ label: t('column.changeType'), icon: '⇄', action: () => { setTypePickerMode(true); } });
    }
    if (onSort && field) {
      items.push({ divider: true });
      items.push({ label: t(sortLabelKey(field.type, 'asc') as any), action: () => { onSort(target.fieldId, 'asc'); onClose(); } });
      items.push({ label: t(sortLabelKey(field.type, 'desc') as any), action: () => { onSort(target.fieldId, 'desc'); onClose(); } });
      if (sortDirection) {
        items.push({ label: t('column.sortNone' as any), action: () => { onSort(target.fieldId, null); onClose(); } });
      }
    }
    if (onGroupByChange) {
      items.push({ divider: true });
      if (groupBy === target.fieldId) {
        items.push({ label: 'Remove grouping', action: () => { onGroupByChange(null); onClose(); } });
      } else {
        items.push({ label: 'Group by this column', action: () => { onGroupByChange(target.fieldId); onClose(); } });
      }
    }
    if (onColorByChange && field) {
      const colorable = field.type === 'SingleSelect' || field.type === 'MultiSelect' || field.type === 'Boolean';
      if (colorBy === target.fieldId) {
        items.push({ label: 'Remove row coloring', action: () => { onColorByChange(null); onClose(); } });
      } else if (colorable) {
        items.push({ label: 'Color rows by this column', action: () => { onColorByChange(target.fieldId); onClose(); } });
      }
    }
    if (onColumnHide) {
      items.push({ divider: true });
      items.push({ label: t('column.hide'), action: () => { onColumnHide(target.fieldId); onClose(); } });
    }
    if (onColumnDelete) {
      items.push({ divider: true });
      items.push({ label: t('column.delete'), action: () => {
        if (confirm(t('column.deleteConfirm'))) {
          onColumnDelete(target.fieldId);
        }
        onClose();
      }, danger: true });
    }
  }

  if (items.length === 0) return null;

  // Remove leading/trailing dividers and consecutive dividers
  const cleaned: MenuItem[] = [];
  for (const item of items) {
    if ('divider' in item) {
      if (cleaned.length > 0 && !('divider' in cleaned[cleaned.length - 1])) {
        cleaned.push(item);
      }
    } else {
      cleaned.push(item);
    }
  }
  if (cleaned.length > 0 && 'divider' in cleaned[cleaned.length - 1]) cleaned.pop();

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        zIndex: 10000,
        minWidth: '170px',
        overflow: 'hidden',
        padding: '4px 0',
      }}
    >
      {copyFormatMode ? (
        <>
          <button
            onClick={() => setCopyFormatMode(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              width: '100%',
              padding: '7px 14px',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span>{'←'}</span>
            <span>{t('context.back')}</span>
          </button>
          {copyFormatMode.map((fmt, i) => (
            <button
              key={i}
              onClick={() => {
                navigator.clipboard.writeText(fmt.text);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '7px 14px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#374151',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '13px', minWidth: '18px', textAlign: 'center' }}>{'\u2398'}</span>
              <span>{fmt.label}</span>
            </button>
          ))}
        </>
      ) : typePickerMode && target.type === 'column' ? (
        <>
          <button
            onClick={() => setTypePickerMode(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              width: '100%',
              padding: '7px 14px',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid #e5e7eb',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span>{'←'}</span>
            <span>{t('context.back')}</span>
          </button>
          {typeValidating ? (
            <div style={{ padding: '8px 14px', fontSize: '13px', color: '#6b7280' }}>{t('column.validating')}</div>
          ) : (
            FIELD_TYPES.map((ft) => {
              const currentField = table.fields.find((f) => f.id === target.fieldId);
              const isCurrent = currentField?.type === ft.type;
              return (
                <button
                  key={ft.type}
                  onClick={async () => {
                    if (isCurrent) return;
                    if (onColumnValidateType && onColumnChangeType) {
                      setTypeValidating(true);
                      try {
                        const validation = await onColumnValidateType(target.fieldId, ft.type);
                        onClose();
                        if (validation.incompatible > 0) {
                          if (confirm(t('column.convert.confirmPrompt', { type: t(`fieldType.${ft.type}`), compatible: validation.compatible, total: validation.total, incompatible: validation.incompatible }))) {
                            onColumnChangeType(target.fieldId, ft.type);
                          }
                        } else {
                          onColumnChangeType(target.fieldId, ft.type);
                        }
                      } catch {
                        onColumnChangeType(target.fieldId, ft.type);
                        onClose();
                      } finally {
                        setTypeValidating(false);
                      }
                    } else if (onColumnChangeType) {
                      onColumnChangeType(target.fieldId, ft.type);
                      onClose();
                    }
                  }}
                  disabled={isCurrent}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 14px',
                    textAlign: 'left',
                    background: isCurrent ? '#eff6ff' : 'transparent',
                    border: 'none',
                    cursor: isCurrent ? 'default' : 'pointer',
                    fontSize: '13px',
                    color: isCurrent ? '#2563eb' : '#374151',
                  }}
                  onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = '#f3f4f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isCurrent ? '#eff6ff' : 'transparent'; }}
                >
                  <FieldTypeIcon type={ft.type} size={14} style={{ minWidth: '18px' }} />
                  <span>{t(`fieldType.${ft.type}`)}</span>
                  {isCurrent && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>{'\u2713'}</span>}
                </button>
              );
            })
          )}
        </>
      ) : (
        cleaned.map((item, i) =>
          'divider' in item ? (
            <div key={i} style={{ height: '1px', background: '#e5e7eb', margin: '4px 0' }} />
          ) : (
            <button
              key={i}
              onClick={item.action}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '7px 14px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                color: item.danger ? '#dc2626' : '#374151',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {item.icon && <span style={{ fontSize: '13px', minWidth: '18px', textAlign: 'center' }}>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          )
        )
      )}
    </div>
  );
}

// =============================================================================
// Add Field Button (the "+" at the end of columns)
// =============================================================================

const FIELD_TYPES: { type: FieldType; label: string }[] = [
  { type: 'Text', label: 'Text' },
  { type: 'Number', label: 'Number' },
  { type: 'Boolean', label: 'Checkbox' },
  { type: 'Date', label: 'Date' },
  { type: 'SingleSelect', label: 'Single Select' },
  { type: 'MultiSelect', label: 'Multi Select' },
  { type: 'Attachment', label: 'Attachment' },
  { type: 'Image', label: 'Image' },
];

function AddFieldButton({ onCreateField, onCreateComputedField, fields: tableFields }: {
  onCreateField: (label: string, type: FieldType) => void;
  onCreateComputedField?: (label: string, options: import('@monkeytab/core').ComputedFieldOptions) => void;
  fields: import('@monkeytab/core').FieldSpec[];
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [selectedType, setSelectedType] = useState<FieldType>('Text');
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFieldName('');
        setSelectedType('Text');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (fieldName.trim()) {
      onCreateField(fieldName.trim(), selectedType);
      setFieldName('');
      setSelectedType('Text');
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          color: '#9ca3af',
          padding: '2px 6px',
          borderRadius: '4px',
          lineHeight: 1,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
        title={t('addField.title')}
      >
        +
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 1000,
            width: '240px',
            padding: '12px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
            {t('addField.header')}
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={t('addField.placeholder')}
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') { setIsOpen(false); setFieldName(''); }
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              outline: 'none',
              marginBottom: '8px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
            {t('addField.typeLabel')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '12px' }}>
            {FIELD_TYPES.map((ft) => (
              <button
                key={ft.type}
                onClick={() => setSelectedType(ft.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  fontSize: '13px',
                  border: selectedType === ft.type ? '1px solid #2563eb' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: selectedType === ft.type ? '#eff6ff' : 'white',
                  color: selectedType === ft.type ? '#2563eb' : '#374151',
                  cursor: 'pointer',
                }}
              >
                <FieldTypeIcon type={ft.type} size={14} />
                <span>{t(`fieldType.${ft.type}`)}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!fieldName.trim()}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              fontWeight: 500,
              background: fieldName.trim() ? '#2563eb' : '#e5e7eb',
              color: fieldName.trim() ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              cursor: fieldName.trim() ? 'pointer' : 'default',
            }}
          >
            {t('addField.submit')}
          </button>
          {onCreateComputedField && (
            <>
              <div style={{ height: '1px', background: '#e5e7eb', margin: '10px 0' }} />
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowFormulaBuilder(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: 'white',
                  color: '#6b7280',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#374151'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#6b7280'; }}
              >
                <span style={{ fontSize: '12px', fontStyle: 'italic' }}>fx</span>
                <span>{t('addField.computed')}</span>
              </button>
            </>
          )}
        </div>
      )}

      {showFormulaBuilder && onCreateComputedField && (
        <FormulaBuilder
          fields={tableFields}
          onSave={(label, options) => {
            onCreateComputedField(label, options);
            setShowFormulaBuilder(false);
          }}
          onCancel={() => setShowFormulaBuilder(false)}
        />
      )}
    </div>
  );
}

// Hidden columns dropdown menu
function HiddenColumnsMenu({
  hiddenColumns,
  onUnhide,
}: {
  hiddenColumns: FieldSpec[];
  onUnhide: (fieldId: string) => void;
}) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          background: 'transparent',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '12px',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>{t('column.hiddenCount', { count: hiddenColumns.length })}</span>
      </button>

      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '160px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6b7280',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            {t('column.hiddenHeader')}
          </div>
          {hiddenColumns.map((field) => (
            <button
              key={field.id}
              onClick={() => {
                onUnhide(field.id);
                if (hiddenColumns.length === 1) {
                  setMenuOpen(false);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ color: '#2563eb' }}>+</span>
              <span>{field.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
