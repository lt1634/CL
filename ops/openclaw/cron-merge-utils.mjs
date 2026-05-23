import { readJobs, withLock, writeJobs } from "./cron-jobs-io.mjs";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

const LEGACY_CL_ROOT = "/Users/timnewmac/Desktop/CL";
const PLIST = path.join(os.homedir(), "Library/LaunchAgents/ai.openclaw.gateway.plist");

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* gateway grace period */
  }
}

function withGatewayStopped(fn) {
  if (process.env.OPENCLAW_CRON_SKIP_GATEWAY_STOP === "1" || !fs.existsSync(PLIST)) {
    return fn();
  }

  const graceMs = Number(process.env.OPENCLAW_CRON_GRACE_STOP_MS || 5000);
  console.log("Stopping OpenClaw gateway for cron jobs.json update...");
  spawnSync("launchctl", ["unload", PLIST], { stdio: "inherit" });
  sleep(graceMs);
  try {
    return fn();
  } finally {
    console.log("Starting OpenClaw gateway after cron jobs.json update...");
    spawnSync("launchctl", ["load", PLIST], { stdio: "inherit" });
  }
}

function replaceInValue(value, search, replacement) {
  if (typeof value === "string") return value.split(search).join(replacement);
  if (Array.isArray(value)) return value.map((item) => replaceInValue(item, search, replacement));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceInValue(item, search, replacement)]),
    );
  }
  return value;
}

export function resolveRepoPathsInJobs(jobs, clRoot) {
  return jobs.map((job) => replaceInValue(job, LEGACY_CL_ROOT, clRoot));
}

export function mergeJobsById(data, incoming) {
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  let added = 0;
  let updated = 0;

  for (const job of incoming) {
    const idx = jobs.findIndex((existing) => existing.id === job.id);
    if (idx >= 0) {
      jobs[idx] = { ...job, state: jobs[idx].state || {} };
      updated++;
    } else {
      jobs.push(job);
      added++;
    }
  }

  data.jobs = jobs;
  return { added, updated };
}

export function mergeCronJobs(incoming, { clRoot } = {}) {
  return updateCronJobs((data) => {
    const jobs = clRoot ? resolveRepoPathsInJobs(incoming, clRoot) : incoming;
    return mergeJobsById(data, jobs);
  });
}

export function updateCronJobs(mutator) {
  return withGatewayStopped(() =>
    withLock(() => {
      const data = readJobs();
      const result = mutator(data) || {};
      writeJobs(data);
      return result;
    }),
  );
}
