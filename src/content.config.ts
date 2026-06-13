import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const LOCALES = ['en', 'it', 'es', 'fr', 'sk'] as const;

/** Shared fields for DeepL-translated files (Phase 1.5 pipeline). */
const translationMeta = {
  /** Set by scripts/translate.ts on generated files. Human-written files omit it. */
  translated: z.enum(['deepl']).optional(),
  /** Hash of the EN source payload this translation was generated from. */
  sourceHash: z.string().optional(),
  /** SK files get a native-speaker review pass by the owner. */
  needsReview: z.boolean().optional(),
};

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      /** SEO overrides — keyword-tuned <title>/meta that leave the visible H1 editorial. */
      seoTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      locale: z.enum(LOCALES),
      heroImage: image().optional(),
      gallery: z.array(image()).default([]),
      /** Optional intro lead (e.g. the Story page). */
      lead: z.string().optional(),
      /** Optional milestone timeline (e.g. the Story page). */
      timeline: z.array(z.object({ year: z.string(), text: z.string() })).default([]),
      /** Optional voyage log grouped by year (the Route page). */
      voyage: z
        .array(
          z.object({
            year: z.string(),
            title: z.string(),
            legs: z.array(
              z.object({
                when: z.string(),
                place: z.string(),
                note: z.string(),
                now: z.boolean().optional(),
              }),
            ),
          }),
        )
        .default([]),
      /** Optional "road ahead" block (the Route page). */
      aheadTitle: z.string().optional(),
      ahead: z.string().optional(),
      /** Old WordPress URL(s) this page replaces — drives _redirects generation. */
      oldUrls: z.array(z.string()).default([]),
      ...translationMeta,
    }),
});

const trips = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/trips' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      /** SEO overrides — keyword-tuned <title>/meta that leave the visible H1 editorial. */
      seoTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      locale: z.enum(LOCALES),
      price: z.number().nullable().default(null),
      currency: z.string().default('EUR'),
      priceNote: z.string().optional(), // e.g. "per week", "per month", "deposit 30%"
      duration: z.string(),
      season: z.string().optional(),
      location: z.string(),
      membersOnly: z.boolean().default(false),
      stripePriceId: z.string().optional(),
      depositStripePriceId: z.string().optional(),
      heroImage: image().optional(),
      gallery: z.array(image()).default([]),
      faq: z
        .array(z.object({ q: z.string(), a: z.string() }))
        .default([]),
      order: z.number().default(99),
      oldUrls: z.array(z.string()).default([]),
      ...translationMeta,
    }),
});

const activities = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/activities' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      /** SEO overrides — keyword-tuned <title>/meta that leave the visible H1 editorial. */
      seoTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      locale: z.enum(LOCALES),
      category: z.string().default('wellness'),
      image: image().optional(),
      gallery: z.array(image()).default([]),
      /** Spec facts (Level, Duration, …) shown as a designed grid. Lifted from body. */
      facts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
      order: z.number().default(99),
      oldUrls: z.array(z.string()).default([]),
      ...translationMeta,
    }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({
    author: z.string(),
    origin: z.string().optional(), // e.g. "Italy", "France"
    title: z.string().optional(),
    date: z.coerce.date().optional(),
    source: z.enum(['trustpilot', 'direct', 'google']).default('direct'),
    sourceUrl: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    /** Original language of the review — reviews stay verbatim in their language. */
    locale: z.enum(LOCALES),
    /** Pre-generated DeepL translations of the body, keyed by locale (Phase 1.5). */
    translations: z.record(z.string()).default({}),
    featured: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      locale: z.enum(LOCALES),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().default('Ikigai Sailing crew'),
      tags: z.array(z.string()).default([]),
      image: image().optional(),
      draft: z.boolean().default(false),
      ...translationMeta,
    }),
});

export const collections = { pages, trips, activities, testimonials, blog };
