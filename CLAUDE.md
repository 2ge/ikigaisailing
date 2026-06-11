# Ikigai Sailing — ikigaisailing.com rebuild

Astro 6 (static) + Tailwind 4. Five locales. Deployed to Cloudflare Pages. Claude Code IS the CMS — every owner request ("change the hero text", "add a testimonial", "write a post about X") must be a one-step file edit.

## Hard rules

- **All human-visible text lives in `src/content/` or `src/i18n/ui.ts`** — never hardcoded in components. UI strings exist for all 5 locales (en/it/es/fr/sk).
- **Content layout:** `src/content/<collection>/<locale>/<slug>.md`. **EN is the source of truth.** IT is human-maintained (extracted from the live WordPress site) — never overwrite it. ES/FR/SK are DeepL-generated and carry `translated: deepl` + `sourceHash` in frontmatter — never hand-edit those except for terminology fixes; fix the EN source and re-run the pipeline instead.
- **Translate:** `npm run translate` (incremental — only touches files whose EN `sourceHash` changed). DeepL key in `.env` (`DEEPL_API_KEY`), build-time only.
- **Slugs are identical across locales** (`/es/trips/ikigai-experience/`) — localized H1/meta carry the keywords, never the slug.
- **Images** go in `src/assets/<section>/` and render through `astro:assets` `<Image>` (auto AVIF/WebP). Keep originals full-resolution; never pre-shrink. Track every asset in `ASSET-MANIFEST.md`.
- **One component = one file** in `src/components/`. Layouts in `src/layouts/`.
- **`npm run build` must pass with zero errors before committing.** Run `npm run test` (Playwright) before pushing.
- Conventional commits: `feat:`, `fix:`, `content:`, `seo:`.
- Never commit secrets — `.env` / `.dev.vars` are gitignored; runtime secrets go via `wrangler pages secret`. See `.dev.vars.example`.

## GEO content rules (every page/post)

1. Lead with a 40–60 word direct answer/summary before any storytelling.
2. Question-shaped H2s where natural ("How much does a week in San Blas on a catamaran cost?").
3. Self-contained citable passages (~130–160 words) with concrete facts: prices, dates, boat specs, locations.
4. FAQ section on every trip page and the season page (renders as `FAQPage` JSON-LD).
5. Mention the non-profit structure where pricing appears: payments are **member contributions** to an ASD (CONI-recognized, MSP Italia affiliated), not commercial fees — see `docs/SEO-STRATEGY.md`.

## Key facts (do not invent variants)

- WhatsApp: +39 331 32 926 29 → `https://wa.me/393313292629`
- Legal: Ikigai Sailing ASD, Via Gorlago 37 – 00135 Roma (RM), C.F. 96511650580
- Socials: Facebook, YouTube, Instagram `@ikigaisailing_asd`
- Boat: Catana 47 catamaran. Skippers: AIDA + Apnea Total certified (freediving), RYA Yachtmaster.
- Sailing since 2022, 20+ countries, 10,000+ miles. 2027: Pacific crossing.
- GSC verification token lives in `BaseLayout.astro` — keep it.

## Dev on this box

- Dev preview: https://ikigai.2pu.net → haproxy → `127.0.0.1:3014` (PM2 app `ikigai` runs `npm run dev`). Port 3014 is claimed in `~/projects/PORTS.md`.
- `docs/SEO-STRATEGY.md` — direct-booking keyword portfolio (10 landing pages + 50 blog spokes).
- `CONTENT-INVENTORY.md` — every old WP URL → content file → new URL (drives `public/_redirects`).

## Common owner operations

- **Publish a post:** create `src/content/blog/en/<slug>.md` with frontmatter → `npm run translate` → `npm run build` → commit + push (Cloudflare deploys automatically).
- **Change a price:** edit the trip's EN frontmatter (`price`) → translate → build; if Stripe price changes, output the Stripe CLI command for the owner.
- **Add a testimonial:** new file in `src/content/testimonials/` with `locale` = its original language → it appears everywhere automatically.
