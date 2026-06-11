---
name: seo-audit
description: Run the full SEO validation pass over the built site. Use after any structural/layout/head change, when adding a new page type, before any deploy, and whenever the user asks to check SEO. Validates JSON-LD, hreflang, titles/descriptions, broken links, redirects coverage, sitemap, robots.txt, llms.txt.
---

# SEO audit

Run against a fresh build: `npm run build` first, then audit `dist/`.

## Checks (all must pass — fix failures before finishing the task)

1. **JSON-LD** — for one URL of every page type (home, trip, activity, blog post, season page, reviews):
   extract every `<script type="application/ld+json">`, `JSON.parse` it (zero tolerance for parse errors),
   and check required fields per type: `Organization` (name, url, logo, address, sameAs),
   `Product`/`TouristTrip` (name, offers.price, offers.priceCurrency), `Article` (headline, datePublished, author),
   `FAQPage` (mainEntity Q/A pairs), `BreadcrumbList` (itemListElement positions).
2. **hreflang** — every page emits exactly 6 alternates (en, it, es, fr, sk, x-default); each href
   must exist as a file in `dist/` (locally) and resolve 200 (on preview). x-default → EN.
3. **Head hygiene** — exactly one `<h1>` per page; `<title>` ≤ 60 chars; meta description present,
   120–160 chars, unique across pages (hash them all, report duplicates).
4. **Links & images** — crawl `dist/` HTML for internal `href`/`src`; every internal target must exist.
   No hotlinks to `www.ikigaisailing.com/wp-content/` (everything must be local).
5. **Redirects** — every old URL in `CONTENT-INVENTORY.md` must have a row in `public/_redirects`
   (301 → an existing new page).
6. **Sitemap** — `dist/sitemap-*.xml` contains all 5 locale variants of every indexable page.
7. **robots.txt** — explicitly allows `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `CCBot`.
8. **llms.txt** — exists in `dist/`, was regenerated this build (its content must reference current
   trips/pages — spot-check one recently changed title appears).

## Output

Print a compact PASS/FAIL table (one row per check, with counts). On FAIL: fix, rebuild, re-run.
A task that touched structure/head/content is NOT complete until this passes.
