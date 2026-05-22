#!/usr/bin/env node
/**
 * Merge world-cron-jobs.json into ~/.openclaw/cron/jobs.json (resolves delivery placeholders).
 */
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { resolveJobs } from "./resolve-cron-delivery.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const CRON_FILE = process.env.CRON_FILE || path.join(os.homedir(), ".openclaw/cron/jobs.json");
const SNIPPET =
  process.env.SNIPPET || path.join(CL_ROOT, "tools/world-ingest/world-cron-jobs.json");

const data = JSON.parse(fs.readFileSync(CRON_FILE, "utf8"));
const incoming = resolveJobs(JSON.parse(fs.readFileSync(SNIPPET, "utf8")));
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
fs.writeFileSync(CRON_FILE, JSON.stringify(data, null, 2) + "\n");
console.log(`Cron merge done: added=${added} updated=${updated}`);
