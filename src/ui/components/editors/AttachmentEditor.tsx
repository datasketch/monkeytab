import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { CellEditorProps } from './types.ts';
import type { Attachment, AttachmentFieldOptions } from '@monkeytab/core';
import { usePopupPosition } from './usePopupPosition.ts';
import { useI18n } from '../../i18n/index.ts';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const POPUP_WIDTH = 400;
const POPUP_MAX_HEIGHT = 500;

export function AttachmentEditor({ value, field, onSave, onCancel, onUpload }: CellEditorProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { anchorRef, containerRef, position } = usePopupPosition(POPUP_WIDTH, POPUP_MAX_HEIGHT);
  const options = field.options as AttachmentFieldOptions | undefined;
  const maxFiles = options?.maxFiles ?? 10;
  const maxFileSize = options?.maxFileSize ?? 10 * 1024 * 1024;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const existingAttachments: Attachment[] = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value as unknown as Attachment[];
    return [value as unknown as Attachment];
  }, [value]);

  const [attachments, setAttachments] = useState<Attachment[]>(existingAttachments);

  const handleSave = useCallback(() => {
    onSave(attachments.length > 0 ? attachments : null);
  }, [attachments, onSave]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleSave]);

  const handleRemove = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = maxFiles - attachments.length;
    const toProcess = Array.from(files).slice(0, remaining);

    setUploading(true);
    setUploadError(null);
    try {
      const newAttachments: Attachment[] = [];
      for (const file of toProcess) {
        if (file.size > maxFileSize) continue;
        const url = onUpload
          ? await onUpload(file, field.type)
          : await fileToDataUrl(file);
        if (!url) continue;
        newAttachments.push({
          id: crypto.randomUUID(),
          filename: file.name,
          url,
          mimeType: file.type,
          size: file.size,
        });
      }

      if (newAttachments.length > 0) {
        setAttachments((prev) => [...prev, ...newAttachments]);
      }
    } catch {
      setUploadError(t('editor.uploadError'));
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  };

  const popup = (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: `${POPUP_WIDTH}px`,
        maxHeight: `${POPUP_MAX_HEIGHT}px`,
        overflow: 'hidden',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        zIndex: 10000,
      }}
    >
      {/* Existing attachments */}
      {attachments.length > 0 && (
        <div
          style={{
            padding: '12px',
            borderBottom: '1px solid #e5e7eb',
            maxHeight: '150px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
            {t('editor.attachment.header', { count: attachments.length })}
          </div>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                background: '#f9fafb',
                borderRadius: '4px',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>{t('editor.attachment.fileBadge')}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {attachment.filename}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {formatFileSize(attachment.size)}
                </div>
              </div>
              <button
                onClick={() => handleRemove(attachment.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#9ca3af',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File picker */}
      {attachments.length < maxFiles && (
        <div style={{ padding: '12px' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '24px 16px',
              background: '#f9fafb',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              cursor: uploading ? 'wait' : 'pointer',
              color: '#6b7280',
              fontSize: '14px',
              textAlign: 'center',
              opacity: uploading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.color = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            {uploading ? t('editor.uploading') : t('editor.attachment.choose')}
          </button>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px', textAlign: 'center' }}>
            {t('editor.attachment.constraints', { max: maxFiles, size: formatFileSize(maxFileSize) })}
          </div>
        </div>
      )}

      {uploadError && (
        <div style={{ padding: '8px 12px', color: '#dc2626', fontSize: '13px' }}>{uploadError}</div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          background: '#f9fafb',
          borderRadius: '0 0 8px 8px',
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
        >
          {t('editor.cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={uploading}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            background: uploading ? '#93c5fd' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {t('editor.done')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div ref={anchorRef} style={{ width: '100%', height: '100%' }}>
        <span style={{ color: '#9ca3af', fontSize: '13px' }}>{t('grid.editing')}</span>
      </div>
      {createPortal(popup, document.body)}
    </>
  );
}
