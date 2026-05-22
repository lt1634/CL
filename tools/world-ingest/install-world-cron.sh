#!/usr/bin/env bash
# Merge world-cron-jobs.json into ~/.openclaw/cron/jobs.json (idempotent by job id)
set -euo pipefail

CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CRON_FILE="${CRON_FILE:-$HOME/.openclaw/cron/jobs.json}"
SNIPPET="$CL_ROOT/tools/world-ingest/world-cron-jobs.json"
PLIST="${HOME}/Library/LaunchAgents/ai.openclaw.gateway.plist"

if [[ ! -f "$CRON_FILE" ]]; then
  echo "Missing $CRON_FILE" >&2
  exit 1
fi

gateway_stopped=0
restart_gateway() {
  if [[ "$gateway_stopped" != "1" ]]; then
    return
  fi
  echo "Restarting OpenClaw gateway..."
  launchctl load "$PLIST"
  gateway_stopped=0
  echo "Gateway restarted."
}

if [[ -f "$PLIST" ]]; then
  echo "Stopping OpenClaw gateway before editing cron..."
  launchctl unload "$PLIST" 2>/dev/null || true
  gateway_stopped=1
  trap restart_gateway EXIT
  sleep 5
else
  echo "No LaunchAgent at $PLIST — editing cron without stopping gateway."
fi

CRON_FILE="$CRON_FILE" SNIPPET="$SNIPPET" node "$CL_ROOT/tools/world-ingest/merge-world-cron.mjs"
restart_gateway
trap - EXIT
