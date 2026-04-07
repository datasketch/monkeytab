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

export function MultiSelectEditor({ value, field, onSave, onCancel }: CellEditorProps) {
  // Convert value to array of strings (filter out non-string items defensively)
  const initialValues: string[] = Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : (value !== null && value !== undefined)
      ? [String(value)]
      : [];

  const [selectedValues, setSelectedValues] = useState<string[]>(initialValues);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const options = getSelectOptions(field);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Save current selection when clicking outside
        onSave(selectedValues.length > 0 ? selectedValues : null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel, onSave, selectedValues]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onCancel();
        break;
      case 'Enter':
        e.preventDefault();
        // Save current selection
        onSave(selectedValues.length > 0 ? selectedValues : null);
        break;
      case ' ':
        e.preventDefault();
        // Toggle selection for highlighted option
        if (options[highlightedIndex]) {
          toggleOption(options[highlightedIndex].value);
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

  const toggleOption = (optionValue: string) => {
    setSelectedValues((prev) => {
      if (prev.includes(optionValue)) {
        return prev.filter((v) => v !== optionValue);
      } else {
        return [...prev, optionValue];
      }
    });
  };

  const handleClear = () => {
    setSelectedValues([]);
  };

  const handleDone = () => {
    onSave(selectedValues.length > 0 ? selectedValues : null);
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
      {/* Selected items display */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          minHeight: '24px',
          marginBottom: '4px',
        }}
      >
        {selectedValues.map((val) => {
          const option = options.find((o) => o.value === val);
          return (
            <span
              key={val}
              onClick={() => toggleOption(val)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: option?.color ? `${option.color}20` : '#e5e7eb',
                color: option?.color || '#374151',
                border: `1px solid ${option?.color || '#d1d5db'}`,
                cursor: 'pointer',
              }}
            >
              {option?.label || val}
              <span style={{ fontSize: '10px', color: '#6b7280' }}>×</span>
            </span>
          );
        })}
        {selectedValues.length === 0 && (
          <span style={{ color: '#9ca3af', fontSize: '14px' }}>Select options...</span>
        )}
      </div>

      {/* Dropdown menu */}
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
        {/* Clear all option */}
        <div
          onClick={handleClear}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#6b7280',
            borderBottom: '1px solid #e5e7eb',
            background: 'transparent',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Clear all</span>
          {selectedValues.length > 0 && (
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              {selectedValues.length} selected
            </span>
          )}
        </div>

        {/* Options with checkboxes */}
        {options.map((option, index) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <div
              key={option.value}
              onClick={() => toggleOption(option.value)}
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
              {/* Checkbox */}
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  border: isSelected ? '2px solid #2563eb' : '2px solid #d1d5db',
                  backgroundColor: isSelected ? '#2563eb' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {isSelected && '✓'}
              </span>

              {/* Badge */}
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: option.color ? `${option.color}20` : '#e5e7eb',
                  color: option.color || '#374151',
                  border: `1px solid ${option.color || '#d1d5db'}`,
                }}
              >
                {option.label}
              </span>
            </div>
          );
        })}

        {/* Done button */}
        <div
          onClick={handleDone}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            color: '#2563eb',
            borderTop: '1px solid #e5e7eb',
            background: '#f9fafb',
            textAlign: 'center',
          }}
        >
          Done
        </div>
      </div>
    </div>
  );
}
