#!/usr/bin/env node
/**
 * Apply integrated digest schedule: world cron (aggressive mode) + hybrid 12:00+20:00.
 */
import fs from "fs";
import path from "path";
import os from "os";
import { spawnSync } from "child_process";
import { resolveJobs } from "./resolve-cron-delivery.mjs";

const CL_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const CRON_FILE = process.env.CRON_FILE || path.join(os.homedir(), ".openclaw/cron/jobs.json");
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

function mergeWorldJobs() {
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
  console.log("World cron: added=" + added + " updated=" + updated);
}

function patchHybridSchedule() {
  const data = JSON.parse(fs.readFileSync(CRON_FILE, "utf8"));
  const job = (data.jobs || []).find((j) => j.id === "content-digest-hybrid-001");
  if (!job) {
    console.warn("content-digest-hybrid-001 not found — skip");
    return;
  }
  job.schedule = { expr: "0 12,20 * * *", kind: "cron", tz: "Asia/Hong_Kong" };
  job.enabled = true;
  fs.writeFileSync(CRON_FILE, JSON.stringify(data, null, 2) + "\n");
  console.log("Hybrid digest: 12:00 + 20:00 HKT (aggressive MiniMax usage)");
}

function disableLegacy() {
  const data = JSON.parse(fs.readFileSync(CRON_FILE, "utf8"));
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
  fs.writeFileSync(CRON_FILE, JSON.stringify(data, null, 2) + "\n");
}

function enableAggressiveWorldMode() {
  const data = JSON.parse(fs.readFileSync(CRON_FILE, "utf8"));
  const snippet = resolveJobs(JSON.parse(fs.readFileSync(SNIPPET, "utf8")));
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
  fs.writeFileSync(CRON_FILE, JSON.stringify(data, null, 2) + "\n");
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

function printVerify() {
  const data = JSON.parse(fs.readFileSync(CRON_FILE, "utf8"));
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

mergeWorldJobs();
patchHybridSchedule();
disableLegacy();
enableAggressiveWorldMode();
syncArchitectureDoc();
printVerify();

const installSh = path.join(CL_ROOT, "tools/world-ingest/install-world-cron.sh");
if (fs.existsSync(installSh)) {
  spawnSync("bash", [installSh], { stdio: "inherit" });
}
