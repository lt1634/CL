#!/usr/bin/env node
/** Merge a-track-daily-ops-001 into ~/.openclaw/cron/jobs.json (optional Telegram notify). */
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import {
  resolveJobs,
  resolveTelegramTo,
  TELEGRAM_TO_PLACEHOLDER,
} from "../../tools/world-ingest/resolve-cron-delivery.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const CRON_FILE = process.env.CRON_FILE || path.join(os.homedir(), ".openclaw/cron/jobs.json");
const SNIPPET = path.join(CL_ROOT, "ops/openclaw/merge-daily-ops-openclaw-cron.snippet.json");

function telegramToFromExistingJobs(data) {
  for (const job of data.jobs || []) {
    const to = job?.delivery?.to;
    if (to && to !== TELEGRAM_TO_PLACEHOLDER) return String(to);
  }
  return null;
}

const data = JSON.parse(fs.readFileSync(CRON_FILE, "utf8"));
let telegramTo = process.env.OPENCLAW_TELEGRAM_TO;
if (!telegramTo) {
  try {
    telegramTo = resolveTelegramTo();
  } catch {
    telegramTo = telegramToFromExistingJobs(data);
    if (!telegramTo) throw new Error("Set OPENCLAW_TELEGRAM_TO or existing cron delivery.to");
  }
}
const incoming = resolveJobs(JSON.parse(fs.readFileSync(SNIPPET, "utf8")), telegramTo);
const jobs = data.jobs || [];
let added = 0;
let updated = 0;
for (const job of incoming) {
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    jobs[idx] = { ...job, state: jobs[idx].state || {} };
    updated++;
  } else {
    jobs.push(job);
    added++;
  }
}
data.jobs = jobs;
fs.writeFileSync(CRON_FILE, JSON.stringify(data, null, 2) + "\n");
console.log(`A-track daily ops cron: added=${added} updated=${updated}`);
