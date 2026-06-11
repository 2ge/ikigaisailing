#!/bin/bash
# PostToolUse(Edit|Write) quality gate — fast (<30s) sanity pass.
# Full Lighthouse/seo-audit runs via skills + CI, not here.
# Reads the hook JSON from stdin; exits 0 always (advisory), prints PASS/FAIL.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 0

INPUT=$(cat 2>/dev/null || true)
FILE=$(printf '%s' "$INPUT" | python3 -c "import json,sys
try: print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))
except Exception: print('')" 2>/dev/null)

# Only gate repo files
case "$FILE" in
  "$PWD"/*) REL="${FILE#"$PWD"/}" ;;
  *) exit 0 ;;
esac

fail() { echo "quality-gate: FAIL ($1) — $REL"; exit 0; }

case "$REL" in
  src/content/*)
    # content edit → staleness check only (cheap)
    if [ -f scripts/translate.ts ]; then
      npm run --silent translate -- --check >/dev/null 2>&1 || fail "translations stale — run: npm run translate"
    fi
    echo "quality-gate: PASS — $REL"
    ;;
  src/*|functions/*|astro.config.mjs|tsconfig.json)
    OUT=$(npx astro check --minimumSeverity error 2>&1) || { echo "$OUT" | tail -5; fail "astro check"; }
    OUT=$(npm run --silent build 2>&1) || { echo "$OUT" | tail -5; fail "build"; }
    echo "quality-gate: PASS — $REL"
    ;;
  *) exit 0 ;;
esac
