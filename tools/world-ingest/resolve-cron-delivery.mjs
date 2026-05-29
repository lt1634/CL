#!/usr/bin/env node
/**
 * Resolve delivery placeholders in cron job JSON (no secrets in repo).
 * Placeholder: __OPENCLAW_TELEGRAM_TO__ → OPENCLAW_TELEGRAM_TO from ~/.openclaw/.env
 */
import fs from "fs";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";

export const TELEGRAM_TO_PLACEHOLDER = "__OPENCLAW_TELEGRAM_TO__";
export const CL_ROOT_PLACEHOLDER = "__CL_ROOT__";

export function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function resolveTelegramTo(env = process.env) {
  if (env.OPENCLAW_TELEGRAM_TO) return String(env.OPENCLAW_TELEGRAM_TO).trim();
  const dot = loadDotEnv(path.join(os.homedir(), ".openclaw/.env"));
  if (dot.OPENCLAW_TELEGRAM_TO) return dot.OPENCLAW_TELEGRAM_TO.trim();
  throw new Error(
    "Missing OPENCLAW_TELEGRAM_TO — set in ~/.openclaw/.env (numeric Telegram user/chat id from allowlist)",
  );
}

export function resolveJobDelivery(job, telegramTo) {
  if (!job?.delivery) return job;
  const d = { ...job.delivery };
  if (d.to === TELEGRAM_TO_PLACEHOLDER) d.to = telegramTo;
  return { ...job, delivery: d };
}

function resolveClRoot(value, clRoot) {
  if (!clRoot) return value;
  if (typeof value === "string") return value.replaceAll(CL_ROOT_PLACEHOLDER, clRoot);
  if (Array.isArray(value)) return value.map((item) => resolveClRoot(item, clRoot));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveClRoot(item, clRoot)]),
    );
  }
  return value;
}

export function resolveJobs(jobs, telegramTo = resolveTelegramTo(), options = {}) {
  const clRoot = options.clRoot || process.env.CL_ROOT || "";
  return jobs.map((j) => resolveClRoot(resolveJobDelivery(j, telegramTo), clRoot));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const to = resolveTelegramTo();
    console.log(JSON.stringify({ ok: true, to: `${to.slice(0, 3)}…` }));
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }
}
