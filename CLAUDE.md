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

## Publishing contract (how changes go live — applies to EVERY session)

Production (`ikigaisailing.com` / `ikigai.2pu.net`) updates **only** by merging a PR on
`github.com/2ge/ikigaisailing`. CI (`.github/workflows/deploy.yml`) builds and deploys on merge.

- **NEVER run `wrangler pages deploy`** — the deploy token was removed from `.env` on purpose.
  Direct deploys bypass git history and break the owner's ability to revert selectively.
- **Never push to `main`** (blocked server-side). Never force-push.
- For every change request: work on a topic branch → commit → push → `gh pr create` → reply in
  chat with **both** the PR link and the preview URL
  (`https://<branch>.ikigai-sailing.pages.dev` — also auto-commented on the PR within ~2 min).
- If the user said to publish / make it live (or clearly wants it live now): **merge the PR
  immediately** after CI passes — don't wait for them to review. Reply "live in ~2 min" + the
  page URL. If they want to check first, stop at the PR and merge on their go-ahead.
- **Undo requests** ("undo X", "put it back how it was"): `git revert` the relevant merge/commit
  on a branch → PR → merge. Same one-step contract as publishing.
- **One topic per PR.** Small PRs keep every change independently revertible — never bundle
  unrelated changes.

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

## Common owner operations (the editing contract)

The owner edits this site exclusively by instructing Claude Code. Every operation must stay one-step:

- **Publish a post:** "Write a blog post about lobster season in San Blas, optimize for 'San Blas lobster veda'" → geo-writer rules, create `src/content/blog/en/<slug>.md`, `npm run translate`, build → branch + PR + merge per the publishing contract (Cloudflare deploys on merge).
- **Change a price:** "Change the season page price to €1.450/week and update Stripe" → edit the trip's EN frontmatter (`price`) → translate → build → output the Stripe CLI command for the owner.
- **Add a testimonial:** "Add a testimonial from Trustpilot, here's the text" → new file in `src/content/testimonials/` with `locale` = its original language → it appears everywhere automatically.
- **Update the route:** "We arrived in Galápagos — update the route page and llms.txt" → edit EN content, re-run translate; llms.txt regenerates at build.

## Skills, hooks & MCP (Phase 8 tooling)

- Skills in `.claude/skills/`: **seo-audit** (run before deploys/after structural changes), **geo-writer** (ALL copywriting), **perf-budget** (any component/script/image/font/tag), **translate** (any EN content change). Follow them — they are the quality bar.
- For any substantial styling/visual task, use Anthropic's **frontend-design** skill (installed globally) to avoid generic AI aesthetics.
- PostToolUse hook runs `scripts/quality-gate.sh` on every Edit/Write (astro check + build for code, staleness check for content). Pre-push git hook runs Playwright.
- MCP servers in `.mcp.json`: chrome-devtools (perf traces), cloudflare-docs/bindings, stripe, gsc (needs `.secrets/gsc-service-account.json` — see README for service-account setup).

## Monthly SEO loop (owner routine, run on request: "do the monthly SEO pass")

1. Via GSC MCP: pull last 28 days of queries; find pages ranking positions 5–15 with high impressions ("striking distance").
2. For each: strengthen with geo-writer (sharper direct answer, expanded FAQ, internal links from related posts) → `npm run translate`.
3. Check Core Web Vitals field data (CrUX via chrome-devtools MCP) — fix any page whose real-user LCP/CLS regressed.
4. Write 2 new blog posts targeting query gaps GSC reveals (questions searched that no page answers).
5. Run the seo-audit skill; commit; deploy.
