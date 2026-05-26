#!/usr/bin/env bash
# Merge world-cron-jobs.json into ~/.openclaw/cron/jobs.json (idempotent by job id).
# The node merge stops/restarts the OpenClaw Gateway when the LaunchAgent exists.
set -euo pipefail

CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CRON_FILE="${CRON_FILE:-$HOME/.openclaw/cron/jobs.json}"
SNIPPET="$CL_ROOT/tools/world-ingest/world-cron-jobs.json"

if [[ ! -f "$CRON_FILE" ]]; then
  echo "Missing $CRON_FILE" >&2
  exit 1
fi

CRON_FILE="$CRON_FILE" SNIPPET="$SNIPPET" node "$CL_ROOT/tools/world-ingest/merge-world-cron.mjs"
