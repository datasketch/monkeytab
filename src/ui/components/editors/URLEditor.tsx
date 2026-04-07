import { useState, useRef, useEffect } from 'react';
import type { CellEditorProps } from './types.ts';
import type { LinkValue } from '@monkeytab/core';
import { useI18n } from '../../i18n/index.ts';

/**
 * Detects whether the current value is a LinkValue object.
 */
function isLinkValue(value: unknown): value is LinkValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'url' in value;
}

export function URLEditor({ value, onSave, onCancel }: CellEditorProps) {
  const { t } = useI18n();
  // Determine initial mode from the current value
  const hasLabel = isLinkValue(value);

  const initialUrl = isLinkValue(value) ? value.url : (value != null ? String(value) : '');
  const initialLabel = isLinkValue(value) ? (value.label ?? '') : '';

  const [url, setUrl] = useState(initialUrl);
  const [label, setLabel] = useState(initialLabel);
  const [showLabel, setShowLabel] = useState(hasLabel && !!initialLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    if (!url) {
      onSave(null);
      return;
    }
    if (showLabel && label) {
      onSave({ url, label } as unknown as string);
    } else {
      onSave(url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Only save on blur if label field isn't focused
          if (!showLabel) handleSave();
        }}
        placeholder={t('editor.url.placeholder')}
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
      {showLabel ? (
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={t('editor.url.labelPlaceholder')}
          style={{
            width: '100%',
            padding: '5px 8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '12px',
            outline: 'none',
            background: 'white',
          }}
        />
      ) : (
        <button
          onClick={() => setShowLabel(true)}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            alignSelf: 'flex-start',
            padding: '2px 6px',
            fontSize: '11px',
            color: '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {t('editor.url.addLabel')}
        </button>
      )}
    </div>
  );
}
