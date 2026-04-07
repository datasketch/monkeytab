import type { CellRendererProps } from './types.ts';
import type { SelectOption, SingleSelectFieldOptions, MultiSelectFieldOptions } from '@monkeytab/core';
import { useI18n } from '../../i18n/index.ts';

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
}

// Get select options from field.options.options (the canonical format)
function getSelectOptions(field: CellRendererProps['field']): SelectOption[] {
  if (!field.options) return [];
  const opts = field.options as Record<string, unknown>;
  if ('options' in opts && Array.isArray(opts.options)) {
    return opts.options as SelectOption[];
  }
  return [];
}

export function SelectRenderer({ value, field }: CellRendererProps) {
  const { t } = useI18n();
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  const options = getSelectOptions(field);
  const option = options.find((o) => o.value === value);
  if (!option) {
    return <span>{String(value)}</span>;
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
        background: option.color ?? '#e5e7eb',
        color: getContrastColor(option.color ?? '#e5e7eb'),
      }}
    >
      {option.label}
    </span>
  );
}
