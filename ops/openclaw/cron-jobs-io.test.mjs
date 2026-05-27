#!/usr/bin/env node
import assert from "assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const IO = path.join(CL_ROOT, "ops/openclaw/cron-jobs-io.mjs");
const MERGE_WORLD = path.join(CL_ROOT, "tools/world-ingest/merge-world-cron.mjs");

function makeTempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function writeJobs(cronFile, jobs) {
  fs.mkdirSync(path.dirname(cronFile), { recursive: true });
  fs.writeFileSync(cronFile, JSON.stringify({ version: 1, jobs }, null, 2) + "\n");
}

function runNode(script, args, env, timeout = 5000) {
  const result = spawnSync(process.execPath, [script, ...args], {
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout,
  });
  assert.equal(
    result.error?.code,
    undefined,
    `node ${path.basename(script)} failed to run: ${result.error?.message}`,
  );
  assert.equal(
    result.status,
    0,
    `node ${path.basename(script)} exited ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  return result;
}

{
  const dir = makeTempDir("cron-io-add");
  const cronFile = path.join(dir, "jobs.json");
  writeJobs(cronFile, []);

  runNode(IO, ["add"], {
    CRON_FILE: cronFile,
    OPENCLAW_GATEWAY_PLIST: path.join(dir, "missing.plist"),
    NAME: "Smoke",
    SCHEDULE: "cron:0 7 * * *:Asia/Hong_Kong",
    SESSION: "isolated",
    PAYLOAD: "hello",
  });

  const data = JSON.parse(fs.readFileSync(cronFile, "utf8"));
  assert.equal(data.jobs.length, 1);
  assert.equal(data.jobs[0].name, "Smoke");
  assert.equal(fs.existsSync(`${cronFile}.lock`), false);
}

{
  const dir = makeTempDir("cron-merge-world");
  const cronFile = path.join(dir, "jobs.json");
  const snippet = path.join(dir, "snippet.json");
  writeJobs(cronFile, [
    {
      id: "world-test-001",
      name: "old",
      enabled: true,
      schedule: { kind: "cron", expr: "0 6 * * *", tz: "Asia/Hong_Kong" },
      payload: { kind: "agentTurn", message: "old" },
      state: { lastRunMs: 123 },
    },
  ]);
  fs.writeFileSync(
    snippet,
    JSON.stringify(
      [
        {
          id: "world-test-001",
          name: "new",
          enabled: true,
          schedule: { kind: "cron", expr: "0 8 * * *", tz: "Asia/Hong_Kong" },
          payload: {
            kind: "agentTurn",
            message: "cd __CL_ROOT__ && bash /Users/timnewmac/Desktop/CL/tools/world-ingest/run.sh",
          },
          delivery: {
            mode: "announce",
            channel: "telegram",
            to: "__OPENCLAW_TELEGRAM_TO__",
          },
        },
      ],
      null,
      2,
    ) + "\n",
  );

  runNode(MERGE_WORLD, [], {
    CRON_FILE: cronFile,
    SNIPPET: snippet,
    OPENCLAW_TELEGRAM_TO: "12345",
    OPENCLAW_GATEWAY_PLIST: path.join(dir, "missing.plist"),
  });

  const data = JSON.parse(fs.readFileSync(cronFile, "utf8"));
  assert.equal(data.jobs.length, 1);
  assert.equal(data.jobs[0].name, "new");
  assert.deepEqual(data.jobs[0].state, { lastRunMs: 123 });
  assert.equal(data.jobs[0].delivery.to, "12345");
  assert.match(data.jobs[0].payload.message, new RegExp(`^cd ${CL_ROOT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.equal(data.jobs[0].payload.message.includes("/Users/timnewmac/Desktop/CL"), false);
  assert.equal(fs.existsSync(`${cronFile}.bak`), true);
}

console.log("cron-jobs-io tests passed");
