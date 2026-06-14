/**
 * Localized URL segments. Slugs are NO LONGER identical across locales:
 * each top-level page and section root has a per-locale, ASCII-safe segment
 * (e.g. story → /sk/pribeh/, trips → /sk/plavby/). Collection *item* slugs
 * stay in their canonical (English) form for stability.
 *
 * This module has no other local imports so it can be used from both the link
 * helpers (i18n/ui.ts) and the routing/resolution layer (lib/routes.ts) without
 * a circular dependency.
 */
export const LOCALES = ['en', 'it', 'es', 'fr', 'sk'] as const;
export type Loc = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Loc = 'en';

/** canonical (English) segment → localized segment per locale. */
export const SEGMENTS: Record<string, Record<Loc, string>> = {
  // dedicated + section-root pages
  about: { en: 'about', it: 'chi-siamo', es: 'sobre-nosotros', fr: 'a-propos', sk: 'o-nas' },
  ikigai: { en: 'ikigai', it: 'ikigai', es: 'ikigai', fr: 'ikigai', sk: 'ikigai' },
  story: { en: 'story', it: 'la-storia', es: 'historia', fr: 'histoire', sk: 'pribeh' },
  route: { en: 'route', it: 'la-rotta', es: 'la-ruta', fr: 'itineraire', sk: 'trasa' },
  benefits: { en: 'benefits', it: 'benefici', es: 'beneficios', fr: 'benefices', sk: 'vyhody' },
  reviews: { en: 'reviews', it: 'recensioni', es: 'opiniones', fr: 'avis', sk: 'recenzie' },
  faq: { en: 'faq', it: 'faq', es: 'faq', fr: 'faq', sk: 'faq' },
  'catana-47': { en: 'catana-47', it: 'catana-47', es: 'catana-47', fr: 'catana-47', sk: 'catana-47' },
  liveaboard: { en: 'liveaboard', it: 'vita-a-bordo', es: 'vida-a-bordo', fr: 'vie-a-bord', sk: 'zivot-na-palube' },
  // De-routed: the season content now renders at /panama/san-blas/ (see lib/routes
  // topLevelStaticPaths skip). Kept here so (a) check-routes' "every pages/*.md has a
  // SEGMENTS entry" rule passes, and (b) gen-redirects can 301 every old localized
  // season URL → /panama/san-blas/. No /season-2025-26/ route is emitted.
  'season-2025-26': {
    en: 'season-2025-26',
    it: 'stagione-2025-26',
    es: 'temporada-2025-26',
    fr: 'saison-2025-26',
    sk: 'sezona-2025-26',
  },
  contact: { en: 'contact', it: 'contatti', es: 'contacto', fr: 'contact', sk: 'kontakt' },
  terms: { en: 'terms', it: 'termini', es: 'terminos', fr: 'conditions', sk: 'podmienky' },
  cookies: { en: 'cookies', it: 'cookie', es: 'cookies', fr: 'cookies', sk: 'cookies' },
  privacy: { en: 'privacy', it: 'privacy', es: 'privacidad', fr: 'confidentialite', sk: 'sukromie' },
  // section roots with item children
  trips: { en: 'trips', it: 'imbarchi', es: 'embarques', fr: 'embarquements', sk: 'plavby' },
  activities: { en: 'activities', it: 'attivita', es: 'actividades', fr: 'activites', sk: 'aktivity' },
  blog: { en: 'blog', it: 'blog', es: 'blog', fr: 'blog', sk: 'blog' },
};

/**
 * RETIRED slugs. When you RENAME a localized segment, move its previous value
 * here so the old URL keeps 301-redirecting to the new one (no dead links after
 * a rename). Format: canonical key → locale → [old segments].
 *   e.g. trips: { sk: ['vylety'] }  after renaming sk trips 'vylety' → 'plavby'.
 * The prebuild check (scripts/check-routes.ts) rejects an alias that clashes
 * with any live segment, and gen-redirects.ts turns each into a 301.
 */
export const ALIASES: Record<string, Partial<Record<Loc, string[]>>> = {};

/** Every retired alias flattened: { canonical, locale, segment }. */
export function aliasEntries(): { canonical: string; locale: Loc; segment: string }[] {
  const out: { canonical: string; locale: Loc; segment: string }[] = [];
  for (const [canonical, byLoc] of Object.entries(ALIASES)) {
    for (const l of LOCALES) for (const segment of byLoc[l] ?? []) out.push({ canonical, locale: l, segment });
  }
  return out;
}

