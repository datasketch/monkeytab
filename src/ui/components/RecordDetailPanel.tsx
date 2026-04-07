import React, { useRef, useEffect } from 'react';
import type { Row, FieldSpec, Value } from '@monkeytab/core';
import { getRenderer } from './renderers/index.ts';
import { useI18n } from '../i18n/index.ts';

interface RecordDetailPanelProps {
  row: Row;
  fields: FieldSpec[];
  onClose: () => void;
  onCellSave?: (rowId: string, fieldId: string, value: Value) => void;
}

const FIELD_TYPE_ICONS: Record<string, string> = {
  Text: 'Aa',
  Number: '#',
  Boolean: '\u2611',
  Date: '\uD83D\uDCC5',
  SingleSelect: '\u25C9',
  MultiSelect: '\u2630',
  Attachment: '\uD83D\uDCCE',
  Image: '\uD83D\uDDBC\uFE0F',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RecordDetailPanel({ row, fields, onClose }: RecordDetailPanelProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        zIndex: 200,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        ref={panelRef}
        style={{
          width: '480px',
          maxWidth: '100vw',
          height: '100%',
          background: 'white',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              {t('record.title')}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {row.id}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#6b7280',
              padding: '4px 8px',
              borderRadius: '4px',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title={t('record.close')}
          >
            &times;
          </button>
        </div>

        {/* Body - scrollable field list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
          }}
        >
          {fields.map((field) => {
            const Renderer = getRenderer(field.type);
            const value = row.fields[field.id];

            return (
              <div
                key={field.id}
                style={{
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                {/* Field label */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {FIELD_TYPE_ICONS[field.type] ?? '?'}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {field.label}
                  </span>
                </div>

                {/* Field value */}
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    minHeight: '36px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {value == null ? (
                    <span style={{ color: '#d1d5db', fontSize: '14px', fontStyle: 'italic' }}>
                      {t('record.empty')}
                    </span>
                  ) : (
                    <Renderer value={value} field={field} rowId={row.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer - timestamps */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e5e7eb',
            flexShrink: 0,
            fontSize: '12px',
            color: '#9ca3af',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div>{t('record.created', { date: formatTimestamp(row.createdAt) })}</div>
          <div>{t('record.updated', { date: formatTimestamp(row.updatedAt) })}</div>
        </div>
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
