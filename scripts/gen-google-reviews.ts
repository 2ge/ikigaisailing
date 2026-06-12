/**
 * Fetch live Google reviews via the Places API (New) at build time and write
 * them to src/data/google-reviews.json (read by the Reviews page).
 *
 * Needs two env vars (set in Cloudflare Pages + local .env):
 *   GOOGLE_MAPS_API_KEY   — a Places API key (restrict it to Places API)
 *   GOOGLE_PLACE_ID       — the surviving profile's Place ID (ChIJ… form)
 *
 * If either is missing, it writes an empty payload and exits 0 — so the build
 * never breaks before the key exists; the site just shows no live-reviews block.
 * The Places API returns up to 5 reviews + the overall rating/count (Google's cap).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'src', 'data', 'google-reviews.json');

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACE = process.env.GOOGLE_PLACE_ID;

type Review = {
  author: string;
  photo: string | null;
  profileUrl: string | null;
  rating: number;
  text: string;
  when: string;
  lang: string | null;
};
type Payload = { rating: number | null; count: number; mapsUri: string | null; reviews: Review[]; fetchedAt: string | null };

function writeOut(p: Payload) {
  mkdirSync(join(ROOT, 'src', 'data'), { recursive: true });
  writeFileSync(OUT, JSON.stringify(p, null, 2) + '\n');
}

async function main() {
  const empty: Payload = { rating: null, count: 0, mapsUri: null, reviews: [], fetchedAt: null };
  if (!KEY || !PLACE) {
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
    const reviews: Review[] = (d.reviews ?? []).map((r: any) => ({
      author: r.authorAttribution?.displayName ?? 'Google user',
      photo: r.authorAttribution?.photoUri ?? null,
      profileUrl: r.authorAttribution?.uri ?? null,
      rating: r.rating ?? 5,
      text: (r.text?.text ?? r.originalText?.text ?? '').trim(),
      when: r.relativePublishTimeDescription ?? '',
      lang: r.text?.languageCode ?? null,
    }));
    writeOut({
      rating: d.rating ?? null,
      count: d.userRatingCount ?? 0,
      mapsUri: d.googleMapsUri ?? null,
      reviews: reviews.filter((r) => r.text),
      fetchedAt: new Date().toISOString(),
    });
    console.log(`google-reviews: ${reviews.length} reviews, ★${d.rating} (${d.userRatingCount} total).`);
  } catch (e: any) {
    writeOut(empty);
    console.warn(`google-reviews: fetch failed (${e.message}) — wrote empty payload, build continues.`);
  }
}

main();
