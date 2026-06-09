#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  resolveJobs,
  resolveTelegramTo,
  TELEGRAM_TO_PLACEHOLDER,
} from "../../tools/world-ingest/resolve-cron-delivery.mjs";
import { mutateJobs, withGatewayStopped } from "./cron-jobs-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const SNIPPET = path.join(CL_ROOT, "ops/openclaw/memory-weekly-janitor-cron.snippet.json");

function telegramToFromExistingJobs(data) {
  for (const job of data.jobs || []) {
    const to = job?.delivery?.to;
    if (to && to !== TELEGRAM_TO_PLACEHOLDER) return String(to);
  }
  return null;
}

let added = 0;
let updated = 0;

withGatewayStopped(() => {
  mutateJobs((data) => {
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
  });
});
console.log(`Memory janitor cron: added=${added} updated=${updated}`);
