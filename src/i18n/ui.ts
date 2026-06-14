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
import { localizeSegment, canonicalSegment, isItemRoot, localizeItemSlug, canonicalItemSlug, type Loc } from './segments';

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

/**
 * Build a localized URL from a canonical (English) path.
 *   '/story/'  + 'sk' → '/sk/pribeh/'
 *   '/trips/ikigai-experience/' + 'sk' → '/sk/plavby/ikigai-experience/'
 *   '/about/'  + 'en' → '/about/'
 * Known section/page segments are translated via the segment registry; unknown
 * segments (collection item slugs), query strings and hashes pass through.
 */
export function localizePath(path: string, locale: Locale): string {
  const clean = path.replace(/^\/(it|es|fr|sk)(\/|$)/, '/');
  const m = clean.match(/^([^?#]*)([?#].*)?$/);
  const pathname = m?.[1] ?? clean;
  const tail = m?.[2] ?? '';
  const segs = pathname.split('/'); // EN-canonical input: ['', 'activities', 'freediving', '']
  const out = segs.map((seg) => (seg ? localizeSegment(seg, locale) : seg));
  // localize the collection ITEM slug too (not just the section root)
  if (isItemRoot(segs[1]) && segs[2]) out[2] = localizeItemSlug(segs[1], segs[2], locale as Loc);
  else if (segs[1] === 'panama' && segs[2] === 'san-blas' && segs[3]) out[3] = localizeItemSlug('landings', segs[3], locale as Loc);
  const translated = out.join('/');
  const prefixed = locale === defaultLocale ? translated : `/${locale}${translated}`;
  return prefixed + tail;
}

/**
 * Reverse of localizePath: turn a localized URL back into its canonical
 * (English) path so it can be re-localized into another locale. Used by the
 * language switcher. '/fr/a-propos/' (fromLocale 'fr') → '/about/'.
 */
export function canonicalizePath(path: string, fromLocale: Locale): string {
  const stripped = path.replace(/^\/(it|es|fr|sk)(\/|$)/, '/');
  const m = stripped.match(/^([^?#]*)([?#].*)?$/);
  const pathname = m?.[1] ?? stripped;
  const tail = m?.[2] ?? '';
  const segs = pathname.split('/'); // localized input: ['', 'attivita', 'apnea', '']
  const out = segs.map((seg) => (seg ? canonicalSegment(seg, fromLocale) : seg));
  const canonRoot = segs[1] ? canonicalSegment(segs[1], fromLocale) : '';
  if (isItemRoot(canonRoot) && segs[2]) out[2] = canonicalItemSlug(canonRoot, segs[2], fromLocale as Loc);
  else if (segs[1] === 'panama' && segs[2] === 'san-blas' && segs[3]) out[3] = canonicalItemSlug('landings', segs[3], fromLocale as Loc);
  return out.join('/') + tail;
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split('/');
  return (locales as readonly string[]).includes(first) ? (first as Locale) : defaultLocale;
}
