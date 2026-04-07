import { useState, useRef, useEffect } from 'react';
import type { SelectOption } from '@monkeytab/core';
import type { FieldOptionSchema } from '../../registry/FieldTypeRegistry.ts';

// =============================================================================
// Common Types
// =============================================================================

interface OptionEditorProps<T> {
  schema: FieldOptionSchema;
  value: T;
  onChange: (value: T) => void;
}

// =============================================================================
// Text Option Editor
// =============================================================================

export function TextOptionEditor({ schema, value, onChange }: OptionEditorProps<string | undefined>) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: '4px',
        }}
      >
        {schema.label}
      </label>
      {schema.description && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', marginTop: 0 }}>
          {schema.description}
        </p>
      )}
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={schema.label}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '14px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
      />
    </div>
  );
}

// =============================================================================
// Number Option Editor
// =============================================================================

export function NumberOptionEditor({ schema, value, onChange }: OptionEditorProps<number | undefined>) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: '4px',
        }}
      >
        {schema.label}
      </label>
      {schema.description && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', marginTop: 0 }}>
          {schema.description}
        </p>
      )}
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? undefined : Number(val));
        }}
        min={schema.min}
        max={schema.max}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '14px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
      />
    </div>
  );
}

// =============================================================================
// Boolean Option Editor
// =============================================================================

export function BooleanOptionEditor({ schema, value, onChange }: OptionEditorProps<boolean | undefined>) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={value ?? false}
          onChange={(e) => onChange(e.target.checked)}
          style={{
            width: '16px',
            height: '16px',
            cursor: 'pointer',
          }}
        />
        {schema.label}
      </label>
      {schema.description && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', marginBottom: 0, marginLeft: '24px' }}>
          {schema.description}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Select Option Editor
// =============================================================================

export function SelectOptionEditor({ schema, value, onChange }: OptionEditorProps<string | undefined>) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: '4px',
        }}
      >
        {schema.label}
      </label>
      {schema.description && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', marginTop: 0 }}>
          {schema.description}
        </p>
      )}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '14px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          outline: 'none',
          background: 'white',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
        onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
      >
        {schema.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// =============================================================================
// Color Picker (for options-list)
// =============================================================================

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

interface ColorPickerProps {
  value: string | undefined;
  onChange: (color: string | undefined) => void;
  onClose: () => void;
}

function ColorPicker({ value, onChange, onClose }: ColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '4px',
        padding: '8px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1001,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '4px',
      }}
    >
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => {
            onChange(color);
            onClose();
          }}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            border: value === color ? '2px solid #374151' : '1px solid #e5e7eb',
            background: color,
            cursor: 'pointer',
          }}
        />
      ))}
      <button
        onClick={() => {
          onChange(undefined);
          onClose();
        }}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
          background: 'white',
          cursor: 'pointer',
          fontSize: '10px',
          color: '#6b7280',
        }}
        title="No color"
      >
        ✕
      </button>
    </div>
  );
}

// =============================================================================
// Options List Editor (for SingleSelect/MultiSelect)
// =============================================================================

interface OptionsListEditorProps {
  schema: FieldOptionSchema;
  value: SelectOption[] | undefined;
  onChange: (value: SelectOption[]) => void;
}

export function OptionsListEditor({ schema, value, onChange }: OptionsListEditorProps) {
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);
  const options = value ?? [];

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    const newOption: SelectOption = {
      value: `opt_${Date.now()}`,
      label: newOptionLabel.trim(),
      color: PRESET_COLORS[options.length % PRESET_COLORS.length],
    };
    onChange([...options, newOption]);
    setNewOptionLabel('');
  };

  const handleRemoveOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const handleUpdateLabel = (index: number, label: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], label };
    onChange(newOptions);
  };

  const handleUpdateColor = (index: number, color: string | undefined) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], color };
    onChange(newOptions);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(options[index].label);
  };

  const saveEditing = () => {
    if (editingIndex !== null && editingValue.trim()) {
      handleUpdateLabel(editingIndex, editingValue.trim());
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: '4px',
        }}
      >
        {schema.label}
      </label>
      {schema.description && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', marginTop: 0 }}>
          {schema.description}
        </p>
      )}

      {/* Options list */}
      <div style={{ marginBottom: '8px' }}>
        {options.map((option, index) => (
          <div
            key={option.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              marginBottom: '4px',
              background: '#f9fafb',
              borderRadius: '6px',
              position: 'relative',
            }}
          >
            {/* Color button */}
            <button
              onClick={() => setColorPickerIndex(colorPickerIndex === index ? null : index)}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                background: option.color || '#e5e7eb',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Change color"
            />
            {colorPickerIndex === index && (
              <ColorPicker
                value={option.color}
                onChange={(color) => handleUpdateColor(index, color)}
                onClose={() => setColorPickerIndex(null)}
              />
            )}

            {/* Label */}
            {editingIndex === index ? (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={saveEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing();
                  if (e.key === 'Escape') setEditingIndex(null);
                }}
                autoFocus
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '13px',
                  border: '1px solid #2563eb',
                  borderRadius: '4px',
                  outline: 'none',
                }}
              />
            ) : (
              <span
                onDoubleClick={() => startEditing(index)}
                style={{
                  flex: 1,
                  fontSize: '13px',
                  color: '#374151',
                  cursor: 'text',
                }}
                title="Double-click to edit"
              >
                {option.label}
              </span>
            )}

            {/* Delete button */}
            <button
              onClick={() => handleRemoveOption(index)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#9ca3af',
                fontSize: '14px',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              title="Remove option"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add new option */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newOptionLabel}
          onChange={(e) => setNewOptionLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddOption();
          }}
          placeholder="Add option..."
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '13px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
        />
        <button
          onClick={handleAddOption}
          disabled={!newOptionLabel.trim()}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            background: newOptionLabel.trim() ? '#2563eb' : '#e5e7eb',
            color: newOptionLabel.trim() ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '6px',
            cursor: newOptionLabel.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Main Option Editor Dispatcher
// =============================================================================

interface OptionEditorDispatcherProps {
  schema: FieldOptionSchema;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function OptionEditor({ schema, value, onChange }: OptionEditorDispatcherProps) {
  switch (schema.type) {
    case 'text':
      return (
        <TextOptionEditor
          schema={schema}
          value={value as string | undefined}
          onChange={onChange}
        />
      );
    case 'number':
      return (
        <NumberOptionEditor
          schema={schema}
          value={value as number | undefined}
          onChange={onChange}
        />
      );
    case 'boolean':
      return (
        <BooleanOptionEditor
          schema={schema}
          value={value as boolean | undefined}
          onChange={onChange}
        />
      );
    case 'select':
      return (
        <SelectOptionEditor
          schema={schema}
          value={value as string | undefined}
          onChange={onChange}
        />
      );
    case 'options-list':
      return (
        <OptionsListEditor
          schema={schema}
          value={value as SelectOption[] | undefined}
          onChange={onChange}
        />
      );
    case 'color':
      // Color is handled inline in options-list, but provide a fallback
      return (
        <TextOptionEditor
          schema={schema}
          value={value as string | undefined}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}
