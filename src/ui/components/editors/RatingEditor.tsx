import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { CellEditorProps } from './types.ts';
import { usePopupPosition } from './usePopupPosition.ts';
import { useI18n } from '../../i18n/index.ts';

interface RatingFieldOptions {
  max?: number;
  icon?: 'star' | 'heart' | 'circle';
}

const ICONS: Record<string, { filled: string; empty: string }> = {
  star: { filled: '\u2605', empty: '\u2606' },
  heart: { filled: '\u2665', empty: '\u2661' },
  circle: { filled: '\u25CF', empty: '\u25CB' },
};

const POPUP_WIDTH = 220;
const POPUP_MAX_HEIGHT = 200;

export function RatingEditor({ value, field, onSave, onCancel }: CellEditorProps) {
  const { t } = useI18n();
  const { anchorRef, containerRef, position } = usePopupPosition(POPUP_WIDTH, POPUP_MAX_HEIGHT);
  const options = field.options as RatingFieldOptions | undefined;
  const max = options?.max ?? 5;
  const iconType = options?.icon ?? 'star';
  const { filled, empty } = ICONS[iconType] ?? ICONS.star;

  const [rating, setRating] = useState(value !== null && value !== undefined ? Number(value) : 0);
  const [hover, setHover] = useState(-1);

  const handleSave = useCallback(() => {
    onSave(rating);
  }, [rating, onSave]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter') handleSave();
    const num = parseInt(e.key, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= max) {
      setRating(num);
    }
  };

  const popup = (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: `${POPUP_WIDTH}px`,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        zIndex: 10000,
        padding: '12px',
        outline: 'none',
      }}
    >
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
        {t('editor.rating.instruction', { n: rating, max })}
      </div>
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        {Array.from({ length: max }, (_, i) => {
          const idx = i + 1;
          const isActive = idx <= (hover >= 0 ? hover : rating);
          return (
            <button
              key={i}
              onClick={() => setRating(idx === rating ? 0 : idx)}
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover(-1)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: isActive ? '#f59e0b' : '#d1d5db',
                padding: '2px',
                lineHeight: 1,
                transition: 'transform 0.1s',
                transform: hover === idx ? 'scale(1.2)' : 'scale(1)',
              }}
              title={`${idx}`}
            >
              {isActive ? filled : empty}
            </button>
          );
        })}
      </div>
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
