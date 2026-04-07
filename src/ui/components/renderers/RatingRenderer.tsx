import type { CellRendererProps } from './types.ts';
import { useI18n } from '../../i18n/index.ts';

interface RatingFieldOptions {
  max?: number;
  icon?: 'star' | 'heart' | 'circle';
}

const ICONS: Record<string, { filled: string; empty: string }> = {
  star: { filled: '\u2605', empty: '\u2606' },
  heart: { filled: '\u2665', empty: '\u2661' },
  circle: { filled: '\u25CF', empty: '\u25CB' },
};

export function RatingRenderer({ value, field }: CellRendererProps) {
  const { t } = useI18n();
  if (value === null || value === undefined) {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  const num = Number(value);
  if (Number.isNaN(num)) {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  const options = field.options as RatingFieldOptions | undefined;
  const max = options?.max ?? 5;
  const iconType = options?.icon ?? 'star';
  const { filled, empty } = ICONS[iconType] ?? ICONS.star;
  const rating = Math.max(0, Math.min(max, Math.round(num)));

  return (
    <span
      style={{
        whiteSpace: 'nowrap',
        fontSize: '14px',
        letterSpacing: '1px',
        lineHeight: 1,
      }}
      title={`${num} / ${max}`}
    >
      <span style={{ color: '#f59e0b' }}>{filled.repeat(rating)}</span>
      <span style={{ color: '#d1d5db' }}>{empty.repeat(max - rating)}</span>
    </span>
  );
}
