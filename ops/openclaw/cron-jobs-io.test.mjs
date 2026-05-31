#!/usr/bin/env node
import assert from "assert/strict";
import { spawn, spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const IO = path.join(__dirname, "cron-jobs-io.mjs");
const MERGE_WORLD = path.join(CL_ROOT, "tools/world-ingest/merge-world-cron.mjs");

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-cron-"));
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function runNode(args, env, timeout = 5000) {
  const r = spawnSync(process.execPath, args, {
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout,
  });
  assert.equal(
    r.status,
    0,
    `command failed\nstdout:\n${r.stdout}\nstderr:\n${r.stderr}\nerror:\n${r.error?.message || ""}`,
  );
  return r;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout(promise, ms, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function testCliAddRemoveDoesNotSelfDeadlock() {
  const dir = tmpDir();
  const cron = path.join(dir, "jobs.json");
  runNode([IO, "add"], {
    CRON_FILE: cron,
    NAME: "test reminder",
    SCHEDULE: "cron:0 7 * * *:Asia/Taipei",
    SESSION: "main",
    PAYLOAD: "hello",
  });
  const afterAdd = readJson(cron);
  assert.equal(afterAdd.jobs.length, 1);
  assert.equal(afterAdd.jobs[0].name, "test reminder");

  runNode([IO, "remove"], {
    CRON_FILE: cron,
    JOB_ID: afterAdd.jobs[0].id,
  });
  const afterRemove = readJson(cron);
  assert.equal(afterRemove.jobs.length, 0);
}

async function testMergeWaitsForCronLock() {
  const dir = tmpDir();
  const cron = path.join(dir, "jobs.json");
  const snippet = path.join(dir, "world-snippet.json");
  fs.writeFileSync(
    cron,
    JSON.stringify(
      {
        version: 1,
        jobs: [
          {
            id: "existing",
            name: "Existing",
            enabled: true,
            schedule: { kind: "cron", expr: "0 0 * * *", tz: "UTC" },
            payload: { kind: "agentTurn", message: "keep" },
            state: { lastRunStatus: "ok" },
          },
        ],
      },
      null,
      2,
    ) + "\n",
  );
  fs.writeFileSync(
    snippet,
    JSON.stringify(
      [
        {
          id: "world-test",
          name: "World Test",
          enabled: true,
          schedule: { kind: "cron", expr: "30 6 * * *", tz: "UTC" },
          payload: { kind: "agentTurn", message: "world" },
          state: {},
        },
      ],
      null,
      2,
    ) + "\n",
  );

  const lock = `${cron}.lock`;
  fs.writeFileSync(lock, "held-by-test", { mode: 0o600 });
  const child = spawn(process.execPath, [MERGE_WORLD], {
    env: {
      ...process.env,
      CRON_FILE: cron,
      SNIPPET: snippet,
      OPENCLAW_TELEGRAM_TO: "123456",
      OPENCLAW_GATEWAY_PLIST: path.join(dir, "missing.plist"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  let exited = false;
  const exitPromise = new Promise((resolve) => {
    child.on("exit", (code, signal) => {
      exited = true;
      resolve({ code, signal });
    });
  });

  await sleep(300);
  assert.equal(exited, false, `merge ignored jobs.json lock\nstdout:\n${stdout}\nstderr:\n${stderr}`);

  fs.unlinkSync(lock);
  const result = await withTimeout(exitPromise, 5000, "merge after releasing lock");
  assert.equal(result.code, 0, `merge failed\nstdout:\n${stdout}\nstderr:\n${stderr}`);

  const data = readJson(cron);
  assert.deepEqual(
    data.jobs.map((j) => j.id).sort(),
    ["existing", "world-test"],
  );
  assert.equal(data.jobs.find((j) => j.id === "existing").state.lastRunStatus, "ok");
}

await testCliAddRemoveDoesNotSelfDeadlock();
await testMergeWaitsForCronLock();
console.log("cron-jobs-io tests passed");
