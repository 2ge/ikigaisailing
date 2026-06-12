# Ikigai Sailing

Modern, fast, AI-editable rebuild of [ikigaisailing.com](https://www.ikigaisailing.com) — a non-profit sailing crew running mindful trips aboard the Catana 47 *Ikigai* in San Blas, Panama.

**Stack:** Astro 6 (static) · Tailwind 4 · content collections · 5-locale i18n · DeepL translation pipeline · Cloudflare Pages + Pages Functions · Stripe Checkout · self-hosted Listmonk.

> **Claude Code is the CMS.** You edit this site by instructing Claude Code in natural language. See [`CLAUDE.md`](./CLAUDE.md) for the editing contract and rules.

## Architecture

```
src/
  content/<collection>/<locale>/<slug>.md   pages, trips, activities, testimonials, blog
  i18n/                  ui strings (strings.<locale>.json) + nav + helpers
  components/            one component per file (Header, Footer, TripCard, …)
  layouts/               BaseLayout (head/SEO/analytics) → PageLayout (header/footer)
  pages/[...locale]/     i18n route tree (rest param = locale; '' = en)
  lib/                   content + schema (JSON-LD) helpers
  assets/                originals, rendered via astro:assets (<Image>)
functions/api/           Pages Functions: checkout, stripe-webhook, contact, subscribe
scripts/                 translate, gen-redirects, gen-llms, verify-redirects
infra/listmonk/          docker-compose + haproxy stanza + campaign template
```

EN is the source of truth. IT is human-maintained (extracted from the old site). ES/FR/SK are
DeepL-generated (`translated: deepl` + `sourceHash`). SK files carry `needsReview: true`.

## Run locally

```bash
npm install
npm run dev          # http://localhost:4321 (proxied as https://ikigai.2pu.net on aidev)
npm run build        # prebuild generates _redirects + llms.txt, then astro build → dist/
npm run preview
```

Pages Functions (Stripe/contact/newsletter) need `wrangler pages dev dist` with a `.dev.vars`
file (copy `.dev.vars.example`).

## Edit content (common operations)

| You want to… | Do |
|---|---|
| Add a blog post | create `src/content/blog/en/<slug>.md` → `npm run translate` → build → commit |
| Change a trip price | edit the trip's EN `price` → `npm run translate` → build (+ Stripe CLI cmd) |
| Add a testimonial | new file in `src/content/testimonials/<lang>/` with `locale` = its language |
| Update the route | edit EN `route.md` → `npm run translate` (llms.txt regenerates on build) |

Translations: `npm run translate` (incremental). Glossary in `scripts/glossary.csv`;
re-push with `npm run translate -- --push-glossaries`.

## Deploy (Cloudflare Pages)

1. Create the Pages project (one-time): connect this repo in the Cloudflare dashboard, or
   `wrangler pages project create ikigai-sailing --production-branch main`.
2. Build command `npm run build`, output `dist/`. Functions in `functions/` deploy automatically.
3. Pushes to `main` deploy production; branch pushes get preview URLs.
4. **Custom domain:** add `www.ikigaisailing.com` + apex in Pages → Custom domains. Keep the old
   WordPress at `old.ikigaisailing.com` for 60 days. Verify redirects:
   `scripts/verify-redirects.sh https://ikigai-sailing.pages.dev`.
5. GSC verification token is already in `BaseLayout.astro`. Submit `sitemap-index.xml` in Search
   Console + Bing.

### Cloudflare dashboard toggles (Speed/Caching)

Early Hints **ON**, HTTP/3 **ON**, Brotli **ON**, Speed Brain **ON**,
Rocket Loader **OFF** (conflicts with Astro), Auto Minify **OFF** (Astro already minifies).

## Secrets

Never committed. Build-time in `.env`; runtime via `wrangler pages secret put <NAME>` (or dashboard).

| Name | Where | Purpose |
|---|---|---|
| `DEEPL_API_KEY` | `.env` / CI | translation pipeline (build-time only) |
| `CLOUDFLARE_API_TOKEN` | `.env` / CI | Pages deploy |
| `STRIPE_SECRET_KEY` | Pages secret | checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Pages secret | webhook signature verify |
| `RESEND_API_KEY`, `CREW_EMAIL` | Pages secret | transactional email |
| `TURNSTILE_SECRET` | Pages secret | contact form anti-spam |
| `LISTMONK_URL`, `LISTMONK_API_KEY`, `LISTMONK_*_LIST_ID` | Pages secret | mailing |
| `GEMINI_API_KEY` | Pages secret | "Ask Ikigai" concierge (Google Gemini) |
| `GEMINI_MODEL` | Pages var (optional) | concierge model override (default `gemini-flash-latest`) |
| `CONCIERGE_DAILY_BUDGET_USD` | Pages var (optional) | concierge daily spend cap (default `2`) |
| `PUBLIC_UMAMI_SRC`, `PUBLIC_UMAMI_ID` | `wrangler.toml` vars | analytics (public) |

## "Ask Ikigai" concierge (Phase 10)

A chat widget (bottom-right, lazy-loaded — 0 KB until clicked) answering visitor
questions **strictly from site content**, in the visitor's language, handing off to
WhatsApp when it can't help.

- **Model:** Google **Gemini** (`gemini-flash-latest`) via `functions/api/concierge.ts`,
  SSE-streamed. Thinking disabled for fast, short answers. Free-tier friendly.
- **Knowledge:** `scripts/gen-knowledge.ts` compiles all EN content into
  `functions/api/_knowledge.ts` on every build (never stale). Editable rules in
  `src/concierge/system-prompt.md`.
- **Guardrails:** 10 turns/conversation, 500 chars/message, 20 requests/hour/IP,
  `$2`/day budget cap, Turnstile on the first message — all via the `CONCIERGE_KV`
  namespace (bound in `wrangler.toml`).
- **Escalation log:** every WhatsApp hand-off is logged to KV. `npm run concierge:report`
  lists the unanswered questions — exactly the FAQ items / blog posts to write next
  (feeds the monthly SEO loop). Needs a `CLOUDFLARE_KV_TOKEN` (Workers KV read) in `.env`.
- **Swap provider:** the only provider-specific code is the upstream `fetch` in
  `concierge.ts`; the widget/KV/limits are agnostic.

## Stripe (Phase 4)

Create one Product + Price (EUR) per bookable trip, then put the price IDs into
`functions/api/checkout.ts` (`TRIP_PRICES`) and each trip's `stripePriceId` frontmatter:

```bash
stripe products create --name "Ikigai Experience"
stripe prices create --product <prod_id> --unit-amount 30000 --currency eur
# members-only trips (one-month, pacific-crossing, crew-exchange) use the request-access flow — no price
```

Webhook: point `https://<domain>/api/stripe-webhook` at `checkout.session.completed`,
copy the signing secret to `STRIPE_WEBHOOK_SECRET`.

## Mailing — Listmonk

See [`infra/listmonk/README.md`](./infra/listmonk/README.md).

## Tooling (Phase 8)

- **Skills** (`.claude/skills/`): `seo-audit`, `geo-writer`, `perf-budget`, `translate`.
- **MCP** (`.mcp.json`): chrome-devtools, cloudflare-docs/bindings, stripe, gsc.
  GSC needs a service account JSON at `.secrets/gsc-service-account.json` (enable the Search
  Console API, add the service account as a user on the GSC property).
- **Hooks**: `scripts/quality-gate.sh` runs on every edit; pre-push runs Playwright.
- Monthly SEO loop + keyword strategy: `docs/SEO-STRATEGY.md`, `CLAUDE.md`.

## Inventories

- `CONTENT-INVENTORY.md` — every old URL → content file → new URL (+ review flags).
- `ASSET-MANIFEST.md` — every original upload → local asset → pages used on.
