import type { FieldType } from '@monkeytab/core';
import { FIELD_TYPE_ICONS } from './field-types/index.ts';

interface FieldTypeIconProps {
  type: FieldType;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders an inline SVG icon for a field type.
 * Icons inherit the parent's text color via currentColor.
 */
export function FieldTypeIcon({ type, size = 16, className, style }: FieldTypeIconProps) {
  const svg = FIELD_TYPE_ICONS[type];
  if (!svg) return null;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
