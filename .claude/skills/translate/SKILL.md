---
name: translate
description: Translation workflow for the 5-locale content model. Use whenever EN content is created or edited, when the user mentions translations or languages, or when locale files look stale. Runs the DeepL pipeline and enforces the EN-source-of-truth rules.
---

# Translate

## The model

- **EN is the source of truth.** `src/content/<collection>/en/...` and the EN values in `src/i18n/ui.ts`.
- **IT is human-maintained** (extracted from the live WordPress site). Files WITHOUT
  `translated: deepl` are human — **never overwrite them**, never "improve" them unprompted.
- **ES/FR/SK are DeepL-generated** (`translated: deepl` + `sourceHash` frontmatter).
  Never hand-write or hand-edit them — fix the EN source and re-run the pipeline.
  Exception: terminology fixes belong in `scripts/glossary.csv`, then re-translate.

## Workflow

1. After any EN content change: `npm run translate` (incremental — only files whose EN
   `sourceHash` changed are touched; DeepL key from `.env`).
2. After the run, report: DeepL character usage (the script prints it; abort threshold 80% of quota),
   and the list of files marked `needsReview: true` (SK) for the owner's native pass.
3. New brand/nautical terms encountered (boat parts, place names, activity names) →
   add to `scripts/glossary.csv`, run the glossary push command, then translate.
4. The CI staleness check (`npm run translate -- --check`) must pass before any commit
   touching content — a failing check means EN changed without re-running the pipeline.
