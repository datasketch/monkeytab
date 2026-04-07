import type { CellRendererProps } from './types.ts';
import type { Attachment, AttachmentFieldOptions } from '@monkeytab/core';
import { useI18n } from '../../i18n/index.ts';

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Get file icon based on mime type (plain text abbreviations, no emojis)
function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'IMG';
  if (mimeType.startsWith('video/')) return 'VID';
  if (mimeType.startsWith('audio/')) return 'AUD';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'XLS';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'DOC';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'ZIP';
  return 'FILE';
}

export function AttachmentRenderer({ value, field, cellHeight }: CellRendererProps) {
  const { t } = useI18n();
  const options = field.options as AttachmentFieldOptions | undefined;

  if (!value || (Array.isArray(value) && value.length === 0)) {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  // Handle both single attachment and array of attachments
  const attachments: Attachment[] = Array.isArray(value)
    ? (value as unknown as Attachment[])
    : [value as unknown as Attachment];

  if (attachments.length === 0) {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  // Adjust display based on cell height
  const isCompact = cellHeight && cellHeight <= 44;
  const maxToShow = isCompact ? 2 : 3;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
      {attachments.slice(0, maxToShow).map((attachment, index) => (
        <a
          key={attachment.id || index}
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: isCompact ? '1px 6px' : '2px 8px',
            background: '#f3f4f6',
            borderRadius: '4px',
            fontSize: isCompact ? '11px' : '12px',
            color: '#374151',
            textDecoration: 'none',
            maxWidth: isCompact ? '100px' : '150px',
          }}
          title={`${attachment.filename} (${formatFileSize(attachment.size)})`}
        >
          <span style={{ fontSize: isCompact ? '10px' : '12px' }}>{getFileIcon(attachment.mimeType)}</span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {attachment.filename}
          </span>
        </a>
      ))}
      {attachments.length > maxToShow && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: isCompact ? '1px 6px' : '2px 8px',
            background: '#e5e7eb',
            borderRadius: '4px',
            fontSize: isCompact ? '10px' : '12px',
            color: '#6b7280',
          }}
        >
          +{attachments.length - maxToShow}
        </span>
      )}
    </div>
  );
}
