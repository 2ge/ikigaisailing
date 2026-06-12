/**
 * Pure text/HTML formatting helpers (no astro:content deps, so unit-testable).
 */

/**
 * Render a stored translation string (testimonial `translations[locale]`) to HTML
 * for `set:html`, mirroring how the original markdown body renders: blank lines
 * become paragraph breaks, and every remaining newline (incl. markdown `  \n`
 * hard breaks) becomes a <br>. The old code only replaced `\n\n`, so single-line
 * breaks collapsed to spaces and the translation rendered as one run-on block.
 * Escapes HTML so the trusted-but-plain review text can't inject markup.
 */
export function translationToHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/[ \t]*\n/g, '<br>')}</p>`)
    .join('');
}
