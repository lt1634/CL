#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/home" "$TMP/ws"

HOME="$TMP/home" OPENCLAW_WORKSPACE="$TMP/ws" \
  bash "$ROOT/tools/openclaw-memory-janitor/token-estimate.sh" >"$TMP/out"

python3 - "$TMP/home/.openclaw/backup/token-budget.json" <<'PY'
import json
import sys
from pathlib import Path

p = Path(sys.argv[1])
d = json.loads(p.read_text(encoding="utf-8"))
assert d["hot_memory_tokens"] == 0
assert d["memory_md_lines"] == 0
assert isinstance(d["hints"], list)
PY

echo "token-estimate tests passed"
