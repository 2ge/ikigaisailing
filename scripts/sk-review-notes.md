# Slovak (SK) review notes — for the owner's native pass

DeepL's formality control does not support Slovak, so SK output may oscillate between
tykanie/vykanie. All generated SK files carry `needsReview: true` until reviewed.

When reviewing:

1. **Tone**: the brand voice is warm and informal — prefer **tykanie** ("nalodíš sa", not
   "nalodíte sa") to match the EN/IT register, unless it reads unnatural in context.
2. **Nautical terms**: DeepL sometimes picks awkward calques. Preferred terms:
   katamarán, kormidlo, kotvisko, plavba, posádka. "Liveaboard" stays English (glossary).
3. **Protected names** must survive verbatim: Ikigai Sailing, Catana 47, San Blas, Guna Yala,
   Janzu, CONI, MSP Italia (see `scripts/glossary.csv`).
4. After fixing a file, remove its `needsReview: true` line. Do NOT remove `translated: deepl`
   or `sourceHash` — they keep the pipeline incremental.
5. Recurring fixes → tell Claude to add the term to `scripts/glossary.csv` and re-push
   glossaries (`npm run translate -- --push-glossaries`) so future runs get it right.
