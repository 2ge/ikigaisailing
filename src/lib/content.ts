/**
 * Collection helpers with locale + EN-fallback logic.
 * Slugs are identical across locales, so an entry id is `<locale>/<slug>`.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { defaultLocale, type Locale } from '../i18n/ui';

type AnyCol = 'pages' | 'trips' | 'activities' | 'blog' | 'testimonials';

export function slugOf(entry: { id: string }): string {
  return entry.id.split('/').slice(1).join('/');
}
export function localeOf(entry: { id: string }): Locale {
  return entry.id.split('/')[0] as Locale;
}

/** All entries of a collection for a locale, falling back to EN where a locale file is missing. */
export async function entriesForLocale<C extends AnyCol>(
  collection: C,
  locale: Locale,
): Promise<CollectionEntry<C>[]> {
  const all = await getCollection(collection);
  const bySlug = new Map<string, CollectionEntry<C>>();
  for (const e of all) {
    const slug = slugOf(e);
    const loc = localeOf(e);
    if (loc === defaultLocale && !bySlug.has(slug)) bySlug.set(slug, e);
    if (loc === locale) bySlug.set(slug, e);
  }
  return [...bySlug.values()];
}

/** One entry by slug for a locale (EN fallback). */
export async function entryForLocale<C extends AnyCol>(
  collection: C,
  slug: string,
  locale: Locale,
): Promise<CollectionEntry<C> | undefined> {
  const all = await getCollection(collection);
  return (
    all.find((e) => slugOf(e) === slug && localeOf(e) === locale) ??
    all.find((e) => slugOf(e) === slug && localeOf(e) === defaultLocale)
  );
}

/**
 * Static paths for a collection, emitting a (locale, slug) route only when that
 * locale has its own file OR an EN source exists to fall back to. This avoids
 * phantom routes (→ /404/) for content that exists in only one locale
 * (e.g. IT-only legacy posts/pages with no EN source).
 */
export async function existingLocalePaths<C extends AnyCol>(
  collection: C,
  { filter }: { filter?: (e: CollectionEntry<C>) => boolean } = {},
) {
  let all = await getCollection(collection);
  if (filter) all = all.filter(filter);
  const localesBySlug = new Map<string, Set<Locale>>();
  for (const e of all) {
    const slug = slugOf(e);
    if (!localesBySlug.has(slug)) localesBySlug.set(slug, new Set());
    localesBySlug.get(slug)!.add(localeOf(e));
  }
  const out: { params: { locale: string | undefined; slug: string }; props: { slug: string; locale: Locale } }[] = [];
  for (const [slug, have] of localesBySlug) {
    const locales = have.has(defaultLocale)
      ? (['en', 'it', 'es', 'fr', 'sk'] as Locale[]) // EN source → all locales (translations or EN fallback)
      : [...have]; // single-locale content → only the locales that exist
    for (const locale of locales) {
      out.push({
        params: { locale: locale === defaultLocale ? undefined : locale, slug },
        props: { slug, locale },
      });
    }
  }
  return out;
}
