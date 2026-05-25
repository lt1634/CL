#!/usr/bin/env node
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { readJobs, writeJobs, withLock } from "./cron-jobs-io.mjs";
import {
  resolveJobs,
  resolveTelegramTo,
  TELEGRAM_TO_PLACEHOLDER,
} from "../../tools/world-ingest/resolve-cron-delivery.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const CRON_FILE = process.env.CRON_FILE || path.join(os.homedir(), ".openclaw/cron/jobs.json");
const SNIPPET = path.join(CL_ROOT, "ops/openclaw/memory-weekly-janitor-cron.snippet.json");
const PLIST = path.join(os.homedir(), "Library/LaunchAgents/ai.openclaw.gateway.plist");

function withGatewayStopped(fn) {
  if (!fs.existsSync(PLIST)) return fn();

  console.log("Stopping OpenClaw gateway...");
  spawnSync("launchctl", ["unload", PLIST], { stdio: "ignore" });
  spawnSync("sleep", ["2"], { stdio: "ignore" });
  try {
    return fn();
  } finally {
    console.log("Restarting OpenClaw gateway...");
    spawnSync("launchctl", ["load", PLIST], { stdio: "inherit" });
  }
}

function telegramToFromExistingJobs(data) {
  for (const job of data.jobs || []) {
    const to = job?.delivery?.to;
    if (to && to !== TELEGRAM_TO_PLACEHOLDER) return String(to);
  }
  return null;
}

withGatewayStopped(() => withLock(() => {
  const data = readJobs();
  let telegramTo = process.env.OPENCLAW_TELEGRAM_TO;
  if (!telegramTo) {
    try {
      telegramTo = resolveTelegramTo();
    } catch {
      telegramTo = telegramToFromExistingJobs(data);
      if (!telegramTo) {
        throw new Error(
          "Set OPENCLAW_TELEGRAM_TO in ~/.openclaw/.env or ensure an existing cron job has delivery.to",
        );
      }
    }
  }
  const incoming = resolveJobs(JSON.parse(fs.readFileSync(SNIPPET, "utf8")), telegramTo);
  const jobs = data.jobs || [];
  const byId = new Map(jobs.map((j) => [j.id, j]));
  let added = 0;
  let updated = 0;
  for (const job of incoming) {
    if (byId.has(job.id)) {
      const idx = jobs.findIndex((j) => j.id === job.id);
      jobs[idx] = { ...job, state: jobs[idx].state || {} };
      updated++;
    } else {
      jobs.push(job);
      added++;
    }
  }
  data.jobs = jobs;
  writeJobs(data);
  console.log(`Memory janitor cron: added=${added} updated=${updated}`);
}));
