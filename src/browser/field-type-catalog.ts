/**
 * MonkeyTable Field Type Catalog
 *
 * Machine-readable registry of all supported field types with their value shapes,
 * rendering behavior, editor behavior, and available options.
 *
 * Used for:
 * - AI agent consumption: understand what each field type accepts and renders
 * - Documentation generation: produce per-type docs
 * - Validation: verify column definitions against known types
 */

import type { FieldType } from '@monkeytab/core';

export interface FieldTypeCatalogEntry {
  /** The FieldType identifier */
  type: FieldType;
  /** Human-readable label */
  label: string;
  /** TypeScript type of the stored value */
  valueType: string;
  /** What the renderer displays in the grid cell */
  renders: string;
  /** What the editor provides for editing */
  editorDescription: string;
  /** Available option keys (from the corresponding *FieldOptions interface) */
  options: string[];
  /** Example values for this field type */
  examples: unknown[];
  /** Category for grouping in UI */
  category: 'basic' | 'select' | 'media' | 'contact' | 'special';
  /** Whether the field supports sorting */
  supportsSort: boolean;
  /** Whether the field supports filtering */
  supportsFilter: boolean;
}

export const FIELD_TYPE_CATALOG: FieldTypeCatalogEntry[] = [
  // ── Basic ──────────────────────────────────────────────────────────────────
  {
    type: 'Text',
    label: 'Text',
    valueType: 'string',
    renders: 'Plain text, truncated to cell height. With json option: formatted JSON with syntax highlighting.',
    editorDescription: 'Text input (single-line or textarea for multiline). JSON mode shows formatted editor.',
    options: ['maxLength', 'multiline', 'placeholder', 'richText', 'json'],
    examples: ['Hello world', '{"key": "value"}'],
    category: 'basic',
    supportsSort: true,
    supportsFilter: true,
  },
  {
    type: 'Number',
    label: 'Number',
    valueType: 'number',
    renders: 'Formatted number. Supports decimal, percentage (×100 + %), and currency ($) formats.',
    editorDescription: 'Numeric text input with validation.',
    options: ['precision', 'format', 'currencySymbol', 'min', 'max', 'thousandsSeparator'],
    examples: [42, 3.14, 0.85, 95000],
    category: 'basic',
    supportsSort: true,
    supportsFilter: true,
  },
  {
    type: 'Boolean',
    label: 'Boolean',
    valueType: 'boolean',
    renders: 'Checkbox icon (checked/unchecked).',
    editorDescription: 'Clickable checkbox toggle.',
    options: ['displayAs', 'trueLabel', 'falseLabel'],
    examples: [true, false],
    category: 'basic',
    supportsSort: true,
    supportsFilter: true,
  },
  {
    type: 'Date',
    label: 'Date',
    valueType: 'string (ISO 8601)',
    renders: 'Formatted date string.',
    editorDescription: 'Date picker input.',
    options: ['format', 'dateFormat', 'includeTime', 'use24Hour'],
    examples: ['2024-03-15', '2024-03-15T10:30:00Z'],
    category: 'basic',
    supportsSort: true,
    supportsFilter: true,
  },

  // ── Select ─────────────────────────────────────────────────────────────────
  {
    type: 'SingleSelect',
    label: 'Single Select',
    valueType: 'string',
    renders: 'Colored pill/badge with the selected option value.',
    editorDescription: 'Dropdown with colored option list. Supports search within options.',
    options: ['choices (array of {id, value, color})'],
    examples: ['Engineer', 'Designer'],
    category: 'select',
    supportsSort: true,
    supportsFilter: true,
  },
  {
    type: 'MultiSelect',
    label: 'Multi Select',
    valueType: 'string[]',
    renders: 'Multiple colored pills/badges.',
    editorDescription: 'Multi-select dropdown with checkboxes.',
    options: ['choices (array of {id, value, color})', 'maxSelections'],
    examples: [['TypeScript', 'React'], ['Go']],
    category: 'select',
    supportsSort: false,
    supportsFilter: true,
  },

  // ── Media ──────────────────────────────────────────────────────────────────
  {
    type: 'Image',
    label: 'Image',
    valueType: 'string | string[] | Attachment[]',
    renders: 'Thumbnail image(s) fitting the cell height. Plain URL strings accepted.',
    editorDescription: 'Image preview with URL input and file upload.',
    options: ['maxImages', 'maxFileSize', 'displaySize'],
    examples: ['https://example.com/photo.jpg'],
    category: 'media',
    supportsSort: false,
    supportsFilter: false,
  },
  {
    type: 'Attachment',
    label: 'Attachment',
    valueType: 'string | Attachment[]',
    renders: 'File icon with filename. Shows thumbnail for image attachments.',
    editorDescription: 'File upload with drag-and-drop support.',
    options: ['maxFiles', 'maxFileSize', 'allowedTypes'],
    examples: [{ id: '1', filename: 'doc.pdf', url: '/files/doc.pdf', mimeType: 'application/pdf', size: 1024 }],
    category: 'media',
    supportsSort: false,
    supportsFilter: false,
  },
  // ── Contact ────────────────────────────────────────────────────────────────
  {
    type: 'Email',
    label: 'Email',
    valueType: 'string',
    renders: 'Clickable mailto link with envelope icon.',
    editorDescription: 'Text input with email validation.',
    options: ['maxLength', 'placeholder'],
    examples: ['alice@example.com'],
    category: 'contact',
    supportsSort: true,
    supportsFilter: true,
  },
  {
    type: 'URL',
    label: 'URL',
    valueType: 'string | { url: string, label?: string }',
    renders: 'Clickable link. Plain strings show domain as text. { url, label } objects show label as clickable text.',
    editorDescription: 'URL input with optional label field. "+ Add label" button toggles labeled link mode.',
    options: ['placeholder'],
    examples: ['https://example.com', { url: 'https://example.com', label: 'Example Site' }],
    category: 'contact',
    supportsSort: true,
    supportsFilter: true,
  },
  {
    type: 'Phone',
    label: 'Phone',
    valueType: 'string',
    renders: 'Clickable tel: link with phone icon.',
    editorDescription: 'Text input for phone numbers.',
    options: ['maxLength', 'placeholder'],
    examples: ['+1-555-123-4567'],
    category: 'contact',
    supportsSort: true,
    supportsFilter: true,
  },

  // ── Special ────────────────────────────────────────────────────────────────
  {
    type: 'Color',
    label: 'Color',
    valueType: 'string',
    renders: 'Color swatch (rounded square) with hex value in monospace.',
    editorDescription: 'Color swatch preview + text input + native color picker + preset swatches grid.',
    options: ['format'],
    examples: ['#3b82f6', '#ec4899'],
    category: 'special',
    supportsSort: true,
    supportsFilter: true,
  },
  {
    type: 'Rating',
    label: 'Rating',
    valueType: 'number',
    renders: 'Row of star/heart/circle icons (filled amber + empty gray). Default max: 5.',
    editorDescription: 'Clickable icon picker with hover effect. Keyboard support (number keys).',
    options: ['max', 'icon'],
    examples: [5, 3, 0],
    category: 'special',
    supportsSort: true,
    supportsFilter: true,
  },
  {
    type: 'Computed',
    label: 'Computed',
    valueType: 'string | number (derived)',
    renders: 'Italic text on light gray background. Shows "fx: functionName(inputs)" tooltip.',
    editorDescription: 'Read-only — computed fields cannot be edited directly.',
    options: ['functionName', 'inputFieldIds', 'params'],
    examples: [],
    category: 'special',
    supportsSort: true,
    supportsFilter: true,
  },
];

/**
 * Look up a field type entry by type name.
 */
export function getFieldTypeInfo(type: FieldType): FieldTypeCatalogEntry | undefined {
  return FIELD_TYPE_CATALOG.find((entry) => entry.type === type);
}

/**
 * Get all field types in a category.
 */
export function getFieldTypesByCategory(category: FieldTypeCatalogEntry['category']): FieldTypeCatalogEntry[] {
  return FIELD_TYPE_CATALOG.filter((entry) => entry.category === category);
}

/**
 * Get a simplified map for quick AI agent consumption.
 */
export function getFieldTypeSummaryMap(): Record<string, { valueType: string; renders: string; options: string[] }> {
  const map: Record<string, { valueType: string; renders: string; options: string[] }> = {};
  for (const entry of FIELD_TYPE_CATALOG) {
    map[entry.type] = {
      valueType: entry.valueType,
      renders: entry.renders,
      options: entry.options,
    };
  }
  return map;
}
