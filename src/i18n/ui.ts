/**
 * UI strings for all 5 locales. EN (`strings.en.json`) is the source of truth.
 * `npm run translate` fills missing keys in strings.{it,es,fr,sk}.json via DeepL.
 * Hand-tuned values survive — the pipeline only adds missing keys.
 */
import en from './strings.en.json';
import it from './strings.it.json';
import es from './strings.es.json';
import fr from './strings.fr.json';
import sk from './strings.sk.json';

export const locales = ['en', 'it', 'es', 'fr', 'sk'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  it: 'Italiano',
  es: 'Español',
  fr: 'Français',
  sk: 'Slovenčina',
};

export const ui: Record<Locale, Record<string, string>> = { en, it, es, fr, sk };

export type UIKey = keyof typeof en;

/** Translate a UI key for a locale, falling back to EN. */
export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    return ui[locale][key] ?? ui[defaultLocale][key];
  };
}

/** Path helpers: '/about/' + 'it' → '/it/about/' (en stays unprefixed). */
export function localizePath(path: string, locale: Locale): string {
  const clean = path.replace(/^\/(it|es|fr|sk)(\/|$)/, '/');
  return locale === defaultLocale ? clean : `/${locale}${clean}`;
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split('/');
  return (locales as readonly string[]).includes(first) ? (first as Locale) : defaultLocale;
}
