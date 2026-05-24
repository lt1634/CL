import assert from "assert";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const IO = path.join(__dirname, "cron-jobs-io.mjs");
const MERGE_WORLD = path.join(CL_ROOT, "tools/world-ingest/merge-world-cron.mjs");
const PLACEHOLDER = "__OPENCLAW_TELEGRAM_TO__";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-cron-test-"));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function runNode(script, args = [], env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [script, ...args], {
      env: { ...process.env, ...env },
      cwd: CL_ROOT,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`timeout: node ${path.basename(script)} ${args.join(" ")}`));
    }, 5_000);
    child.stdout.on("data", (c) => (stdout += c));
    child.stderr.on("data", (c) => (stderr += c));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`exit ${code}: ${stderr || stdout}`));
    });
  });
}

async function testAddRemoveDoesNotDeadlock() {
  const dir = tmpDir();
  try {
    const cronFile = path.join(dir, "jobs.json");
    fs.writeFileSync(cronFile, JSON.stringify({ version: 1, jobs: [] }, null, 2) + "\n");

    const add = await runNode(IO, ["add"], {
      CRON_FILE: cronFile,
      NAME: "Test cron add",
      SCHEDULE: "every:60000",
      SESSION: "main",
      PAYLOAD: "hello",
    });
    const id = add.stdout.match(/Added job: (\S+)/)?.[1];
    assert.ok(id, `missing added id in stdout: ${add.stdout}`);
    assert.equal(readJson(cronFile).jobs.length, 1);
    assert.equal(fs.existsSync(`${cronFile}.lock`), false);

    await runNode(IO, ["remove"], { CRON_FILE: cronFile, JOB_ID: id });
    assert.equal(readJson(cronFile).jobs.length, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function testMergeWorldUsesSafeIoAndFallbackDelivery() {
  const dir = tmpDir();
  try {
    const cronFile = path.join(dir, "jobs.json");
    const snippet = path.join(dir, "snippet.json");
    const job = {
      id: "world-test-001",
      name: "Old world job",
      enabled: false,
      schedule: { kind: "cron", expr: "0 1 * * *", tz: "Asia/Hong_Kong" },
      payload: { kind: "agentTurn", message: "old" },
      delivery: { mode: "announce", channel: "telegram", to: "12345" },
      state: { lastRunStatus: "ok", lastRunAtMs: 123 },
    };
    fs.writeFileSync(cronFile, JSON.stringify({ version: 1, jobs: [job] }, null, 2) + "\n", {
      mode: 0o644,
    });
    fs.writeFileSync(
      snippet,
      JSON.stringify(
        [
          {
            ...job,
            name: "New world job",
            enabled: true,
            payload: { kind: "agentTurn", message: "new" },
            delivery: { mode: "announce", channel: "telegram", to: PLACEHOLDER },
            state: {},
          },
        ],
        null,
        2,
      ) + "\n",
    );

    await runNode(MERGE_WORLD, [], {
      CRON_FILE: cronFile,
      SNIPPET: snippet,
      HOME: dir,
      OPENCLAW_TELEGRAM_TO: "",
    });
    const data = readJson(cronFile);
    assert.equal(data.jobs.length, 1);
    assert.equal(data.jobs[0].name, "New world job");
    assert.equal(data.jobs[0].delivery.to, "12345");
    assert.deepEqual(data.jobs[0].state, { lastRunStatus: "ok", lastRunAtMs: 123 });
    assert.equal(fs.statSync(cronFile).mode & 0o777, 0o600);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function run() {
  await testAddRemoveDoesNotDeadlock();
  await testMergeWorldUsesSafeIoAndFallbackDelivery();
  console.error("cron-jobs-io tests passed");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
