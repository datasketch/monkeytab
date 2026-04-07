import type { CellRendererProps } from './types.ts';
import type { DateFieldOptions } from '@monkeytab/core';
import { useI18n } from '../../i18n/index.ts';
import { useSettings } from '../../hooks/useTableData.ts';

/** Parse a YYYY-MM-DD string into parts without timezone conversion */
function parseDateParts(s: string): { year: number; month: number; day: number } | null {
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), month: parseInt(match[2], 10), day: parseInt(match[3], 10) };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => n.toString().padStart(2, '0');

function formatDateParts(parts: { year: number; month: number; day: number }, dateFormat: string): string {
  const { year, month, day } = parts;
  switch (dateFormat) {
    case 'YYYY-MM-DD':
      return `${year}-${pad(month)}-${pad(day)}`;
    case 'MM/DD/YYYY':
      return `${pad(month)}/${pad(day)}/${year}`;
    case 'DD/MM/YYYY':
      return `${pad(day)}/${pad(month)}/${year}`;
    case 'MMM D, YYYY':
      return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
    case 'D MMM YYYY':
      return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
    default:
      return `${year}-${pad(month)}-${pad(day)}`;
  }
}

// Format time from an ISO datetime string (the time portion after T)
function formatTimePart(s: string, use24Hour: boolean): string | null {
  const match = s.match(/T(\d{2}):(\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (use24Hour) {
    return `${pad(hours)}:${pad(minutes)}`;
  }
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${pad(minutes)} ${period}`;
}

/** Relative time formatting using Intl.RelativeTimeFormat */
function formatRelativeTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const absDiffMs = Math.abs(diffMs);

  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
    { unit: 'year', ms: 365.25 * 24 * 60 * 60 * 1000 },
    { unit: 'month', ms: 30.44 * 24 * 60 * 60 * 1000 },
    { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
    { unit: 'day', ms: 24 * 60 * 60 * 1000 },
    { unit: 'hour', ms: 60 * 60 * 1000 },
    { unit: 'minute', ms: 60 * 1000 },
  ];

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const { unit, ms } of units) {
    if (absDiffMs >= ms) {
      const value = Math.round(diffMs / ms);
      return rtf.format(value, unit);
    }
  }
  return rtf.format(0, 'second');
}

export function DateRenderer({ value, field }: CellRendererProps) {
  const { t, formatDate, locale } = useI18n();
  const { data: settings } = useSettings();
  const options = field.options as DateFieldOptions | undefined;
  const format = options?.format ?? 'date';
  const dateFormat = options?.dateFormat;
  const includeTime = options?.includeTime ?? false;
  const use24Hour = options?.use24Hour ?? false;
  const dateDisplayFormat = settings?.dateDisplayFormat ?? 'iso';

  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  const s = String(value);
  const parts = parseDateParts(s);
  if (!parts) {
    return <span style={{ color: '#9ca3af' }}>{t('renderer.date.invalid')}</span>;
  }

  let formatted: string;

  // If field has explicit dateFormat, always use manual formatting
  // Otherwise, respect the global dateDisplayFormat setting
  if (dateFormat) {
    formatted = formatDateParts(parts, dateFormat);
  } else if (dateDisplayFormat === 'locale') {
    // Use Intl.DateTimeFormat via the i18n hook
    const dateObj = new Date(parts.year, parts.month - 1, parts.day);
    const dateOpts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    formatted = formatDate(dateObj, dateOpts);
  } else if (dateDisplayFormat === 'relative') {
    return (
      <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {formatRelativeTime(s, locale)}
      </span>
    );
  } else {
    // 'iso' or default
    formatted = formatDateParts(parts, 'YYYY-MM-DD');
  }

  if (format === 'datetime' || includeTime) {
    const timePart = formatTimePart(s, use24Hour);
    if (timePart) {
      formatted = `${formatted} ${timePart}`;
    }
  } else if (format === 'time') {
    const timePart = formatTimePart(s, use24Hour);
    if (timePart) {
      formatted = timePart;
    }
  }

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {formatted}
    </span>
  );
}
