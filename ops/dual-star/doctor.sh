#!/usr/bin/env bash
# 雙星健康檢查：OpenClaw + Hermes（只讀，唔改設定）
set -euo pipefail

CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PATH="${HOME}/.local/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

echo "=== CL dual-star doctor ==="
echo "CL_ROOT: $CL_ROOT"
echo ""

fail=0
warn=0

check_cmd() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    echo "OK  $name: $($name --version 2>/dev/null | head -1 || echo present)"
  else
    echo "FAIL $name: not in PATH"
    fail=$((fail + 1))
  fi
}

check_launchd() {
  local label="$1"
  if launchctl print "gui/$(id -u)/${label}" >/dev/null 2>&1; then
    local state
    state="$(launchctl print "gui/$(id -u)/${label}" 2>/dev/null | awk -F'= ' '/state =/{print $2; exit}')"
    echo "OK  LaunchAgent ${label}: ${state:-running}"
  else
    echo "WARN LaunchAgent ${label}: not loaded"
    warn=$((warn + 1))
  fi
}

echo "--- CLI ---"
check_cmd openclaw
check_cmd hermes
check_cmd node
echo ""

echo "--- LaunchAgents (macOS) ---"
check_launchd "ai.openclaw.gateway"
check_launchd "ai.hermes.gateway"
echo ""

echo "--- Config homes ---"
for d in "${HOME}/.openclaw" "${HOME}/.hermes"; do
  if [[ -d "$d" ]]; then
    echo "OK  $d"
    if [[ -f "$d/.env" ]]; then
      perm="$(stat -f '%OLp' "$d/.env" 2>/dev/null || echo '?')"
      if [[ "$perm" == "600" ]]; then
        echo "    .env: present (600)"
      else
        echo "    .env: present but perm=$perm (want 600) — run: ${CL_ROOT}/ops/openclaw/harden-openclaw.sh"
        warn=$((warn + 1))
      fi
    else
      echo "    .env: missing (create from .env.example if needed)"
    fi
  else
    echo "WARN $d: not found"
    warn=$((warn + 1))
  fi
done
echo ""

echo "--- Security (read-only) ---"
if command -v openclaw >/dev/null 2>&1; then
  summary="$(openclaw security audit 2>&1 | grep -E '^Summary:' || true)"
  [[ -n "$summary" ]] && echo "    $summary" || echo "WARN openclaw security audit failed"
  crit="$(openclaw security audit 2>&1 | grep -c 'CRITICAL' || true)"
  [[ "${crit:-0}" -gt 0 ]] && warn=$((warn + 1))
else
  echo "SKIP openclaw security audit (CLI missing)"
fi
if [[ -f "${HOME}/.openclaw/cron/jobs.json" && -f "${CL_ROOT}/ops/openclaw/cron-jobs-io.mjs" ]]; then
  CRON_FILE="${HOME}/.openclaw/cron/jobs.json" node "${CL_ROOT}/ops/openclaw/cron-jobs-io.mjs" validate 2>&1 | sed 's/^/    /' || warn=$((warn + 1))
fi
echo ""

echo "--- Hermes submodule ---"
SUB="${CL_ROOT}/vendor/hermes-agent"
if [[ -f "${SUB}/.git" || -f "${CL_ROOT}/.gitmodules" ]]; then
  if [[ -d "$SUB" && -n "$(ls -A "$SUB" 2>/dev/null)" ]]; then
    echo "OK  vendor/hermes-agent @ $(git -C "$SUB" describe --tags --always 2>/dev/null || echo unknown)"
  else
    echo "FAIL vendor/hermes-agent: empty — run: git submodule update --init --recursive"
    fail=$((fail + 1))
  fi
else
  echo "WARN vendor/hermes-agent: not initialized"
  warn=$((warn + 1))
fi
echo ""

echo "--- OpenClaw cron (summary) ---"
if [[ -f "${HOME}/.openclaw/cron/jobs.json" ]] && command -v openclaw >/dev/null 2>&1; then
  openclaw cron list 2>/dev/null | head -20 || echo "WARN openclaw cron list failed"
elif [[ -x "${CL_ROOT}/ops/openclaw/openclaw-cron.sh" ]]; then
  "${CL_ROOT}/ops/openclaw/openclaw-cron.sh" list 2>/dev/null | head -20 || true
else
  echo "SKIP (no jobs.json or openclaw CLI)"
fi
echo ""

echo "--- Hermes gateway status ---"
if command -v hermes >/dev/null 2>&1; then
  hermes gateway status 2>&1 | head -15 || echo "WARN hermes gateway status failed"
else
  echo "SKIP"
fi
echo ""

echo "=== Summary: fail=$fail warn=$warn ==="
[[ "$fail" -eq 0 ]] || exit 1
