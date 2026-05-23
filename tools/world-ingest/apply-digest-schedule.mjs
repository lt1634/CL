#!/usr/bin/env node
/**
 * Apply integrated digest schedule: world cron (aggressive mode) + hybrid 12:00+20:00.
 */
import fs from "fs";
import path from "path";
import os from "os";
import {
  mergeJobsById,
  resolveRepoPathsInJobs,
  updateCronJobs,
} from "../../ops/openclaw/cron-merge-utils.mjs";
import { resolveJobs } from "./resolve-cron-delivery.mjs";

const CL_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const SNIPPET = path.join(CL_ROOT, "tools/world-ingest/world-cron-jobs.json");

const WORLD_LLM_IDS = [
  "world-ingest-morning-001",
  "world-opportunity-scan-001",
  "world-opportunity-scan-afternoon-001",
  "world-opportunity-weekly-001",
  "world-digest-evening-001",
  "world-consolidate-weekly-001",
  "world-reflection-weekly-001",
];

function mergeWorldJobs(data) {
  const incoming = resolveRepoPathsInJobs(
    resolveJobs(JSON.parse(fs.readFileSync(SNIPPET, "utf8"))),
    CL_ROOT,
  );
  const { added, updated } = mergeJobsById(data, incoming);
  console.log("World cron: added=" + added + " updated=" + updated);
}

function patchHybridSchedule(data) {
  const job = (data.jobs || []).find((j) => j.id === "content-digest-hybrid-001");
  if (!job) {
    console.warn("content-digest-hybrid-001 not found — skip");
    return;
  }
  job.schedule = { expr: "0 12,20 * * *", kind: "cron", tz: "Asia/Hong_Kong" };
  job.enabled = true;
  console.log("Hybrid digest: 12:00 + 20:00 HKT (aggressive MiniMax usage)");
}

function disableLegacy(data) {
  const legacyIds = new Set([
    "11fecbfb-46db-44e1-adbb-09662bbb3a31",
    "daily-content-digest",
    "ff1faddc-cb83-465e-9b12-283cdfe3e485",
    "content-digestion-collect",
  ]);
  for (const job of data.jobs || []) {
    if (legacyIds.has(job.id) && job.enabled) {
      job.enabled = false;
      console.log("Disabled legacy:", job.id);
    }
  }
}

function enableAggressiveWorldMode(data) {
  const snippet = resolveRepoPathsInJobs(
    resolveJobs(JSON.parse(fs.readFileSync(SNIPPET, "utf8"))),
    CL_ROOT,
  );
  const snippetById = new Map(snippet.map((j) => [j.id, j]));
  for (const job of data.jobs || []) {
    if (!WORLD_LLM_IDS.includes(job.id)) continue;
    const src = snippetById.get(job.id);
    if (src) {
      job.enabled = src.enabled !== false;
      if (src.payload?.message) job.payload = { ...job.payload, ...src.payload };
      if (src.schedule) job.schedule = src.schedule;
      if (src.timeoutSeconds) job.payload = job.payload || {};
      if (src.payload?.timeoutSeconds) job.payload.timeoutSeconds = src.payload.timeoutSeconds;
    } else {
      job.enabled = true;
    }
    console.log("Aggressive:", job.id, "enabled=" + job.enabled);
  }
}

function syncArchitectureDoc() {
  const wsKb = path.join(os.homedir(), ".openclaw/workspace/memory/kb");
  fs.mkdirSync(wsKb, { recursive: true });
  const copies = [
    [path.join(CL_ROOT, "memory/kb/digest-rss-architecture.md"), "digest-rss-architecture.md"],
    [path.join(CL_ROOT, "docs/WORLD_MODEL_PROJECT.md"), "WORLD_MODEL_PROJECT.md"],
  ];
  for (const [src, destName] of copies) {
    if (!fs.existsSync(src)) {
      console.warn("Missing SSOT:", src);
      continue;
    }
    const dest = path.join(wsKb, destName);
    fs.copyFileSync(src, dest);
    console.log("Copied SSOT ->", dest);
  }
}

function printVerify(data) {
  const jobs = data.jobs || [];
  const world = jobs.filter((j) => j.id?.startsWith("world-"));
  const hybrid = jobs.find((j) => j.id === "content-digest-hybrid-001");
  console.log("\n--- verify ~/.openclaw/cron/jobs.json ---");
  console.log("total jobs:", jobs.length);
  console.log(
    "world jobs:",
    world.map((j) => `${j.id} enabled=${j.enabled}`).join(", "),
  );
  if (hybrid) {
    console.log(
      "content-digest-hybrid:",
      hybrid.schedule?.expr,
      "enabled=" + hybrid.enabled,
    );
  }
}

const updated = updateCronJobs((data) => {
  mergeWorldJobs(data);
  patchHybridSchedule(data);
  disableLegacy(data);
  enableAggressiveWorldMode(data);
  return { data };
});

syncArchitectureDoc();
printVerify(updated.data);
