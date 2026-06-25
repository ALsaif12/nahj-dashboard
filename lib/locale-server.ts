// Server-side helper for reading the current locale from the cookie.
// Used by server components / layouts to set `dir` and pre-translate where needed.

import 'server-only';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, LOCALES, type Locale, translate, type TranslationKey } from './i18n';

export function getServerLocale(): Locale {
  const c = cookies().get(LOCALE_COOKIE)?.value;
  if (c && (LOCALES as string[]).includes(c)) return c as Locale;
  return 'en';
}

export function getServerT() {
  const locale = getServerLocale();
  return (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars);
}
