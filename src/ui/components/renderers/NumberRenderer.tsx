import type { CellRendererProps } from './types.ts';
import type { NumberFieldOptions } from '@monkeytab/core';
import { useI18n } from '../../i18n/index.ts';
import { useSettings } from '../../hooks/useTableData.ts';

export function NumberRenderer({ value, field }: CellRendererProps) {
  const { t, formatNumber, formatCurrency, locale } = useI18n();
  const { data: settings } = useSettings();
  const options = field.options as NumberFieldOptions | undefined;

  // Field-level options → global settings → hardcoded defaults
  const precision = options?.precision ?? settings?.numberDecimalPlaces ?? 2;
  const format = options?.format ?? 'decimal';
  const currencyCode = options?.currencyCode ?? settings?.currencyCode ?? 'USD';
  const currencyDisplay = options?.currencyDisplay ?? settings?.currencyDisplay ?? 'symbol';
  const thousandsSeparator = options?.thousandsSeparator ?? settings?.numberThousandsSeparator ?? false;

  if (value === null || value === undefined) {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  const num = Number(value);
  if (Number.isNaN(num)) {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  let formatted: string;

  if (format === 'percentage') {
    formatted = formatNumber(num, {
      style: 'percent',
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  } else if (format === 'currency') {
    formatted = formatCurrency(num, currencyCode, currencyDisplay);
  } else {
    formatted = formatNumber(num, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping: thousandsSeparator,
    });
  }

  return <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatted}</span>;
}
