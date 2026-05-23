#!/usr/bin/env bash
# Rough token budget for hot/cold memory paths (chars/4 heuristic). No API calls.
set -euo pipefail

WS="${OPENCLAW_WORKSPACE:-$HOME/.openclaw/workspace}"
MEM="${WS}/memory"
BACKUP="${HOME}/.openclaw/backup"
OUT="${BACKUP}/token-budget.json"
mkdir -p "$BACKUP"

count_file() {
  local f="$1"
  [[ -f "$f" ]] || { echo 0; return; }
  wc -c <"$f" | awk '{print int($1/4)}'
}

count_dir_md() {
  local d="$1"
  [[ -d "$d" ]] || { echo 0; return; }
  find "$d" -name '*.md' -type f 2>/dev/null | while read -r f; do
    wc -c <"$f"
  done | awk '{s+=$1} END {print int(s/4)}'
}

mem_file="${WS}/MEMORY.md"
[[ -f "$mem_file" ]] || mem_file="${MEM}/MEMORY.md"

hot_tokens=$(count_file "$mem_file")
kb_tokens=$(count_dir_md "${MEM}/kb")
daily_tokens=0
if [[ -d "$MEM" ]]; then
  daily_tokens=$(find "$MEM" -maxdepth 1 -name '????-??-??.md' -type f 2>/dev/null | while read -r f; do wc -c <"$f"; done | awk '{s+=$1} END {print int(s/4)}')
fi
archive_tokens=$(count_dir_md "${MEM}/archive")
world_snap=$(count_file "${MEM}/world/snapshots/latest.md")

total=$((hot_tokens + kb_tokens + daily_tokens))
now=$(date -u +%Y-%m-%dT%H:%M:%SZ)

cat >"$OUT" <<EOF
{
  "generated_at": "$now",
  "heuristic": "chars/4",
  "hot_memory_tokens": $hot_tokens,
  "memory_kb_tokens": $kb_tokens,
  "daily_logs_tokens": $daily_tokens,
  "archive_tokens": $archive_tokens,
  "world_snapshot_tokens": $world_snap,
  "indexed_estimate_tokens": $((hot_tokens + kb_tokens)),
  "memory_md_lines": $(wc -l <"$mem_file" 2>/dev/null | awk '{print $1}' || echo 0),
  "targets": {
    "memory_md_max_lines": 200,
    "memory_md_warn_tokens": 3000
  },
  "hints": []
}
EOF

# Hints
hints=()
if [[ $(wc -l <"$mem_file" 2>/dev/null | awk '{print $1}') -gt 200 ]]; then
  hints+=("MEMORY.md over 200 lines — run memory-janitor.sh and archive P2")
fi
if [[ $hot_tokens -gt 3000 ]]; then
  hints+=("MEMORY.md est. tokens high — compact or move detail to archive/kb")
fi
if [[ $daily_tokens -gt 8000 ]]; then
  hints+=("Many daily logs in memory/ — run archive-daily-logs.sh")
fi

# Patch hints into JSON (minimal jq-free)
if [[ ${#hints[@]} -gt 0 ]]; then
  python3 -c "
import json,sys
p=sys.argv[1]
h=sys.argv[2:]
d=json.load(open(p))
d['hints']=h
json.dump(d,open(p,'w'),indent=2)
print('hints:',len(h))
" "$OUT" "${hints[@]}"
fi

echo "token-budget: hot≈${hot_tokens} kb≈${kb_tokens} daily≈${daily_tokens} → $OUT"
cat "$OUT"
