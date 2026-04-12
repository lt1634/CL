#!/usr/bin/env bash
# MEMORY.md line budget check for OpenClaw hot memory.
# Env: OPENCLAW_MEMORY (default: $HOME/.openclaw/workspace/memory)
set -euo pipefail
MEM_DIR="${OPENCLAW_MEMORY:-$HOME/.openclaw/workspace/memory}"
MEM_FILE="$MEM_DIR/MEMORY.md"
MAX=200
WARN=220
if [[ ! -f "$MEM_FILE" ]]; then
  echo "memory-janitor: missing $MEM_FILE"
  exit 1
fi
count=$(wc -l < "$MEM_FILE" | awk '{print $1}')
echo "memory-janitor: MEMORY.md lines=$count (target <= $MAX)"
if [[ "${count}" -gt "${WARN}" ]]; then
  echo "memory-janitor: WARN over ${WARN} lines — trim [P2], move detail to memory/archive/ or memory/kb/; update memory/qmd-root symlinks if you add root curated files."
  exit 1
fi
if grep -q '^## \[P2\]' "$MEM_FILE"; then
  p2_n=$(awk '/^## \[P2\]/{p=1;next} /^## \[/ && p{exit} p' "$MEM_FILE" | grep -cve '^[[:space:]]*$' 2>/dev/null || echo 0)
  echo "memory-janitor: [P2] non-blank lines (approx)=$p2_n"
  if [[ "${p2_n}" -gt 25 ]]; then
    echo "memory-janitor: HINT [P2] bulky — consider moving old bullets to memory/archive/MEMORY-shed-$(date +%Y-%m-%d).md"
  fi
fi
exit 0
