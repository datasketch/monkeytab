import type { CellRendererProps } from './types.ts';
import { useI18n } from '../../i18n/index.ts';

export function ColorRenderer({ value }: CellRendererProps) {
  const { t } = useI18n();
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  const text = String(value);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
      <div
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '4px',
          background: text,
          border: '1px solid rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: '12px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          color: '#374151',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {text}
      </span>
    </div>
  );
}
