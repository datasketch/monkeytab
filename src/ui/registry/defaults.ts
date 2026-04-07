import { componentRegistry } from './ComponentRegistry.ts';
import {
  fieldTypeRegistry,
  DEFAULT_FIELD_TYPE_DEFINITIONS,
} from './FieldTypeRegistry.ts';
import {
  TextRenderer,
  NumberRenderer,
  BoolRenderer,
  DateRenderer,
  SelectRenderer,
  MultiSelectRenderer,
  AttachmentRenderer,
  ImageRenderer,
  ColorRenderer,
  RatingRenderer,
  EmailRenderer,
  URLRenderer,
  PhoneRenderer,
} from '../components/renderers/index.ts';
import {
  TextEditor,
  NumberEditor,
  BoolEditor,
  DateEditor,
  SelectEditor,
  MultiSelectEditor,
  AttachmentEditor,
  ImageEditor,
  ColorEditor,
  RatingEditor,
} from '../components/editors/index.ts';

let initialized = false;

/**
 * Register all default field types, renderers, and editors.
 * Idempotent — safe to call multiple times.
 */
export function registerDefaults(): void {
  if (initialized) return;
  initialized = true;
  // Register field type definitions
  for (const definition of DEFAULT_FIELD_TYPE_DEFINITIONS) {
    fieldTypeRegistry.registerFieldType(definition);
  }

  // Register renderers and editors in ComponentRegistry (used by GridCell)
  componentRegistry.register('Text', TextRenderer, TextEditor);
  componentRegistry.register('Number', NumberRenderer, NumberEditor);
  componentRegistry.register('Boolean', BoolRenderer, BoolEditor);
  componentRegistry.register('Date', DateRenderer, DateEditor);
  componentRegistry.register('SingleSelect', SelectRenderer, SelectEditor);
  componentRegistry.register('MultiSelect', MultiSelectRenderer, MultiSelectEditor);
  componentRegistry.register('Attachment', AttachmentRenderer, AttachmentEditor);
  componentRegistry.register('Image', ImageRenderer, ImageEditor);
  componentRegistry.register('Color', ColorRenderer, ColorEditor);
  componentRegistry.register('Rating', RatingRenderer, RatingEditor);
  componentRegistry.register('Email', EmailRenderer, TextEditor);
  componentRegistry.register('URL', URLRenderer, TextEditor);
  componentRegistry.register('Phone', PhoneRenderer, TextEditor);
}
