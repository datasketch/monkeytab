import type { CellRendererProps } from './types.ts';
import type { BooleanFieldOptions } from '@monkeytab/core';
import { useI18n } from '../../i18n/index.ts';

export function BoolRenderer({ value, field }: CellRendererProps) {
  const { t } = useI18n();
  const options = field.options as BooleanFieldOptions | undefined;
  const displayAs = options?.displayAs ?? 'checkbox';
  const trueLabel = options?.trueLabel ?? t('bool.yes');
  const falseLabel = options?.falseLabel ?? t('bool.no');

  if (value === null || value === undefined) {
    return <span style={{ color: '#9ca3af' }}>{t('grid.empty')}</span>;
  }

  const boolValue = Boolean(value);

  // Icon display — shows custom images for true/false
  if (displayAs === 'icon') {
    const trueColor = options?.trueColor ?? '#22c55e';
    const falseColor = options?.falseColor ?? '#d1d5db';
    const trueIcon = options?.trueIcon;
    const falseIcon = options?.falseIcon;
    const icon = boolValue ? trueIcon : falseIcon;
    const color = boolValue ? trueColor : falseColor;

    if (icon) {
      return (
        <img
          src={icon}
          alt={boolValue ? (options?.trueLabel ?? 'true') : (options?.falseLabel ?? 'false')}
          style={{ width: '20px', height: '20px', objectFit: 'contain', opacity: boolValue ? 1 : 0.4 }}
        />
      );
    }
    // Fallback: colored dot when no icon URLs provided
    return (
      <span style={{
        display: 'inline-block',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: color,
      }} />
    );
  }

  // Yes/No text display
  if (displayAs === 'yesno') {
    return (
      <span
        style={{
          color: boolValue ? '#166534' : '#991b1b',
          fontWeight: 500,
        }}
      >
        {boolValue ? trueLabel : falseLabel}
      </span>
    );
  }

  // Toggle switch display
  if (displayAs === 'toggle') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          background: boolValue ? '#22c55e' : '#d1d5db',
          padding: '2px',
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            transform: boolValue ? 'translateX(16px)' : 'translateX(0)',
            transition: 'transform 0.2s',
          }}
        />
      </span>
    );
  }

  // Default checkbox display
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        background: boolValue ? '#dcfce7' : '#fee2e2',
        color: boolValue ? '#166534' : '#991b1b',
        fontSize: '12px',
      }}
    >
      {boolValue ? '✓' : '✗'}
    </span>
  );
}
