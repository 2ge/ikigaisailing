/**
 * Fetch live Google reviews via the Places API (New) at build time, translate
 * them into the site locales with DeepL, and write src/data/google-reviews.json
 * (read by the Reviews page).
 *
 * Env:
 *   GOOGLE_MAPS_API_KEY  — Places API key (restrict to Places API New)
 *   GOOGLE_PLACE_ID      — surviving profile Place ID (ChIJ…)
 *   DEEPL_API_KEY        — optional; translates review text into the other site
 *                          locales. Cached by source-text hash so unchanged
 *                          reviews aren't re-translated; absent → keep cached.
 *
 * On missing key or a transient failure it keeps the last committed payload
 * (never wipes the reviews block). Places API returns up to 5 reviews + overall
 * rating/count (Google's cap).
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import * as deepl from 'deepl-node';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'src', 'data', 'google-reviews.json');

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACE = process.env.GOOGLE_PLACE_ID;
const DEEPL = process.env.DEEPL_API_KEY;

const MIN_REVIEW_LEN = 90;

// Site locales and the DeepL target code for each. A review's own language is
// left as the original (no self-translation).
const TARGETS: Record<string, deepl.TargetLanguageCode> = {
  en: 'en-US', it: 'it', es: 'es', fr: 'fr', sk: 'sk',
};

type Review = {
  author: string;
  photo: string | null;
  profileUrl: string | null;
  rating: number;
  text: string;
  when: string;
  lang: string | null;
  translations?: Record<string, string>;
};
type Payload = { rating: number | null; count: number; mapsUri: string | null; reviews: Review[]; fetchedAt: string | null };

const hash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 12);

function writeOut(p: Payload) {
  mkdirSync(join(ROOT, 'src', 'data'), { recursive: true });
  writeFileSync(OUT, JSON.stringify(p, null, 2) + '\n');
}

// Last good payload already committed/generated — so a missing key or a transient
// API failure on a routine deploy never wipes the reviews block site-wide.
function existing(): Payload | null {
  try {
    const p = JSON.parse(readFileSync(OUT, 'utf8')) as Payload;
    return p.reviews?.length ? p : null;
  } catch {
    return null;
  }
}

// Prior translations keyed by source-text hash, so an unchanged review never
// re-pays DeepL across builds.
function priorTranslations(): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {};
  for (const r of existing()?.reviews ?? []) if (r.translations) map[hash(r.text)] = r.translations;
  return map;
}

async function translate(reviews: Review[]) {
  const prior = priorTranslations();
  const base = (r: Review) => (r.lang || 'en').slice(0, 2); // source language
  if (!DEEPL) {
    // No key: reuse cached translations for unchanged reviews; leave the rest.
    for (const r of reviews) {
      const cached = prior[hash(r.text)];
      if (cached) r.translations = cached;
    }
    console.log('google-reviews: DEEPL_API_KEY not set — kept cached translations only.');
    return;
  }
  const translator = new deepl.Translator(DEEPL);
  for (const r of reviews) {
    const cached = prior[hash(r.text)];
    if (cached) { r.translations = cached; continue; } // unchanged → reuse
    const out: Record<string, string> = {};
    for (const [loc, target] of Object.entries(TARGETS)) {
      if (loc === base(r)) continue; // original already in this language
      const res = await translator.translateText(r.text, null, target);
      out[loc] = res.text;
    }
    r.translations = out;
  }
}

async function main() {
  const empty: Payload = { rating: null, count: 0, mapsUri: null, reviews: [], fetchedAt: null };
  if (!KEY || !PLACE) {
    const cached = existing();
    if (cached) {
      console.log('google-reviews: key not set — kept cached reviews (no overwrite).');
      return;
    }
    writeOut(empty);
    console.log('google-reviews: GOOGLE_MAPS_API_KEY / GOOGLE_PLACE_ID not set — wrote empty payload (skipped).');
    return;
  }
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE)}`, {
      headers: {
        'X-Goog-Api-Key': KEY,
        'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews',
      },
    });
    if (!res.ok) throw new Error(`Places API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const d: any = await res.json();
    const reviews: Review[] = (d.reviews ?? [])
      .map((r: any) => ({
        author: r.authorAttribution?.displayName ?? 'Google user',
        photo: r.authorAttribution?.photoUri ?? null,
        profileUrl: r.authorAttribution?.uri ?? null,
        rating: r.rating ?? 5,
        text: (r.text?.text ?? r.originalText?.text ?? '').trim(),
        when: r.relativePublishTimeDescription ?? '',
        lang: r.text?.languageCode ?? null,
      }))
      .filter((r: Review) => r.rating >= 4 && r.text.length >= MIN_REVIEW_LEN);
    await translate(reviews);
    writeOut({
      rating: d.rating ?? null,
      count: d.userRatingCount ?? 0,
      mapsUri: d.googleMapsUri ?? null,
      reviews,
      fetchedAt: new Date().toISOString(),
    });
    const tCount = reviews.filter((r) => r.translations && Object.keys(r.translations).length).length;
    console.log(`google-reviews: ${reviews.length} reviews, ★${d.rating} (${d.userRatingCount} total); ${tCount} translated.`);
  } catch (e: any) {
    const cached = existing();
    if (cached) {
      console.warn(`google-reviews: fetch failed (${e.message}) — kept cached reviews, build continues.`);
      return;
    }
    writeOut(empty);
    console.warn(`google-reviews: fetch failed (${e.message}) — wrote empty payload, build continues.`);
  }
}

main();
