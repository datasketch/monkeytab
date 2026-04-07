import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { CellEditorProps } from './types.ts';
import { usePopupPosition } from './usePopupPosition.ts';
import { useI18n } from '../../i18n/index.ts';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#78716c', '#6b7280', '#1e293b', '#000000',
];

const POPUP_WIDTH = 260;
const POPUP_MAX_HEIGHT = 400;

export function ColorEditor({ value, onSave, onCancel }: CellEditorProps) {
  const { t } = useI18n();
  const { anchorRef, containerRef, position } = usePopupPosition(POPUP_WIDTH, POPUP_MAX_HEIGHT);
  const [color, setColor] = useState(value ? String(value) : '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    onSave(color || null);
  }, [color, onSave]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleSave]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter') handleSave();
  };

  const popup = (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: `${POPUP_WIDTH}px`,
        maxHeight: `${POPUP_MAX_HEIGHT}px`,
        overflowY: 'auto',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        zIndex: 10000,
        padding: '12px',
      }}
    >
      {/* Preview + text input */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: color || '#fff',
            border: '1px solid rgba(0,0,0,0.15)',
            flexShrink: 0,
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder={t('editor.color.placeholder')}
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: '#374151',
            outline: 'none',
            minWidth: 0,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
        />
      </div>

      {/* Native color picker */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="color"
          value={color || '#000000'}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: '100%', height: '32px', cursor: 'pointer', border: 'none', padding: 0 }}
        />
      </div>

      {/* Preset swatches */}
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>{t('editor.color.presets')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              background: c,
              border: color === c ? '2px solid #2563eb' : '1px solid rgba(0,0,0,0.1)',
              cursor: 'pointer',
              padding: 0,
            }}
            title={c}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            background: 'white',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {t('editor.cancel')}
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {t('editor.done')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div ref={anchorRef} style={{ width: '100%', height: '100%' }}>
        <span style={{ color: '#9ca3af', fontSize: '13px' }}>{t('grid.editing')}</span>
      </div>
      {createPortal(popup, document.body)}
    </>
  );
}
