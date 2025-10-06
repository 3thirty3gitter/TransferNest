#!/usr/bin/env bash
set -euo pipefail

# Recompute call sites
grep -RIn -E 'executeNesting\s*\(' src | tee /tmp/nesting_calls.txt >/dev/null || true
files=$(cut -d: -f1 /tmp/nesting_calls.txt | sort -u)

for f in $files; do
  [[ -f "$f" ]] || continue
  # Only patch client components
  if ! grep -qE "^\s*['\"]use client['\"]" "$f"; then
    continue
  fi
  # Skip if already posting to our API
  if grep -q '/api/nesting-telemetry' "$f"; then
    echo "✅ already wired (client): $f"
    continue
  fi

  echo "-- Patching client file: $f"
  # Find lines with "const result = executeNesting(..."
  while IFS=: read -r FILE LINE REST; do
    [[ "$FILE" != "$f" ]] && continue
    code_line="$(sed -n "${LINE}p" "$f")"

    # Extract arguments inside executeNesting( ... )
    args="$(echo "$code_line" | sed -E 's/.*executeNesting[[:space:]]*\((.*)\).*/\1/')" || true
    # First two args = imagesExpr, widthExpr (trim spaces)
    imagesExpr="$(echo "$args" | awk -F, '{print $1}' | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
    widthExpr="$(echo "$args" | awk -F, '{print $2}' | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
    [[ -z "$imagesExpr" || -z "$widthExpr" ]] && { echo "   !! Could not parse args at $f:$LINE"; continue; }

    # Insert the fetch block on the next line after the assignment line
    sed -i "$((LINE+1))i \
      /* auto-telemetry */\\n      fetch(\"/api/nesting-telemetry\", {\\n        method: \"POST\",\\n        headers: { \"Content-Type\": \"application/json\" },\\n        body: JSON.stringify({ context: \"tester\", sheetWidth: $widthExpr, images: $imagesExpr, result }),\\n      }).catch(() => {});" "$f"

    echo "   -> inserted POST after line $LINE using images=[$imagesExpr], width=[$widthExpr]"
  done < <(grep -nE 'const[[:space:]]+result[[:space:]]*=[[:space:]]*executeNesting[[:space:]]*\(' "$f" || true)
done

echo "Done patching client files."
