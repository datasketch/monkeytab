import { useRef, useState, useEffect, useCallback } from 'react';
import { useSelectionStore, useEditingStore, isCellSelected } from '../../state/GridStoreContext.tsx';
import { useSearchQuery, cellMatchesSearch } from '../../state/SearchContext.tsx';
import type { FieldSpec, Value, Row, Attachment, ImageFieldOptions } from '@monkeytab/core';
import { componentRegistry } from '../../registry/ComponentRegistry.ts';
import { getRenderer as getDefaultRenderer } from '../renderers/index.ts';
import { getEditor as getDefaultEditor } from '../editors/index.ts';
import type { CellRenderer } from './Grid.tsx';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface GridCellProps {
  rowId: string;
  field: FieldSpec;
  value: Value;
  /** Full row object — passed to custom renderers */
  row?: Row;
  /** Custom renderer override — when provided, replaces the default type-aware renderer */
  customRenderer?: CellRenderer;
  /** Cell text alignment override */
  align?: 'left' | 'center' | 'right';
  onSave?: (rowId: string, fieldId: string, value: Value) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onFillStart?: (rowId: string, fieldId: string) => void;
  isFillTarget?: boolean;
  height?: number;
  width?: number;
  fixedHeight?: boolean;
  /** All fields in the table, used to resolve input field names for computed field tooltips */
  allFields?: FieldSpec[];
  /** Whether this cell is in a Shift+Arrow range selection */
  isInRange?: boolean;
  /** Whether this column is part of a multi-column selection */
  isColumnSelected?: boolean;
  /** Compact mode — tighter padding and smaller font */
  isCompact?: boolean;
  /** Consumer-provided file upload handler — passed to file-type editors */
  onUpload?: (file: File, fieldType: string) => Promise<string>;
}

// Field types that need minimal padding to show their content properly
const VISUAL_FIELD_TYPES = ['Image', 'Attachment'];

