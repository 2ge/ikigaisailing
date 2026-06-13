---
name: geo-writer
description: Writing rules for ALL page copy and blog posts on this site. Use whenever creating or editing any human-visible content — pages, trips, activities, landing pages, blog posts. Enforces the Ikigai voice, anti-AI-slop craft rules + banned list, GEO structure, fact discipline, and the keyword architecture.
---

# GEO writer

Write the way a sharp human expert writes for people they respect — someone with real opinions and real time on the water. The Ikigai voice already exists on the old site (warm, philosophical, anti-commercial, transformation-first). **Keep that soul. Cut the AI tics it was full of.** That's the whole brief.

## Brief — fill this before writing
```
Type:        blog post | landing page | trip | activity | geo landing
Topic:       …
Primary kw:  … (from src/data/seoKeywords.ts — the single source)
Secondary:   2–3 spoke terms from the same cluster
Audience:    who they are, what they already know, what they fear/want
Length:      ~N words
Page role:   worldwide-evergreen (activity) OR geo (/panama/san-blas/…) — sets the keyword
```

## Voice — the Ikigai soul (keep)
- **First-person-plural crew** ("we anchor in", "our galley", "Luca coaches"). Concrete, sensory, lived.
- **Transformation, not vacation.** The sea resets the nervous system; this is a way of living, not a package. That undercurrent is the brand.
- **Take the anti-commercial position out loud.** "We're not a floating spa. Not a luxury resort. Not a yoga hotel." Asymmetry is human — say what we are *and aren't*.
- **Non-profit framing wherever price appears:** payments are **member contributions** to an ASD (CONI-recognized, MSP Italia affiliated), not commercial fees — and that's *why* it costs a fraction of a charter.

## Craft — the rules that kill the slop
- **Vary sentence length aggressively.** Short punchy line next to a long winding one. Fragments are fine. Never three sentences in a row with the same rhythm. (The old posts failed exactly here — all long, all even.)
- **Concrete and specific.** Real numbers, named places, actual trade-offs: 28 °C water, AIDA certs, a 4×4 over the Guna Yala ridge, what breakfast smells like. No claim that could apply to any other business.
- **Take positions.** State what's better and why. One clear statement beats three hedged ones. Kill "on one hand / on the other".
- **Contractions, natural phrasing.** Write like you talk.
- **Cut every empty transition and filler.** Delete the sentence and see if anything's lost.
- **Reread test:** any sentence that could appear in an article on *any* topic is wrong — rewrite it.

## Banned — never use
**Words:** delve, tapestry, testament, navigate/navigating, realm, landscape (figurative), foster, leverage (verb), robust, seamless, crucial, vital, elevate, unlock, embark, dive into, ever-evolving, unforgettable, hidden gem, paradise on earth, once in a lifetime, breathtaking, nestled.
**Phrases:** "in today's [X] world", "it's important/worth noting", moreover, furthermore, in conclusion, that said, "when it comes to", "it's not just X, it's Y", "whether you're A or B".
**Structures:** rhetorical question as a section opener; rule-of-three lists by default ("fast, reliable, affordable"); a closing paragraph that restates what was already said; hedging every claim.

## GEO structure (every page/post)
1. **40–60 word direct answer** to the page's core question, before any storytelling. Primary keyword sits here naturally.
2. **H2s that describe real content** (not keyword-stuffed, not rhetorical questions). Question-shaped is fine when it's a real question someone asks.
3. At least one **self-contained citable passage, 130–160 words**, with concrete facts (price model, Catana 47 specs, dates, coordinates) — must make sense quoted alone by an AI engine.
4. **FAQ** on every commercial page → renders as FAQPage JSON-LD.

## Keywords (architecture)
- **Single source of truth: `src/data/seoKeywords.ts`.** Each page targets exactly one primary + its spokes. Check `/admin/seo` for the page's assigned cluster and current GSC rank.
- **Activity pages = worldwide terms** (e.g. "yoga sailing retreat", "freediving liveaboard"). **Geo pages (/panama/san-blas/…) = the regional term** ("yoga retreat san blas panama"). Strict split — never make the two compete.
- Primary phrase in: title, first 100 words, one H2 — invisibly. Spokes appear naturally in the body; spoke blog posts link up to their hub with descriptive anchor text.

## Facts
- Facts come ONLY from repo content (`src/content/`, `docs/`, CLAUDE.md "Key facts") or explicit owner input. Assumed → `<!-- TODO: verify -->` + flag it in the summary.
- Never invent variants of contact / legal / boat data.

## Workflow
Write EN first → `npm run translate` (DeepL → it/es/fr/sk) → spot-check IT for naturalness → SK keeps `needsReview: true` for the owner's native pass.
