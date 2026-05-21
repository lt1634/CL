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

CRON_FILE="$CRON_FILE" SNIPPET="$SNIPPET" node -e '
const fs = require("fs");
const cronPath = process.env.CRON_FILE;
const snippetPath = process.env.SNIPPET;
const data = JSON.parse(fs.readFileSync(cronPath, "utf8"));
const incoming = JSON.parse(fs.readFileSync(snippetPath, "utf8"));
const jobs = data.jobs || [];
const byId = new Map(jobs.map((j) => [j.id, j]));
let added = 0;
let updated = 0;
for (const job of incoming) {
  if (byId.has(job.id)) {
    const idx = jobs.findIndex((j) => j.id === job.id);
    const prev = jobs[idx];
    jobs[idx] = { ...job, state: prev.state || {} };
    updated++;
  } else {
    jobs.push(job);
    added++;
  }
}
data.jobs = jobs;
fs.writeFileSync(cronPath, JSON.stringify(data, null, 2) + "\n");
console.log("Cron merge done: added=" + added + " updated=" + updated);
'

if [[ -f "$PLIST" ]]; then
  echo "Restarting OpenClaw gateway..."
  launchctl unload "$PLIST" 2>/dev/null || true
  sleep 2
  launchctl load "$PLIST"
  echo "Gateway restarted."
else
  echo "No LaunchAgent at $PLIST — restart gateway manually if needed."
fi
