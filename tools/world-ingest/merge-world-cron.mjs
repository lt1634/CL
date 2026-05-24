#!/usr/bin/env node
/**
 * Merge world-cron-jobs.json into ~/.openclaw/cron/jobs.json (resolves delivery placeholders).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readJobs, writeJobs, withLock } from "../../ops/openclaw/cron-jobs-io.mjs";
import {
  resolveJobs,
  resolveTelegramTo,
  TELEGRAM_TO_PLACEHOLDER,
} from "./resolve-cron-delivery.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const SNIPPET =
  process.env.SNIPPET || path.join(CL_ROOT, "tools/world-ingest/world-cron-jobs.json");

function telegramToFromExistingJobs(data) {
  for (const job of data.jobs || []) {
    const to = job?.delivery?.to;
    if (to && to !== TELEGRAM_TO_PLACEHOLDER) return String(to);
  }
  return null;
}

withLock(() => {
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
  console.log(`Cron merge done: added=${added} updated=${updated}`);
});
