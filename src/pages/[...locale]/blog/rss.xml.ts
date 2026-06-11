import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { defaultLocale, localizePath, type Locale } from '../../../i18n/ui';
import { entriesForLocale, slugOf } from '../../../lib/content';

export async function getStaticPaths() {
  return (['en', 'it', 'es', 'fr', 'sk'] as Locale[]).map((locale) => ({
    params: { locale: locale === defaultLocale ? undefined : locale },
    props: { locale },
  }));
}

export const GET: APIRoute = async ({ props, site }) => {
  const locale = (props as { locale: Locale }).locale;
  const posts = (await entriesForLocale('blog', locale))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  return rss({
    title: 'Ikigai Sailing — Logbook',
    description: 'Stories and guides from the crew of the catamaran Ikigai.',
    site: site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: localizePath(`/blog/${slugOf(p)}/`, locale),
    })),
  });
};
