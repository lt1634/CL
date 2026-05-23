#!/usr/bin/env bash
# Regenerate status HTML + memory token budget (OpenClaw selective borrowings).
set -euo pipefail
CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PATH="${HOME}/.local/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

chmod +x "${CL_ROOT}/tools/openclaw-memory-janitor/"*.sh 2>/dev/null || true

"${CL_ROOT}/tools/openclaw-memory-janitor/token-estimate.sh" >/dev/null
node "${CL_ROOT}/agent-status-page.mjs"
echo "Open: file://${CL_ROOT}/docs/agent-status.html"
