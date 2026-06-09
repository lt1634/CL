#!/usr/bin/env node
/**
 * Safe read/write for ~/.openclaw/cron/jobs.json
 * - PID lock file (30s timeout)
 * - Backup before write (.bak)
 * - Atomic write (tmp + rename)
 * - Minimal schema validation
 */
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { spawnSync } from "child_process";
import { pathToFileURL } from "url";

const CRON_FILE = process.env.CRON_FILE || path.join(os.homedir(), ".openclaw/cron/jobs.json");
const LOCK_FILE = `${CRON_FILE}.lock`;
const BACKUP_SUFFIX = ".bak";
const PLIST =
  process.env.OPENCLAW_GATEWAY_PLIST ||
  path.join(os.homedir(), "Library/LaunchAgents/ai.openclaw.gateway.plist");
const GRACE_STOP_SEC = parseInt(process.env.OPENCLAW_CRON_GRACE_STOP || "5", 10);
const GRACE_START_SEC = parseInt(process.env.OPENCLAW_CRON_GRACE_START || "5", 10);

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* lock retry */
  }
}

export function withLock(fn) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      fs.writeFileSync(LOCK_FILE, String(process.pid), { flag: "wx", mode: 0o600 });
      try {
        return fn();
      } finally {
        try {
          fs.unlinkSync(LOCK_FILE);
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      sleep(150);
    }
  }
  throw new Error(`Could not acquire lock on ${LOCK_FILE} within 30s`);
}

function validateJobs(data) {
  if (!data || typeof data !== "object") throw new Error("jobs.json: root must be object");
  if (!Array.isArray(data.jobs)) throw new Error("jobs.json: jobs must be array");
  for (const job of data.jobs) {
    if (!job.id || typeof job.id !== "string") throw new Error("jobs.json: each job needs string id");
    if (!job.name || typeof job.name !== "string") throw new Error(`jobs.json: job ${job.id} needs name`);
    if (!job.schedule || typeof job.schedule !== "object")
      throw new Error(`jobs.json: job ${job.id} needs schedule object`);
    if (!job.payload || typeof job.payload !== "object")
      throw new Error(`jobs.json: job ${job.id} needs payload object`);
  }
  return data;
}

export function readJobs() {
  if (!fs.existsSync(CRON_FILE)) return { version: 1, jobs: [] };
  const raw = fs.readFileSync(CRON_FILE, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in ${CRON_FILE}: ${e.message}`);
  }
  return validateJobs(data);
}

export function writeJobs(data) {
  validateJobs(data);
  const dir = path.dirname(CRON_FILE);
  fs.mkdirSync(dir, { recursive: true });
  const text = JSON.stringify(data, null, 2) + "\n";
  if (fs.existsSync(CRON_FILE)) {
    fs.copyFileSync(CRON_FILE, CRON_FILE + BACKUP_SUFFIX);
  }
  const tmp = `${CRON_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, text, { mode: 0o600 });
  fs.renameSync(tmp, CRON_FILE);
}

export function mutateJobs(mutator) {
  return withLock(() => {
    const data = readJobs();
    const result = mutator(data);
    writeJobs(data);
    return result;
  });
}

export function withGatewayStopped(fn) {
  if (!fs.existsSync(PLIST)) return fn();

  console.log("Stopping Gateway...");
  spawnSync("launchctl", ["unload", PLIST], { stdio: "ignore" });
  sleep(Math.max(0, GRACE_STOP_SEC) * 1000);
  try {
    return fn();
  } finally {
    console.log("Restarting Gateway...");
    spawnSync("launchctl", ["load", PLIST], { stdio: "ignore" });
    sleep(Math.max(0, GRACE_START_SEC) * 1000);
  }
}

function parseSchedule(scheduleRaw) {
  if (scheduleRaw.startsWith("cron:")) {
    const parts = scheduleRaw.slice(5).split(":");
    return { kind: "cron", expr: parts[0] || "0 7 * * *", tz: parts[1] || "Asia/Taipei" };
  }
  if (scheduleRaw.startsWith("every:")) {
    const ms = parseInt(scheduleRaw.slice(6), 10) || 3_600_000;
    return { kind: "every", everyMs: ms };
  }
  if (scheduleRaw.startsWith("at:")) {
    return { kind: "at", at: scheduleRaw.slice(3) };
  }
  return { kind: "cron", expr: "0 7 * * *", tz: "Asia/Taipei" };
}

function cmdList() {
  const data = readJobs();
  for (const [i, job] of (data.jobs || []).entries()) {
    const s = job.schedule || {};
    const when =
      s.kind === "at"
        ? s.at
        : s.kind === "cron"
          ? `${s.expr || ""} (${s.tz || "local"})`
          : s.kind === "every"
            ? `every ${Math.floor((s.everyMs || 0) / 60_000)}m`
            : "?";
    console.log(`  ${i + 1}. [${job.id}] ${job.name} - ${when} (enabled: ${job.enabled})`);
  }
}

function cmdAdd() {
  const name = process.env.NAME || "unnamed";
  const scheduleRaw = process.env.SCHEDULE || "";
  const sessionTarget = process.env.SESSION || "main";
  const payloadText = process.env.PAYLOAD || name;
  const id = `job-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = Date.now();
  const schedule = parseSchedule(scheduleRaw);
  const payloadKind = sessionTarget === "main" ? "systemEvent" : "agentTurn";
  const payload =
    payloadKind === "systemEvent"
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
    state: {},
  };
  const data = readJobs();
  data.jobs.push(job);
  writeJobs(data);
  console.log("Added job:", id, "-", name);
}

function cmdRemove() {
  const targetId = process.env.JOB_ID;
  if (!targetId) throw new Error("JOB_ID required");
  const data = readJobs();
  const before = data.jobs.length;
  data.jobs = data.jobs.filter((j) => j.id !== targetId && j.id !== `job-${targetId}`);
  writeJobs(data);
  const removed = before - data.jobs.length;
  console.log(removed ? `Removed job: ${targetId}` : `Job not found: ${targetId}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2];
  if (cmd === "list") withLock(cmdList);
  else if (cmd === "add") withLock(cmdAdd);
  else if (cmd === "remove") withLock(cmdRemove);
  else if (cmd === "validate") {
    withLock(() => {
      readJobs();
      console.log("OK", CRON_FILE);
    });
  } else {
    console.error("Usage: cron-jobs-io.mjs list|add|remove|validate");
    process.exit(1);
  }
}
