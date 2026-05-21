#!/usr/bin/env node
/**
 * If any task's latest state_set is blocked and older than SLA minutes, print one line per task to stdout.
 * Wire to your notifier / openclaw cron.
 */
import fs from "fs";
import path from "path";

const BOARD =
  process.env.COMPANY_BOARD_FILE ||
  path.join(process.env.HOME || ".", ".openclaw", "workspace", "company-board.jsonl");
const DIR = process.env.COMPANY_BOARD_DIR || path.dirname(BOARD);
const SLA_MIN = Number(process.env.BLOCKED_SLA_MINUTES || 30);

/** 與 va-bots-home/lib/company-board.ts listBoardFilesSync 一致 */
const ROTATED_RE = /^company-board-(\d{4}-\d{2}-\d{2})\.jsonl$/;

function localISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rotatedCutoffISODate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return localISODate(d);
}

function boardFiles() {
  if (!fs.existsSync(DIR)) return [];
  const raw = process.env.COMPANY_BOARD_TAIL_DAYS ?? "3";
  const allMode =
    raw === "" || String(raw).toLowerCase() === "all" || raw === "-1";
  const daysBack = allMode ? -1 : Math.max(0, Number(raw) || 3);
  const cutoff = daysBack >= 0 ? rotatedCutoffISODate(daysBack) : "";

  const all = fs.readdirSync(DIR);
  let jsonl = all.filter(
    (f) => f.startsWith("company-board") && f.endsWith(".jsonl"),
  );

  if (!allMode && daysBack >= 0) {
    jsonl = jsonl.filter((n) => {
      if (n === "company-board.jsonl") return true;
      const m = n.match(ROTATED_RE);
      if (m) return m[1] >= cutoff;
      return true;
    });
  }

  jsonl.sort((a, b) => {
    if (a === "company-board.jsonl") return 1;
    if (b === "company-board.jsonl") return -1;
    return a.localeCompare(b);
  });
  return jsonl.map((f) => path.join(DIR, f));
}

function parseLines(files) {
  const events = [];
  for (const file of files) {
    let raw;
    try {
      raw = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        events.push(JSON.parse(line));
      } catch {
        /* skip */
      }
    }
  }
  return events;
}

const lastStateByTask = new Map();
for (const e of parseLines(boardFiles())) {
  if (e.type === "state_set" && e.task_id && e.state) {
    lastStateByTask.set(e.task_id, { state: e.state, ts: e.ts, seq: e.seq });
  }
}

const now = Date.now();
const slaMs = SLA_MIN * 60 * 1000;

for (const [taskId, v] of lastStateByTask) {
  if (v.state !== "blocked" || !v.ts) continue;
  const t = Date.parse(v.ts);
  if (Number.isNaN(t)) continue;
  if (now - t > slaMs) {
    console.log(`SLA_BLOCKED task_id=${taskId} since=${v.ts} seq=${v.seq || ""}`);
  }
}
