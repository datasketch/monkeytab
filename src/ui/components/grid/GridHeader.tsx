import { useState, useRef, useEffect } from 'react';
import type { FieldSpec, FieldOptions, FieldType } from '@monkeytab/core';
import { FieldOptionsPanel } from '../field-options/index.ts';
import { FieldTypeIcon } from '../../icons/FieldTypeIcon.tsx';
import { useI18n } from '../../i18n/index.ts';

interface GridHeaderProps {
  field: FieldSpec;
  /** Custom icon — when provided, replaces the default type icon */
  customIcon?: React.ReactNode;
  sortDirection?: 'asc' | 'desc' | null;
  isInputToComputed?: boolean;
  /** Compact mode — tighter spacing and smaller font */
  isCompact?: boolean;
  /** Show a lock icon — column is not editable */
  isLocked?: boolean;
  onRename?: (fieldId: string, newLabel: string) => void;
  onSort?: (fieldId: string, direction: 'asc' | 'desc' | null) => void;
  onHide?: (fieldId: string) => void;
  onDelete?: (fieldId: string) => void;
  onUpdateOptions?: (fieldId: string, options: FieldOptions) => void;
  onChangeType?: (fieldId: string, newType: FieldType) => void;
  onValidateType?: (fieldId: string, newType: FieldType) => Promise<{
    compatible: number;
    incompatible: number;
    total: number;
    warnings: string[];
  }>;
}

const FIELD_TYPE_VALUES: FieldType[] = ['Text', 'Number', 'Boolean', 'Date', 'SingleSelect', 'MultiSelect'];

/** Types that have dedicated sort labels (not A→Z / Z→A). */
const TYPED_SORT_TYPES = new Set<string>(['Number', 'Date', 'Boolean', 'Rating']);

/** Return the i18n key for a type-aware sort label. */
export function sortLabelKey(fieldType: FieldType, direction: 'asc' | 'desc'): string {
  if (TYPED_SORT_TYPES.has(fieldType)) {
    return direction === 'asc' ? `column.sortAsc.${fieldType}` : `column.sortDesc.${fieldType}`;
  }
  return direction === 'asc' ? 'column.sortAZ' : 'column.sortZA';
}

