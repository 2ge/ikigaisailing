# imgindex — semantic image search for the media library

Find site photos by describing them (`"freediving at sunset"`, `"yoga on deck, warm light"`)
instead of remembering filenames. Built for the Claude-as-CMS workflow: *"drop the best 3
kite-on-the-water shots into this post"* becomes one query.

## How it works (no GPU, Gemini API key only)

```
image → Gemini 2.5 Flash caption + tags → gemini-embedding-001 (768-dim) → pgvector (cosine)
query text ───────────────────────────→ gemini-embedding-001 ──────────→ ORDER BY <=> LIMIT K
```

Caption-then-embed because the Gemini **API** key can't do Vertex multimodal image embeddings.
To upgrade to true visual embeddings later, swap `embed()` for Vertex `multimodalembedding`
(or local SigLIP if a GPU appears) — the pgvector half is unchanged.

## Setup (already done on the aidev box)

- **DB:** dedicated `ikigai` role + database on the shared PG16 cluster (`5432`), `vector` ext
  enabled. Table `image_index (path, source, caption, tags, sha, embedding vector(768))` with an
  HNSW cosine index. `sha` lets re-runs skip unchanged files.
- **Secrets** in `.dev.vars` (gitignored): `GEMINI_API_KEY`, `IMGIDX_DATABASE_URL`.
- DB access via `psql` (no node deps). Needs `convert` (ImageMagick) only to read `.avif`.

## Use

```bash
npm run img:index                 # index/refresh all of src/assets (incremental via sha)
npm run img:index src/assets/trips   # just one subtree
npm run img:query "kitesurfer on flat turquoise water" 8
npm run img:stats
```

Cost is index-time only (~1 Flash call + 1 embed per image, cents for the whole library);
queries are free local pgvector lookups. Re-run `img:index` after adding new assets.
