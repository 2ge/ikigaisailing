/**
 * Build-time Instagram fetch → src/data/instagram.json.
 *
 * Pulls the latest media (posts + reels) for the connected Instagram *Business*
 * account via the Meta Graph API and writes a small JSON cache that
 * InstagramFeed.astro renders as static, optimized cards (no client-side IG
 * script, no cookies). A scheduled rebuild (see .github/workflows/deploy.yml)
 * keeps it fresh.
 *
 * Env (set in .env locally and as GitHub/Cloudflare Pages secrets in CI):
 *   IG_ACCESS_TOKEN  — long-lived Page/IG access token (required to fetch)
 *   IG_USER_ID       — the Instagram Business account id (recommended)
 *   IG_GRAPH_VERSION — Graph API version, default v21.0
 *   IG_FEED_COUNT    — how many items to show, default 9
 *
 * Resilience contract: this script NEVER fails the build. No token, an API
 * error, or a network blip → it logs a warning, keeps the existing committed
 * cache, and exits 0. A broken IG integration must never take the site down.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(import.meta.dirname, '..', 'src', 'data', 'instagram.json');
const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER_ID = process.env.IG_USER_ID;
const VERSION = process.env.IG_GRAPH_VERSION || 'v21.0';
const COUNT = Number(process.env.IG_FEED_COUNT || 9);
const HANDLE = 'ikigaisailing_asd';

type Item = {
  id: string;
  caption: string;
  permalink: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  isReel: boolean;
  image: string;
  timestamp: string;
};

function keepExisting(reason: string) {
  console.warn(`[instagram] ${reason} — keeping existing cache, not failing the build.`);
  process.exit(0);
}

async function main() {
  if (!TOKEN) keepExisting('no IG_ACCESS_TOKEN set');

  const fields = 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp';
  // Graph API (Business) when we have the IG user id; otherwise the token's own media.
  const base = USER_ID
    ? `https://graph.facebook.com/${VERSION}/${USER_ID}/media`
    : `https://graph.facebook.com/${VERSION}/me/media`;
  const url = `${base}?fields=${fields}&limit=${COUNT}&access_token=${TOKEN}`;

  let json: any;
  try {
    const res = await fetch(url);
    json = await res.json();
    if (!res.ok || json.error) {
      keepExisting(`API error: ${json?.error?.message ?? res.status}`);
    }
  } catch (e) {
    keepExisting(`fetch failed: ${(e as Error).message}`);
  }

  const items: Item[] = (json.data ?? [])
    .filter((m: any) => m.media_type !== 'VIDEO' || m.thumbnail_url) // need a poster for videos/reels
    .slice(0, COUNT)
    .map((m: any) => ({
      id: m.id,
      caption: (m.caption ?? '').replace(/\s+/g, ' ').trim().slice(0, 160),
      permalink: m.permalink,
      mediaType: m.media_type,
      isReel: m.media_product_type === 'REELS',
      image: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
      timestamp: m.timestamp,
    }))
    .filter((it: Item) => it.image && it.permalink);

  if (!items.length) keepExisting('API returned no usable media');

  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  writeFileSync(
    OUT,
    JSON.stringify({ fetchedAt: new Date().toISOString(), handle: prev.handle ?? HANDLE, items }, null, 2) + '\n',
  );
  console.log(`[instagram] wrote ${items.length} item(s) → src/data/instagram.json`);
}

main();
