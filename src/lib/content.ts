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

/** Build i18n static paths for a collection: one route per (locale, slug). */
export async function localePaths<C extends AnyCol>(collection: C) {
  const all = await getCollection(collection);
  const slugs = new Set(all.map(slugOf));
  const out: { params: { locale: string | undefined; slug: string }; props: { slug: string; locale: Locale } }[] = [];
  for (const slug of slugs) {
    for (const locale of ['en', 'it', 'es', 'fr', 'sk'] as Locale[]) {
      out.push({
        params: { locale: locale === defaultLocale ? undefined : locale, slug },
        props: { slug, locale },
      });
    }
  }
  return out;
}
