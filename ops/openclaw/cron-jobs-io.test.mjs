import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const IO = path.join(__dirname, "cron-jobs-io.mjs");
const MERGE_WORLD = path.join(CL_ROOT, "tools/world-ingest/merge-world-cron.mjs");
const LEGACY_CL_ROOT = "/Users/timnewmac/Desktop/CL";

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cl-cron-test-"));
}

function runNode(args, env) {
  return spawnSync(process.execPath, args, {
    cwd: CL_ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

test("cron-jobs-io add/remove uses a single lock", () => {
  const dir = mkTempDir();
  try {
    const cronFile = path.join(dir, "jobs.json");
    fs.writeFileSync(cronFile, JSON.stringify({ version: 1, jobs: [] }) + "\n");

    const add = runNode([IO, "add"], {
      CRON_FILE: cronFile,
      NAME: "test cron",
      SCHEDULE: "cron:0 1 * * *:Asia/Hong_Kong",
      PAYLOAD: "hello",
    });
    assert.equal(add.status, 0, add.stderr);

    const afterAdd = JSON.parse(fs.readFileSync(cronFile, "utf8"));
    assert.equal(afterAdd.jobs.length, 1);
    assert.match(afterAdd.jobs[0].id, /^job-/);
    assert.ok(fs.existsSync(`${cronFile}.bak`));

    const remove = runNode([IO, "remove"], {
      CRON_FILE: cronFile,
      JOB_ID: afterAdd.jobs[0].id,
    });
    assert.equal(remove.status, 0, remove.stderr);

    const afterRemove = JSON.parse(fs.readFileSync(cronFile, "utf8"));
    assert.equal(afterRemove.jobs.length, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("world cron merge preserves state and localizes repo paths", () => {
  const dir = mkTempDir();
  try {
    const cronFile = path.join(dir, "jobs.json");
    const snippet = path.join(dir, "snippet.json");
    fs.writeFileSync(
      cronFile,
      JSON.stringify(
        {
          version: 1,
          jobs: [
            {
              id: "world-test-001",
              name: "old",
              enabled: true,
              schedule: { kind: "cron", expr: "0 0 * * *", tz: "UTC" },
              payload: { kind: "agentTurn", message: "old" },
              state: { lastRunAtMs: 123 },
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
            id: "world-test-001",
            name: "new",
            enabled: true,
            schedule: { kind: "cron", expr: "0 1 * * *", tz: "Asia/Hong_Kong" },
            sessionTarget: "isolated",
            wakeMode: "now",
            payload: {
              kind: "agentTurn",
              message: `exec: bash ${LEGACY_CL_ROOT}/tools/world-ingest/morning-world-ingest.sh`,
            },
            delivery: { mode: "announce", channel: "telegram", to: "__OPENCLAW_TELEGRAM_TO__" },
            state: { shouldNotReplaceExistingState: true },
          },
        ],
        null,
        2,
      ) + "\n",
    );

    const merge = runNode([MERGE_WORLD], {
      CRON_FILE: cronFile,
      SNIPPET: snippet,
      OPENCLAW_TELEGRAM_TO: "12345",
      OPENCLAW_CRON_SKIP_GATEWAY_STOP: "1",
    });
    assert.equal(merge.status, 0, merge.stderr);

    const data = JSON.parse(fs.readFileSync(cronFile, "utf8"));
    assert.equal(data.jobs.length, 1);
    assert.equal(data.jobs[0].name, "new");
    assert.deepEqual(data.jobs[0].state, { lastRunAtMs: 123 });
    assert.equal(data.jobs[0].delivery.to, "12345");
    assert.ok(data.jobs[0].payload.message.includes(CL_ROOT));
    assert.ok(!data.jobs[0].payload.message.includes(LEGACY_CL_ROOT));
    assert.ok(fs.existsSync(`${cronFile}.bak`));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
