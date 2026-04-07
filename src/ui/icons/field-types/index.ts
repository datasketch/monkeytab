/**
 * Field Type Icons
 *
 * Each icon is a raw .svg file in this directory. Designers can edit them
 * directly with any SVG tool. Vite's ?raw import inlines them at build time.
 *
 * All SVGs should be 16x16, use stroke="currentColor" so they inherit the
 * parent text color, and use stroke-width="1.5" for consistency.
 */

import type { FieldType } from '@monkeytab/core';

// @ts-ignore: Vite ?raw import
import textSvg from './text.svg?raw';
// @ts-ignore: Vite ?raw import
import numberSvg from './number.svg?raw';
// @ts-ignore: Vite ?raw import
import booleanSvg from './boolean.svg?raw';
// @ts-ignore: Vite ?raw import
import dateSvg from './date.svg?raw';
// @ts-ignore: Vite ?raw import
import singleSelectSvg from './single-select.svg?raw';
// @ts-ignore: Vite ?raw import
import multiSelectSvg from './multi-select.svg?raw';
// @ts-ignore: Vite ?raw import
import attachmentSvg from './attachment.svg?raw';
// @ts-ignore: Vite ?raw import
import imageSvg from './image.svg?raw';
// @ts-ignore: Vite ?raw import
import audioSvg from './audio.svg?raw';
// @ts-ignore: Vite ?raw import
import videoSvg from './video.svg?raw';
// @ts-ignore: Vite ?raw import
import emailSvg from './email.svg?raw';
// @ts-ignore: Vite ?raw import
import urlSvg from './url.svg?raw';
// @ts-ignore: Vite ?raw import
import phoneSvg from './phone.svg?raw';
// @ts-ignore: Vite ?raw import
import colorSvg from './color.svg?raw';
// @ts-ignore: Vite ?raw import
import ratingSvg from './rating.svg?raw';
// @ts-ignore: Vite ?raw import
import computedSvg from './computed.svg?raw';

export const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  Text: textSvg,
  Number: numberSvg,
  Boolean: booleanSvg,
  Date: dateSvg,
  SingleSelect: singleSelectSvg,
  MultiSelect: multiSelectSvg,
  Attachment: attachmentSvg,
  Image: imageSvg,
  Audio: audioSvg,
  Video: videoSvg,
  Email: emailSvg,
  URL: urlSvg,
  Phone: phoneSvg,
  Color: colorSvg,
  Rating: ratingSvg,
  Computed: computedSvg,
};

/**
 * Get the raw SVG string for a field type.
 * Returns undefined for unknown types.
 */
export function getFieldTypeIconSvg(type: FieldType): string | undefined {
  return FIELD_TYPE_ICONS[type];
}
