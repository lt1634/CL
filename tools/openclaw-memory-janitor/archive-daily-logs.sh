#!/usr/bin/env bash
# Move old daily logs (memory/YYYY-MM-DD.md) to memory/archive/dailies/
# Raw dailies are NOT in qmd — archive keeps them for manual recall only.
set -euo pipefail

MEM_DIR="${OPENCLAW_MEMORY_DIR:-$HOME/.openclaw/workspace/memory}"
ARCHIVE_DIR="${MEM_DIR}/archive/dailies"
KEEP_DAYS="${ARCHIVE_DAILY_KEEP_DAYS:-14}"
DRY_RUN="${DRY_RUN:-0}"

mkdir -p "$ARCHIVE_DIR"
moved=0

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  base="$(basename "$f")"
  dest="${ARCHIVE_DIR}/${base}"
  if [[ -f "$dest" ]]; then
    echo "skip (exists): $base"
    continue
  fi
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "dry-run: would move $f -> $dest"
  else
    mv "$f" "$dest"
    echo "moved: $base -> archive/dailies/"
  fi
  moved=$((moved + 1))
done < <(
  find "$MEM_DIR" -maxdepth 1 -type f -name '????-??-??.md' -mtime "+${KEEP_DAYS}" 2>/dev/null
)

echo "archive-daily-logs: moved=$moved keep_days=$KEEP_DAYS archive=$ARCHIVE_DIR"
