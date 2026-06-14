/**
 * Generate public/_redirects (Cloudflare Pages format). Run at prebuild.
 * Three sources, all 301 → the new LOCALIZED URL:
 *   1. Old WordPress URLs (content `oldUrls` frontmatter) — survives the
 *      ikigaisailing.com cutover.
 *   2. The previous English-slug localized URLs (e.g. /sk/story/ → /sk/pribeh/)
 *      from before slugs were localized — keeps existing links/bookmarks alive.
 *   3. A few hand-mapped section/retired-page redirects, plus retired slug aliases.
 */
import matter from 'gray-matter';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { localizePath } from '../src/i18n/ui';
import type { Locale } from '../src/i18n/ui';
import { aliasEntries, localizeSegment } from '../src/i18n/segments';

const ROOT = join(import.meta.dirname, '..');
const CONTENT = join(ROOT, 'src', 'content');
const LOCS: Locale[] = ['en', 'it', 'es', 'fr', 'sk'];

type Row = { from: string; to: string };
const rows: Row[] = [];
const seen = new Set<string>();
const add = (from: string, to: string) => {
  const f = from.replace(/\/?$/, '/');
  if (!f.startsWith('/') || seen.has(f) || f === to) return;
  seen.add(f);
  rows.push({ from: f, to });
};

/** Canonical (English, pre-localization) path for a content entry. */
function canonicalPath(collection: string, slug: string): string {
  if (collection === 'pages') return slug === 'home' ? '/' : `/${slug}/`;
  return `/${collection}/${slug}/`;
}
/** Re-localize an English-slug (possibly locale-prefixed) path to its current URL. */
function current(path: string): string {
  const m = path.match(/^\/(it|es|fr|sk)(\/.*)$/);
  const loc = (m ? m[1] : 'en') as Locale;
  const canon = m ? m[2] : path;
  return localizePath(canon, loc);
}

// Pages whose route was removed and whose content moved to a hand-picked path.
// Every old URL of theirs (English-slug, live localized-slug, and WordPress
// oldUrls) must 301 to the new path — critical for the ikigaisailing.com cutover.
const MOVED: Record<string, string> = { 'season-2025-26': '/panama/san-blas/' };

for (const collection of ['pages', 'trips', 'activities', 'blog']) {
  for (const loc of LOCS) {
    const dir = join(CONTENT, collection, loc);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const { data } = matter(readFileSync(join(dir, file), 'utf8'));
      const slug = file.replace(/\.md$/, '');
      const canon = canonicalPath(collection, slug);
      const moved = collection === 'pages' ? MOVED[slug] : undefined;
      const to = moved ? (loc === 'en' ? moved : `/${loc}${moved}`) : localizePath(canon, loc);

      // (2) previous English-slug localized URL → target
      add(loc === 'en' ? canon : `/${loc}${canon}`, to);
      // moved pages also 301 their LIVE localized slug (e.g. /it/stagione-2025-26/ → /it/panama/san-blas/)
      if (moved) {
        const seg = localizeSegment(slug, loc);
        add(loc === 'en' ? `/${seg}/` : `/${loc}/${seg}/`, to);
      }
      // (1) WordPress oldUrls → target
      for (const old of (data.oldUrls as string[] | undefined) ?? []) add(old, to);
    }
  }
}

// (2b) slug-localization migration — the previous live localized URL used the
// English item slug (e.g. /it/attivita/freediving/); 301 it to the new localized
// slug (/it/attivita/apnea/). add() skips unchanged slugs (brand/proper nouns).
for (const loc of LOCS) {
  if (loc === 'en') continue;
  for (const collection of ['activities', 'trips']) {
    const dir = join(CONTENT, collection, loc);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const slug = file.replace(/\.md$/, '');
      add(`/${loc}/${localizeSegment(collection, loc)}/${slug}/`, localizePath(`/${collection}/${slug}/`, loc));
    }
  }
  const ldir = join(CONTENT, 'landings', loc);
  if (existsSync(ldir))
    for (const file of readdirSync(ldir).filter((f) => f.endsWith('.md'))) {
      const slug = file.replace(/\.md$/, '');
      if (slug === 'pillar') continue;
      add(`/${loc}/panama/san-blas/${slug}/`, localizePath(`/panama/san-blas/${slug}/`, loc));
    }
}

// (3) section / retired-page redirects — keys are old URLs, values English-slug
// localized targets that get re-localized to their current form.
const EXTRA: Record<string, string> = {
  // Google Ads landing pages (paid traffic must not 404 after the cutover)
  '/retreat/sailing-&-yoga': '/panama/san-blas/',
  '/retreat/sailing-&-yoga/': '/panama/san-blas/',
  '/retreat/': '/panama/san-blas/',
  '/prodotto/advance-payment/': '/trips/',
  '/it/prodotto/acconto/': '/it/trips/',
  '/life-on-the-boat/': '/liveaboard/',
  '/liveaboard-social/': '/liveaboard/',
  '/it/vita-a-bordo-social/': '/it/liveaboard/',
  '/sport/': '/activities/',
  '/it/sport-attivita/': '/it/activities/',
  '/project/': '/activities/',
  '/it/project/': '/it/activities/',
  '/testimonials/': '/reviews/',
  '/it/our-testimonials/': '/it/reviews/',
  '/shop/': '/trips/',
  '/it/shop/': '/it/trips/',
  '/cart/': '/trips/',
  '/checkout/': '/trips/',
  '/formule-di-imbarco-new/': '/trips/',
  '/prodotto/ikigai-experience-2/': '/trips/ikigai-experience/',
  '/prodotto/10-days-on-board-ikigai/': '/trips/10-days-on-board/',
  '/prodotto/one-month/': '/trips/one-month/',
  '/prodotto/pacific-crossing/': '/trips/pacific-crossing/',
  '/prodotto/crew-exchange-boarding/': '/trips/crew-exchange/',
};
for (const [from, to] of Object.entries(EXTRA)) add(from, current(to));

// (4) retired localized slugs (renames) → current localized segment.
for (const { canonical, locale, segment } of aliasEntries()) {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  const live = localizeSegment(canonical, locale);
  add(`${prefix}/${segment}/`, `${prefix}/${live}/`);
}

const out =
  '# Generated by scripts/gen-redirects.ts — do not edit by hand.\n' +
  rows.map((r) => `${r.from}  ${r.to}  301`).join('\n') +
  '\n';
writeFileSync(join(ROOT, 'public', '_redirects'), out);
console.log(`_redirects: ${rows.length} rules`);
