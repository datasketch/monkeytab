import type {
  FieldType,
  FieldOptions,
  FieldTypeOptionsMap,
  TextFieldOptions,
  NumberFieldOptions,
  BooleanFieldOptions,
  DateFieldOptions,
  SingleSelectFieldOptions,
  MultiSelectFieldOptions,
  AttachmentFieldOptions,
  ImageFieldOptions,
  AudioFieldOptions,
  VideoFieldOptions,
  ColorFieldOptions,
  RatingFieldOptions,
} from '@monkeytab/core';

/**
 * Field type definition with metadata, defaults, and options schema.
 * No React dependency — stores type metadata only, not components.
 * Components are stored separately in ComponentRegistry.
 */
export interface FieldTypeDefinition<T extends FieldType = FieldType> {
  type: T;
  label: string;
  description: string;
  icon: string; // SVG filename in packages/ui/src/icons/field-types/
  category: 'basic' | 'advanced' | 'relation' | 'computed';
  defaultOptions: FieldTypeOptionsMap[T];
  optionsSchema: FieldOptionSchema[];
  supportsSort: boolean;
  supportsFilter: boolean;
  supportsGroup: boolean;
}

/**
 * Schema for a single option in a field type's configuration
 */
export interface FieldOptionSchema {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'options-list';
  defaultValue?: unknown;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

/**
 * Registry for field type metadata — labels, icons, categories, options schemas.
 * Does NOT store renderers/editors — those live in ComponentRegistry.
 */
class FieldTypeRegistry {
  private fieldTypes = new Map<FieldType, FieldTypeDefinition>();

  /**
   * Register a field type with its full definition
   */
  registerFieldType<T extends FieldType>(definition: FieldTypeDefinition<T>): void {
    this.fieldTypes.set(definition.type, definition as FieldTypeDefinition);
  }

  /**
   * Get the full definition for a field type
   */
  getDefinition(fieldType: FieldType): FieldTypeDefinition | undefined {
    return this.fieldTypes.get(fieldType);
  }

  /**
   * Get all registered field type definitions
   */
  getAllDefinitions(): FieldTypeDefinition[] {
    return Array.from(this.fieldTypes.values());
  }

  /**
   * Get field types by category
   */
  getByCategory(category: FieldTypeDefinition['category']): FieldTypeDefinition[] {
    return this.getAllDefinitions().filter((def) => def.category === category);
  }

  /**
   * Get default options for a field type
   */
  getDefaultOptions<T extends FieldType>(fieldType: T): FieldTypeOptionsMap[T] | undefined {
    const definition = this.fieldTypes.get(fieldType);
    return definition?.defaultOptions as FieldTypeOptionsMap[T] | undefined;
  }

  /**
   * Get the options schema for a field type
   */
  getOptionsSchema(fieldType: FieldType): FieldOptionSchema[] {
    return this.fieldTypes.get(fieldType)?.optionsSchema ?? [];
  }

  /**
   * Check if a field type supports a capability
   */
  supportsCapability(
    fieldType: FieldType,
    capability: 'sort' | 'filter' | 'group'
  ): boolean {
    const definition = this.fieldTypes.get(fieldType);
    if (!definition) return false;
    switch (capability) {
      case 'sort':
        return definition.supportsSort;
      case 'filter':
        return definition.supportsFilter;
      case 'group':
        return definition.supportsGroup;
    }
  }

  /**
   * Get all registered field types
   */
  getRegisteredTypes(): FieldType[] {
    return Array.from(this.fieldTypes.keys());
  }

