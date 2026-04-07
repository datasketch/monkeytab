import { useState, useRef, useEffect } from 'react';
import type { FieldSpec, FieldOptions } from '@monkeytab/core';
import { fieldTypeRegistry } from '../../registry/FieldTypeRegistry.ts';
import { OptionEditor } from './OptionEditors.tsx';
import { FieldTypeIcon } from '../../icons/FieldTypeIcon.tsx';

interface FieldOptionsPanelProps {
  field: FieldSpec;
  onSave: (options: FieldOptions) => void;
  onCancel: () => void;
}

export function FieldOptionsPanel({ field, onSave, onCancel }: FieldOptionsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const optionsSchema = fieldTypeRegistry.getOptionsSchema(field.type);

  // Local state for editing options
  const [localOptions, setLocalOptions] = useState<Record<string, unknown>>(() => {
    // Initialize with current field options
    return { ...(field.options as Record<string, unknown> || {}) };
  });

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleOptionChange = (key: string, value: unknown) => {
    setLocalOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    onSave(localOptions as FieldOptions);
  };

  const definition = fieldTypeRegistry.getDefinition(field.type);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '4px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        zIndex: 1000,
        width: '320px',
        maxHeight: '400px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FieldTypeIcon type={field.type} size={16} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Customize {field.type} field
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
          {definition?.description || `Configure options for ${field.label}`}
        </p>
      </div>

      {/* Options form */}
      <div
        style={{
          padding: '16px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {optionsSchema.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
            No configurable options for this field type.
          </p>
        ) : (
          optionsSchema.map((schema) => (
            <OptionEditor
              key={schema.key}
              schema={schema}
              value={localOptions[schema.key]}
              onChange={(value) => handleOptionChange(schema.key, value)}
            />
          ))
        )}
      </div>

      {/* Footer with buttons */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          background: '#f9fafb',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            background: 'white',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
        >
          Save
        </button>
      </div>
    </div>
  );
}
