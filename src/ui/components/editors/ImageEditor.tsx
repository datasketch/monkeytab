import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { CellEditorProps } from './types.ts';
import type { Attachment, ImageFieldOptions } from '@monkeytab/core';
import { usePopupPosition } from './usePopupPosition.ts';
import { useI18n } from '../../i18n/index.ts';

function normalizeImage(v: unknown, index: number): Attachment {
  if (typeof v === 'string') {
    const filename = v.split('/').pop() || v;
    return { id: `img-${index}`, filename, url: v, mimeType: 'image/*', size: 0 };
  }
  const obj = v as Partial<Attachment>;
  return {
    id: obj.id || `img-${index}`,
    filename: obj.filename || obj.url || '',
    url: obj.url || '',
    mimeType: obj.mimeType || 'image/*',
    size: obj.size || 0,
    thumbnailUrl: obj.thumbnailUrl,
  };
}

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

const POPUP_WIDTH = 450;
const POPUP_MAX_HEIGHT = 600;

export function ImageEditor({ value, field, onSave, onCancel, onUpload }: CellEditorProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { anchorRef, containerRef, position } = usePopupPosition(POPUP_WIDTH, POPUP_MAX_HEIGHT);
  const options = field.options as ImageFieldOptions | undefined;
  const maxImages = options?.maxImages ?? 10;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const maxFileSize = options?.maxFileSize ?? 10 * 1024 * 1024;

  const existingImages: Attachment[] = useMemo(() => {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : [value];
    return raw.map((v, i) => normalizeImage(v, i));
  }, [value]);

  const [images, setImages] = useState<Attachment[]>(existingImages);

  const handleSave = useCallback(() => {
    onSave(images.length > 0 ? images : null);
  }, [images, onSave]);

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
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleUrlChange = (id: string, newUrl: string) => {
    setImages((prev) => prev.map((img) =>
      img.id === id ? { ...img, url: newUrl, filename: newUrl.split('/').pop() || newUrl } : img
    ));
  };

  const processFiles = useCallback(async (files: File[]) => {
    const remaining = maxImages - images.length;
    const toProcess = files.slice(0, remaining);
    if (toProcess.length === 0) return;

    setUploading(true);
    setUploadError(null);
    try {
      const newImages: Attachment[] = [];
      for (const file of toProcess) {
        if (file.size > maxFileSize) continue;
        if (!file.type.startsWith('image/')) continue;
        const url = onUpload
          ? await onUpload(file, field.type)
          : await fileToDataUrl(file);
        if (!url) continue;
        newImages.push({
          id: crypto.randomUUID(),
          filename: file.name,
          url,
          mimeType: file.type,
          size: file.size,
        });
      }

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch {
      setUploadError(t('editor.uploadError'));
    } finally {
      setUploading(false);
    }
  }, [images.length, maxImages, maxFileSize, onUpload, field.type, t]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await processFiles(Array.from(files));
    e.target.value = '';
  };

  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) processFiles(files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  // Paste handler — listen on the popup container
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        processFiles(files);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processFiles]);

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
        overflowY: 'auto',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        zIndex: 10000,
      }}
    >
      {/* Existing images — each with preview + URL */}
      {images.length > 0 && (
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
            Images ({images.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {images.map((image) => (
              <div
                key={image.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#fafafa',
                }}
              >
                {/* Image preview */}
                <div style={{ position: 'relative' }}>
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={image.thumbnailUrl || image.url}
                      alt={image.filename}
                      style={{
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        background: '#f3f4f6',
                        display: 'block',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.style.cssText = 'padding:24px;text-align:center;color:#9ca3af;font-size:13px;background:#f9fafb;';
                          fallback.textContent = 'Image could not be loaded';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </a>
                  <button
                    onClick={() => handleRemove(image.id)}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'white',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
                {/* URL field */}
                <div style={{ padding: '8px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={image.url}
                      onChange={(e) => handleUrlChange(image.id, e.target.value)}
                      placeholder="Image URL"
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        color: '#374151',
                        outline: 'none',
                        minWidth: 0,
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(image.url);
                        const btn = e.currentTarget;
                        const orig = btn.innerHTML;
                        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                        setTimeout(() => { btn.innerHTML = orig; }, 1500);
                      }}
                      title="Copy URL"
                      style={{
                        padding: '4px',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Open in new tab"
                      style={{
                        padding: '4px',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        textDecoration: 'none',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File picker / drop zone */}
      {images.length < maxImages && (
        <div style={{ padding: '12px', borderTop: images.length > 0 ? '1px solid #e5e7eb' : 'none' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              width: '100%',
              padding: '20px 16px',
              background: dragOver ? '#eff6ff' : '#f9fafb',
              border: `2px dashed ${dragOver ? '#2563eb' : '#d1d5db'}`,
              borderRadius: '8px',
              cursor: uploading ? 'wait' : 'pointer',
              color: dragOver ? '#2563eb' : '#6b7280',
              fontSize: '13px',
              textAlign: 'center',
              opacity: uploading ? 0.6 : 1,
              transition: 'border-color 0.15s, background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!uploading && !dragOver) {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.color = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!dragOver) {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            {uploading
              ? t('editor.uploading')
              : dragOver
                ? 'Drop images here'
                : images.length > 0
                  ? t('editor.image.addMore')
                  : t('editor.image.choose')}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', textAlign: 'center' }}>
            Drop, paste, or click to browse. Max {maxImages}, up to {formatFileSize(maxFileSize)} each
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
          Cancel
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
          Done
        </button>
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