  /**
   * Validate options against the schema for a field type
   */
  validateOptions(fieldType: FieldType, options: FieldOptions): string[] {
    const schema = this.getOptionsSchema(fieldType);
    const errors: string[] = [];

    for (const field of schema) {
      if (field.required && !(field.key in (options as Record<string, unknown>))) {
        errors.push(`Missing required option: ${field.key}`);
      }
    }

    return errors;
  }
}

// Singleton instance
export const fieldTypeRegistry = new FieldTypeRegistry();

// =============================================================================
// Default Field Type Definitions
// =============================================================================

export const TEXT_FIELD_DEFINITION: FieldTypeDefinition<'Text'> = {
  type: 'Text',
  label: 'Text',
  description: 'Single line or multi-line text',
  icon: 'text',
  category: 'basic',
  defaultOptions: {
    maxLength: undefined,
    multiline: false,
    placeholder: '',
    richText: false,
  },
  optionsSchema: [
    {
      key: 'multiline',
      label: 'Long Text',
      description: 'Allow multiple lines of text with expanded editor',
      type: 'boolean',
      defaultValue: false,
    },
    {
      key: 'richText',
      label: 'Rich Text (Markdown)',
      description: 'Enable markdown formatting (**bold**, *italic*, `code`, [links](url))',
      type: 'boolean',
      defaultValue: false,
    },
    {
      key: 'maxLength',
      label: 'Max Length',
      description: 'Maximum number of characters allowed',
      type: 'number',
      min: 1,
      max: 100000,
    },
    {
      key: 'placeholder',
      label: 'Placeholder',
      description: 'Placeholder text when empty',
      type: 'text',
    },
  ],
  supportsSort: true,
  supportsFilter: true,
  supportsGroup: true,
};

export const NUMBER_FIELD_DEFINITION: FieldTypeDefinition<'Number'> = {
  type: 'Number',
  label: 'Number',
  description: 'Numeric values with optional formatting',
  icon: 'number',
  category: 'basic',
  defaultOptions: {
    precision: 0,
    format: 'decimal',
    thousandsSeparator: true,
  },
  optionsSchema: [
    {
      key: 'precision',
      label: 'Decimal Places',
      description: 'Number of decimal places to display',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 10,
    },
    {
      key: 'format',
      label: 'Format',
      description: 'How to display the number',
      type: 'select',
      defaultValue: 'decimal',
      options: [
        { value: 'decimal', label: 'Decimal (1,234.56)' },
        { value: 'percentage', label: 'Percentage (12.34%)' },
        { value: 'currency', label: 'Currency ($1,234.56)' },
      ],
    },
    {
      key: 'currencySymbol',
      label: 'Currency Symbol',
      description: 'Symbol to display for currency format',
      type: 'text',
      defaultValue: '$',
    },
    {
      key: 'thousandsSeparator',
      label: 'Thousands Separator',
      description: 'Show comma separators for large numbers',
      type: 'boolean',
      defaultValue: true,
    },
    {
      key: 'min',
      label: 'Minimum Value',
      description: 'Minimum allowed value',
      type: 'number',
    },
    {
      key: 'max',
      label: 'Maximum Value',
      description: 'Maximum allowed value',
      type: 'number',
    },
  ],
  supportsSort: true,
  supportsFilter: true,
  supportsGroup: false,
};

export const BOOLEAN_FIELD_DEFINITION: FieldTypeDefinition<'Boolean'> = {
  type: 'Boolean',
  label: 'Checkbox',
  description: 'True/false checkbox field',
  icon: 'boolean',
  category: 'basic',
  defaultOptions: {
    displayAs: 'checkbox',
    trueLabel: 'Yes',
    falseLabel: 'No',
  },
  optionsSchema: [
    {
      key: 'displayAs',
      label: 'Display As',
      description: 'How to display the checkbox',
      type: 'select',
      defaultValue: 'checkbox',
      options: [
        { value: 'checkbox', label: 'Checkbox' },
        { value: 'toggle', label: 'Toggle Switch' },
        { value: 'yesno', label: 'Yes/No Text' },
      ],
    },
    {
      key: 'trueLabel',
      label: 'True Label',
      description: 'Label for true value (Yes/No mode)',
      type: 'text',
      defaultValue: 'Yes',
    },
    {
      key: 'falseLabel',
      label: 'False Label',
      description: 'Label for false value (Yes/No mode)',
      type: 'text',
      defaultValue: 'No',
    },
  ],
  supportsSort: true,
  supportsFilter: true,
  supportsGroup: true,
};

export const DATE_FIELD_DEFINITION: FieldTypeDefinition<'Date'> = {
  type: 'Date',
  label: 'Date',
  description: 'Date with optional time',
  icon: 'date',
  category: 'basic',
  defaultOptions: {
    format: 'date',
    dateFormat: 'YYYY-MM-DD',
    includeTime: false,
    use24Hour: false,
  },
  optionsSchema: [
    {
      key: 'format',
      label: 'Type',
      description: 'What to capture',
      type: 'select',
      defaultValue: 'date',
      options: [
        { value: 'date', label: 'Date only' },
        { value: 'datetime', label: 'Date and Time' },
        { value: 'time', label: 'Time only' },
      ],
    },
    {
      key: 'dateFormat',
      label: 'Date Format',
      description: 'How to display the date',
      type: 'select',
      defaultValue: 'YYYY-MM-DD',
      options: [
        { value: 'YYYY-MM-DD', label: '2024-01-15' },
        { value: 'MM/DD/YYYY', label: '01/15/2024' },
        { value: 'DD/MM/YYYY', label: '15/01/2024' },
        { value: 'MMM D, YYYY', label: 'Jan 15, 2024' },
        { value: 'D MMM YYYY', label: '15 Jan 2024' },
      ],
    },
    {
      key: 'includeTime',
      label: 'Include Time',
      description: 'Show time alongside date',
      type: 'boolean',
      defaultValue: false,
    },
    {
      key: 'use24Hour',
      label: '24-Hour Format',
      description: 'Use 24-hour time format',
      type: 'boolean',
      defaultValue: false,
    },
  ],
  supportsSort: true,
  supportsFilter: true,
  supportsGroup: true,
};

export const SINGLE_SELECT_FIELD_DEFINITION: FieldTypeDefinition<'SingleSelect'> = {
  type: 'SingleSelect',
  label: 'Single Select',
  description: 'Choose one option from a list',
  icon: 'single-select',
  category: 'basic',
  defaultOptions: {
    options: [],
  },
  optionsSchema: [
    {
      key: 'options',
      label: 'Options',
      description: 'Available choices for this field',
      type: 'options-list',
      required: true,
    },
  ],
  supportsSort: true,
  supportsFilter: true,
  supportsGroup: true,
};

export const MULTI_SELECT_FIELD_DEFINITION: FieldTypeDefinition<'MultiSelect'> = {
  type: 'MultiSelect',
  label: 'Multi Select',
  description: 'Choose multiple options from a list',
  icon: 'multi-select',
  category: 'basic',
  defaultOptions: {
    options: [],
    maxSelections: undefined,
  },
  optionsSchema: [
    {
      key: 'options',
      label: 'Options',
      description: 'Available choices for this field',
      type: 'options-list',
      required: true,
    },
    {
      key: 'maxSelections',
      label: 'Max Selections',
      description: 'Maximum number of options that can be selected',
      type: 'number',
      min: 1,
    },
  ],
  supportsSort: false,
  supportsFilter: true,
  supportsGroup: true,
};

export const ATTACHMENT_FIELD_DEFINITION: FieldTypeDefinition<'Attachment'> = {
  type: 'Attachment',
  label: 'Attachment',
  description: 'Upload files and images',
  icon: 'attachment',
  category: 'advanced',
  defaultOptions: {
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: undefined,
  },
  optionsSchema: [
    {
      key: 'maxFiles',
      label: 'Max Files',
      description: 'Maximum number of files allowed',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 100,
    },
    {
      key: 'maxFileSize',
      label: 'Max File Size (bytes)',
      description: 'Maximum size per file in bytes',
      type: 'number',
      defaultValue: 10 * 1024 * 1024,
    },
    {
      key: 'allowedTypes',
      label: 'Allowed Types',
      description: 'Comma-separated list of allowed file extensions (empty = all)',
      type: 'text',
    },
  ],
  supportsSort: false,
  supportsFilter: false,
  supportsGroup: false,
};

export const IMAGE_FIELD_DEFINITION: FieldTypeDefinition<'Image'> = {
  type: 'Image',
  label: 'Image',
  description: 'Upload and display images',
  icon: 'image',
  category: 'advanced',
  defaultOptions: {
    maxImages: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    displaySize: 'medium',
  },
  optionsSchema: [
    {
      key: 'maxImages',
      label: 'Max Images',
      description: 'Maximum number of images allowed',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 100,
    },
    {
      key: 'maxFileSize',
      label: 'Max File Size (bytes)',
      description: 'Maximum size per image in bytes',
      type: 'number',
      defaultValue: 10 * 1024 * 1024,
    },
    {
      key: 'displaySize',
      label: 'Thumbnail Size',
      description: 'Size of image thumbnails in the grid',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { value: 'small', label: 'Small (32px)' },
        { value: 'medium', label: 'Medium (48px)' },
        { value: 'large', label: 'Large (64px)' },
      ],
    },
  ],
  supportsSort: false,
  supportsFilter: false,
  supportsGroup: false,
};

