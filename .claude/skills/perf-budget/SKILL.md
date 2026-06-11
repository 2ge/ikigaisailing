---
name: perf-budget
description: Performance budget enforcement. Use when adding any component, script, image, font, iframe, or third-party tag, and before declaring any visual/page work done. Hard Core-Web-Vitals budgets verified with Chrome DevTools MCP against the local preview.
---

# Performance budget

## Hard budgets (mobile, throttled — non-negotiable)

| Metric | Budget |
|---|---|
| LCP | < 1.8 s |
| CLS | < 0.05 |
| INP | < 200 ms |
| Client JS (gzipped, total) | < 50 KB |
| Render-blocking third-party requests | 0 |

## How to verify

1. `npm run build && npm run preview` (or use the running dev preview for iteration,
   but final numbers come from a production build).
2. Via **Chrome DevTools MCP**: open the page, run a performance trace + Lighthouse audit
   at mobile (375px) and desktop viewports.
3. Iterate until budgets pass. Audit at minimum: home, season page, one trip, one blog post.

## Rules

- All images via `astro:assets` `<Image>` with explicit dimensions — zero layout shift.
- Fonts: self-hosted, `font-display: swap`, subset, **max 2 families** (Figtree + Fraunces).
- GTM + Meta pixel load via Partytown or `requestIdleCallback` — never in the critical path.
- No client-side framework hydration unless a component is genuinely interactive
  (lightbox and mobile menu are vanilla JS).
- Iframes (noforeignland map, YouTube) always `loading="lazy"` behind a click/scroll facade.

## Exceptions

Any budget exception must be added to this file with its justification. Current exceptions: none.
