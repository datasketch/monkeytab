import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { I18nStrings } from './strings.ts';
import { en } from './en.ts';
import { es } from './es.ts';
import { useSettings } from '../hooks/useTableData.ts';

// ---------------------------------------------------------------------------
// Language registry — add imports here as new translations are added
// ---------------------------------------------------------------------------
const LANGUAGE_MAP: Record<string, I18nStrings> = {
  en,
  es,
};

function getStringsForLanguage(language: string): I18nStrings {
  return LANGUAGE_MAP[language] ?? LANGUAGE_MAP.en ?? en;
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
export interface I18nContextValue {
  /** Current BCP 47 locale (e.g. 'en-US', 'es-CO') */
  locale: string;
  /** The resolved string catalog */
  strings: I18nStrings;
  /** Translate a key, with optional {param} interpolation */
  t: (key: keyof I18nStrings | (string & {}), params?: Record<string, string | number>) => string;
  /** Locale-aware number formatting */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** Locale-aware date formatting */
  formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  /** Locale-aware currency formatting */
  formatCurrency: (value: number, currency?: string, display?: Intl.NumberFormatOptions['currencyDisplay']) => string;
}

// ---------------------------------------------------------------------------
// Interpolation helper
// ---------------------------------------------------------------------------
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = params[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

// ---------------------------------------------------------------------------
// Build a context value from locale + strings
// ---------------------------------------------------------------------------
function buildContextValue(
  locale: string,
  strings: I18nStrings,
  overrides?: Partial<I18nStrings>,
): I18nContextValue {
  const merged = overrides ? { ...strings, ...overrides } : strings;

  const t = (key: keyof I18nStrings | (string & {}), params?: Record<string, string | number>): string => {
    const template = merged[key as keyof I18nStrings] ?? key;
    return interpolate(template, params);
  };

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(locale, options).format(value);
  };

  const formatDate = (value: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return merged['renderer.date.invalid'];
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  const formatCurrency = (
    value: number,
    currency: string = 'USD',
    display: Intl.NumberFormatOptions['currencyDisplay'] = 'symbol',
  ): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: display,
    }).format(value);
  };

  return { locale, strings: merged, t, formatNumber, formatDate, formatCurrency };
}

// ---------------------------------------------------------------------------
// Default context (English, en-US) — used when no provider is mounted
// ---------------------------------------------------------------------------
const defaultValue = buildContextValue('en-US', en);

const I18nCtx = createContext<I18nContextValue>(defaultValue);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export interface I18nProviderProps {
  /** Optional partial string overrides (e.g. from <MonkeyTable translations={...} />) */
  overrides?: Partial<I18nStrings>;
  children: ReactNode;
}

export function I18nProvider({ overrides, children }: I18nProviderProps) {
  const { data: settings } = useSettings();
  const locale = settings?.locale ?? 'en-US';
  const language = settings?.language ?? locale.split('-')[0];

  const value = useMemo(() => {
    const strings = getStringsForLanguage(language);
    return buildContextValue(locale, strings, overrides);
  }, [locale, language, overrides]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useI18n(): I18nContextValue {
  return useContext(I18nCtx);
}
