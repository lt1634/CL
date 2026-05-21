#!/usr/bin/env node
/**
 * Daily rotation: rename current COMPANY_BOARD_FILE to company-board-YYYY-MM-DD.jsonl
 * in the same directory, then create empty new file.
 */
import fs from "fs";
import path from "path";

const BOARD =
  process.env.COMPANY_BOARD_FILE ||
  path.join(process.env.HOME || ".", ".openclaw", "workspace", "company-board.jsonl");
const LOCK_PATH = `${BOARD}.writer.lock`;
const LOCK_MAX_MS = Number(process.env.BOARD_LOCK_MAX_MS || 30000);
const LOCK_RETRY_MS = Number(process.env.BOARD_LOCK_RETRY_MS || 50);

const dir = path.dirname(BOARD);
const base = path.basename(BOARD, ".jsonl");
const day = new Date().toISOString().slice(0, 10);
const rotated = path.join(dir, `${base}-${day}.jsonl`);

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock() {
  const start = Date.now();
  while (Date.now() - start < LOCK_MAX_MS) {
    try {
      fs.writeFileSync(LOCK_PATH, String(process.pid), { flag: "wx" });
      return;
    } catch {
      try {
        const pid = parseInt(fs.readFileSync(LOCK_PATH, "utf8").trim(), 10);
        if (pid && !isProcessAlive(pid)) {
          try {
            fs.unlinkSync(LOCK_PATH);
          } catch {
            /* ignore */
          }
          continue;
        }
      } catch {
        /* ignore */
      }
      const until = Date.now() + LOCK_RETRY_MS;
      while (Date.now() < until) {
        /* sync backoff */
      }
    }
  }
  throw new Error(`rotate-board: lock timeout (${LOCK_PATH})`);
}

function releaseLock() {
  try {
    fs.unlinkSync(LOCK_PATH);
  } catch {
    /* ignore */
  }
}

fs.mkdirSync(dir, { recursive: true });
acquireLock();
let exitCode = 0;
try {
  if (!fs.existsSync(BOARD)) {
    fs.writeFileSync(BOARD, "", "utf8");
    console.error(`Created empty ${BOARD}`);
  } else {
    const stat = fs.statSync(BOARD);
    if (stat.size === 0) {
      console.error(`Board empty, nothing to rotate: ${BOARD}`);
    } else if (fs.existsSync(rotated)) {
      console.error(`Target exists, skip: ${rotated}`);
      exitCode = 1;
    } else {
      fs.renameSync(BOARD, rotated);
      fs.writeFileSync(BOARD, "", "utf8");
      console.error(`Rotated -> ${rotated}, fresh ${BOARD}`);
    }
  }
} finally {
  releaseLock();
}
process.exit(exitCode);
