#!/usr/bin/env node
/**
 * Merge world-cron-jobs.json into ~/.openclaw/cron/jobs.json (resolves delivery placeholders).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updateJobs } from "../../ops/openclaw/cron-jobs-io.mjs";
import { resolveJobs } from "./resolve-cron-delivery.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const SNIPPET =
  process.env.SNIPPET || path.join(CL_ROOT, "tools/world-ingest/world-cron-jobs.json");

const incoming = resolveJobs(JSON.parse(fs.readFileSync(SNIPPET, "utf8")));
let added = 0;
let updated = 0;

updateJobs((data) => {
  const jobs = data.jobs || [];
  const byId = new Map(jobs.map((j) => [j.id, j]));
  for (const job of incoming) {
    if (byId.has(job.id)) {
      const idx = jobs.findIndex((j) => j.id === job.id);
      const existing = jobs[idx];
      jobs[idx] = { ...job, enabled: existing.enabled ?? job.enabled, state: existing.state || {} };
      updated++;
    } else {
      jobs.push(job);
      added++;
    }
  }
  data.jobs = jobs;
});
console.log(`Cron merge done: added=${added} updated=${updated}`);
