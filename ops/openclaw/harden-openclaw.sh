#!/usr/bin/env bash
# 本機 OpenClaw/Hermes 權限硬化（不 commit 秘密）
set -euo pipefail

CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PATH="${HOME}/.local/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

echo "=== OpenClaw / Hermes harden ==="

perm_ok() {
  local f="$1"
  local want="$2"
  [[ -f "$f" ]] || return 0
  local got
  got="$(stat -f '%OLp' "$f" 2>/dev/null || stat -c '%a' "$f" 2>/dev/null || echo '')"
  if [[ "$got" == "$want" ]]; then
    echo "OK  $f ($got)"
  else
    echo "FIX $f ($got -> $want)"
    chmod "$want" "$f"
  fi
}

for envf in "${HOME}/.openclaw/.env" "${HOME}/.hermes/.env"; do
  perm_ok "$envf" 600
done

if [[ -d "${HOME}/.openclaw" ]]; then
  chmod 700 "${HOME}/.openclaw" 2>/dev/null || true
  [[ -d "${HOME}/.openclaw/credentials" ]] && chmod 700 "${HOME}/.openclaw/credentials" 2>/dev/null || true
fi

if command -v openclaw >/dev/null 2>&1; then
  echo ""
  echo ">> openclaw security audit --fix"
  openclaw security audit --fix 2>&1 | tail -20 || true
else
  echo "WARN: openclaw CLI not found — skip audit --fix"
fi

echo ""
echo ">> Scan workspace/memory for credential-like filenames"
FOUND=0
if [[ -d "${HOME}/.openclaw/workspace/memory" ]]; then
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    echo "WARN credential-like file in memory path: $f"
    FOUND=1
  done < <(
    find "${HOME}/.openclaw/workspace/memory" -maxdepth 3 -type f \
      \( -iname '*credential*' -o -iname '*password*' -o -iname '*secret*' \) \
      2>/dev/null | head -20
  )
fi
if [[ "$FOUND" -eq 0 ]]; then
  echo "OK  no obvious credential filenames under workspace/memory (top 3 levels)"
fi

migrate_cred_file() {
  local src="$1"
  local base
  base="$(basename "$src")"
  mkdir -p "${HOME}/.openclaw/credentials"
  chmod 700 "${HOME}/.openclaw/credentials"
  local dest="${HOME}/.openclaw/credentials/${base}"
  if [[ -f "$dest" ]]; then
    echo "SKIP $base (already in credentials/)"
    return
  fi
  mv "$src" "$dest"
  chmod 600 "$dest"
  echo "MOVED $src -> $dest"
}

if [[ -d "${HOME}/.openclaw/workspace/memory" ]]; then
  echo ""
  echo ">> Migrate *credentials*.md out of workspace/memory (R3)"
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    migrate_cred_file "$f"
  done < <(
    find "${HOME}/.openclaw/workspace/memory" -type f -iname '*credentials*.md' 2>/dev/null
  )
  echo "Tip: exclude ~/.openclaw/credentials from memory.qmd.paths in openclaw.json"
fi

echo ""
echo ">> Validate cron jobs.json"
if [[ -f "${HOME}/.openclaw/cron/jobs.json" ]]; then
  CRON_FILE="${HOME}/.openclaw/cron/jobs.json" node "${CL_ROOT}/ops/openclaw/cron-jobs-io.mjs" validate
fi

echo ""
echo "Done. Re-run: openclaw security audit --deep"
echo "R2 (dedicated user): see ops/openclaw/dedicated-user-migration.md"
