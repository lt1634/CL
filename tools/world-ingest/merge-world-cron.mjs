#!/usr/bin/env node
/**
 * Merge world-cron-jobs.json into ~/.openclaw/cron/jobs.json (resolves delivery placeholders).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mutateJobs, withGatewayStopped } from "../../ops/openclaw/cron-jobs-io.mjs";
import { resolveJobs } from "./resolve-cron-delivery.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const SNIPPET =
  process.env.SNIPPET || path.join(CL_ROOT, "tools/world-ingest/world-cron-jobs.json");

const incoming = resolveJobs(JSON.parse(fs.readFileSync(SNIPPET, "utf8")));
let added = 0;
let updated = 0;

withGatewayStopped(() =>
  mutateJobs((data) => {
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
  }),
);
console.log(`Cron merge done: added=${added} updated=${updated}`);