export function GridHeader({
  field,
  customIcon,
  sortDirection,
  isInputToComputed,
  isCompact,
  isLocked,
  onRename,
  onSort,
  onHide,
  onDelete,
  onUpdateOptions,
  onChangeType,
  onValidateType,
}: GridHeaderProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.label);
  const [menuOpen, setMenuOpen] = useState(false);
  const [optionsPanelOpen, setOptionsPanelOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isCramped, setIsCramped] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    targetType: FieldType;
    compatible: number;
    incompatible: number;
    total: number;
    warnings: string[];
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Hide the type icon when the header is too cramped to show it with the label
  useEffect(() => {
    if (!rootRef.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      setIsCramped(entry.contentRect.width < 70);
    });
    ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setTypeMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const handleDoubleClick = () => {
    if (onRename) {
      setEditValue(field.label);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (editValue.trim() && editValue !== field.label) {
      onRename?.(field.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(field.label);
      setIsEditing(false);
    }
  };

  // Field type icon is now rendered via FieldTypeIcon component

  const handleTypeSelect = async (newType: FieldType) => {
    if (newType === field.type) {
      setTypeMenuOpen(false);
      return;
    }

    if (onValidateType) {
      setValidating(true);
      try {
        const validation = await onValidateType(field.id, newType);
        setTypeMenuOpen(false);
        setMenuOpen(false);
        setConfirmDialog({
          targetType: newType,
          ...validation,
        });
      } catch {
        setTypeMenuOpen(false);
        setMenuOpen(false);
        onChangeType?.(field.id, newType);
      } finally {
        setValidating(false);
      }
    } else {
      setTypeMenuOpen(false);
      setMenuOpen(false);
      onChangeType?.(field.id, newType);
    }
  };

  const handleConfirmTypeChange = () => {
    if (confirmDialog) {
      onChangeType?.(field.id, confirmDialog.targetType);
      setConfirmDialog(null);
    }
  };

  const menuItems = [
    { label: t('column.rename'), action: () => { setMenuOpen(false); handleDoubleClick(); } },
    { label: t('column.customize'), action: () => { setMenuOpen(false); setOptionsPanelOpen(true); } },
    ...(onChangeType ? [{ label: t('column.changeType'), icon: '⇄', action: () => { setTypeMenuOpen(true); } }] : []),
    { type: 'divider' as const },
    { label: t(sortLabelKey(field.type, 'asc') as any), action: () => { setMenuOpen(false); onSort?.(field.id, 'asc'); } },
    { label: t(sortLabelKey(field.type, 'desc') as any), action: () => { setMenuOpen(false); onSort?.(field.id, 'desc'); } },
    ...(sortDirection ? [{ label: t('column.sortNone' as any), action: () => { setMenuOpen(false); onSort?.(field.id, null); } }] : []),
    { type: 'divider' as const },
    { label: t('column.hide'), action: () => { setMenuOpen(false); onHide?.(field.id); } },
    { label: t('column.delete'), action: () => { setMenuOpen(false); onDelete?.(field.id); }, danger: true },
  ];

  return (
    <div
      ref={rootRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isCompact ? '4px' : '6px',
        width: '100%',
        minWidth: 0,
        position: 'relative',
        ...(isInputToComputed && {
          background: '#eef2ff',
          borderBottom: '3px solid #6366f1',
          borderRadius: '2px 2px 0 0',
        }),
      }}
    >
      {/* Field type icon — hidden when header is too cramped */}
      {!isCramped && (
        <span title={field.type} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: isCompact ? 12 : 14, height: isCompact ? 12 : 14, flexShrink: 0, color: '#6b7280' }}>
          {customIcon ?? <FieldTypeIcon type={field.type} size={isCompact ? 12 : 14} style={{ color: '#6b7280' }} />}
        </span>
      )}

      {/* Editable name */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            padding: '2px 6px',
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid #2563eb',
            borderRadius: '4px',
            outline: 'none',
            minWidth: '60px',
          }}
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          style={{
            flex: 1,
            minWidth: 0,
            cursor: onRename ? 'text' : 'default',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            position: 'relative',
          }}
          title={field.label}
        >
          <span>
            {field.label}
            {sortDirection && (
              <span style={{ color: '#2563eb', fontSize: '12px', marginLeft: '4px' }}>
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </span>
          {/* Horizontal fade */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '20px',
              background: 'linear-gradient(to right, transparent, #f9fafb)',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      {/* Lock icon for read-only columns */}
      {isLocked && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <title>Read-only</title>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      )}

      {/* Menu button */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px',
            color: '#9ca3af',
            fontSize: '14px',
            lineHeight: 1,
            opacity: menuOpen ? 1 : 0.5,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = menuOpen ? '1' : '0.5')}
          title={t('column.options')}
        >
          ⋮
        </button>

        {/* Dropdown menu */}
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
              minWidth: '170px',
              overflow: 'hidden',
              padding: '4px 0',
            }}
          >
            {typeMenuOpen ? (
              <>
                <button
                  onClick={() => setTypeMenuOpen(false)}
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
                  <span>{'\u2190'}</span>
                  <span>{t('column.back')}</span>
                </button>
                {validating ? (
                  <div style={{ padding: '8px 14px', fontSize: '13px', color: '#6b7280' }}>{t('column.validating')}</div>
                ) : (
                  FIELD_TYPE_VALUES.map((ftValue) => {
                    const isCurrent = ftValue === field.type;
                    return (
                      <button
                        key={ftValue}
                        onClick={() => handleTypeSelect(ftValue)}
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
                        <FieldTypeIcon type={ftValue} size={14} style={{ minWidth: '18px' }} />
                        <span>{t(`fieldType.${ftValue}` as any)}</span>
                        {isCurrent && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>{'\u2713'}</span>}
                      </button>
                    );
                  })
                )}
              </>
            ) : (
              menuItems.map((item, index) =>
                item.type === 'divider' ? (
                  <div
                    key={index}
                    style={{
                      height: '1px',
                      background: '#e5e7eb',
                      margin: '4px 0',
                    }}
                  />
                ) : (
                  <button
                    key={index}
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {item.icon && <span style={{ fontSize: '13px', minWidth: '18px', textAlign: 'center' }}>{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                )
              )
            )}
          </div>
        )}

        {/* Field Options Panel */}
        {optionsPanelOpen && (
          <FieldOptionsPanel
            field={field}
            onSave={(options) => {
              onUpdateOptions?.(field.id, options);
              setOptionsPanelOpen(false);
            }}
            onCancel={() => setOptionsPanelOpen(false)}
          />
        )}
      </div>

      {/* Type change confirmation dialog */}
      {confirmDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDialog(null); }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              padding: '20px',
              width: '380px',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              {t('column.convert.title')}
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#374151' }}>
              {t('column.convert.message', { field: field.label, from: field.type, to: confirmDialog.targetType })}
            </p>

            {/* Compatibility indicator */}
            <div style={{
              padding: '10px 12px',
              borderRadius: '6px',
              marginBottom: '12px',
              background: confirmDialog.incompatible === 0 ? '#f0fdf4' : confirmDialog.incompatible > confirmDialog.compatible ? '#fef2f2' : '#fffbeb',
              border: `1px solid ${confirmDialog.incompatible === 0 ? '#bbf7d0' : confirmDialog.incompatible > confirmDialog.compatible ? '#fecaca' : '#fde68a'}`,
            }}>
              <div style={{ fontSize: '13px', color: '#374151' }}>
                {t('column.convert.compatible', { n: confirmDialog.compatible, total: confirmDialog.total })}
              </div>
              {confirmDialog.incompatible > 0 && (
                <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                  {t('column.convert.incompatible', { n: confirmDialog.incompatible })}
                </div>
              )}
            </div>

            {/* Warnings */}
            {confirmDialog.warnings.map((w, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>
                {w}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: '#374151',
                }}
              >
                {t('column.convert.cancel')}
              </button>
              <button
                onClick={handleConfirmTypeChange}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {t('column.convert.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