export function GridCell({ rowId, field, value, row, customRenderer, align, onSave, onContextMenu, onFillStart, isFillTarget, isInRange, height, width, fixedHeight = true, allFields, isColumnSelected, isCompact, onUpload }: GridCellProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasVerticalOverflow, setHasVerticalOverflow] = useState(false);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);

  const activeCell = useSelectionStore((state) => state.activeCell);
  const setActiveCell = useSelectionStore((state) => state.setActiveCell);

  const editingCell = useEditingStore((state) => state.editingCell);
  const startEditing = useEditingStore((state) => state.startEditing);
  const stopEditing = useEditingStore((state) => state.stopEditing);

  const isSelected = isCellSelected(activeCell, rowId, field.id);
  const isEditing = editingCell?.rowId === rowId && editingCell?.fieldId === field.id;

  const searchQuery = useSearchQuery();
  const isCellMatch = searchQuery ? cellMatchesSearch(value, searchQuery) : false;

  // Detect overflow when content changes
  useEffect(() => {
    if (contentRef.current) {
      const el = contentRef.current;
      // Use a generous tolerance to avoid false positives on short rows
      // where line-height barely exceeds the cell height
      if (fixedHeight) {
        setHasVerticalOverflow(el.scrollHeight > el.clientHeight + 10);
      }
      setHasHorizontalOverflow(el.scrollWidth > el.clientWidth + 10);
    }
  }, [value, fixedHeight, height, width]);

  // Use registry first, fall back to defaults
  const Renderer = componentRegistry.getRenderer(field.type) ?? getDefaultRenderer(field.type);
  const Editor = componentRegistry.getEditor(field.type) ?? getDefaultEditor(field.type);

  const isReadOnly = !onSave || field.type === 'Computed';

  // Single-click: select cell, but for Boolean toggle immediately, for Rating open editor
  const handleClick = () => {
    setActiveCell({ rowId, fieldId: field.id });
    if (isReadOnly) return;
    if (field.type === 'Boolean') {
      onSave!(rowId, field.id, !value);
      return;
    }
    // Rating is handled inline — no action needed here
  };

  const handleDoubleClick = () => {
    if (isReadOnly) return;
    startEditing(rowId, field.id, value);
  };

  const handleSave = (newValue: Value) => {
    stopEditing();
    if (newValue !== value && onSave) {
      onSave(rowId, field.id, newValue);
    }
  };

  const handleCancel = () => {
    stopEditing();
  };

  // ── Direct drop/paste for Image cells ──────────────────────────────────
  const isImageField = field.type === 'Image';
  const imageOptions = isImageField ? (field.options as ImageFieldOptions | undefined) : undefined;
  const maxImages = imageOptions?.maxImages ?? 10;
  const maxFileSize = imageOptions?.maxFileSize ?? 10 * 1024 * 1024;
  const isSingleImage = maxImages === 1;
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const processImageFiles = useCallback(async (files: File[]) => {
    if (!isImageField || !onSave) return;
    const imageFiles = files.filter(f => f.type.startsWith('image/') && f.size <= maxFileSize);
    if (imageFiles.length === 0) return;

    setProcessing(true);
    try {
      const newAttachments: Attachment[] = [];
      for (const file of imageFiles) {
        const url = onUpload
          ? await onUpload(file, field.type)
          : await fileToDataUrl(file);
        if (!url) continue;
        newAttachments.push({
          id: crypto.randomUUID(),
          filename: file.name,
          url,
          mimeType: file.type,
          size: file.size,
        });
      }
      if (newAttachments.length === 0) return;

      if (isSingleImage) {
        onSave(rowId, field.id, newAttachments[0]);
      } else {
        // Append to existing images
        const existing: Attachment[] = value
          ? (Array.isArray(value) ? value : [value]).map((v, i) => {
              if (typeof v === 'string') return { id: `img-${i}`, filename: v.split('/').pop() || v, url: v, mimeType: 'image/*', size: 0 };
              return v as Attachment;
            })
          : [];
        const merged = [...existing, ...newAttachments].slice(0, maxImages);
        onSave(rowId, field.id, merged);
      }
    } finally {
      setProcessing(false);
    }
  }, [isImageField, onSave, onUpload, field.type, field.id, rowId, value, isSingleImage, maxImages, maxFileSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!isImageField || !onSave) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    processImageFiles(Array.from(e.dataTransfer.files));
  }, [isImageField, onSave, processImageFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isImageField || !onSave) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, [isImageField, onSave]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!isImageField) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, [isImageField]);

  // Paste on selected Image cell
  useEffect(() => {
    if (!isImageField || !isSelected || isEditing || !onSave) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        processImageFiles(files);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isImageField, isSelected, isEditing, onSave, processImageFiles]);

  // Use minimal padding for visual field types (images, attachments)
  const isVisualField = VISUAL_FIELD_TYPES.includes(field.type);
  const verticalPadding = isVisualField ? (isCompact ? 2 : 4) : (isCompact ? 2 : (height ? Math.max(6, Math.min(12, (height - 20) / 2)) : 10));
  const horizontalPadding = isVisualField ? (isCompact ? 4 : 8) : (isCompact ? 8 : 16);

  // Calculate content height (cell height minus padding)
  const contentHeight = height ? height - (verticalPadding * 2) : undefined;

  // When selected in fixed height mode, allow scrolling; otherwise clip with fade indicator
  const showScrollOnSelect = fixedHeight && isSelected && !isEditing;
  const showVerticalFade = fixedHeight && hasVerticalOverflow && !isSelected && !isEditing;
  const showHorizontalFade = hasHorizontalOverflow && !isSelected && !isEditing;

  // Computed cell styling
  const isComputed = field.type === 'Computed';
  const computedTooltip = isComputed && field.options && 'functionName' in field.options
    ? `fx: ${field.options.functionName}(${(field.options.inputFieldIds || []).map(
        (id: string) => allFields?.find((f) => f.id === id)?.label ?? id
      ).join(', ')})`
    : undefined;

  return (
    <td
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
      title={computedTooltip}
      style={{
        padding: 0,
        fontSize: isCompact ? '12px' : '14px',
        lineHeight: isCompact ? '16px' : '20px',
        textAlign: align,
        cursor: isReadOnly ? 'default' : 'pointer',
        outline: 'none',
        position: 'relative',
        width: width,
        minWidth: '80px',
        maxWidth: width,
        height: height,
        verticalAlign: 'top',
        borderRight: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        ...(isComputed && {
          background: '#f8fafc',
          fontStyle: 'italic',
          borderLeft: '2px solid #e2e8f0',
        }),
        ...(isCellMatch && !isSelected && {
          background: '#fef9c3',
        }),
        ...(isSelected && !isEditing && {
          boxShadow: isReadOnly ? 'inset 0 0 0 2px #d1d5db' : 'inset 0 0 0 2px #2563eb',
          background: isReadOnly ? '#f9fafb' : (isComputed ? '#f0f4ff' : '#eff6ff'),
        }),
        ...(isInRange && !isSelected && {
          background: '#dbeafe',
        }),
        ...(isColumnSelected && !isSelected && !isFillTarget && !isInRange && !isComputed && {
          background: '#f8fafc',
        }),
        ...(isFillTarget && !isSelected && {
          background: '#dbeafe',
          boxShadow: 'inset 0 0 0 1px #93c5fd',
        }),
        ...(dragOver && {
          background: '#eff6ff',
          boxShadow: 'inset 0 0 0 2px #2563eb',
        }),
      }}
      data-row-id={rowId}
      data-field-id={field.id}
    >
      {/* Inner wrapper - use absolute positioning in fixed mode to enforce height */}
      <div
        ref={contentRef}
        style={{
          padding: isEditing ? '4px' : `${verticalPadding}px ${horizontalPadding}px`,
          boxSizing: 'border-box',
          whiteSpace: fixedHeight ? 'nowrap' : 'normal',
          ...(fixedHeight
            ? {
                // Absolute positioning removes content from flow, enforcing fixed height
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                // When selected, allow scrolling to see all content
                overflow: isEditing ? 'visible' : (showScrollOnSelect ? 'auto' : 'hidden'),
              }
            : {
                minHeight: height,
                overflow: isEditing ? 'visible' : 'hidden',
              }),
        }}
      >
        {isEditing && field.type !== 'Rating' ? (
          <Editor
            value={value}
            field={field}
            rowId={rowId}
            onSave={handleSave}
            onCancel={handleCancel}
            onUpload={onUpload}
          />
        ) : field.type === 'Rating' && !isReadOnly ? (
          <InlineRating value={value} field={field} onSave={(v) => onSave!(rowId, field.id, v)} />
        ) : customRenderer && row ? (
          customRenderer(value, row, field.id)
        ) : (
          <Renderer value={value} field={field} rowId={rowId} cellHeight={contentHeight} />
        )}
      </div>
      {/* Vertical fade indicator for overflow content */}
      {showVerticalFade && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: showHorizontalFade ? (isCompact ? '14px' : '20px') : 0,
            height: isCompact ? '14px' : '20px',
            background: `linear-gradient(to bottom, transparent, ${isCellMatch ? '#fef9c3' : 'white'})`,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Horizontal fade indicator for overflow content */}
      {showHorizontalFade && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: showVerticalFade ? (isCompact ? '14px' : '20px') : 0,
            width: isCompact ? '16px' : '24px',
            background: `linear-gradient(to right, transparent, ${isCellMatch ? '#fef9c3' : 'white'})`,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Processing overlay for direct image drop/paste */}
      {processing && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 6,
          fontSize: '11px',
          color: '#6b7280',
        }}>
          Uploading...
        </div>
      )}
      {/* Fill handle */}
      {isSelected && !isEditing && onSave && onFillStart && field.type !== 'Computed' && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFillStart(rowId, field.id);
          }}
          style={{
            position: 'absolute',
            bottom: -3,
            right: -3,
            width: 8,
            height: 8,
            background: '#2563eb',
            cursor: 'crosshair',
            zIndex: 5,
            borderRadius: 1,
          }}
        />
      )}
    </td>
  );
}

