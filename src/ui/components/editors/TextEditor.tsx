import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { CellEditorProps } from './types.ts';
import type { TextFieldOptions } from '@monkeytab/core';
import { usePopupPosition } from './usePopupPosition.ts';
import { useTextPopupSize, toCssLength } from './TextPopupContext.tsx';
import { parseMarkdown } from '../renderers/TextRenderer.tsx';

const DEFAULT_POPUP_WIDTH = 450;
const DEFAULT_POPUP_MAX_HEIGHT = 500;
const DEFAULT_TEXTAREA_MIN_HEIGHT = 200;
const DEFAULT_TEXTAREA_MAX_HEIGHT = 400;

type Wrap = { before: string; after: string; placeholder?: string };

function wrapSelection(el: HTMLTextAreaElement, { before, after, placeholder = '' }: Wrap): string {
  const { selectionStart, selectionEnd, value } = el;
  const selected = value.slice(selectionStart, selectionEnd);
  const body = selected || placeholder;
  const next = value.slice(0, selectionStart) + before + body + after + value.slice(selectionEnd);
  // Restore selection to the inserted body so the user can keep typing over it.
  requestAnimationFrame(() => {
    el.focus();
    const start = selectionStart + before.length;
    el.setSelectionRange(start, start + body.length);
  });
  return next;
}

export function TextEditor({ value, field, onSave, onCancel }: CellEditorProps) {
  const options = field.options as TextFieldOptions | undefined;
  const isJson = (options?.json ?? false) || (typeof value === 'object' && value !== null);
  const isRichText = options?.richText ?? false;
  const isMultiline = options?.multiline ?? (isJson || isRichText);
  const maxLength = options?.maxLength;
  const placeholder = options?.placeholder ?? '';

  // Popup size resolution: column options → global context → defaults.
  const globalSize = useTextPopupSize();
  const popupWidth = toCssLength(options?.popupWidth ?? globalSize?.width) ?? `${DEFAULT_POPUP_WIDTH}px`;
  const textareaMinHeight = toCssLength(options?.popupMinHeight ?? globalSize?.minHeight) ?? `${DEFAULT_TEXTAREA_MIN_HEIGHT}px`;
  const textareaMaxHeight = toCssLength(options?.popupMaxHeight ?? globalSize?.maxHeight) ?? `${DEFAULT_TEXTAREA_MAX_HEIGHT}px`;
  const popupWidthPx = typeof options?.popupWidth === 'number' ? options.popupWidth
    : typeof globalSize?.width === 'number' ? globalSize.width
    : DEFAULT_POPUP_WIDTH;

  const initialText = value === null || value === undefined ? ''
    : (typeof value === 'object') ? JSON.stringify(value, null, 2) : String(value);
  const [text, setText] = useState(initialText);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { anchorRef, containerRef, position } = usePopupPosition(popupWidthPx, DEFAULT_POPUP_MAX_HEIGHT);

  useEffect(() => {
    if (isMultiline) {
      if (tab === 'write') {
        setTimeout(() => {
          textareaRef.current?.focus();
          const len = textareaRef.current?.value.length ?? 0;
          textareaRef.current?.setSelectionRange(len, len);
        }, 10);
      }
    } else {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isMultiline, tab]);

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

  const applyWrap = useCallback((w: Wrap) => {
    const el = textareaRef.current;
    if (!el) return;
    const next = wrapSelection(el, w);
    if (maxLength && next.length > maxLength) return;
    setText(next);
  }, [maxLength]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
      return;
    }
    if (e.key === 'Enter' && !isMultiline) {
      e.preventDefault();
      onSave(text || null);
      return;
    }
    // Rich-text shortcuts (textarea only)
    if (isRichText && isMultiline && (e.metaKey || e.ctrlKey)) {
      const key = e.key.toLowerCase();
      if (key === 'b') { e.preventDefault(); applyWrap({ before: '**', after: '**', placeholder: 'bold' }); return; }
      if (key === 'i') { e.preventDefault(); applyWrap({ before: '*', after: '*', placeholder: 'italic' }); return; }
      if (key === 'e') { e.preventDefault(); applyWrap({ before: '`', after: '`', placeholder: 'code' }); return; }
      if (key === 'k') { e.preventDefault(); applyWrap({ before: '[', after: '](https://)', placeholder: 'link' }); return; }
    }
  };

  const handleChange = (newValue: string) => {
    if (maxLength && newValue.length > maxLength) return;
    setText(newValue);
  };

  // Multiline: Show a popup with textarea (and optional toolbar/preview for richText) via portal
  if (isMultiline) {
    const toolbarButton = (label: string, title: string, wrap: Wrap) => (
      <button
        key={label}
        type="button"
        onMouseDown={(e) => e.preventDefault() /* keep textarea focus/selection */}
        onClick={() => applyWrap(wrap)}
        title={title}
        style={{
          padding: '4px 8px',
          fontSize: '13px',
          fontWeight: label === 'B' ? 700 : label === 'I' ? 400 : 500,
          fontStyle: label === 'I' ? 'italic' : 'normal',
          textDecoration: label === 'S' ? 'line-through' : 'none',
          fontFamily: label === '<>' ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
          background: 'transparent',
          color: '#374151',
          border: '1px solid transparent',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {label}
      </button>
    );

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
          width: popupWidth,
          maxWidth: 'calc(100vw - 16px)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
              Edit: {field.label}
            </div>
            {isRichText && (
              <div style={{ display: 'inline-flex', gap: '2px', background: '#f3f4f6', borderRadius: '6px', padding: '2px' }}>
                {(['write', 'preview'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    style={{
                      padding: '3px 10px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: tab === id ? 'white' : 'transparent',
                      color: tab === id ? '#111827' : '#6b7280',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      boxShadow: tab === id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {id === 'write' ? 'Write' : 'Preview'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isRichText && tab === 'write' && (
            <div style={{ display: 'flex', gap: '2px', marginBottom: '6px', flexWrap: 'wrap' }}>
              {toolbarButton('B', 'Bold (⌘/Ctrl+B)', { before: '**', after: '**', placeholder: 'bold' })}
              {toolbarButton('I', 'Italic (⌘/Ctrl+I)', { before: '*', after: '*', placeholder: 'italic' })}
              {toolbarButton('<>', 'Code (⌘/Ctrl+E)', { before: '`', after: '`', placeholder: 'code' })}
              {toolbarButton('Link', 'Link (⌘/Ctrl+K)', { before: '[', after: '](https://)', placeholder: 'link' })}
              {toolbarButton('S', 'Strikethrough', { before: '~~', after: '~~', placeholder: 'text' })}
            </div>
          )}

          {tab === 'preview' && isRichText ? (
            <div
              style={{
                width: '100%',
                minHeight: textareaMinHeight,
                maxHeight: textareaMaxHeight,
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: 1.6,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#fafafa',
                color: text ? '#111827' : '#9ca3af',
              }}
            >
              {text ? parseMarkdown(text) : 'Nothing to preview'}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{
                width: '100%',
                minHeight: textareaMinHeight,
                maxHeight: textareaMaxHeight,
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
          )}

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
              type="button"
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
              type="button"
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
