import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CellEditorProps } from './types.ts';
import type { TextFieldOptions } from '@monkeytab/core';
import { usePopupPosition } from './usePopupPosition.ts';

const POPUP_WIDTH = 450;
const POPUP_MAX_HEIGHT = 500;

export function TextEditor({ value, field, onSave, onCancel }: CellEditorProps) {
  const options = field.options as TextFieldOptions | undefined;
  const isJson = (options?.json ?? false) || (typeof value === 'object' && value !== null);
  const isMultiline = options?.multiline ?? isJson;
  const maxLength = options?.maxLength;
  const placeholder = options?.placeholder ?? '';

  const initialText = value === null || value === undefined ? ''
    : (typeof value === 'object') ? JSON.stringify(value, null, 2) : String(value);
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { anchorRef, containerRef, position } = usePopupPosition(POPUP_WIDTH, POPUP_MAX_HEIGHT);

  useEffect(() => {
    if (isMultiline) {
      setTimeout(() => {
        textareaRef.current?.focus();
        const len = textareaRef.current?.value.length ?? 0;
        textareaRef.current?.setSelectionRange(len, len);
      }, 10);
    } else {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isMultiline]);

  // Handle click outside for multiline popup
  useEffect(() => {
    if (!isMultiline) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onSave(text || null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMultiline, text, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter' && !isMultiline) {
      e.preventDefault();
      onSave(text || null);
    }
  };

  const handleChange = (newValue: string) => {
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    setText(newValue);
  };

  // Multiline: Show a popup with textarea using portal
  if (isMultiline) {
    const popup = (
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          zIndex: 10000,
          width: `${POPUP_WIDTH}px`,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '12px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#6b7280',
              marginBottom: '8px',
            }}
          >
            Edit: {field.label}
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              width: '100%',
              minHeight: '200px',
              maxHeight: '400px',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: isJson ? '12px' : '14px',
              lineHeight: '1.6',
              outline: 'none',
              resize: 'vertical',
              fontFamily: isJson ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
            }}
          />
          {maxLength && (
            <div
              style={{
                fontSize: '12px',
                color: text.length > maxLength * 0.9 ? '#ef4444' : '#9ca3af',
                textAlign: 'right',
                marginTop: '4px',
              }}
            >
              {text.length} / {maxLength}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f9fafb',
          }}
        >
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Escape to cancel
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'white',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(text || null)}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 500,
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );

    return (
      <>
        <div ref={anchorRef} style={{ width: '100%', height: '100%' }}>
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>Editing...</span>
        </div>
        {createPortal(popup, document.body)}
      </>
    );
  }

  // Single line: Inline input
  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(text || null)}
      placeholder={placeholder}
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
