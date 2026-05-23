#!/usr/bin/env node
/**
 * Merge world-cron-jobs.json into ~/.openclaw/cron/jobs.json (resolves delivery placeholders).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mergeCronJobs } from "../../ops/openclaw/cron-merge-utils.mjs";
import { resolveJobs } from "./resolve-cron-delivery.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const SNIPPET =
  process.env.SNIPPET || path.join(CL_ROOT, "tools/world-ingest/world-cron-jobs.json");

const incoming = resolveJobs(JSON.parse(fs.readFileSync(SNIPPET, "utf8")));
const { added, updated } = mergeCronJobs(incoming, { clRoot: CL_ROOT });
console.log(`Cron merge done: added=${added} updated=${updated}`);
