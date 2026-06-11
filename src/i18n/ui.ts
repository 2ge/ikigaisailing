/**
 * UI strings for all 5 locales. EN is the source of truth.
 * `npm run translate` fills missing keys in it/es/fr/sk from the EN values
 * (DeepL). Hand-tuned values survive — the script only adds missing keys.
 */
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

export const ui = {
  en: {
    'site.name': 'Ikigai Sailing',
    'site.tagline': 'Mindful Sailing & Ocean Adventures',
    'nav.about': 'About',
    'nav.boat': 'Catana 47',
    'nav.trips': 'Boarding Options',
    'nav.activities': 'Activities',
    'nav.liveaboard': 'Liveaboard',
    'nav.blog': 'Blog',
    'nav.contact': 'Contact',
    'nav.reviews': 'Reviews',
    'cta.contact': 'Contact us',
    'cta.whatsapp': 'Chat on WhatsApp',
    'cta.book': 'Request to book',
    'footer.legal': 'Ikigai Sailing ASD — Via Gorlago 37 – 00135 Roma (RM) — C.F. 96511650580',
    'footer.affiliation': 'Recognized by CONI · Affiliated with MSP Italia',
  },
  it: {},
  es: {},
  fr: {},
  sk: {},
} as const satisfies Record<Locale, Record<string, string>>;

type UIKey = keyof (typeof ui)['en'];

/** Translate a UI key for a locale, falling back to EN. */
export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    const dict = ui[locale] as Partial<Record<UIKey, string>>;
    return dict[key] ?? ui[defaultLocale][key];
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
