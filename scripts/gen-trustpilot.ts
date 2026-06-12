/**
 * Refresh the Trustpilot rating badge shown on /reviews/ at build time.
 *
 * Trustpilot's FREE tier blocks the widget/data API (returns empty) and the
 * public page is bot-gated, so for a free business unit this fetch is a no-op
 * and the committed value in src/data/trustpilot.json is kept. The moment the
 * business upgrades to a plan that exposes widget data, this starts auto-
 * updating the rating + count on every (weekly) build. Never fails the build.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'src', 'data', 'trustpilot.json');
// "Micro Review Count" template — the lightest data endpoint.
const TEMPLATE = '5419b6a8b0d04a076446a9ad';

async function main() {
  let cur: any;
  try {
    cur = JSON.parse(readFileSync(OUT, 'utf8'));
  } catch {
    console.warn('trustpilot: src/data/trustpilot.json missing/invalid — skipped.');
    return;
  }
  if (!cur.businessUnitId) {
    console.log('trustpilot: no businessUnitId — kept committed rating.');
    return;
  }
  try {
    const res = await fetch(
      `https://widget.trustpilot.com/trustbox-data/${TEMPLATE}?businessUnitId=${cur.businessUnitId}&locale=en-US`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IkigaiBuild/1.0)' } },
    );
    const d: any = await res.json();
    const bu = d?.businessUnit;
    const rating = bu?.trustScore ?? bu?.stars;
    const count = bu?.numberOfReviews?.total;
    if (typeof rating === 'number' && typeof count === 'number' && count > 0) {
      writeFileSync(OUT, JSON.stringify({ ...cur, rating, count, fetchedAt: new Date().toISOString() }, null, 2) + '\n');
      console.log(`trustpilot: ★${rating} (${count} reviews).`);
    } else {
      console.log('trustpilot: widget data not available (free tier) — kept committed rating.');
    }
  } catch (e: any) {
    console.warn(`trustpilot: fetch failed (${e.message}) — kept committed rating.`);
  }
}

main();
