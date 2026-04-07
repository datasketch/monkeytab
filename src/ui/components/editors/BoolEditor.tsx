import { useEffect, useRef } from 'react';
import type { CellEditorProps } from './types.ts';

export function BoolEditor({ value, onSave, onCancel }: CellEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSave(!value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleClick = () => {
    onSave(!value);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px',
        cursor: 'pointer',
        outline: '2px solid #2563eb',
        borderRadius: '4px',
        background: 'white',
      }}
    >
      <input
        type="checkbox"
        checked={!!value}
        onChange={() => onSave(!value)}
        style={{ cursor: 'pointer' }}
      />
      <span style={{ fontSize: '14px' }}>{value ? 'Yes' : 'No'}</span>
    </div>
  );
}
