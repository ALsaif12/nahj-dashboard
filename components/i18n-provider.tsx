'use client';

import * as React from 'react';
import { type Locale, type TranslationKey, translate, translatePlural, LOCALE_COOKIE } from '@/lib/i18n';

interface I18nContext {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dir: 'ltr' | 'rtl';
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  tPlural: (
    singularKey: TranslationKey,
    pluralKey: TranslationKey,
    count: number,
    vars?: Record<string, string | number>,
  ) => string;
}

const Ctx = React.createContext<I18nContext | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);

  // Keep <html dir> and <html lang> in sync with the active locale.
  React.useEffect(() => {
    document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    // Persist via cookie; readable on the server for SSR consistency.
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }, []);

  const value: I18nContext = React.useMemo(() => ({
    locale,
    setLocale,
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    t: (key, vars) => translate(locale, key, vars),
    tPlural: (s, p, n, v) => translatePlural(locale, s, p, n, v),
  }), [locale, setLocale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nContext {
  const c = React.useContext(Ctx);
  if (!c) throw new Error('useI18n must be used inside <I18nProvider>');
  return c;
}

/** Shortcut hook returning just the t function. */
export function useT() {
  return useI18n().t;
}
