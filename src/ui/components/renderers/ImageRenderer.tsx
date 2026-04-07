import type { CellRendererProps } from './types.ts';
import type { Attachment, ImageFieldOptions } from '@monkeytab/core';
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

function getThumbnailSize(cellHeight?: number, displaySize?: 'small' | 'medium' | 'large'): number {
  if (cellHeight) {
    const availableHeight = cellHeight - 8;
    return Math.max(24, Math.min(80, availableHeight));
  }
  switch (displaySize) {
    case 'small':
      return 32;
    case 'large':
      return 64;
    case 'medium':
    default:
      return 48;
  }
}

export function ImageRenderer({ value, field, cellHeight }: CellRendererProps) {
  const { t } = useI18n();
  const options = field.options as ImageFieldOptions | undefined;
  const size = getThumbnailSize(cellHeight, options?.displaySize);

  if (!value || (Array.isArray(value) && value.length === 0)) {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  const raw = Array.isArray(value) ? value : [value];
  const images: Attachment[] = raw.map((v, i) => normalizeImage(v, i));

  if (images.length === 0) {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  const maxImages = size <= 32 ? 3 : size <= 48 ? 4 : 5;

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'nowrap' }}>
      {images.slice(0, maxImages).map((image) => (
        <div
          key={image.id}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '4px',
            overflow: 'hidden',
            background: '#f3f4f6',
            flexShrink: 0,
          }}
        >
          <img
            src={image.thumbnailUrl || image.url}
            alt={image.filename}
            title={image.filename}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ))}
      {images.length > maxImages && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: `${Math.min(size, 32)}px`,
            height: `${size}px`,
            padding: '0 4px',
            background: '#e5e7eb',
            borderRadius: '4px',
            fontSize: size <= 32 ? '10px' : '12px',
            fontWeight: 500,
            color: '#6b7280',
          }}
        >
          +{images.length - maxImages}
        </span>
      )}
    </div>
  );
}
