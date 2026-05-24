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

restart_gateway() {
  launchctl load "$PLIST"
  echo "Gateway restarted."
}

if [[ -f "$PLIST" ]]; then
  echo "Stopping OpenClaw gateway..."
  launchctl unload "$PLIST" 2>/dev/null || true
  sleep 2
  trap restart_gateway EXIT
else
  echo "No LaunchAgent at $PLIST — merging cron without gateway restart."
fi

CRON_FILE="$CRON_FILE" SNIPPET="$SNIPPET" node "$CL_ROOT/tools/world-ingest/merge-world-cron.mjs"

if [[ -f "$PLIST" ]]; then
  trap - EXIT
  echo "Restarting OpenClaw gateway..."
  restart_gateway
else
  echo "Restart gateway manually if needed."
fi
