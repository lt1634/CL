#!/usr/bin/env bash
# A 軌日常三件套（免 LLM）：世界快照 MD + 記憶 token 預算 + 狀態頁
# 主線：OpenClaw + CL；Hermes B 軌唔跑呢個腳本。
set -euo pipefail

CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PATH="${HOME}/.local/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

MODE="${1:-all}" # all | snapshot | memory | status

run_snapshot() {
  echo ">> [1/3] World snapshot → Markdown"
  if [[ "${SKIP_FETCH:-0}" == "1" ]]; then
    python3 "${CL_ROOT}/tools/world-ingest/snapshot-to-markdown.py"
  else
    bash "${CL_ROOT}/tools/world-ingest/morning-world-ingest.sh"
  fi
}

run_memory() {
  echo ">> [2/3] Memory token budget + janitor"
  bash "${CL_ROOT}/tools/openclaw-memory-janitor/memory-janitor.sh" || true
  bash "${CL_ROOT}/tools/openclaw-memory-janitor/token-estimate.sh"
  if [[ "${ARCHIVE_DAILIES:-0}" == "1" ]]; then
    bash "${CL_ROOT}/tools/openclaw-memory-janitor/archive-daily-logs.sh"
  fi
}

run_status() {
  echo ">> [3/3] Status dashboard HTML"
  bash "${CL_ROOT}/ops/openclaw/refresh-status-dashboard.sh"
}

case "$MODE" in
  snapshot) run_snapshot ;;
  memory) run_memory ;;
  status) run_status ;;
  all)
    run_snapshot
    run_memory
    run_status
    ;;
  *)
    echo "Usage: $0 [all|snapshot|memory|status]"
    echo "  SKIP_FETCH=1     snapshot only (no RSS fetch)"
    echo "  ARCHIVE_DAILIES=1  also archive old daily logs"
    exit 1
    ;;
esac

echo ""
echo "Done. A-track ops:"
echo "  world:  ~/.openclaw/workspace/memory/world/snapshots/latest.md"
echo "  tokens: ~/.openclaw/backup/token-budget.json"
echo "  status: ${CL_ROOT}/docs/agent-status.html"
