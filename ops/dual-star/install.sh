#!/usr/bin/env bash
# 雙星運維初始化：submodule + 本機檢查（唔覆寫 ~/.openclaw/.env / ~/.hermes/.env）
set -euo pipefail

CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PATH="${HOME}/.local/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

echo "=== CL dual-star install ==="
echo "CL_ROOT: $CL_ROOT"
echo ""

cd "$CL_ROOT"

if [[ -f .gitmodules ]]; then
  echo ">> git submodule update --init vendor/hermes-agent"
  git submodule update --init --depth 1 vendor/hermes-agent
  TAG="$(grep -A5 '^hermes:' ops/versions.lock.yaml | grep 'release_tag:' | sed 's/.*"\(.*\)".*/\1/' || true)"
  if [[ -n "$TAG" && -d vendor/hermes-agent ]]; then
    echo ">> Pin submodule to ${TAG} (from versions.lock.yaml)"
    if ! git -C vendor/hermes-agent fetch --tags --depth 1 origin 2>/dev/null; then
      echo "WARN: submodule fetch failed — offline or network issue"
    fi
    if ! git -C vendor/hermes-agent checkout "$TAG" 2>/dev/null; then
      echo "FAIL: could not checkout $TAG — run: git -C vendor/hermes-agent fetch --tags && git checkout $TAG"
      exit 1
    fi
    echo "OK  vendor/hermes-agent @ $(git -C vendor/hermes-agent describe --tags --always 2>/dev/null)"
  fi
else
  echo "WARN: no .gitmodules — skip submodule"
fi
echo ""

chmod +x "${CL_ROOT}/ops/dual-star/doctor.sh" \
  "${CL_ROOT}/ops/dual-star/install.sh" \
  "${CL_ROOT}/ops/openclaw/openclaw-cron.sh" \
  "${CL_ROOT}/ops/hermes/post-install.sh" 2>/dev/null || true

echo ">> Secrets (manual — never commit):"
echo "   OpenClaw: ~/.openclaw/.env"
echo "   Hermes:   ~/.hermes/.env"
echo ""

if ! command -v openclaw >/dev/null 2>&1; then
  echo "WARN: openclaw not in PATH — install OpenClaw first."
fi
if ! command -v hermes >/dev/null 2>&1; then
  echo "WARN: hermes not in PATH — install: pip install hermes-agent  (see vendor/hermes-agent README)"
fi
echo ""

echo ">> Running doctor..."
"${CL_ROOT}/ops/dual-star/doctor.sh"
echo ""
echo "Done. Edit cron in CL docs/ops then deploy to ~/.openclaw — see docs/DUAL-STAR-OPS.md"
