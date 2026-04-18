import { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../i18n/index.ts';

interface RowActionsProps {
  rowId: string;
  rowIndex: number;
  showRowNumbers?: boolean;
  isSelected?: boolean;
  isCompact?: boolean;
  height?: number;
  onSelect?: (rowId: string, selected: boolean) => void;
  onDelete?: (rowId: string) => void;
  onView?: (rowId: string) => void;
  onDuplicate?: (rowId: string) => void;
  onAddRow?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart?: (rowId: string) => void;
  onDragOver?: (rowId: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  selectedRowCount?: number;
}

export function RowActions({
  rowId,
  rowIndex,
  showRowNumbers,
  isSelected,
  isCompact,
  height,
  onSelect,
  onDelete,
  onView,
  onDuplicate,
  onAddRow,
  onContextMenu: onContextMenuProp,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
  selectedRowCount = 1,
}: RowActionsProps) {
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

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(rowId);
  };

  const handleView = () => {
    setMenuOpen(false);
    onView?.(rowId);
  };

  const handleDuplicate = () => {
    setMenuOpen(false);
    onDuplicate?.(rowId);
  };

  const handleAddRow = () => {
    setMenuOpen(false);
    onAddRow?.();
  };

  const [hovered, setHovered] = useState(false);

  return (
    <td
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={onContextMenuProp}
      style={{
        padding: isCompact ? '0 2px' : '0 4px',
        textAlign: 'center',
        width: showRowNumbers ? '70px' : '50px',
        height: height,
        verticalAlign: 'middle',
        borderRight: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        left: 0,
        zIndex: 2,
        background: 'white',
        boxShadow: '2px 0 4px rgba(0,0,0,0.06)',
      }}
      draggable={!!onDragStart}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', rowId);

        // Create custom drag ghost
        const count = selectedRowCount;
        const ghost = document.createElement('div');
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        ghost.style.left = '-1000px';
        ghost.style.pointerEvents = 'none';

        if (count > 1) {
          for (let i = Math.min(count, 5) - 1; i >= 0; i--) {
            const card = document.createElement('div');
            card.style.width = '120px';
            card.style.height = '24px';
            card.style.background = '#eff6ff';
            card.style.border = '1px solid #2563eb';
            card.style.borderRadius = '4px';
            card.style.position = 'absolute';
            card.style.top = `${i * 3}px`;
            card.style.left = `${i * 3}px`;
            card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            ghost.appendChild(card);
          }
          const badge = document.createElement('div');
          badge.textContent = String(count);
          badge.style.position = 'absolute';
          badge.style.top = '3px';
          badge.style.left = '48px';
          badge.style.fontSize = '14px';
          badge.style.fontWeight = '600';
          badge.style.color = '#2563eb';
          ghost.appendChild(badge);
          const stackCount = Math.min(count, 5);
          ghost.style.width = `${120 + (stackCount - 1) * 3}px`;
          ghost.style.height = `${24 + (stackCount - 1) * 3}px`;
        } else {
          const card = document.createElement('div');
          card.style.width = '120px';
          card.style.height = '24px';
          card.style.background = '#f9fafb';
          card.style.border = '1px solid #d1d5db';
          card.style.borderRadius = '4px';
          card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          ghost.appendChild(card);
          ghost.style.width = '120px';
          ghost.style.height = '24px';
        }

        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 60, 12);
        requestAnimationFrame(() => document.body.removeChild(ghost));

        onDragStart?.(rowId);
      }}
      onDragEnd={onDragEnd}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        {/* Drag handle */}
        {onDragStart && (
          <span
            style={{
              cursor: 'grab',
              color: '#9ca3af',
              fontSize: '10px',
              padding: '2px',
            }}
            title={t('row.dragToReorder')}
          >
            ⋮⋮
          </span>
        )}

        {/* Checkbox for selection */}
        {onSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(rowId, e.target.checked);
            }}
            style={{
              width: isCompact ? '12px' : '14px',
              height: isCompact ? '12px' : '14px',
              cursor: 'pointer',
              margin: 0,
            }}
            title={t('row.select')}
          />
        )}

        {/* Row number */}
        {showRowNumbers && (
          <span
            style={{
              fontSize: isCompact ? '10px' : '11px',
              color: '#9ca3af',
              minWidth: '20px',
              textAlign: 'right',
            }}
          >
            {rowIndex + 1}
          </span>
        )}

        {/* 3-dots menu */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            style={{
              padding: '2px 4px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#9ca3af',
              fontSize: '14px',
              lineHeight: 1,
              opacity: menuOpen ? 1 : 0.6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = menuOpen ? '1' : '0.6')}
            title={t('row.options')}
          >
            ⋮
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '140px',
                overflow: 'hidden',
              }}
            >
              {onView && (
                <button
                  onClick={handleView}
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>{'\u25ce'}</span>
                  <span>{t('row.view')}</span>
                </button>
              )}
              {onDuplicate && (
                <button
                  onClick={handleDuplicate}
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>{'\u2750'}</span>
                  <span>{t('row.duplicate')}</span>
                </button>
              )}
              {onAddRow && (
                <button
                  onClick={handleAddRow}
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '13px' }}>+</span>
                  <span>{t('row.insert')}</span>
                </button>
              )}
              {(onView || onDuplicate || onAddRow) && onDelete && (
                <div style={{ height: '1px', background: '#e5e7eb', margin: '4px 0' }} />
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
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
                    color: '#dc2626',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>{'\u2715'}</span>
                  <span>{t('row.delete')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Insert row indicator at bottom edge */}
      {hovered && onAddRow && !menuOpen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddRow();
          }}
          style={{
            position: 'absolute',
            bottom: '1px',
            left: '4px',
            right: '4px',
            height: '14px',
            borderRadius: '3px',
            background: '#f3f4f6',
            color: '#9ca3af',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            lineHeight: '14px',
            textAlign: 'center',
            padding: 0,
          }}
          title={t('row.insert')}
        >
          +
        </button>
      )}
    </td>
  );
}
