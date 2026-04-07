import { useState, useRef, useEffect } from 'react';
import type { CellEditorProps } from './types.ts';

/** Extract YYYY-MM-DD from any stored date value without timezone conversion */
function toDateString(v: unknown): string {
  if (!v) return '';
  const s = String(v);
  // Already in YYYY-MM-DD format
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  return '';
}

export function DateEditor({ value, onSave, onCancel }: CellEditorProps) {
  const [dateValue, setDateValue] = useState(toDateString(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(dateValue || null);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const openNativePicker = () => {
    hiddenDateRef.current?.showPicker?.();
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setDateValue(val);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        ref={inputRef}
        type="text"
        value={dateValue}
        placeholder="yyyy-mm-dd"
        onChange={(e) => setDateValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(dateValue || null)}
        style={{
          width: '100%',
          padding: '6px 28px 6px 8px',
          border: '2px solid #2563eb',
          borderRadius: '4px',
          fontSize: '13px',
          fontFamily: 'monospace',
          outline: 'none',
          background: 'white',
          boxSizing: 'border-box',
        }}
      />
      {/* Calendar icon that opens native date picker */}
      <button
        type="button"
        onClick={openNativePicker}
        onMouseDown={(e) => e.preventDefault()}
        style={{
          position: 'absolute',
          right: '4px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#6b7280',
          padding: '2px 4px',
          lineHeight: 1,
        }}
        title="Open date picker"
        tabIndex={-1}
      >
        {'\ud83d\udcc5'}
      </button>
      {/* Hidden native date input for picker only */}
      <input
        ref={hiddenDateRef}
        type="date"
        value={dateValue}
        onChange={handleNativeChange}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
        tabIndex={-1}
      />
    </div>
  );
}
