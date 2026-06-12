/**
 * Routing layer for localized slugs. Produces the static-path params (with
 * localized segments) for the two dispatchers and resolves which view/content
 * a localized URL maps to.
 */
import { getCollection } from 'astro:content';
import { LOCALES, type Loc, localizeSegment } from '../i18n/segments';
import { slugOf, localeOf } from './content';

/** pages-collection slugs rendered by a bespoke designed view. */
export const DEDICATED = new Set([
  'about',
  'ikigai',
  'route',
  'story',
  'season-2025-26',
  'reviews',
  'contact',
]);
/** pages-collection intro slugs that render as a section index (with item grid). */
export const SECTION_INDEX = new Set(['trips', 'activities']);
/** collections exposed as /<section>/<item>/. */
export const ITEM_COLLECTIONS = ['trips', 'activities', 'blog'] as const;
export type ItemCollection = (typeof ITEM_COLLECTIONS)[number];

/** Static paths for the single-segment dispatcher: top-level pages + section indexes + blog index. */
export async function topLevelStaticPaths() {
  const all = await getCollection('pages');
  const localesBySlug = new Map<string, Set<Loc>>();
  for (const e of all) {
    const slug = slugOf(e);
    if (slug === 'home') continue; // home is the locale index route
    (localesBySlug.get(slug) ?? localesBySlug.set(slug, new Set()).get(slug)!).add(localeOf(e) as Loc);
  }
  const out: { params: { locale: string | undefined; slug: string }; props: { locale: Loc; pageKey: string } }[] = [];
  const push = (slug: string, locale: Loc) =>
    out.push({
      params: { locale: locale === 'en' ? undefined : locale, slug: localizeSegment(slug, locale) },
      props: { locale, pageKey: slug },
    });
  for (const [slug, have] of localesBySlug) {
    const locs = have.has('en') ? [...LOCALES] : [...have];
    for (const locale of locs) push(slug, locale);
  }
  // blog index has no pages entry of its own
  for (const locale of LOCALES) push('blog', locale);
  return out;
}

/** Static paths for the item dispatcher: /<localized-section>/<item>/ for each collection. */
export async function itemStaticPaths() {
  const out: {
    params: { locale: string | undefined; section: string; item: string };
    props: { locale: Loc; collection: ItemCollection; slug: string };
  }[] = [];
  for (const collection of ITEM_COLLECTIONS) {
    const all = await getCollection(collection);
    const localesBySlug = new Map<string, Set<Loc>>();
    for (const e of all) {
      const slug = slugOf(e);
      if (collection === 'blog' && (e.data as any).draft) continue;
      (localesBySlug.get(slug) ?? localesBySlug.set(slug, new Set()).get(slug)!).add(localeOf(e) as Loc);
    }
    for (const [slug, have] of localesBySlug) {
      const locs = have.has('en') ? [...LOCALES] : [...have];
      for (const locale of locs) {
        out.push({
          params: {
            locale: locale === 'en' ? undefined : locale,
            section: localizeSegment(collection, locale),
            item: slug,
          },
          props: { locale, collection, slug },
        });
      }
    }
  }
  return out;
}
