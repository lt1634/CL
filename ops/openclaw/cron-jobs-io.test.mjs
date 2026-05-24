import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const cronIo = path.join(repoRoot, "ops/openclaw/cron-jobs-io.mjs");
const mergeWorldCron = path.join(repoRoot, "tools/world-ingest/merge-world-cron.mjs");

function tmpCronFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cron-jobs-"));
  return path.join(dir, "jobs.json");
}

function runNode(script, args, env) {
  return spawnSync(process.execPath, [script, ...args], {
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 5_000,
  });
}

test("cron CLI add/remove completes without re-locking itself", () => {
  const cronFile = tmpCronFile();

  const add = runNode(cronIo, ["add"], {
    CRON_FILE: cronFile,
    NAME: "test job",
    SCHEDULE: "every:60000",
    SESSION: "main",
    PAYLOAD: "test payload",
  });
  assert.equal(add.status, 0, add.stderr || add.stdout);

  let data = JSON.parse(fs.readFileSync(cronFile, "utf8"));
  assert.equal(data.jobs.length, 1);
  assert.equal(data.jobs[0].name, "test job");

  const remove = runNode(cronIo, ["remove"], {
    CRON_FILE: cronFile,
    JOB_ID: data.jobs[0].id,
  });
  assert.equal(remove.status, 0, remove.stderr || remove.stdout);

  data = JSON.parse(fs.readFileSync(cronFile, "utf8"));
  assert.equal(data.jobs.length, 0);
});

test("world cron merge keeps local disabled flag and runtime state", () => {
  const cronFile = tmpCronFile();
  const snippet = path.join(path.dirname(cronFile), "world-snippet.json");
  fs.writeFileSync(
    cronFile,
    JSON.stringify(
      {
        version: 1,
        jobs: [
          {
            id: "world-opportunity-scan-001",
            name: "World opportunity scan",
            enabled: false,
            schedule: { kind: "cron", expr: "0 1 * * *", tz: "Asia/Hong_Kong" },
            sessionTarget: "isolated",
            payload: { kind: "agentTurn", message: "old" },
            state: { lastRunAtMs: 123 },
          },
        ],
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    snippet,
    JSON.stringify([
      {
        id: "world-opportunity-scan-001",
        name: "World opportunity scan",
        enabled: true,
        schedule: { kind: "cron", expr: "15 8 * * *", tz: "Asia/Hong_Kong" },
        sessionTarget: "isolated",
        wakeMode: "now",
        payload: { kind: "agentTurn", message: "new" },
        delivery: {
          mode: "announce",
          channel: "telegram",
          to: "__OPENCLAW_TELEGRAM_TO__",
        },
      },
    ]),
  );

  const merge = runNode(mergeWorldCron, [], {
    CRON_FILE: cronFile,
    SNIPPET: snippet,
    OPENCLAW_TELEGRAM_TO: "12345",
  });
  assert.equal(merge.status, 0, merge.stderr || merge.stdout);

  const [job] = JSON.parse(fs.readFileSync(cronFile, "utf8")).jobs;
  assert.equal(job.enabled, false);
  assert.deepEqual(job.state, { lastRunAtMs: 123 });
  assert.equal(job.payload.message, "new");
  assert.equal(job.delivery.to, "12345");
});
