#!/usr/bin/env bash
set -euo pipefail

echo "== Finding executeNesting call sites =="
grep -RIn -E 'executeNesting\s*\(' src | tee /tmp/nesting_calls.txt || true
files=$(cut -d: -f1 /tmp/nesting_calls.txt | sort -u)

insert_import() {
  local file="$1"
  if grep -q 'recordNestingRun' "$file"; then
    echo "  import exists: $file"
    return
  fi
  if grep -qE "^\s*['\"]use (client|server)['\"]" "$file"; then
    local line
    line=$(grep -nE "^\s*['\"]use (client|server)['\"]" "$file" | head -1 | cut -d: -f1)
    sed -i "${line}a import { recordNestingRun } from \"@/lib/nesting-telemetry\";" "$file"
  else
    sed -i "1i import { recordNestingRun } from \"@/lib/nesting-telemetry\";" "$file"
  fi
  echo "  import inserted: $file"
}

insert_call() {
  local file="$1"
  local ctx="$2"
  # For lines like: const result = executeNesting( ... )  OR  let result = executeNesting( ... )
  local matches
  matches=$(grep -nE "((const|let)[[:space:]]+result[[:space:]]*=[[:space:]]*)?executeNesting\s*\(" "$file" || true)
  if [[ -z "$matches" ]]; then
    echo "  WARN: no recognizable assignment around executeNesting in $file (manual review)"
    return
  fi
  # Insert after each explicit result assignment occurrence (safer than rewriting returns)
  while IFS=: read -r f l rest; do
    [[ "$f" != "$file" ]] && continue
    if sed -n "$l{p;q;}" "$file" | grep -qE "(const|let)[[:space:]]+result[[:space:]]*="; then
      # Avoid duplicate insertion
      if sed -n "$((l+1)),+$((l+5))p" "$file" | grep -q 'recordNestingRun'; then
        echo "  call exists near line $l in $file"
      else
        sed -i "$((l+1))i recordNestingRun({ context: \"$ctx\", sheetWidth, images: (typeof images!=='undefined'?images:[]), result });" "$file"
        echo "  call inserted after line $l in $file"
      fi
    fi
  done <<< "$matches"
}

for f in $files; do
  [[ -f "$f" ]] || continue
  # Skip client components; they cannot write with fs. We'll print a note.
  if grep -qE "^\s*['\"]use client['\"]" "$f"; then
    echo "SKIP (client component): $f  -> use API logging for this one."
    continue
  fi
  ctx="live"
  [[ "$f" == *"/nesting-tester/"* ]] && ctx="tester"
  echo "-- Patching $f  (context=$ctx)"
  insert_import "$f"
  insert_call "$f" "$ctx"
done

echo "== Done. Build & run something, then check logs =="
echo "tail -n 5 data/nesting-runs.jsonl || echo 'No runs yet'"
