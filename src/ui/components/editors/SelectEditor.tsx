import { useState, useRef, useEffect } from 'react';
import type { CellEditorProps } from './types.ts';
import type { SelectOption, SingleSelectFieldOptions, MultiSelectFieldOptions } from '@monkeytab/core';

// Get select options from field.options.options (the canonical format)
function getSelectOptions(field: CellEditorProps['field']): SelectOption[] {
  if (!field.options) return [];
  const opts = field.options as Record<string, unknown>;
  if ('options' in opts && Array.isArray(opts.options)) {
    return opts.options as SelectOption[];
  }
  return [];
}

export function SelectEditor({ value, field, onSave, onCancel }: CellEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const options = getSelectOptions(field);
  const [highlightedIndex, setHighlightedIndex] = useState(() => {
    const idx = options.findIndex((o) => o.value === value);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onCancel();
        break;
      case 'Enter':
        e.preventDefault();
        if (options[highlightedIndex]) {
          onSave(options[highlightedIndex].value);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(0, i - 1));
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onSave(optionValue);
  };

  const handleClear = () => {
    onSave(null);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        outline: 'none',
      }}
    >
      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '2px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            minWidth: '150px',
          }}
        >
          {/* Clear option */}
          <div
            onClick={handleClear}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#6b7280',
              borderBottom: '1px solid #e5e7eb',
              background: 'transparent',
            }}
            onMouseEnter={() => setHighlightedIndex(-1)}
          >
            Clear selection
          </div>

          {/* Options */}
          {options.map((option, index) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                background: highlightedIndex === index ? '#f3f4f6' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: option.color || '#e5e7eb',
                  color: '#374151',
                }}
              >
                {option.label}
              </span>
              {value === option.value && (
                <span style={{ marginLeft: 'auto', color: '#2563eb' }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
