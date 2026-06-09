#!/usr/bin/env node
import assert from "assert/strict";
import { spawn, spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const CRON_IO = path.join(CL_ROOT, "ops/openclaw/cron-jobs-io.mjs");
const MERGE_WORLD = path.join(CL_ROOT, "tools/world-ingest/merge-world-cron.mjs");

function testJob(id) {
  return {
    id,
    name: id,
    enabled: true,
    schedule: { kind: "cron", expr: "0 7 * * *", tz: "UTC" },
    payload: { kind: "systemEvent", text: id },
    state: {},
  };
}

function writeCron(file, jobs) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ version: 1, jobs }, null, 2) + "\n");
}

function runNode(args, env) {
  const result = spawnSync(process.execPath, args, {
    cwd: CL_ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 2500,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForExit(child) {
  return await new Promise((resolve) => {
    child.on("exit", (code) => resolve(code));
  });
}

async function testAddRemoveDoNotSelfDeadlock(tmp) {
  const cronFile = path.join(tmp, "jobs-add-remove.json");
  writeCron(cronFile, []);

  runNode([CRON_IO, "add"], {
    CRON_FILE: cronFile,
    NAME: "smoke",
    SCHEDULE: "every:60000",
    PAYLOAD: "smoke payload",
  });

  let data = JSON.parse(fs.readFileSync(cronFile, "utf8"));
  assert.equal(data.jobs.length, 1);
  assert.match(data.jobs[0].id, /^job-/);

  runNode([CRON_IO, "remove"], {
    CRON_FILE: cronFile,
    JOB_ID: data.jobs[0].id,
  });

  data = JSON.parse(fs.readFileSync(cronFile, "utf8"));
  assert.equal(data.jobs.length, 0);
}

async function testMergeWaitsForLockAndPreservesConcurrentWrite(tmp) {
  const cronFile = path.join(tmp, "jobs-merge.json");
  const snippetFile = path.join(tmp, "snippet.json");
  const lockFile = `${cronFile}.lock`;

  writeCron(cronFile, [testJob("existing")]);
  fs.writeFileSync(
    snippetFile,
    JSON.stringify([testJob("incoming-from-merge")], null, 2) + "\n",
  );
  fs.writeFileSync(lockFile, String(process.pid), { flag: "wx" });

  const child = spawn(process.execPath, [MERGE_WORLD], {
    cwd: CL_ROOT,
    env: {
      ...process.env,
      CRON_FILE: cronFile,
      SNIPPET: snippetFile,
      OPENCLAW_TELEGRAM_TO: "123456",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  let exitedBeforeUnlock = false;
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  child.on("exit", () => {
    if (fs.existsSync(lockFile)) exitedBeforeUnlock = true;
  });

  await delay(300);
  assert.equal(exitedBeforeUnlock, false, "merge ignored the jobs.json lock");
  writeCron(cronFile, [testJob("existing"), testJob("concurrent-during-lock")]);
  fs.unlinkSync(lockFile);

  const code = await waitForExit(child);
  assert.equal(code, 0, stderr || stdout);

  const ids = JSON.parse(fs.readFileSync(cronFile, "utf8")).jobs.map((job) => job.id);
  assert.deepEqual(ids.sort(), ["concurrent-during-lock", "existing", "incoming-from-merge"]);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cron-jobs-io-test-"));
try {
  await testAddRemoveDoNotSelfDeadlock(tmp);
  await testMergeWaitsForLockAndPreservesConcurrentWrite(tmp);
  console.log("cron-jobs-io tests passed");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
