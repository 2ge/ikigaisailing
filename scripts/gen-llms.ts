/**
 * Generate public/llms.txt from the content collections at prebuild.
 * English (lingua franca for AI crawlers) with a Languages section.
 */
import matter from 'gray-matter';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const CONTENT = join(ROOT, 'src', 'content');
const SITE = 'https://www.ikigaisailing.com';

function enEntries(collection: string) {
  const dir = join(CONTENT, collection, 'en');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data } = matter(readFileSync(join(dir, f), 'utf8'));
      return { slug: f.replace(/\.md$/, ''), ...data } as any;
    });
}

const trips = enEntries('trips').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
const activities = enEntries('activities').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
const blog = enEntries('blog')
  .filter((p) => !p.draft)
  .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

const lines: string[] = [];
lines.push('# Ikigai Sailing');
lines.push('');
lines.push(
  '> Ikigai Sailing ASD is a non-profit amateur sailing association (recognized by CONI, ' +
    'affiliated with MSP Italia) running mindful sailing trips aboard the Catana 47 catamaran ' +
    '"Ikigai" in San Blas (Guna Yala), Panama, and across the Pacific. Trips combine freediving, ' +
    'yoga, meditation, Janzu and slow ocean travel. Bookings are direct with the crew; payments ' +
    'are member contributions, not commercial charter fees.',
);
lines.push('');
lines.push('Contact: WhatsApp +39 331 32 926 29 · Instagram @ikigaisailing_asd');
lines.push('');

lines.push('## Boarding options');
for (const t of trips) {
  const price = t.price != null ? ` (from €${t.price})` : '';
  lines.push(`- [${t.title}](${SITE}/trips/${t.slug}/): ${t.description}${price}`);
}
lines.push('');

lines.push('## Activities aboard');
for (const a of activities) lines.push(`- [${a.title}](${SITE}/activities/${a.slug}/): ${a.summary}`);
lines.push('');

lines.push('## Key pages');
lines.push(`- [The Route](${SITE}/route/): where Ikigai is sailing now and next`);
lines.push(`- [Catana 47](${SITE}/catana-47/): the boat`);
lines.push(`- [San Blas catamaran charter](${SITE}/panama/san-blas/): the main season + per-cabin booking`);
lines.push(`- [Reviews](${SITE}/reviews/): guest testimonials`);
lines.push(`- [Contact](${SITE}/contact/): book direct`);
lines.push('');

if (blog.length) {
  lines.push('## Recent writing');
  for (const p of blog.slice(0, 12)) lines.push(`- [${p.title}](${SITE}/blog/${p.slug}/): ${p.description}`);
  lines.push('');
}

lines.push('## Languages');
lines.push('Content is available in 5 languages:');
lines.push(`- English: ${SITE}/`);
lines.push(`- Italiano: ${SITE}/it/`);
lines.push(`- Español: ${SITE}/es/`);
lines.push(`- Français: ${SITE}/fr/`);
lines.push(`- Slovenčina: ${SITE}/sk/`);
lines.push('');

writeFileSync(join(ROOT, 'public', 'llms.txt'), lines.join('\n'));
console.log(`llms.txt: ${trips.length} trips, ${activities.length} activities, ${blog.length} posts`);
