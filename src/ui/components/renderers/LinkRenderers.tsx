import type { CellRendererProps } from './types.ts';
import { useI18n } from '../../i18n/index.ts';

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none',
  whiteSpace: 'nowrap' as const,
  // Overflow handled by the parent GridCell's fade gradient, not ellipsis.
  display: 'block' as const,
};

export function EmailRenderer({ value }: CellRendererProps) {
  const { t } = useI18n();
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }
  const text = String(value);
  return (
    <a
      href={`mailto:${text}`}
      onClick={(e) => e.stopPropagation()}
      style={linkStyle}
      title={text}
    >
      {text}
    </a>
  );
}

export function URLRenderer({ value }: CellRendererProps) {
  const { t } = useI18n();
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  // Support { url, label } objects alongside plain strings
  let url: string;
  let label: string | undefined;

  if (typeof value === 'object' && !Array.isArray(value) && 'url' in value) {
    url = String((value as { url: string; label?: string }).url);
    label = (value as { url: string; label?: string }).label || undefined;
  } else {
    url = String(value);
  }

  // Don't prepend https:// to relative paths (/...), protocol-relative (//...), or other schemes (mailto:, tel:, etc.)
  const isAbsoluteOrRelative = url.startsWith('/') || url.startsWith('#') || url.match(/^[a-z][a-z0-9+.-]*:/i);
  const href = isAbsoluteOrRelative ? url : `https://${url}`;
  // If no label, show a clean display version without protocol
  const display = label || url.replace(/^https?:\/\//, '');

  const isExternal = url.match(/^https?:\/\//i) || (!url.startsWith('/') && !url.startsWith('#') && !url.startsWith('.'));

  return (
    <a
      href={href}
      {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
      onClick={(e) => e.stopPropagation()}
      style={linkStyle}
      title={url}
    >
      {display}
    </a>
  );
}

export function PhoneRenderer({ value }: CellRendererProps) {
  const { t } = useI18n();
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }
  const text = String(value);
  const href = `tel:${text.replace(/\s/g, '')}`;
  return (
    <a
      href={href}
      onClick={(e) => e.stopPropagation()}
      style={linkStyle}
      title={text}
    >
      {text}
    </a>
  );
}
