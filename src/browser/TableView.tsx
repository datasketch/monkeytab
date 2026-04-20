/**
 * TableView — standalone table editor component.
 * Same logic as the route component but without TanStack Router dependency.
 * Receives baseId/tableId as props, uses useClient() for data access.
 */

import { useState, useCallback, useEffect } from 'react';
import { useClient } from '../ui/client/ClientContext.tsx';
import { useCrudHooks } from '../ui/client/CrudHooksContext.tsx';
import { useBase, useTable, useTableRows, useSettings, useTrash } from '../ui/hooks/useTableData.ts';
import {
  useUpdateRecord,
  useCreateRecord,
  useCreateDraftRow,
  usePromoteDraftRow,
  useDeleteRecord,
  useRenameTable,
  useCreateTable,
  useDeleteTable,
  useRenameField,
  useDeleteField,
  useCreateField,
  useUpdateFieldOptions,
  useUpdateColumnOrder,
  useUpdateRowOrder,
  useUpdateSettings,
  useUpdateTableDisplay,
  useRestoreTable,
  useEmptyTrash,
  useUpdateFieldType,
} from '../ui/hooks/useMutation.ts';
import { Grid, type RowHeightOption, type CellRenderer as GridCellRenderer, type ColumnColor } from '../ui/components/grid/Grid.tsx';
import { GridToolbar } from '../ui/components/grid/GridToolbar.tsx';
import type { Value, FieldOptions, FieldType, Row, FilterGroup, SortSpec, ComputedFieldOptions } from '@monkeytab/core';
import { DEFAULT_SETTINGS, mergeSettings } from '@monkeytab/core';
import { RecordDetailPanel } from '../ui/components/RecordDetailPanel.tsx';
import { SettingsPanel } from '../ui/components/settings/SettingsPanel.tsx';
import { FilterBuilder } from '../ui/components/filter/FilterBuilder.tsx';
import { useUndoStore, type UndoAction } from '../ui/state/GridStoreContext.tsx';
import { useI18n } from '../ui/i18n/index.ts';
import { SearchProvider } from '../ui/state/SearchContext.tsx';
import { ConfirmDialog } from '../ui/components/ConfirmDialog.tsx';
import { PaginationBar } from '../ui/components/grid/PaginationBar.tsx';

export interface TableViewProps {
  baseId: string;
  tableId: string;
  /** Called when user navigates to a different table */
  onNavigate?: (baseId: string, tableId: string) => void;
  /** Called when user navigates "home" (e.g., all tables deleted) */
  onNavigateHome?: () => void;
  /** Called when row checkboxes change — receives array of selected row IDs */
  onSelectionChange?: (selectedRowIds: string[]) => void;
  /** Controlled selection — when provided, overrides internal selection state */
  selectedRowIds?: string[];
  /** Called when a row is clicked (distinct from cell editing) */
  onRowClick?: (row: Row) => void;
  /** Custom renderers per field ID — overrides the default type-aware renderer */
  customRenderers?: Record<string, GridCellRenderer>;
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
  /** Per-column coloring (fieldId → CSS color string or per-cell color function) */
  columnColor?: Record<string, ColumnColor>;
  /** Consumer-provided file upload handler — passed to file-type editors */
  onUpload?: (file: File, fieldType: string) => Promise<string>;
  /** Called when a single cell value changes — fires with rowId, fieldId, new and old values */
  onCellChange?: (rowId: string, fieldId: string, newValue: Value, oldValue: Value) => void;
  /** Called when user changes sort via column header — for server-side sorting */
  onSortChange?: (fieldId: string | null, direction: 'asc' | 'desc' | null) => void;
  /** Controlled sort field */
  sortBy?: string | null;
  /** Controlled sort direction */
  sortDirection?: 'asc' | 'desc' | null;
  /** Total row count from server — enables pagination UI */
  totalRows?: number;
  /** Current page (1-based) */
  page?: number;
  /** Rows per page (default: 500) */
  pageSize?: number;
  /** Called when user navigates to a different page */
  onPageChange?: (page: number) => void;
  /** 'simple' for Previous/Next, 'load-more' for infinite scroll */
  paginationMode?: 'simple' | 'load-more';
  /** Whether more data is being fetched */
  paginationLoading?: boolean;
  /** Show faint ghost rows/columns to fill the viewport, spreadsheet-style */
  ghostGrid?: boolean | { rows?: number; columns?: number };
  /** Column sizing strategy — 'auto' (default) fits content, 'fill' distributes width, 'fixed' uses 180px */
  columnFit?: 'auto' | 'fill' | 'fixed';
  /** Min column width in 'auto' mode (default: 60) */
  autoFitMin?: number;
  /** Max column width in 'auto' mode (default: 320) */
  autoFitMax?: number;
  /** Render prop for custom bulk actions when rows are selected */
  selectionActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;
  /** Field ID to group rows by */
  groupBy?: string | null;
  /** Default collapsed state for groups */
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

