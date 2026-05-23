#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mergeCronJobs } from "./cron-merge-utils.mjs";
import {
  resolveJobs,
  resolveTelegramTo,
  TELEGRAM_TO_PLACEHOLDER,
} from "../../tools/world-ingest/resolve-cron-delivery.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CL_ROOT = path.resolve(__dirname, "../..");
const SNIPPET = path.join(CL_ROOT, "ops/openclaw/memory-weekly-janitor-cron.snippet.json");

function telegramToFromExistingJobs(data) {
  for (const job of data.jobs || []) {
    const to = job?.delivery?.to;
    if (to && to !== TELEGRAM_TO_PLACEHOLDER) return String(to);
  }
  return null;
}

let telegramTo = process.env.OPENCLAW_TELEGRAM_TO;
if (!telegramTo) {
  try {
    telegramTo = resolveTelegramTo();
  } catch {
    const { readJobs } = await import("./cron-jobs-io.mjs");
    const data = readJobs();
    telegramTo = telegramToFromExistingJobs(data);
    if (!telegramTo) {
      throw new Error(
        "Set OPENCLAW_TELEGRAM_TO in ~/.openclaw/.env or ensure an existing cron job has delivery.to",
      );
    }
  }
}
const incoming = resolveJobs(JSON.parse(fs.readFileSync(SNIPPET, "utf8")), telegramTo);
const { added, updated } = mergeCronJobs(incoming, { clRoot: CL_ROOT });
console.log(`Memory janitor cron: added=${added} updated=${updated}`);
