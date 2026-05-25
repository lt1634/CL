#!/usr/bin/env bash
# Merge world-cron-jobs.json into ~/.openclaw/cron/jobs.json (idempotent by job id)
set -euo pipefail

CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CRON_FILE="${CRON_FILE:-$HOME/.openclaw/cron/jobs.json}"
SNIPPET="$CL_ROOT/tools/world-ingest/world-cron-jobs.json"
PLIST="${HOME}/Library/LaunchAgents/ai.openclaw.gateway.plist"

restart_gateway=0

restart_gateway_if_needed() {
  if [[ "$restart_gateway" == "1" ]]; then
    echo "Restarting OpenClaw gateway..."
    launchctl load "$PLIST"
    restart_gateway=0
    echo "Gateway restarted."
  fi
}

if [[ ! -f "$CRON_FILE" ]]; then
  echo "Missing $CRON_FILE" >&2
  exit 1
fi

if [[ -f "$PLIST" ]]; then
  echo "Stopping OpenClaw gateway..."
  launchctl unload "$PLIST" 2>/dev/null || true
  restart_gateway=1
  trap restart_gateway_if_needed EXIT
  sleep 2
fi

CRON_FILE="$CRON_FILE" SNIPPET="$SNIPPET" node "$CL_ROOT/tools/world-ingest/merge-world-cron.mjs"

if [[ "$restart_gateway" == "1" ]]; then
  restart_gateway_if_needed
  trap - EXIT
else
  echo "No LaunchAgent at $PLIST — restart gateway manually if needed."
fi