// ---------------------------------------------------------------------------
// Inline Rating — clickable stars, no popup
// ---------------------------------------------------------------------------

const RATING_ICONS: Record<string, { filled: string; empty: string }> = {
  star: { filled: '\u2605', empty: '\u2606' },
  heart: { filled: '\u2665', empty: '\u2661' },
  circle: { filled: '\u25CF', empty: '\u25CB' },
};

function InlineRating({ value, field, onSave }: { value: Value; field: FieldSpec; onSave: (v: Value) => void }) {
  const [hover, setHover] = useState(-1);
  const options = field.options as { max?: number; icon?: string } | undefined;
  const max = options?.max ?? 5;
  const iconType = options?.icon ?? 'star';
  const { filled, empty } = RATING_ICONS[iconType] ?? RATING_ICONS.star;
  const current = typeof value === 'number' ? value : 0;

  return (
    <span style={{ whiteSpace: 'nowrap', lineHeight: 1 }}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const isActive = star <= (hover >= 0 ? hover : current);
        return (
          <span
            key={i}
            onClick={(e) => { e.stopPropagation(); onSave(star === current ? 0 : star); }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(-1)}
            style={{
              cursor: 'pointer',
              fontSize: '14px',
              letterSpacing: '1px',
              color: isActive ? '#f59e0b' : '#d1d5db',
              transition: 'transform 0.1s',
              display: 'inline-block',
              transform: hover === star ? 'scale(1.3)' : 'scale(1)',
            }}
          >
            {isActive ? filled : empty}
          </span>
        );
      })}
    </span>
  );
}
