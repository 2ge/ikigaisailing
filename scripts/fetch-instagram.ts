/**
 * Build-time Instagram fetch → public/instagram/*.jpg + src/data/instagram.json.
 *
 * Two sources, in order of preference:
 *   1. Official Meta Graph API — used when IG_ACCESS_TOKEN is set (stable, ToS-clean).
 *   2. Public web profile endpoint — tokenless fallback for the owner's OWN public
 *      account (no Meta app needed). Undocumented; can change without notice.
 *
 * Images are DOWNLOADED at build time into public/instagram/ (the IG CDN URLs are
 * signed + expiring, so we can't hotlink them) and served as static files. The
 * 6-hourly rebuild refreshes them.
 *
 * Resilience contract: NEVER fails the build. Any error → keep the committed
 * cache + images, log a warning, exit 0.
 *
 * Env: IG_ACCESS_TOKEN, IG_USER_ID, IG_GRAPH_VERSION (default v21.0), IG_FEED_COUNT (9).
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const OUT_JSON = join(ROOT, 'src', 'data', 'instagram.json');
const IMG_DIR = join(ROOT, 'public', 'instagram');
const HANDLE = 'ikigaisailing_asd';
const COUNT = Number(process.env.IG_FEED_COUNT || 9);
const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER_ID = process.env.IG_USER_ID;
const VERSION = process.env.IG_GRAPH_VERSION || 'v21.0';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

type Item = { id: string; permalink: string; isReel: boolean; caption: string; image: string };
type Raw = { id: string; permalink: string; isReel: boolean; caption: string; srcUrl: string };

function keepExisting(reason: string): never {
  console.warn(`[instagram] ${reason} — keeping existing cache, not failing the build.`);
  process.exit(0);
}
const clean = (s: string) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, 160);

/** Official Graph API (needs a token). */
async function viaGraphApi(): Promise<Raw[]> {
  const fields = 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink';
  const base = USER_ID
    ? `https://graph.facebook.com/${VERSION}/${USER_ID}/media`
    : `https://graph.facebook.com/${VERSION}/me/media`;
  const res = await fetch(`${base}?fields=${fields}&limit=${COUNT}&access_token=${TOKEN}`);
  const json: any = await res.json();
  if (!res.ok || json.error) keepExisting(`Graph API error: ${json?.error?.message ?? res.status}`);
  return (json.data ?? [])
    .filter((m: any) => m.media_type !== 'VIDEO' || m.thumbnail_url)
    .map((m: any) => ({
      id: m.id,
      permalink: m.permalink,
      isReel: m.media_product_type === 'REELS',
      caption: clean(m.caption),
      srcUrl: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
    }));
}

/** Tokenless public profile (owner's own public account). */
async function viaPublicProfile(): Promise<Raw[]> {
  const res = await fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${HANDLE}`, {
    headers: { 'User-Agent': UA, 'x-ig-app-id': '936619743392459' },
  });
  if (!res.ok) keepExisting(`public profile HTTP ${res.status}`);
  const json: any = await res.json();
  const edges = json?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];
  if (!edges.length) keepExisting('public profile returned no media (login wall?)');
  return edges.slice(0, COUNT).map(({ node }: any) => ({
    id: node.shortcode,
    permalink: `https://www.instagram.com/p/${node.shortcode}/`,
    isReel: !!node.is_video,
    caption: clean(node.edge_media_to_caption?.edges?.[0]?.node?.text),
    srcUrl: node.display_url,
  }));
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return false;
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  let raw: Raw[];
  try {
    raw = TOKEN ? await viaGraphApi() : await viaPublicProfile();
  } catch (e) {
    keepExisting(`fetch failed: ${(e as Error).message}`);
  }

  mkdirSync(IMG_DIR, { recursive: true });
  const items: Item[] = [];
  for (const r of raw) {
    const file = `${r.id}.jpg`;
    if (await download(r.srcUrl, join(IMG_DIR, file))) {
      items.push({ id: r.id, permalink: r.permalink, isReel: r.isReel, caption: r.caption, image: `/instagram/${file}` });
    }
  }
  if (!items.length) keepExisting('no images could be downloaded');

  // prune images no longer in the feed
  const keep = new Set(items.map((i) => `${i.id}.jpg`));
  for (const f of readdirSync(IMG_DIR)) if (f.endsWith('.jpg') && !keep.has(f)) unlinkSync(join(IMG_DIR, f));

  const prev = existsSync(OUT_JSON) ? JSON.parse(readFileSync(OUT_JSON, 'utf8')) : {};
  writeFileSync(
    OUT_JSON,
    JSON.stringify({ fetchedAt: new Date().toISOString(), handle: prev.handle ?? HANDLE, source: TOKEN ? 'graph' : 'public', items }, null, 2) + '\n',
  );
  console.log(`[instagram] wrote ${items.length} item(s) (${TOKEN ? 'graph' : 'public'}) → public/instagram/ + instagram.json`);
}

main();
