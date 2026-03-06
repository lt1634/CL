#!/usr/bin/env bash
# OpenClaw Cron 管理腳本 - 繞過 API，直接編輯 jobs.json
# 用法: ./openclaw-cron.sh add|list|remove|restart
#
# 若用 Cron API：schedule/payload/delivery 必須係 nested object，唔係 string。
# 詳見: CRON-API-FORMAT.md

set -e
CRON_FILE="${HOME}/.openclaw/cron/jobs.json"
PLIST="${HOME}/Library/LaunchAgents/ai.openclaw.gateway.plist"

restart_gateway() {
  echo "Restarting Gateway..."
  launchctl unload "$PLIST" 2>/dev/null || true
  sleep 2
  launchctl load "$PLIST"
  echo "Gateway restarted."
}

cron_list() {
  if [[ ! -f "$CRON_FILE" ]]; then
    echo "No cron file at $CRON_FILE"
    exit 1
  fi
  CRON_FILE="$CRON_FILE" node -e '
    const fs = require("fs");
    const path = process.env.CRON_FILE;
    const d = JSON.parse(fs.readFileSync(path, "utf8"));
    console.log("Cron jobs:");
    (d.jobs || []).forEach((job, i) => {
      const s = job.schedule || {};
      const when = s.kind === "at" ? s.at : s.kind === "cron" ? (s.expr || "") + " (" + (s.tz || "local") + ")" : s.kind === "every" ? "every " + Math.floor((s.everyMs||0)/60000) + "m" : "?";
      console.log("  " + (i+1) + ". [" + job.id + "] " + job.name + " - " + when + " (enabled: " + job.enabled + ")");
    });
  '
}

cron_add() {
  local name="$1"
  local schedule="$2"   # cron:0 7 * * *:Asia/Taipei 或 every:3600000 或 at:2026-02-10T09:00:00Z
  local session="${3:-main}"
  local payload="${4:-}"
  
  if [[ -z "$name" || -z "$schedule" ]]; then
    echo "Usage: $0 add <name> <schedule> [session] [payload]"
    echo "  schedule: cron:EXPR:TZ | every:MS | at:ISO"
    echo "  example: cron:0 7 * * *:Asia/Taipei"
    echo "  example: every:3600000  (every hour)"
    exit 1
  fi
  
  [[ -z "$payload" && "$session" == "main" ]] && payload="Reminder: $name"
  [[ -z "$payload" && "$session" == "isolated" ]] && payload="$name"
  
  echo "Stopping Gateway..."
  launchctl unload "$PLIST" 2>/dev/null || true
  sleep 2
  
  CRON_FILE="$CRON_FILE" NAME="$name" SCHEDULE="$schedule" SESSION="$session" PAYLOAD="$payload" node -e '
    const fs = require("fs");
    const path = process.env.CRON_FILE;
    const crypto = require("crypto");
    const id = "job-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const now = Date.now();
    const name = process.env.NAME || "unnamed";
    const scheduleRaw = process.env.SCHEDULE || "";
    const sessionTarget = process.env.SESSION || "main";
    const payloadText = process.env.PAYLOAD || name;

    let data = { version: 1, jobs: [] };
    if (fs.existsSync(path)) {
      data = JSON.parse(fs.readFileSync(path, "utf8"));
    }
    data.jobs = data.jobs || [];

    let schedule = {};
    if (scheduleRaw.startsWith("cron:")) {
      const parts = scheduleRaw.slice(5).split(":");
      schedule = { kind: "cron", expr: parts[0] || "0 7 * * *", tz: parts[1] || "Asia/Taipei" };
    } else if (scheduleRaw.startsWith("every:")) {
      const ms = parseInt(scheduleRaw.slice(6), 10) || 3600000;
      schedule = { kind: "every", everyMs: ms };
    } else if (scheduleRaw.startsWith("at:")) {
      schedule = { kind: "at", at: scheduleRaw.slice(3) };
    } else {
      schedule = { kind: "cron", expr: "0 7 * * *", tz: "Asia/Taipei" };
    }

    const payloadKind = sessionTarget === "main" ? "systemEvent" : "agentTurn";
    const payload = payloadKind === "systemEvent"
      ? { kind: "systemEvent", text: payloadText }
      : { kind: "agentTurn", message: payloadText };

    const job = {
      id,
      name,
      enabled: true,
      createdAtMs: now,
      updatedAtMs: now,
      schedule,
      sessionTarget,
      wakeMode: "next-heartbeat",
      payload,
      state: {}
    };

    data.jobs.push(job);
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log("Added job:", id, "-", name);
  '
  
  restart_gateway
}

cron_remove() {
  local job_id="$1"
  if [[ -z "$job_id" ]]; then
    echo "Usage: $0 remove <jobId>"
    cron_list
    exit 1
  fi
  
  echo "Stopping Gateway..."
  launchctl unload "$PLIST" 2>/dev/null || true
  sleep 2
  
  CRON_FILE="$CRON_FILE" JOB_ID="$job_id" node -e '
    const fs = require("fs");
    const path = process.env.CRON_FILE;
    const targetId = process.env.JOB_ID;
    const data = JSON.parse(fs.readFileSync(path, "utf8"));
    const before = data.jobs.length;
    data.jobs = (data.jobs || []).filter(j => j.id !== targetId && j.id !== "job-" + targetId);
    const removed = before - data.jobs.length;
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log(removed ? "Removed job: " + targetId : "Job not found: " + targetId);
  '
  
  restart_gateway
}

case "${1:-}" in
  list)   cron_list ;;
  add)    cron_add "${2:-}" "${3:-}" "${4:-main}" "${5:-}" ;;
  remove) cron_remove "${2:-}" ;;
  restart) restart_gateway ;;
  *)
    echo "OpenClaw Cron (shell) - bypass API"
    echo ""
    echo "Usage: $0 <command> [args...]"
    echo "  list              - 列出所有 cron 工作"
    echo "  add <name> <sched> [session] [payload]  - 新增工作"
    echo "  remove <jobId>    - 移除工作"
    echo "  restart           - 重啟 Gateway"
    echo ""
    echo "Schedule 格式:"
    echo "  cron:0 7 * * *:Asia/Taipei   - 每天 7:00"
    echo "  every:3600000                - 每小時 (ms)"
    echo "  at:2026-02-10T09:00:00Z      - 指定時間"
    ;;
esac
