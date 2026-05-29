#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const CRON_IO = path.join(__dirname, "cron-jobs-io.mjs");
const MERGE_A_TRACK = path.join(__dirname, "merge-a-track-ops-cron.mjs");

function runNode(script, args, env) {
  return execFileSync(process.execPath, [script, ...args], {
    cwd: CL_ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 10_000,
  });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-cron-test-"));
try {
  const cronFile = path.join(tempDir, "jobs.json");
  fs.writeFileSync(cronFile, JSON.stringify({ version: 1, jobs: [] }, null, 2) + "\n");

  const addOutput = runNode(CRON_IO, ["add"], {
    CRON_FILE: cronFile,
    NAME: "test job",
    SCHEDULE: "cron:0 7 * * *:Asia/Taipei",
    SESSION: "main",
    PAYLOAD: "hello",
  });
  assert.match(addOutput, /Added job: job-[a-f0-9]{12} - test job/);
  let data = readJson(cronFile);
  assert.equal(data.jobs.length, 1);
  assert.equal(data.jobs[0].name, "test job");
  assert.equal(data.jobs[0].payload.text, "hello");
  assert.equal(fs.existsSync(`${cronFile}.lock`), false);
  assert.equal(readJson(`${cronFile}.bak`).jobs.length, 0);

  const jobId = data.jobs[0].id;
  const removeOutput = runNode(CRON_IO, ["remove"], {
    CRON_FILE: cronFile,
    JOB_ID: jobId,
  });
  assert.match(removeOutput, new RegExp(`Removed job: ${jobId}`));
  data = readJson(cronFile);
  assert.equal(data.jobs.length, 0);
  assert.equal(fs.existsSync(`${cronFile}.lock`), false);

  const mergeOutput = runNode(MERGE_A_TRACK, [], {
    CRON_FILE: cronFile,
    OPENCLAW_TELEGRAM_TO: "123456",
  });
  assert.match(mergeOutput, /A-track daily ops cron: added=1 updated=0/);
  data = readJson(cronFile);
  assert.equal(data.jobs.length, 1);
  const aTrack = data.jobs[0];
  assert.equal(aTrack.id, "a-track-daily-ops-001");
  assert.equal(aTrack.delivery.to, "123456");
  assert.match(aTrack.payload.message, new RegExp(`${CL_ROOT}/ops/openclaw/run-a-track-ops\\.sh`));
  assert.doesNotMatch(aTrack.payload.message, /__CL_ROOT__|\/Users\/timnewmac\/Desktop\/CL/);

  aTrack.state = { lastRunMs: 123 };
  fs.writeFileSync(cronFile, JSON.stringify(data, null, 2) + "\n");
  const updateOutput = runNode(MERGE_A_TRACK, [], {
    CRON_FILE: cronFile,
    OPENCLAW_TELEGRAM_TO: "123456",
  });
  assert.match(updateOutput, /A-track daily ops cron: added=0 updated=1/);
  data = readJson(cronFile);
  assert.equal(data.jobs.length, 1);
  assert.deepEqual(data.jobs[0].state, { lastRunMs: 123 });
  assert.equal(fs.existsSync(`${cronFile}.lock`), false);

  console.log("cron-jobs-io tests passed");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