/** Reverse lookup: localized segment (in a given locale) → canonical segment. */
const REVERSE: Record<Loc, Record<string, string>> = Object.fromEntries(
  LOCALES.map((l) => [l, {} as Record<string, string>]),
) as Record<Loc, Record<string, string>>;
for (const [canonical, byLoc] of Object.entries(SEGMENTS)) {
  for (const l of LOCALES) REVERSE[l][byLoc[l]] = canonical;
}

/** canonical English segment → its localized form for `locale`. */
export function localizeSegment(canonical: string, locale: Loc): string {
  return SEGMENTS[canonical]?.[locale] ?? canonical;
}

/** localized segment (as seen in a URL for `locale`) → canonical English segment. */
export function canonicalSegment(localized: string, locale: Loc): string {
  return REVERSE[locale]?.[localized] ?? localized;
}

/** True if `canonical` is a known section root that has item children. */
export const SECTION_ROOTS = ['trips', 'activities', 'blog'] as const;

/**
 * Localized COLLECTION-ITEM slugs. Content files keep their canonical (English)
 * slug; only the URL is translated. Brand/proper nouns (ikigai-experience,
 * pacific-crossing, janzu, yoga, kitesurf) are intentionally omitted → they keep
 * the English slug everywhere. Items not listed here pass through unchanged.
 *   canonical English slug → per-locale localized slug.
 * Keyed by collection. landings + activities share canonical slugs and use the
 * same localized form so /activities/x and /panama/san-blas/x stay consistent.
 */
const ACTIVITY_LANDING_SLUGS: Record<string, Partial<Record<Loc, string>>> = {
  freediving: { it: 'apnea', es: 'apnea', fr: 'apnee', sk: 'freediving' },
  meditation: { it: 'meditazione', es: 'meditacion', fr: 'meditation', sk: 'meditacia' },
  diving: { it: 'immersioni', es: 'buceo', fr: 'plongee', sk: 'potapanie' },
  'sailing-training': { it: 'corso-di-vela', es: 'curso-de-vela', fr: 'cours-de-voile', sk: 'kurz-jachtingu' },
  'functional-training': { it: 'allenamento-funzionale', es: 'entrenamiento-funcional', fr: 'entrainement-fonctionnel', sk: 'funkcny-trening' },
  snorkelling: { it: 'snorkeling', es: 'snorkel', fr: 'snorkeling', sk: 'snorkeling' },
  'cooking-class': { it: 'corso-di-cucina', es: 'clase-de-cocina', fr: 'cours-de-cuisine', sk: 'kurz-varenia' },
  // janzu, yoga, kitesurf → kept (universal / brand)
};
export const ITEM_SLUGS: Record<string, Record<string, Partial<Record<Loc, string>>>> = {
  activities: ACTIVITY_LANDING_SLUGS,
  landings: ACTIVITY_LANDING_SLUGS,
  trips: {
    '10-days-on-board': { it: '10-giorni-a-bordo', es: '10-dias-a-bordo', fr: '10-jours-a-bord', sk: '10-dni-na-palube' },
    'crew-exchange': { it: 'scambio-equipaggio', es: 'intercambio-tripulacion', fr: 'echange-equipage', sk: 'vymena-posadky' },
    'one-month': { it: 'un-mese', es: 'un-mes', fr: 'un-mois', sk: 'jeden-mesiac' },
    // ikigai-experience, pacific-crossing → kept (brand)
  },
  blog: {}, // migrated in a second pass
};

/** Section roots whose items are localized (canonical root name === collection). */
const ITEM_ROOTS = new Set(['activities', 'trips', 'blog']);
export function isItemRoot(canonicalRoot: string): boolean {
  return ITEM_ROOTS.has(canonicalRoot);
}

/** canonical item slug → localized (or unchanged if not mapped / EN). */
export function localizeItemSlug(collection: string, canonical: string, locale: Loc): string {
  if (locale === DEFAULT_LOCALE) return canonical;
  return ITEM_SLUGS[collection]?.[canonical]?.[locale] ?? canonical;
}

/** Reverse: localized item slug (in `locale`) → canonical. */
const ITEM_REVERSE: Record<string, Record<Loc, Record<string, string>>> = {};
for (const [collection, slugs] of Object.entries(ITEM_SLUGS)) {
  ITEM_REVERSE[collection] = Object.fromEntries(LOCALES.map((l) => [l, {}])) as Record<Loc, Record<string, string>>;
  for (const [canon, byLoc] of Object.entries(slugs)) {
    for (const l of LOCALES) {
      const loc = byLoc[l];
      if (loc) ITEM_REVERSE[collection][l][loc] = canon;
    }
  }
}
export function canonicalItemSlug(collection: string, localized: string, locale: Loc): string {
  return ITEM_REVERSE[collection]?.[locale]?.[localized] ?? localized;
}
