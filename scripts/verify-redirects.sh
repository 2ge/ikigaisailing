#!/bin/bash
# Verify every old WordPress URL in CONTENT-INVENTORY.md / public/_redirects
# 301s to a 200. Usage: scripts/verify-redirects.sh https://ikigai-sailing.pages.dev
set -uo pipefail
BASE="${1:-https://www.ikigaisailing.com}"
REDIR="$(dirname "$0")/../public/_redirects"
fail=0 ok=0

while IFS= read -r line; do
  [[ "$line" =~ ^# || -z "$line" ]] && continue
  from=$(awk '{print $1}' <<<"$line")
  to=$(awk '{print $2}' <<<"$line")
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$from")
  loc=$(curl -s -o /dev/null -w '%{redirect_url}' "$BASE$from")
  if [[ "$code" == "301" || "$code" == "308" ]]; then
    ok=$((ok+1))
  else
    echo "FAIL $from → got $code (expected 301 → $to)"
    fail=$((fail+1))
  fi
done < "$REDIR"

echo "redirects: $ok ok, $fail failed"
exit $((fail > 0 ? 1 : 0))
