/**
 * Run: node ops/openclaw/cron-jobs-io.test.mjs
 */
import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const IO = path.join(__dirname, "cron-jobs-io.mjs");
const MERGE_WORLD = path.join(CL_ROOT, "tools/world-ingest/merge-world-cron.mjs");

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-cron-test-"));
}

function runNode(args, env, timeout = 5_000) {
  const result = spawnSync("node", args, {
    cwd: CL_ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout,
  });
  assert.ifError(result.error);
  assert.strictEqual(
    result.status,
    0,
    `node ${args.join(" ")} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  return result;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function testCliAddRemoveDoesNotDeadlock() {
  const dir = mkTmpDir();
  const cronFile = path.join(dir, "jobs.json");
  try {
    runNode([IO, "add"], {
      CRON_FILE: cronFile,
      NAME: "deadlock regression",
      SCHEDULE: "every:60000",
      SESSION: "isolated",
      PAYLOAD: "hello",
    });

    let data = readJson(cronFile);
    assert.strictEqual(data.jobs.length, 1);
    assert.strictEqual(data.jobs[0].name, "deadlock regression");

    runNode([IO, "remove"], {
      CRON_FILE: cronFile,
      JOB_ID: data.jobs[0].id,
    });

    data = readJson(cronFile);
    assert.deepStrictEqual(data.jobs, []);
    assert.ok(fs.existsSync(`${cronFile}.bak`), "remove should keep a pre-write backup");
    assert.ok(!fs.existsSync(`${cronFile}.lock`), "lock file should be cleaned up");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function testWorldMergeUsesSafeIoAndPreservesState() {
  const dir = mkTmpDir();
  const cronFile = path.join(dir, "jobs.json");
  try {
    writeJson(cronFile, {
      version: 1,
      jobs: [
        {
          id: "world-ingest-morning-001",
          name: "old world ingest",
          enabled: false,
          schedule: { kind: "cron", expr: "0 1 * * *", tz: "Asia/Hong_Kong" },
          sessionTarget: "isolated",
          wakeMode: "now",
          payload: { kind: "agentTurn", message: "old" },
          delivery: { mode: "announce", channel: "telegram", to: "old" },
          state: { lastRunAtMs: 123, lastError: "keep me" },
        },
      ],
    });

    runNode([MERGE_WORLD], {
      CRON_FILE: cronFile,
      OPENCLAW_TELEGRAM_TO: "123456",
    });

    const data = readJson(cronFile);
    const merged = data.jobs.find((job) => job.id === "world-ingest-morning-001");
    assert.ok(merged, "expected world-ingest-morning-001 to exist");
    assert.strictEqual(merged.name, "World ingest (RSS)");
    assert.deepStrictEqual(merged.state, { lastRunAtMs: 123, lastError: "keep me" });
    assert.strictEqual(merged.delivery.to, "123456");
    assert.ok(fs.existsSync(`${cronFile}.bak`), "merge should keep a pre-write backup");
    assert.ok(!fs.existsSync(`${cronFile}.lock`), "lock file should be cleaned up");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

testCliAddRemoveDoesNotDeadlock();
testWorldMergeUsesSafeIoAndPreservesState();
console.log("cron-jobs-io tests passed");
