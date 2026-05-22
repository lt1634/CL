#!/usr/bin/env node
/**
 * Single-writer append for company-board.jsonl (see docs/COMPANY_BOARD_SCHEMA.md)
 */
import fs from "fs";
import path from "path";
import http from "http";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BOARD =
  process.env.COMPANY_BOARD_FILE ||
  path.join(process.env.HOME || ".", ".openclaw", "workspace", "company-board.jsonl");
const LOCK_PATH = `${BOARD}.writer.lock`;
const LOCK_MAX_MS = Number(process.env.BOARD_LOCK_MAX_MS || 30000);
const LOCK_RETRY_MS = Number(process.env.BOARD_LOCK_RETRY_MS || 50);
const SERVE_HOST = process.env.BOARD_WRITER_HOST || "127.0.0.1";
const SERVE_PORT = Number(process.env.BOARD_WRITER_PORT || 8765);
const BOARD_WRITER_TOKEN = process.env.BOARD_WRITER_TOKEN || "";
const TOKEN_MIN_LEN = 16;

function ulidLike() {
  const t = Date.now().toString(36).toUpperCase().padStart(8, "0");
  const r = crypto.randomBytes(10).toString("base64url").replace(/=/g, "");
  return `01${t}${r}`.slice(0, 26);
}

function ensureDir(filePath) {
  const d = path.dirname(filePath);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function acquireLock() {
  const start = Date.now();
  while (Date.now() - start < LOCK_MAX_MS) {
    try {
      fs.writeFileSync(LOCK_PATH, String(process.pid), { flag: "wx" });
      return;
    } catch {
      // stale lock: pid dead
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
  throw new Error(`board-writer: lock timeout (${LOCK_PATH})`);
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function releaseLock() {
  try {
    fs.unlinkSync(LOCK_PATH);
  } catch {
    /* ignore */
  }
}

function normalizeEvent(obj) {
  const o = { ...obj };
  if (!o.ts) o.ts = new Date().toISOString();
  if (!o.seq) o.seq = ulidLike();
  // Hermes 直接寫入時自動標示 writer
  if (!o.writer && o.actor === "hermes") o.writer = "hermes";
  console.error("board-writer: appending event", JSON.stringify(o));
  return o;
}

/** 可選嚴格模式：見 docs/COMPANY_BOARD_SCHEMA.md「board-writer 驗證」 */
function validateBoardEvent(o) {
  if (
    process.env.BOARD_REJECT_EMPTY_BLOCKED_QUESTION === "1" &&
    o.type === "blocked"
  ) {
    const q = o.question;
    if (typeof q !== "string" || !String(q).trim()) {
      throw new Error(
        "board-writer: type blocked requires non-empty question (or unset BOARD_REJECT_EMPTY_BLOCKED_QUESTION)",
      );
    }
  }
}

function appendEvent(obj) {
  const o = normalizeEvent(obj);
  validateBoardEvent(o);
  const line = JSON.stringify(o) + "\n";
  ensureDir(BOARD);
  acquireLock();
  try {
    fs.appendFileSync(BOARD, line, "utf8");
  } finally {
    releaseLock();
  }
  return JSON.parse(line.slice(0, -1));
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function requireServeToken() {
  if (!BOARD_WRITER_TOKEN || BOARD_WRITER_TOKEN.length < TOKEN_MIN_LEN) {
    console.error(
      `board-writer serve: set BOARD_WRITER_TOKEN (min ${TOKEN_MIN_LEN} chars) in environment`,
    );
    process.exit(1);
  }
}

function bearerToken(req) {
  const auth = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  return m ? m[1].trim() : "";
}

function checkHttpAuth(req) {
  const token = bearerToken(req);
  if (!token || !timingSafeEqual(token, BOARD_WRITER_TOKEN)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  return { ok: true };
}

/** Reject browser cross-site POSTs (CSRF) while allowing curl / no Origin. */
function checkHttpOrigin(req) {
  const raw = req.headers.origin || req.headers.referer;
  if (!raw) return { ok: true };
  try {
    const host = new URL(raw).hostname;
    if (host === "127.0.0.1" || host === "localhost") return { ok: true };
    return { ok: false, status: 403, error: "forbidden origin" };
  } catch {
    return { ok: false, status: 403, error: "forbidden origin" };
  }
}

function jsonResponse(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function main() {
  const [, , cmd, arg] = process.argv;

  if (cmd === "serve") {
    requireServeToken();
    const server = http.createServer(async (req, res) => {
      if (req.method === "GET" && req.url === "/health") {
        jsonResponse(res, 200, { ok: true, board: BOARD, auth: "required for POST /append" });
        return;
      }
      if (req.method === "POST" && req.url === "/append") {
        const auth = checkHttpAuth(req);
        if (!auth.ok) {
          jsonResponse(res, auth.status, { ok: false, error: auth.error });
          return;
        }
        const origin = checkHttpOrigin(req);
        if (!origin.ok) {
          jsonResponse(res, origin.status, { ok: false, error: origin.error });
          return;
        }
        try {
          const body = await readBody(req);
          const out = appendEvent(body);
          jsonResponse(res, 200, { ok: true, event: out });
        } catch (e) {
          jsonResponse(res, 400, { ok: false, error: String(e.message || e) });
        }
        return;
      }
      res.writeHead(404);
      res.end();
    });
    server.listen(SERVE_PORT, SERVE_HOST, () => {
      console.error(`board-writer listening http://${SERVE_HOST}:${SERVE_PORT} (board=${BOARD})`);
    });
    return;
  }

  if (cmd === "append" && arg) {
    const out = appendEvent(JSON.parse(arg));
    console.log(JSON.stringify(out));
    return;
  }

  if (!process.stdin.isTTY) {
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) process.exit(1);
      const lines = raw.split(/\n/).filter(Boolean);
      for (const line of lines) appendEvent(JSON.parse(line));
    });
    return;
  }

  console.error(`Usage:
  echo '<json>' | node board-writer.mjs
  node board-writer.mjs append '<json>'
  node board-writer.mjs serve
Env: COMPANY_BOARD_FILE, BOARD_WRITER_HOST, BOARD_WRITER_PORT
  BOARD_WRITER_TOKEN (required for serve; min 16 chars; use Bearer on POST /append)
  BOARD_REJECT_EMPTY_BLOCKED_QUESTION=1  (optional: reject type:blocked without question)`);
  process.exit(1);
}

main();