  // ── Column lifecycle — fire after the internal mutation settles.
  // Each is gated: omit the callback to hide its menu entry.
  /** Called after the user renames a column via the header menu or double-click. */
  onColumnRename?: (fieldId: string, newLabel: string, oldLabel: string) => void;
  /** Called after the user deletes a column via the header menu. */
  onColumnDelete?: (fieldId: string) => void;
  /** Called after the user adds a column via the "+" button or ghost cell. */
  onColumnCreate?: (field: { id: string; label: string; type: FieldType; options?: FieldOptions }) => void;
  /** Called after the user changes a column's field type. */
  onColumnChangeType?: (fieldId: string, newType: FieldType) => void;
  /** Called after the user edits a column's type-specific options (select choices, number format, etc.). */
  onColumnUpdateOptions?: (fieldId: string, options: FieldOptions) => void;
}

export function TableView({ baseId, tableId, onNavigate, onNavigateHome, onSelectionChange, selectedRowIds, onRowClick, customRenderers, customIcons, columnEditable, columnWidth, columnMinWidth, columnMaxWidth, columnSortable, columnAlign, columnColor, onUpload, onCellChange, onSortChange, sortBy, sortDirection, totalRows, page = 1, pageSize = 500, onPageChange, paginationMode = 'simple', paginationLoading, ghostGrid, columnFit, autoFitMin, autoFitMax, selectionActions, groupBy, groupCollapsed, onGroupByChange, groupOrder, colorBy, onColorByChange, colorByMap, onColumnRename, onColumnDelete, onColumnCreate, onColumnChangeType, onColumnUpdateOptions }: TableViewProps) {
  const { t } = useI18n();
  const client = useClient();
  const { data: base } = useBase(baseId);
  const { data: table, isLoading: tableLoading } = useTable(baseId, tableId);
  const { data: settingsData } = useSettings();
  const { data: trashItems } = useTrash(baseId);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<FilterGroup | undefined>();
  const [sortSpecs, setSortSpecs] = useState<SortSpec[] | undefined>(
    sortBy && sortDirection ? [{ fieldId: sortBy, direction: sortDirection }] : undefined
  );

  // Sync controlled sort props
  useEffect(() => {
    if (sortBy && sortDirection) {
      setSortSpecs([{ fieldId: sortBy, direction: sortDirection }]);
    } else if (sortBy === null || sortDirection === null) {
      setSortSpecs(undefined);
    }
  }, [sortBy, sortDirection]);

  const { data: queryResult, isLoading: rowsLoading, isFetching } = useTableRows(baseId, tableId, {
    search: searchQuery || undefined,
    filter: filterGroup,
    sort: sortSpecs,
    limit: pageSize,
  });

  // Merged settings
  const settings = mergeSettings(settingsData ?? {});

  // Get row height and show row numbers from table display or settings defaults
  const displayRowHeight = (table?.display?.rowHeight ?? settings.defaultRowHeight) as RowHeightOption;
  const displayShowRowNumbers = table?.display?.showRowNumbers ?? settings.defaultShowRowNumbers;

  // Selected rows state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [viewingRow, setViewingRow] = useState<Row | null>(null);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [trashPanelOpen, setTrashPanelOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    type: 'row' | 'field' | 'bulk';
    id?: string;
    name?: string;
    count?: number;
  } | null>(null);

  const updateRecord = useUpdateRecord(baseId, tableId);
  const createRecord = useCreateRecord(baseId, tableId);
  const createDraftRow = useCreateDraftRow(baseId, tableId);
  const promoteDraftRow = usePromoteDraftRow(baseId, tableId);
  const deleteRecord = useDeleteRecord(baseId, tableId);
  const crudHooks = useCrudHooks();
  const renameTable = useRenameTable(baseId);
  const createTable = useCreateTable(baseId);
  const deleteTable = useDeleteTable(baseId);
  const renameField = useRenameField(baseId, tableId);
  const deleteField = useDeleteField(baseId, tableId);
  const createField = useCreateField(baseId, tableId);
  const updateFieldOptions = useUpdateFieldOptions(baseId, tableId);
  const updateColumnOrder = useUpdateColumnOrder(baseId, tableId);
  const updateRowOrder = useUpdateRowOrder(baseId, tableId);
  const updateSettings = useUpdateSettings();
  const updateTableDisplay = useUpdateTableDisplay(baseId, tableId);
  const restoreTable = useRestoreTable(baseId);
  const emptyTrash = useEmptyTrash(baseId);
  const updateFieldType = useUpdateFieldType(baseId, tableId);

  // Undo/redo
  const undoStore = useUndoStore();
  const [undoToast, setUndoToast] = useState<string | null>(null);

  const showUndoToast = useCallback((msg: string) => {
    setUndoToast(msg);
    setTimeout(() => setUndoToast(null), 2000);
  }, []);

  const applyUndoAction = useCallback((action: UndoAction, direction: 'undo' | 'redo') => {
    switch (action.type) {
      case 'cell_edit': {
        const value = direction === 'undo' ? action.oldValue : action.newValue;
        updateRecord.mutate({ recordId: action.rowId, fieldId: action.fieldId, value });
        showUndoToast(direction === 'undo' ? t('undo.cellEdit') : t('redo.cellEdit'));
        break;
      }
      case 'row_create': {
        if (direction === 'undo') {
          deleteRecord.mutate(action.rowId);
          showUndoToast(t('undo.rowCreate'));
        } else {
          createRecord.mutate(action.fields);
          showUndoToast(t('redo.rowCreate'));
        }
        break;
      }
      case 'row_delete': {
        if (direction === 'undo') {
          createRecord.mutate(action.fields);
          showUndoToast(t('undo.rowDelete'));
        } else {
          deleteRecord.mutate(action.rowId);
          showUndoToast(t('redo.rowDelete'));
        }
        break;
      }
      case 'field_create': {
        if (direction === 'undo') {
          deleteField.mutate(action.fieldId);
          showUndoToast(t('undo.fieldCreate'));
        } else {
          createField.mutate({ label: action.fieldName, type: action.fieldType as FieldType });
          showUndoToast(t('redo.fieldCreate'));
        }
        break;
      }
      case 'field_delete': {
        if (direction === 'undo') {
          createField.mutate({ label: action.fieldName, type: action.fieldType as FieldType });
          showUndoToast(t('undo.fieldDelete'));
        } else {
          deleteField.mutate(action.fieldId);
          showUndoToast(t('redo.fieldDelete'));
        }
        break;
      }
    }
  }, [updateRecord, deleteRecord, createRecord, deleteField, createField, showUndoToast]);

  useEffect(() => {
    undoStore.setTable(tableId);
  }, [tableId]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          const action = undoStore.redo();
          if (action) applyUndoAction(action, 'redo');
        } else {
          const action = undoStore.undo();
          if (action) applyUndoAction(action, 'undo');
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [applyUndoAction, undoStore]);

  const handleRowHeightChange = useCallback((height: RowHeightOption) => {
    updateTableDisplay.mutate({ rowHeight: height });
  }, [updateTableDisplay]);

  const handleShowRowNumbersChange = useCallback((show: boolean) => {
    updateTableDisplay.mutate({ showRowNumbers: show });
  }, [updateTableDisplay]);

  const handleColumnChangeType = useCallback((fieldId: string, newType: FieldType) => {
    updateFieldType.mutate({ fieldId, type: newType }, {
      onSuccess: () => onColumnChangeType?.(fieldId, newType),
    });
  }, [updateFieldType, onColumnChangeType]);

  const handleColumnValidateType = useCallback(async (fieldId: string, newType: FieldType) => {
    return client.validateFieldType({ baseId, tableId, fieldId, type: newType });
  }, [baseId, tableId, client]);

  const handleCreateComputedField = useCallback((label: string, options: ComputedFieldOptions) => {
    createField.mutate({ label, type: 'Computed' as FieldType, options }, {
      onSuccess: (newField) => {
        if (newField?.id) {
          onColumnCreate?.({ id: newField.id, label: newField.label, type: newField.type, options: newField.options });
        }
      },
    });
  }, [createField, onColumnCreate]);

  const handleSortChange = useCallback((fieldId: string | null, direction: 'asc' | 'desc' | null) => {
    if (fieldId && direction) {
      setSortSpecs([{ fieldId, direction }]);
    } else {
      setSortSpecs(undefined);
    }
    onSortChange?.(fieldId, direction);
  }, [onSortChange]);

  // Only show loading on initial load (no data yet), not during refetches
  // (e.g. search/filter changes). This prevents the toolbar from unmounting
  // and losing search input focus.
  if (!table && tableLoading) {
    return <div style={{ padding: '20px' }}>{t('grid.loadingTable')}</div>;
  }

  if (!table) {
    return <div style={{ padding: '20px' }}>{t('grid.tableNotFound')}</div>;
  }

  const rows = queryResult?.rows ?? [];
  const tables = base?.tables ?? [];

  const hasRequiredField = table.fields.some((f) => f.required);
  const useDraftFlow = hasRequiredField || !!crudHooks.onRowCreate;

  const handleCellSave = (rowId: string, fieldId: string, value: Value) => {
    const row = rows.find((r) => r.id === rowId);
    const oldValue = row?.fields[fieldId] ?? null;
    onCellChange?.(rowId, fieldId, value, oldValue);
    // Draft row → try to promote via onRowCreate. Keeps edits local on required-field failure.
    if (row?.draft) {
      return promoteDraftRow.mutateAsync({ rowId, fieldId, value }).then(() => undefined);
    }
    undoStore.push({ type: 'cell_edit', rowId, fieldId, oldValue, newValue: value });
    return updateRecord.mutateAsync({ recordId: rowId, fieldId, value, oldValue }).then(() => undefined);
  };

  const handleAddRow = (count: number = 1, _afterRowId?: string) => {
    // Positioning is handled by Grid via pendingInsertAfterRef
    const fields: Record<string, Value> = {};
    for (const field of table.fields) {
      fields[field.id] = null;
    }
    if (useDraftFlow) {
      // Create local draft rows — never hits onRowCreate until a required field is filled.
      for (let i = 0; i < count; i++) {
        createDraftRow({ ...fields });
      }
      return;
    }
    for (let i = 0; i < count; i++) {
      createRecord.mutate({ ...fields }, {
        onSuccess: (newRow) => {
          if (newRow?.id) {
            undoStore.push({ type: 'row_create', rowId: newRow.id, fields });
          }
        },
      });
    }
  };

  const executeDeleteRow = (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (row) {
      undoStore.push({ type: 'row_delete', rowId, fields: { ...row.fields } });
    }
    deleteRecord.mutate(rowId);
  };

  const handleDeleteRow = (rowId: string) => {
    if (settings.confirmBeforeDelete) {
      setPendingDelete({ type: 'row', id: rowId });
    } else {
      executeDeleteRow(rowId);
    }
  };

  const handleColumnRename = (fieldId: string, newName: string) => {
    const field = table.fields.find((f) => f.id === fieldId);
    const oldLabel = field?.label ?? '';
    renameField.mutate({ fieldId, label: newName }, {
      onSuccess: () => onColumnRename?.(fieldId, newName, oldLabel),
    });
  };

  const executeColumnDelete = (fieldId: string) => {
    const field = table.fields.find((f) => f.id === fieldId);
    if (field) {
      undoStore.push({ type: 'field_delete', fieldId, fieldName: field.label, fieldType: field.type });
    }
    deleteField.mutate(fieldId, {
      onSuccess: () => onColumnDelete?.(fieldId),
    });
  };

  const handleColumnDelete = (fieldId: string) => {
    if (settings.confirmBeforeDelete) {
      const field = table.fields.find((f) => f.id === fieldId);
      setPendingDelete({ type: 'field', id: fieldId, name: field?.label });
    } else {
      executeColumnDelete(fieldId);
    }
  };

  const handleColumnUpdateOptions = (fieldId: string, options: FieldOptions) => {
    updateFieldOptions.mutate({ fieldId, options }, {
      onSuccess: () => onColumnUpdateOptions?.(fieldId, options),
    });
  };

  const handleColumnsReorder = (fieldIds: string[]) => {
    updateColumnOrder.mutate(fieldIds);
  };

  const handleRowsReorder = (rowIds: string[]) => {
    updateRowOrder.mutate(rowIds);
  };

  const handleCreateField = (label: string, type: FieldType) => {
    createField.mutate({ label, type }, {
      onSuccess: (newField) => {
        if (newField?.id) {
          undoStore.push({ type: 'field_create', fieldId: newField.id, fieldName: label, fieldType: type });
          onColumnCreate?.({ id: newField.id, label: newField.label, type: newField.type, options: newField.options });
        }
      },
    });
  };

  const handleRowView = (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (row) setViewingRow(row);
  };

  const handleRowDuplicate = (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (row) {
      createRecord.mutate({ ...row.fields });
    }
  };

  const executeDeleteSelected = () => {
    for (const rowId of selectedRows) {
      deleteRecord.mutate(rowId);
    }
    setSelectedRows(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) return;
    if (settings.confirmBeforeDelete) {
      setPendingDelete({ type: 'bulk', count: selectedRows.size });
    } else {
      executeDeleteSelected();
    }
  };

  const isSaving =
    updateRecord.isPending ||
    createRecord.isPending ||
    deleteRecord.isPending ||
    renameField.isPending ||
    deleteField.isPending ||
    createField.isPending ||
    updateFieldOptions.isPending ||
    updateColumnOrder.isPending ||
    updateRowOrder.isPending ||
    updateTableDisplay.isPending ||
    updateFieldType.isPending;

  // Respect readOnly and allow* flags
  const isReadOnly = settings.readOnly;
  const canCreateField = !isReadOnly && settings.allowCreateField;
  const canDeleteField = !isReadOnly && settings.allowDeleteField;
  const canCreateRecord = !isReadOnly && settings.allowCreateRecord;
  const canReorderColumns = !isReadOnly && settings.allowColumnReorder;

  return (
    <SearchProvider value={searchQuery}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      {settings.showToolbar && (
        <div style={{ padding: '8px 0', backgroundColor: '#fff' }}>
          <GridToolbar
            onAddRow={canCreateRecord && settings.showAddRowButton ? handleAddRow : undefined}
            isAdding={createRecord.isPending}
            rowHeight={settings.showRowHeightControl ? displayRowHeight : undefined}
            onRowHeightChange={settings.showRowHeightControl ? handleRowHeightChange : undefined}
            showRowNumbers={settings.showRowNumbersControl ? displayShowRowNumbers : undefined}
            onShowRowNumbersChange={settings.showRowNumbersControl ? handleShowRowNumbersChange : undefined}
            selectedCount={selectedRows.size}
            selectedRowIds={Array.from(selectedRows)}
            onDeleteSelected={!isReadOnly ? handleDeleteSelected : undefined}
            onClearSelection={() => { setSelectedRows(new Set()); onSelectionChange?.([]); }}
            selectionActions={selectionActions}
            totalRecords={rows.length}
            searchQuery={settings.showSearch ? searchQuery : undefined}
            onSearchChange={settings.showSearch ? setSearchQuery : undefined}
            activeFilterCount={settings.showFilters && filterGroup ? (filterGroup.conditions as unknown[]).length : 0}
            filterOpen={settings.showFilters ? filterPanelOpen : false}
            onFilterToggle={settings.showFilters ? () => setFilterPanelOpen(!filterPanelOpen) : undefined}
          />
        </div>
      )}

      {/* Filter builder */}
      {filterPanelOpen && table && (
        <FilterBuilder
          fields={table.fields}
          filterGroup={filterGroup}
          onChange={(fg) => setFilterGroup(fg)}
          onClose={() => setFilterPanelOpen(false)}
        />
      )}

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Grid
          table={table}
          rows={rows}
          rowHeight={displayRowHeight}
          showRowNumbers={displayShowRowNumbers}
          onCellSave={!isReadOnly ? handleCellSave : undefined}
          onRowDelete={!isReadOnly ? handleDeleteRow : undefined}
          onRowDuplicate={canCreateRecord ? handleRowDuplicate : undefined}
          onRowView={handleRowView}
          onAddRow={canCreateRecord ? handleAddRow : undefined}
          onRowsReorder={!isReadOnly ? handleRowsReorder : undefined}
          onColumnsReorder={canReorderColumns ? handleColumnsReorder : undefined}
          allowMultiColumnDrag={settings.allowMultiColumnDrag}
          onSelectionChange={(ids) => { setSelectedRows(new Set(ids)); onSelectionChange?.(ids); }}
          selectedRowIds={selectedRowIds}
          onRowClick={onRowClick}
          customRenderers={customRenderers}
          customIcons={customIcons}
          columnEditable={columnEditable}
          columnWidth={columnWidth}
          columnMinWidth={columnMinWidth}
          columnMaxWidth={columnMaxWidth}
          columnSortable={columnSortable}
          columnAlign={columnAlign}
          columnColor={columnColor}
          onColumnRename={!isReadOnly && onColumnRename ? handleColumnRename : undefined}
          onColumnDelete={canDeleteField && onColumnDelete ? handleColumnDelete : undefined}
          onColumnUpdateOptions={!isReadOnly && onColumnUpdateOptions ? handleColumnUpdateOptions : undefined}
          onColumnChangeType={!isReadOnly && onColumnChangeType ? handleColumnChangeType : undefined}
          onColumnValidateType={handleColumnValidateType}
          onCreateField={canCreateField && onColumnCreate ? handleCreateField : undefined}
          onCreateComputedField={canCreateField && onColumnCreate ? handleCreateComputedField : undefined}
          onSortChange={handleSortChange}
          onUpload={onUpload}
          loading={isFetching || rowsLoading}
          ghostGrid={ghostGrid}
          columnFit={columnFit}
          autoFitMin={autoFitMin}
          autoFitMax={autoFitMax}
          groupBy={groupBy}
          groupCollapsed={groupCollapsed}
          onGroupByChange={onGroupByChange}
          groupOrder={groupOrder}
          colorBy={colorBy}
          onColorByChange={onColorByChange}
          colorByMap={colorByMap}
        />
      </div>

      {/* Footer / Pagination */}
      {totalRows != null && onPageChange ? (
        <PaginationBar
          totalRows={totalRows}
          loadedRows={rows.length}
          page={page}
          pageSize={pageSize}
          mode={paginationMode}
          loading={paginationLoading}
          saving={isSaving}
          onPageChange={onPageChange}
        />
      ) : (
        <div style={{
          padding: '8px 0',
          color: '#666',
          fontSize: '14px',
        }}>
          {t('grid.showing', { shown: rows.length, total: queryResult?.pagination?.total ?? 0 })}
          {isSaving && <span style={{ marginLeft: '12px' }}>{t('grid.saving')}</span>}
        </div>
      )}

      {/* Record detail panel */}
      {viewingRow && (
        <RecordDetailPanel
          row={viewingRow}
          fields={table.fields}
          onClose={() => setViewingRow(null)}
          onCellSave={!isReadOnly ? handleCellSave : undefined}
        />
      )}

      {/* Settings panel */}
      {settingsPanelOpen && (
        <SettingsPanel
          settings={settingsData ?? {}}
          onUpdateSettings={(s) => updateSettings.mutate(s)}
          onClose={() => setSettingsPanelOpen(false)}
        />
      )}

      {/* Confirm delete dialog */}
      {pendingDelete && (
        <ConfirmDialog
          title={
            pendingDelete.type === 'row' ? t('confirm.deleteRow')
            : pendingDelete.type === 'field' ? t('confirm.deleteColumn')
            : t('confirm.deleteSelected')
          }
          message={
            pendingDelete.type === 'row' ? t('confirm.deleteRow.message')
            : pendingDelete.type === 'field' ? t('confirm.deleteColumn.message', { name: pendingDelete.name ?? '' })
            : t('confirm.deleteSelected.message', { count: pendingDelete.count ?? 0 })
          }
          destructive
          onConfirm={() => {
            if (pendingDelete.type === 'row' && pendingDelete.id) {
              executeDeleteRow(pendingDelete.id);
            } else if (pendingDelete.type === 'field' && pendingDelete.id) {
              executeColumnDelete(pendingDelete.id);
            } else if (pendingDelete.type === 'bulk') {
              executeDeleteSelected();
            }
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {/* Undo toast */}
      {undoToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            background: '#1f2937',
            color: 'white',
            borderRadius: '6px',
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          {undoToast}
        </div>
      )}
    </div>
    </SearchProvider>
  );
}
