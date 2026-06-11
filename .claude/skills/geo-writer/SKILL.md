---
name: geo-writer
description: Writing rules for ALL page copy and blog posts on this site. Use whenever creating or editing any human-visible content — pages, trips, activities, blog posts, landing pages. Enforces the crew voice, GEO (generative-engine-optimization) structure, fact discipline, and the keyword strategy.
---

# GEO writer

## Voice

- Warm, first-person-plural **crew voice** ("we anchor", "our galley"). Concrete and sensory.
- No marketing clichés. **"unforgettable experience" is banned** — show, don't claim.
  Same for "hidden gem", "paradise on earth", "once in a lifetime" — replace with specifics
  (water temperature, anchorage names, what breakfast smells like).
- The non-profit framing appears wherever pricing does: payments are **member contributions**
  to an ASD (CONI-recognized, MSP Italia affiliated), not commercial fees.

## Structure (every page/post)

1. Open with a **40–60 word direct answer** to the page's core question, before any storytelling.
2. **Question-shaped H2s** where natural ("How much does a week in San Blas on a catamaran cost?").
3. At least one **self-contained citable passage of 130–160 words** with concrete facts:
   prices, dates, boat specs (Catana 47), coordinates, seasons. It must make sense quoted alone.
4. **FAQ section** on every commercial page (trips, season, landing pages) — renders as FAQPage JSON-LD.

## Facts

- Facts come ONLY from repo content (`src/content/`, `docs/`) or explicit owner input.
- Anything assumed gets `<!-- TODO: verify -->` and a mention in the task summary.
- Canonical facts live in CLAUDE.md "Key facts" — never invent variants of contact/legal/boat data.

## Keywords

- Exactly **one primary cluster per page** — see `docs/SEO-STRATEGY.md` for the portfolio.
- Primary phrase appears in: H1, first paragraph, meta description. Never stuffed beyond that.
- Spoke posts link to their hub landing page with descriptive anchor text.

## Workflow

Write EN first → `npm run translate` → spot-check IT output for naturalness (it's the second
biggest audience) → SK files keep `needsReview: true` for the owner's native pass.
