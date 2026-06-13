import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';

export const ROOT = process.cwd();
export const CONTENT = join(ROOT, 'src/content');
export const DIST = join(ROOT, 'dist');
export const LOCALES = ['en', 'it', 'es', 'fr', 'sk'] as const;
export const DEFAULT_LOCALE = 'en';
export const COLLECTIONS = ['pages', 'trips', 'activities', 'blog', 'testimonials'] as const;

/** Recursively collect files under `dir` matching `ext`. */
export function walk(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p, ext));
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

export interface ContentFile {
  path: string;          // absolute
  rel: string;           // relative to src/content
  collection: string;
  locale: string;
  slug: string;          // filename without .md
  data: Record<string, any>;
  body: string;
}

/** Every markdown content file with parsed frontmatter. */
export function contentFiles(collection?: string): ContentFile[] {
  const base = collection ? join(CONTENT, collection) : CONTENT;
  return walk(base, '.md').map((path) => {
    const rel = relative(CONTENT, path);
    const [col, locale, ...rest] = rel.split('/');
    const file = matter(readFileSync(path, 'utf8'));
    return {
      path,
      rel,
      collection: col,
      locale,
      slug: rest.join('/').replace(/\.md$/, ''),
      data: file.data,
      body: file.content,
    };
  });
}

/** Built HTML pages with their site-relative URL path (e.g. "/it/trips/x/"). */
export function builtPages(): { file: string; url: string; html: string }[] {
  return walk(DIST, 'index.html')
    .map((file) => {
      let url = '/' + relative(DIST, file).replace(/index\.html$/, '');
      url = url.replace(/\/+$/, '/'); // ensure trailing slash, collapse
      if (url === '/') url = '/';
      return { file, url, html: readFileSync(file, 'utf8') };
    })
    // /admin is a private, Basic-Auth-gated tool — exempt from public-page SEO asserts.
    .filter((p) => !p.url.startsWith('/admin'));
}

/** Extract every <script type="application/ld+json"> block, parsed. */
export function jsonLd(html: string): any[] {
  const out: any[] = [];
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      out.push({ __parseError: m[1].slice(0, 80) });
    }
  }
  return out;
}

/** Recursively collect every "@type" value from a JSON-LD object/graph. */
export function ldTypes(node: any, acc = new Set<string>()): Set<string> {
  if (Array.isArray(node)) node.forEach((n) => ldTypes(n, acc));
  else if (node && typeof node === 'object') {
    if (node['@type']) [].concat(node['@type']).forEach((t) => acc.add(t));
    Object.values(node).forEach((v) => ldTypes(v, acc));
  }
  return acc;
}
