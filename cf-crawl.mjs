#!/usr/bin/env node
/**
 * Cloudflare Browser Rendering /crawl helper (no deps)
 *
 * Usage:
 *   CF_ACCOUNT_ID=... CF_API_TOKEN=... node cf-crawl.mjs --url https://example.com/
 *
 * Notes:
 * - Requires a Cloudflare API Token with "Browser Rendering - Edit" permission.
 * - /crawl is async: POST returns job id; GET polls for results.
 */

function usageAndExit(code = 1) {
  // Keep this short; it's a CLI helper.
  console.error(
    [
      "Usage:",
      "  CF_ACCOUNT_ID=... CF_API_TOKEN=... node cf-crawl.mjs --url <https://...> [--poll-ms 2000] [--timeout-ms 180000] [--out file.json]",
      "",
      "Required env:",
      "  CF_ACCOUNT_ID   Cloudflare account id",
      "  CF_API_TOKEN    Cloudflare API token (Browser Rendering - Edit)",
    ].join("\n"),
  );
  process.exit(code);
}

function parseArgs(argv) {
  const args = { pollMs: 2000, timeoutMs: 180000 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") args.url = argv[++i];
    else if (a === "--poll-ms") args.pollMs = Number(argv[++i]);
    else if (a === "--timeout-ms") args.timeoutMs = Number(argv[++i]);
    else if (a === "--out") args.out = argv[++i];
    else if (a === "-h" || a === "--help") usageAndExit(0);
    else {
      console.error(`Unknown arg: ${a}`);
      usageAndExit(1);
    }
  }
  return args;
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { CF_ACCOUNT_ID, CF_API_TOKEN } = process.env;
  const args = parseArgs(process.argv);

  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !args.url) usageAndExit(1);

  const base = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/browser-rendering/crawl`;
  const headers = {
    authorization: `Bearer ${CF_API_TOKEN}`,
    "content-type": "application/json",
  };

  const initRes = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify({ url: args.url }),
  });
  const initJson = await initRes.json().catch(() => null);
  if (!initRes.ok) {
    console.error("Failed to start crawl.");
    console.error(JSON.stringify(initJson ?? { status: initRes.status }, null, 2));
    process.exit(2);
  }

  // Cloudflare usually returns { success, result: { id } } but keep flexible.
  const jobId =
    initJson?.result?.id ||
    initJson?.result?.job_id ||
    initJson?.result?.jobId ||
    initJson?.result?.uuid;
  if (!jobId) {
    console.error("Started crawl but could not find job id in response:");
    console.error(JSON.stringify(initJson, null, 2));
    process.exit(3);
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < args.timeoutMs) {
    const res = await fetch(`${base}/${jobId}`, { headers });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("Polling failed:");
      console.error(JSON.stringify(json ?? { status: res.status }, null, 2));
      process.exit(4);
    }

    const status =
      json?.result?.status || json?.result?.state || json?.result?.phase || json?.status;
    if (status) {
      console.error(`[crawl] job=${jobId} status=${status}`);
    } else {
      console.error(`[crawl] job=${jobId} polled`);
    }

    if (status === "completed" || status === "errored" || status === "cancelled_by_user") {
      const out = JSON.stringify(json, null, 2);
      if (args.out) {
        const fs = await import("node:fs/promises");
        await fs.writeFile(args.out, out, "utf8");
        console.log(args.out);
      } else {
        console.log(out);
      }
      process.exit(status === "completed" ? 0 : 5);
    }

    await sleep(args.pollMs);
  }

  console.error(`Timeout after ${args.timeoutMs}ms waiting for job ${jobId}`);
  process.exit(6);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(99);
});

