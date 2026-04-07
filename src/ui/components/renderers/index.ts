import type { JSX } from 'react';
import type { FieldType } from '@monkeytab/core';
import type { CellRendererProps } from './types.ts';
import { TextRenderer } from './TextRenderer.tsx';
import { NumberRenderer } from './NumberRenderer.tsx';
import { BoolRenderer } from './BoolRenderer.tsx';
import { DateRenderer } from './DateRenderer.tsx';
import { SelectRenderer } from './SelectRenderer.tsx';
import { MultiSelectRenderer } from './MultiSelectRenderer.tsx';
import { AttachmentRenderer } from './AttachmentRenderer.tsx';
import { ImageRenderer } from './ImageRenderer.tsx';
import { EmailRenderer, URLRenderer, PhoneRenderer } from './LinkRenderers.tsx';
import { ColorRenderer } from './ColorRenderer.tsx';
import { RatingRenderer } from './RatingRenderer.tsx';

export type { CellRendererProps } from './types.ts';

type CellRenderer = (props: CellRendererProps) => JSX.Element;

const renderers: Partial<Record<FieldType, CellRenderer>> = {
  Text: TextRenderer,
  Number: NumberRenderer,
  Boolean: BoolRenderer,
  Date: DateRenderer,
  SingleSelect: SelectRenderer,
  MultiSelect: MultiSelectRenderer,
  Attachment: AttachmentRenderer,
  Image: ImageRenderer,
  Email: EmailRenderer,
  URL: URLRenderer,
  Phone: PhoneRenderer,
  Color: ColorRenderer,
  Rating: RatingRenderer,
};

export function getRenderer(fieldType: FieldType): CellRenderer {
  return renderers[fieldType] ?? TextRenderer;
}

export {
  TextRenderer,
  NumberRenderer,
  BoolRenderer,
  DateRenderer,
  SelectRenderer,
  MultiSelectRenderer,
  AttachmentRenderer,
  ImageRenderer,
  EmailRenderer,
  URLRenderer,
  PhoneRenderer,
  ColorRenderer,
  RatingRenderer,
};
