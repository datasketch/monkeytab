import { useState, useRef, useEffect } from 'react';
import type { CellEditorProps } from './types.ts';

export function NumberEditor({ value, onSave, onCancel }: CellEditorProps) {
  const [text, setText] = useState(value === null || value === undefined ? '' : String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const num = text === '' ? null : Number(text);
      onSave(num === null || Number.isNaN(num) ? null : num);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    const num = text === '' ? null : Number(text);
    onSave(num === null || Number.isNaN(num) ? null : num);
  };

  return (
    <input
      ref={inputRef}
      type="number"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{
        width: '100%',
        padding: '6px 8px',
        border: '2px solid #2563eb',
        borderRadius: '4px',
        fontSize: '13px',
        fontFamily: 'monospace',
        outline: 'none',
        background: 'white',
      }}
    />
  );
}
