import type { JSX } from 'react';
import type { FieldType } from '@monkeytab/core';
import type { CellEditorProps } from './types.ts';
import { TextEditor } from './TextEditor.tsx';
import { NumberEditor } from './NumberEditor.tsx';
import { BoolEditor } from './BoolEditor.tsx';
import { DateEditor } from './DateEditor.tsx';
import { SelectEditor } from './SelectEditor.tsx';
import { MultiSelectEditor } from './MultiSelectEditor.tsx';
import { AttachmentEditor } from './AttachmentEditor.tsx';
import { ImageEditor } from './ImageEditor.tsx';
import { ColorEditor } from './ColorEditor.tsx';
import { RatingEditor } from './RatingEditor.tsx';
import { URLEditor } from './URLEditor.tsx';

export type { CellEditorProps } from './types.ts';

type CellEditor = (props: CellEditorProps) => JSX.Element;

const editors: Partial<Record<FieldType, CellEditor>> = {
  Text: TextEditor,
  Number: NumberEditor,
  Boolean: BoolEditor,
  Date: DateEditor,
  SingleSelect: SelectEditor,
  MultiSelect: MultiSelectEditor,
  Attachment: AttachmentEditor,
  Image: ImageEditor,
  Email: TextEditor,
  URL: URLEditor,
  Phone: TextEditor,
  Color: ColorEditor,
  Rating: RatingEditor,
};

export function getEditor(fieldType: FieldType): CellEditor {
  return editors[fieldType] ?? TextEditor;
}

export {
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
  URLEditor,
};
