#!/usr/bin/env bash
# Install macOS user crontab line for daily A-track ops (shell only, no OpenClaw agentTurn).
set -euo pipefail

CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RUN="${CL_ROOT}/ops/openclaw/run-a-track-ops.sh"
MARKER="# CL A-track ops (snapshot+memory+status)"

chmod +x "$RUN"

tmp="$(mktemp)"
(crontab -l 2>/dev/null | grep -v "run-a-track-ops.sh" | grep -v "$MARKER" || true) >"$tmp"
{
  cat "$tmp"
  echo ""
  echo "$MARKER"
  echo "5 8 * * * SKIP_FETCH=1 ${RUN} all >> ${HOME}/.openclaw/backup/a-track-ops.log 2>&1"
} | crontab -

echo "Installed crontab entry (daily 08:05 HKT, snapshot from existing jsonl + memory + status)"
crontab -l | grep -A1 "A-track" || true
