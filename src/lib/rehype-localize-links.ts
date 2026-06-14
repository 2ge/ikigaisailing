import { visit } from 'unist-util-visit';
import { localizeSegment, isItemRoot, localizeItemSlug } from '../i18n/segments';

/**
 * Rehype plugin — localize internal links in body markdown.
 *
 * Content body copy is written with EN-canonical links (e.g. `/activities/x/`,
 * `/panama/san-blas/x/`). On a non-EN page that would send readers to the EN
 * URL. This rewrites every root-relative internal link to the content file's
 * OWN locale (read from its path: src/content/<collection>/<locale>/...), so the
 * IT page links to `/it/attivita/x/`, ES to `/es/actividades/x/`, etc.
 *
 * Authors keep writing plain EN-canonical links — localization is automatic and
 * impossible to forget. EN files are a no-op. Idempotent: any existing locale
 * prefix is stripped before re-localizing, so already-localized links are safe.
 */
function localizePath(path: string, locale: string): string {
  const clean = path.replace(/^\/(it|es|fr|sk)(\/|$)/, '/');
  const m = clean.match(/^([^?#]*)([?#].*)?$/);
  const pathname = m?.[1] ?? clean;
  const tail = m?.[2] ?? '';
  const segs = pathname.split('/');
  const out = segs.map((seg) => (seg ? localizeSegment(seg, locale as any) : seg));
  // localize the collection ITEM slug too (mirror i18n/ui.ts localizePath)
  if (isItemRoot(segs[1]) && segs[2]) out[2] = localizeItemSlug(segs[1], segs[2], locale as any);
  else if (segs[1] === 'panama' && segs[2] === 'san-blas' && segs[3]) out[3] = localizeItemSlug('landings', segs[3], locale as any);
  return `/${locale}${out.join('/')}` + tail;
}

export default function rehypeLocalizeLinks() {
  return (tree: any, file: any) => {
    const path: string = file?.path || file?.history?.[0] || '';
    const locale = path.match(/[/\\]content[/\\][^/\\]+[/\\](it|es|fr|sk)[/\\]/)?.[1];
    if (!locale) return; // EN, or a file outside the localized content tree → leave as-is
    visit(tree, 'element', (node: any) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      // root-relative internal links only — skip external, protocol-relative, anchors, mailto
      if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return;
      node.properties.href = localizePath(href, locale);
    });
  };
}