export const AUDIO_FIELD_DEFINITION: FieldTypeDefinition<'Audio'> = {
  type: 'Audio',
  label: 'Audio',
  description: 'Upload and play audio files',
  icon: 'audio',
  category: 'advanced',
  defaultOptions: {
    maxFiles: 10,
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  optionsSchema: [
    {
      key: 'maxFiles',
      label: 'Max Files',
      description: 'Maximum number of audio files allowed',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 100,
    },
    {
      key: 'maxFileSize',
      label: 'Max File Size (bytes)',
      description: 'Maximum size per audio file in bytes',
      type: 'number',
      defaultValue: 50 * 1024 * 1024,
    },
  ],
  supportsSort: false,
  supportsFilter: false,
  supportsGroup: false,
};

export const EMAIL_FIELD_DEFINITION: FieldTypeDefinition<'Email'> = {
  type: 'Email',
  label: 'Email',
  description: 'Email address with clickable mailto link',
  icon: 'email',
  category: 'basic',
  defaultOptions: {},
  optionsSchema: [
    {
      key: 'placeholder',
      label: 'Placeholder',
      description: 'Placeholder text when empty',
      type: 'text',
      defaultValue: 'name@example.com',
    },
  ],
  supportsSort: true,
  supportsFilter: true,
  supportsGroup: false,
};

export const URL_FIELD_DEFINITION: FieldTypeDefinition<'URL'> = {
  type: 'URL',
  label: 'URL',
  description: 'Web link that opens in a new tab',
  icon: 'url',
  category: 'basic',
  defaultOptions: {},
  optionsSchema: [
    {
      key: 'placeholder',
      label: 'Placeholder',
      description: 'Placeholder text when empty',
      type: 'text',
      defaultValue: 'https://example.com',
    },
  ],
  supportsSort: true,
  supportsFilter: true,
  supportsGroup: false,
};

export const PHONE_FIELD_DEFINITION: FieldTypeDefinition<'Phone'> = {
  type: 'Phone',
  label: 'Phone',
  description: 'Phone number with clickable tel link',
  icon: 'phone',
  category: 'basic',
  defaultOptions: {},
  optionsSchema: [
    {
      key: 'placeholder',
      label: 'Placeholder',
      description: 'Placeholder text when empty',
      type: 'text',
      defaultValue: '+1 (555) 000-0000',
    },
  ],
  supportsSort: true,
  supportsFilter: true,
  supportsGroup: false,
};

export const VIDEO_FIELD_DEFINITION: FieldTypeDefinition<'Video'> = {
  type: 'Video',
  label: 'Video',
  description: 'Upload and play video files',
  icon: 'video',
  category: 'advanced',
  defaultOptions: {
    maxFiles: 10,
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
  optionsSchema: [
    {
      key: 'maxFiles',
      label: 'Max Files',
      description: 'Maximum number of video files allowed',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 100,
    },
    {
      key: 'maxFileSize',
      label: 'Max File Size (bytes)',
      description: 'Maximum size per video file in bytes',
      type: 'number',
      defaultValue: 100 * 1024 * 1024,
    },
  ],
  supportsSort: false,
  supportsFilter: false,
  supportsGroup: false,
};

export const COLOR_FIELD_DEFINITION: FieldTypeDefinition<'Color'> = {
  type: 'Color',
  label: 'Color',
  description: 'Color value with swatch preview',
  icon: 'color',
  category: 'advanced',
  defaultOptions: {
    format: 'hex',
  },
  optionsSchema: [
    {
      key: 'format',
      label: 'Format',
      description: 'Color format',
      type: 'select',
      defaultValue: 'hex',
      options: [
        { value: 'hex', label: 'Hex (#ff0000)' },
        { value: 'rgb', label: 'RGB (rgb(255,0,0))' },
        { value: 'hsl', label: 'HSL (hsl(0,100%,50%))' },
      ],
    },
  ],
  supportsSort: true,
  supportsFilter: true,
  supportsGroup: true,
};

export const RATING_FIELD_DEFINITION: FieldTypeDefinition<'Rating'> = {
  type: 'Rating',
  label: 'Rating',
  description: 'Star rating from 0 to max',
  icon: 'rating',
  category: 'advanced',
  defaultOptions: {
    max: 5,
    icon: 'star',
  },
  optionsSchema: [
    {
      key: 'max',
      label: 'Maximum',
      description: 'Maximum rating value',
      type: 'number',
      defaultValue: 5,
      min: 1,
      max: 10,
    },
    {
      key: 'icon',
      label: 'Icon',
      description: 'Icon style for the rating',
      type: 'select',
      defaultValue: 'star',
      options: [
        { value: 'star', label: 'Stars' },
        { value: 'heart', label: 'Hearts' },
        { value: 'circle', label: 'Circles' },
      ],
    },
  ],
  supportsSort: true,
  supportsFilter: true,
  supportsGroup: false,
};

// All default field type definitions
export const DEFAULT_FIELD_TYPE_DEFINITIONS: FieldTypeDefinition[] = [
  TEXT_FIELD_DEFINITION,
  NUMBER_FIELD_DEFINITION,
  BOOLEAN_FIELD_DEFINITION,
  DATE_FIELD_DEFINITION,
  SINGLE_SELECT_FIELD_DEFINITION,
  MULTI_SELECT_FIELD_DEFINITION,
  ATTACHMENT_FIELD_DEFINITION,
  IMAGE_FIELD_DEFINITION,
  AUDIO_FIELD_DEFINITION,
  VIDEO_FIELD_DEFINITION,
  COLOR_FIELD_DEFINITION,
  RATING_FIELD_DEFINITION,
  EMAIL_FIELD_DEFINITION,
  URL_FIELD_DEFINITION,
  PHONE_FIELD_DEFINITION,
];
