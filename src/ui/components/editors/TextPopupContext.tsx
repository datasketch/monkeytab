import { createContext, useContext, type ReactNode } from 'react';

export interface TextPopupSize {
  width?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
}

const TextPopupSizeContext = createContext<TextPopupSize | undefined>(undefined);

export function TextPopupSizeProvider({ value, children }: { value?: TextPopupSize; children: ReactNode }) {
  return <TextPopupSizeContext.Provider value={value}>{children}</TextPopupSizeContext.Provider>;
}

export function useTextPopupSize(): TextPopupSize | undefined {
  return useContext(TextPopupSizeContext);
}

/** Coerce a number|string CSS length to a valid style value (raw number → px). */
export function toCssLength(v: number | string | undefined): string | number | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}
