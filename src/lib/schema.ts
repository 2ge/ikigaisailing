/** JSON-LD builders. Keep field names exact for rich-results validation. */
import type { Locale } from '../i18n/ui';
import { localizePath } from '../i18n/ui';

export function breadcrumbs(
  site: string,
  locale: Locale,
  trail: { name: string; path: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: new URL(localizePath(c.path, locale), site).href,
    })),
  };
}

export function faqPage(faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function tripProduct(
  site: string,
  url: string,
  trip: { title: string; description: string; price: number | null; currency: string },
) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: trip.title,
    description: trip.description,
    url,
    provider: { '@id': `${site}/#organization` },
  };
  if (trip.price != null) {
    schema.offers = {
      '@type': 'Offer',
      price: trip.price,
      priceCurrency: trip.currency,
      availability: 'https://schema.org/InStock',
      url,
    };
  }
  return schema;
}

export function article(
  url: string,
  post: { title: string; description: string; author: string; pubDate: Date; updatedDate?: Date; image?: string },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.pubDate.toISOString(),
    dateModified: (post.updatedDate ?? post.pubDate).toISOString(),
    ...(post.image ? { image: post.image } : {}),
    mainEntityOfPage: url,
    url,
  };
}
