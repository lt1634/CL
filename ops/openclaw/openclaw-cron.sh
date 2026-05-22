#!/usr/bin/env bash
# OpenClaw Cron 管理腳本 - 繞過 API，直接編輯 jobs.json
# 用法: ./openclaw-cron.sh add|list|remove|restart|validate
#
# 安全：flock 風格 lock、原子寫入、寫前 .bak、Gateway 停等較長 grace
# 詳見: CRON-API-FORMAT.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CRON_FILE="${CRON_FILE:-${HOME}/.openclaw/cron/jobs.json}"
PLIST="${HOME}/Library/LaunchAgents/ai.openclaw.gateway.plist"
GATEWAY_PORT="${OPENCLAW_GATEWAY_PORT:-18789}"
GRACE_STOP_SEC="${OPENCLAW_CRON_GRACE_STOP:-5}"
GRACE_START_SEC="${OPENCLAW_CRON_GRACE_START:-5}"
IO="${SCRIPT_DIR}/cron-jobs-io.mjs"

wait_port() {
  local host="$1" port="$2" want_up="$3" max="${4:-30}"
  local i=0
  while [[ "$i" -lt "$max" ]]; do
    if nc -z "$host" "$port" 2>/dev/null; then
      [[ "$want_up" == "1" ]] && return 0
    else
      [[ "$want_up" == "0" ]] && return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  return 1
}

restart_gateway() {
  echo "Restarting Gateway..."
  if [[ ! -f "$PLIST" ]]; then
    echo "WARN: No LaunchAgent at $PLIST — restart gateway manually."
    return 0
  fi
  launchctl unload "$PLIST" 2>/dev/null || true
  sleep "$GRACE_STOP_SEC"
  wait_port 127.0.0.1 "$GATEWAY_PORT" 0 15 || echo "WARN: port $GATEWAY_PORT still open after unload"
  launchctl load "$PLIST"
  sleep "$GRACE_START_SEC"
  if wait_port 127.0.0.1 "$GATEWAY_PORT" 1 20; then
    echo "Gateway restarted (port $GATEWAY_PORT up)."
  else
    echo "WARN: port $GATEWAY_PORT not up after load — check launchctl / logs."
  fi
}

run_with_gateway_stopped() {
  local status
  echo "Stopping Gateway..."
  if [[ -f "$PLIST" ]]; then
    launchctl unload "$PLIST" 2>/dev/null || true
    sleep "$GRACE_STOP_SEC"
    wait_port 127.0.0.1 "$GATEWAY_PORT" 0 15 || echo "WARN: port may still be bound"
  else
    echo "WARN: No plist — editing cron without stopping gateway"
  fi

  set +e
  "$@"
  status=$?
  set -e

  restart_gateway
  return "$status"
}

cron_list() {
  if [[ ! -f "$CRON_FILE" ]]; then
    echo "No cron file at $CRON_FILE"
    exit 1
  fi
  echo "Cron jobs:"
  CRON_FILE="$CRON_FILE" node "$IO" list
}

cron_validate() {
  CRON_FILE="$CRON_FILE" node "$IO" validate
}

cron_add() {
  local name="$1"
  local schedule="$2"
  local session="${3:-main}"
  local payload="${4:-}"

  if [[ -z "$name" || -z "$schedule" ]]; then
    echo "Usage: $0 add <name> <schedule> [session] [payload]"
    echo "  schedule: cron:EXPR:TZ | every:MS | at:ISO"
    exit 1
  fi

  [[ -z "$payload" && "$session" == "main" ]] && payload="Reminder: $name"
  [[ -z "$payload" && "$session" == "isolated" ]] && payload="$name"

  mkdir -p "$(dirname "$CRON_FILE")"
  run_with_gateway_stopped cron_add_write "$name" "$schedule" "$session" "$payload"
}

cron_add_write() {
  CRON_FILE="$CRON_FILE" NAME="$1" SCHEDULE="$2" SESSION="$3" PAYLOAD="$4" node "$IO" add
}

cron_remove() {
  local job_id="$1"
  if [[ -z "$job_id" ]]; then
    echo "Usage: $0 remove <jobId>"
    cron_list
    exit 1
  fi
  run_with_gateway_stopped cron_remove_write "$job_id"
}

cron_remove_write() {
  CRON_FILE="$CRON_FILE" JOB_ID="$1" node "$IO" remove
}

case "${1:-}" in
  list) cron_list ;;
  add) cron_add "${2:-}" "${3:-}" "${4:-main}" "${5:-}" ;;
  remove) cron_remove "${2:-}" ;;
  restart) restart_gateway ;;
  validate) cron_validate ;;
  *)
    echo "OpenClaw Cron (shell) - bypass API"
    echo ""
    echo "Usage: $0 <command> [args...]"
    echo "  list              - 列出所有 cron 工作"
    echo "  add <name> <sched> [session] [payload]  - 新增工作"
    echo "  remove <jobId>    - 移除工作"
    echo "  restart           - 重啟 Gateway"
    echo "  validate          - 驗證 jobs.json（不修改）"
    echo ""
    echo "Schedule 格式:"
    echo "  cron:0 7 * * *:Asia/Taipei   - 每天 7:00"
    echo "  every:3600000                - 每小時 (ms)"
    echo "  at:2026-02-10T09:00:00Z      - 指定時間"
    ;;
esac
