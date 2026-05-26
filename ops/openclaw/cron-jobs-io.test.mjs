#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const CRON_IO = path.join(CL_ROOT, "ops/openclaw/cron-jobs-io.mjs");
const MERGE_WORLD = path.join(CL_ROOT, "tools/world-ingest/merge-world-cron.mjs");

function tmpDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function job(id, overrides = {}) {
  return {
    id,
    name: id,
    enabled: true,
    schedule: { kind: "cron", expr: "0 7 * * *", tz: "Asia/Hong_Kong" },
    payload: { kind: "agentTurn", message: id },
    state: {},
    ...overrides,
  };
}

function runNode(script, args, env) {
  return execFileSync(process.execPath, [script, ...args], {
    cwd: CL_ROOT,
    env: {
      ...process.env,
      OPENCLAW_SKIP_GATEWAY_STOP: "1",
      ...env,
    },
    encoding: "utf8",
    timeout: 5_000,
  });
}

{
  const dir = tmpDir("cron-add-remove");
  const cronFile = path.join(dir, "jobs.json");
  writeJson(cronFile, { version: 1, jobs: [job("job-remove-me")] });

  const addOut = runNode(CRON_IO, ["add"], {
    CRON_FILE: cronFile,
    NAME: "Smoke add",
    SCHEDULE: "every:60000",
    SESSION: "main",
    PAYLOAD: "hello",
  });
  assert.match(addOut, /Added job:/);
  assert.equal(readJson(cronFile).jobs.length, 2);
  assert.equal(fs.existsSync(`${cronFile}.lock`), false);

  const removeOut = runNode(CRON_IO, ["remove"], {
    CRON_FILE: cronFile,
    JOB_ID: "remove-me",
  });
  assert.match(removeOut, /Removed job: remove-me/);
  assert.equal(readJson(cronFile).jobs.length, 1);
  assert.equal(fs.existsSync(`${cronFile}.lock`), false);
}

{
  const dir = tmpDir("cron-merge-world");
  const cronFile = path.join(dir, "jobs.json");
  const snippetFile = path.join(dir, "snippet.json");
  writeJson(cronFile, {
    version: 1,
    jobs: [
      job("world-test-001", { state: { lastRunStatus: "ok", lastRunAtMs: 123 } }),
      job("unrelated-001"),
    ],
  });
  writeJson(snippetFile, [
    job("world-test-001", { name: "updated world job", state: {} }),
    job("world-new-001"),
  ]);

  const out = runNode(MERGE_WORLD, [], {
    CRON_FILE: cronFile,
    SNIPPET: snippetFile,
    OPENCLAW_TELEGRAM_TO: "12345",
  });
  assert.match(out, /Cron merge done: added=1 updated=1/);
  const merged = readJson(cronFile);
  assert.equal(merged.jobs.length, 3);
  assert.deepEqual(merged.jobs.find((j) => j.id === "world-test-001").state, {
    lastRunStatus: "ok",
    lastRunAtMs: 123,
  });
  assert.ok(merged.jobs.find((j) => j.id === "unrelated-001"));
  assert.ok(fs.existsSync(`${cronFile}.bak`));
}

{
  const dir = tmpDir("cron-invalid-schema");
  const cronFile = path.join(dir, "jobs.json");
  const snippetFile = path.join(dir, "snippet.json");
  fs.writeFileSync(cronFile, '{ "version": 1, "jobs": null }\n');
  writeJson(snippetFile, [job("world-test-001")]);

  assert.throws(() =>
    runNode(MERGE_WORLD, [], {
      CRON_FILE: cronFile,
      SNIPPET: snippetFile,
      OPENCLAW_TELEGRAM_TO: "12345",
    }),
  );
  assert.equal(fs.readFileSync(cronFile, "utf8"), '{ "version": 1, "jobs": null }\n');
}

console.log("cron-jobs-io tests passed");
