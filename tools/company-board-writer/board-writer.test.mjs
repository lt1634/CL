/**
 * board-writer.mjs — integration / unit tests
 * Run:  node board-writer.test.mjs
 *       BOARD_REJECT_EMPTY_BLOCKED_QUESTION=1 node board-writer.test.mjs  (strict mode)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import http from "http";
import assert from "assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WRITER = path.join(__dirname, "board-writer.mjs");
const ROTATE = path.join(__dirname, "rotate-board.mjs");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COUNTER = { v: 0 };
function nextId() {
  return `test-${Date.now()}-${++COUNTER.v}`;
}

/** Create a tmp directory and return its path. Caller is responsible for rmdir. */
function mkTmpDir() {
  const dir = path.join("/tmp", `bw-test-${nextId()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Return a tmp board file path (parent dir auto-created on first write). */
function tmpBoard(dir) {
  return path.join(dir, "company-board.jsonl");
}

/** Append one event via the CLI and return parsed stdout (or throw). */
async function cliAppend(payload, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, ...extraEnv };
    const child = spawn("node", [WRITER, "append", JSON.stringify(payload)], {
      env,
      cwd: "/tmp",
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (c) => (out += c));
    child.stderr.on("data", (c) => (err += c));
    child.on("close", (code) => {
      const trimmed = out.trim();
      if (code === 0) {
        try {
          resolve(trimmed ? JSON.parse(trimmed) : {});
        } catch (e) {
          reject(new Error(`stdout JSON parse error: ${trimmed} — ${e.message}`));
        }
      } else {
        reject(new Error(`exit ${code}: ${err || "(no stderr)"}`));
      }
    });
    child.on("error", reject);
  });
}

/** Run the daily rotation helper and return its exit details. */
async function runRotate(extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, ...extraEnv };
    const child = spawn("node", [ROTATE], { env, cwd: "/tmp" });
    let out = "";
    let err = "";
    child.stdout.on("data", (c) => (out += c));
    child.stderr.on("data", (c) => (err += c));
    child.on("close", (code) => resolve({ code, out, err }));
    child.on("error", reject);
  });
}

/** Tail the board file and return parsed lines. */
function tailBoard(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8");
  return raw
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return fn()
      .then(() => {
        console.error(`  ✓ ${name}`);
        passed++;
      })
      .catch((e) => {
        console.error(`  ✗ ${name}: ${e.message}`);
        failed++;
      });
  }

  console.error("\n=== board-writer tests ===\n");

  // -------------------------------------------------------------------------
  // 1. BLOCKED validation — strict mode: empty question → throw
  // -------------------------------------------------------------------------
  await test(
    "strict: type:blocked without question throws (BOARD_REJECT_EMPTY_BLOCKED_QUESTION=1)",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      try {
        await cliAppend(
          { type: "blocked", task_id: "T1", actor: "albert", question: "" },
          { COMPANY_BOARD_FILE: board, BOARD_REJECT_EMPTY_BLOCKED_QUESTION: "1" }
        );
        throw new Error("should have thrown");
      } catch (e) {
        if (e.message.includes("non-empty question")) return; // ok
        throw e;
      } finally {
        fs.rmSync(dir, { recursive: true });
      }
    }
  );

  await test(
    "strict: type:blocked with whitespace-only question throws",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      try {
        await cliAppend(
          { type: "blocked", task_id: "T1", actor: "albert", question: "   " },
          { COMPANY_BOARD_FILE: board, BOARD_REJECT_EMPTY_BLOCKED_QUESTION: "1" }
        );
        throw new Error("should have thrown");
      } catch (e) {
        if (e.message.includes("non-empty question")) return;
        throw e;
      } finally {
        fs.rmSync(dir, { recursive: true });
      }
    }
  );

  await test(
    "strict: type:blocked with valid question writes successfully",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      const result = await cliAppend(
        { type: "blocked", task_id: "T1", actor: "albert", question: "Approved?" },
        { COMPANY_BOARD_FILE: board, BOARD_REJECT_EMPTY_BLOCKED_QUESTION: "1" }
      );
      if (!result.seq) throw new Error("seq not generated");
      if (result.type !== "blocked") throw new Error("type wrong");
      const lines = tailBoard(board);
      if (lines.length !== 1) throw new Error("expected 1 line");
      if (lines[0].question !== "Approved?") throw new Error("question lost");
      fs.rmSync(dir, { recursive: true });
    }
  );

  // -------------------------------------------------------------------------
  // 2. BLOCKED validation — lenient mode: no env or env != "1" → no throw
  // -------------------------------------------------------------------------
  for (const envVal of ["", "0", "abc", undefined]) {
    const label =
      envVal === undefined ? "unset" : `BOARD_REJECT_EMPTY_BLOCKED_QUESTION="${envVal}"`;
    await test(
      `lenient: ${label} → type:blocked without question does NOT throw`,
      async () => {
        const dir = mkTmpDir();
        const board = tmpBoard(dir);
        const extra =
          envVal === undefined
            ? {}
            : { BOARD_REJECT_EMPTY_BLOCKED_QUESTION: envVal };
        const result = await cliAppend(
          { type: "blocked", task_id: "T1", actor: "albert", question: "" },
          { COMPANY_BOARD_FILE: board, ...extra }
        );
        if (!result.seq) throw new Error("seq not generated");
        const lines = tailBoard(board);
        if (lines.length !== 1) throw new Error("expected 1 line");
        fs.rmSync(dir, { recursive: true });
      }
    );
  }

  // -------------------------------------------------------------------------
  // 3. Auto-fill seq / ts
  // -------------------------------------------------------------------------
  await test(
    "missing seq → auto-generated ULID-like string",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      const result = await cliAppend(
        { type: "evidence", task_id: "T2", actor: "lt1634", summary: "test" },
        { COMPANY_BOARD_FILE: board }
      );
      if (!result.seq) throw new Error("seq not filled");
      if (result.seq.length < 10) throw new Error("seq too short");
      fs.rmSync(dir, { recursive: true });
    }
  );

  await test(
    "missing ts → ISO8601 UTC",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      const result = await cliAppend(
        { type: "evidence", task_id: "T3", actor: "lt1634", summary: "test" },
        { COMPANY_BOARD_FILE: board }
      );
      if (!result.ts) throw new Error("ts not filled");
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.ts))
        throw new Error(`ts not ISO8601: ${result.ts}`);
      fs.rmSync(dir, { recursive: true });
    }
  );

  await test(
    "both seq and ts provided → preserved (not overwritten)",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      const provided = { seq: "MYSEQ123", ts: "2025-01-01T00:00:00.000Z" };
      const result = await cliAppend(
        { ...provided, type: "state_set", task_id: "T4", actor: "albert", state: "working" },
        { COMPANY_BOARD_FILE: board }
      );
      if (result.seq !== "MYSEQ123") throw new Error(`seq overwritten: ${result.seq}`);
      if (result.ts !== "2025-01-01T00:00:00.000Z") throw new Error(`ts overwritten: ${result.ts}`);
      fs.rmSync(dir, { recursive: true });
    }
  );

  // -------------------------------------------------------------------------
  // 4. hermes_result round-trip
  // -------------------------------------------------------------------------
  await test(
    "hermes_result writes with actor:hermes and idempotency_key",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      const payload = {
        type: "hermes_result",
        task_id: "T5",
        actor: "hermes",
        summary: "script output…",
        idempotency_key: "T5-hermes-20260413-1",
      };
      const result = await cliAppend(payload, { COMPANY_BOARD_FILE: board });
      if (result.actor !== "hermes") throw new Error(`actor not preserved: ${result.actor}`);
      if (result.idempotency_key !== "T5-hermes-20260413-1")
        throw new Error("idempotency_key lost");
      const lines = tailBoard(board);
      if (lines.length !== 1) throw new Error("expected 1 line");
      if (lines[0].summary !== "script output…") throw new Error("summary lost");
      fs.rmSync(dir, { recursive: true });
    }
  );

  // -------------------------------------------------------------------------
  // 5. retry / error fields preserved
  // -------------------------------------------------------------------------
  await test(
    "retry with attempt + detail preserved",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      const result = await cliAppend(
        {
          type: "retry",
          task_id: "T6",
          actor: "lt1634",
          attempt: 3,
          detail: "network timeout, retrying",
        },
        { COMPANY_BOARD_FILE: board }
      );
      if (result.attempt !== 3) throw new Error(`attempt wrong: ${result.attempt}`);
      if (!result.detail.includes("network")) throw new Error("detail lost");
      fs.rmSync(dir, { recursive: true });
    }
  );

  await test(
    "error with message + attempted_steps preserved",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      const result = await cliAppend(
        {
          type: "error",
          task_id: "T7",
          actor: "lt1634",
          message: "source unreachable",
          attempted_steps: ["fetch DOI", "try PubMed fallback"],
        },
        { COMPANY_BOARD_FILE: board }
      );
      if (!result.message.includes("unreachable")) throw new Error("message lost");
      if (!Array.isArray(result.attempted_steps)) throw new Error("attempted_steps not array");
      if (result.attempted_steps.length !== 2) throw new Error("attempted_steps wrong length");
      fs.rmSync(dir, { recursive: true });
    }
  );

  // -------------------------------------------------------------------------
  // 6. Multiple sequential writes — seq monotonically increasing per file
  // -------------------------------------------------------------------------
  await test(
    "sequential writes produce unique, increasing seqs",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(
          await cliAppend(
            { type: "evidence", task_id: `T${i}`, actor: "lt1634", summary: `line ${i}` },
            { COMPANY_BOARD_FILE: board }
          )
        );
      }
      const seqs = results.map((r) => r.seq);
      const uniq = [...new Set(seqs)];
      if (uniq.length !== seqs.length) throw new Error("seqs not unique");
      // ULID-like strings sort lexicographically with time prefix
      for (let i = 1; i < seqs.length; i++) {
        if (seqs[i] <= seqs[i - 1]) throw new Error(`seqs not increasing: ${seqs[i - 1]} → ${seqs[i]}`);
      }
      const lines = tailBoard(board);
      if (lines.length !== 5) throw new Error(`expected 5 lines, got ${lines.length}`);
      fs.rmSync(dir, { recursive: true });
    }
  );

  // -------------------------------------------------------------------------
  // 7. Lock prevents concurrent corruption (basic check — one process waits)
  // -------------------------------------------------------------------------
  await test(
    "concurrent appends: both succeed, file has both lines",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      // Write 5 lines concurrently
      await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          cliAppend(
            { type: "evidence", task_id: `TC${i}`, actor: "lt1634", summary: `concurrent ${i}` },
            { COMPANY_BOARD_FILE: board }
          )
        )
      );
      const lines = tailBoard(board);
      if (lines.length !== 5) throw new Error(`expected 5 lines after concurrent write, got ${lines.length}`);
      // Each line should be valid JSON
      for (const l of lines) {
        if (!l.seq || !l.ts || !l.type) throw new Error("line missing required fields");
      }
      fs.rmSync(dir, { recursive: true });
    }
  );

  await test(
    "rotate respects active writer lock and leaves board untouched",
    async () => {
      const dir = mkTmpDir();
      const board = tmpBoard(dir);
      const initial = {
        type: "evidence",
        task_id: "TR1",
        actor: "lt1634",
        summary: "must survive blocked rotation",
      };
      fs.writeFileSync(board, JSON.stringify(initial) + "\n", "utf8");
      fs.writeFileSync(`${board}.writer.lock`, String(process.pid), "utf8");

      try {
        const result = await runRotate({
          COMPANY_BOARD_FILE: board,
          BOARD_LOCK_MAX_MS: "120",
          BOARD_LOCK_RETRY_MS: "10",
        });
        if (result.code === 0) throw new Error("rotate should fail while writer lock is active");
        if (!result.err.includes("lock timeout")) throw new Error(`expected lock timeout, got: ${result.err}`);

        const lines = tailBoard(board);
        if (lines.length !== 1) throw new Error(`expected board to keep 1 line, got ${lines.length}`);
        if (lines[0].summary !== initial.summary) throw new Error("board content changed during locked rotate");

        const day = new Date().toISOString().slice(0, 10);
        const rotated = path.join(dir, `company-board-${day}.jsonl`);
        if (fs.existsSync(rotated)) throw new Error("rotate created archive despite active writer lock");
      } finally {
        fs.rmSync(dir, { recursive: true });
      }
    }
  );

  // -------------------------------------------------------------------------
  // 8. HTTP server — POST /append
  // -------------------------------------------------------------------------

  /** Start the writer server and return {port, kill}.  Uses a unique port per call. */
  async function startServer(extraEnv = {}) {
    const port = 10000 + (COUNTER.v % 50000);
    const env = {
      ...process.env,
      ...extraEnv,
      BOARD_WRITER_HOST: "127.0.0.1",
      BOARD_WRITER_PORT: String(port),
    };
    const child = spawn("node", [WRITER, "serve"], { env, cwd: "/tmp" });
    // Wait for server to be ready (listen once on stderr)
    await new Promise((res, rej) => {
      child.stderr.once("data", res);
      child.on("error", rej);
    });
    await new Promise((res) => setTimeout(res, 150)); // let server() finish setup
    return {
      port,
      kill: () => child.kill(),
    };
  }

  await test("serve: POST /append with valid event returns 200 + event", async () => {
    const dir = mkTmpDir();
    const board = tmpBoard(dir);
    const { port, kill } = await startServer({ COMPANY_BOARD_FILE: board });
    try {
      const payload = JSON.stringify({
        type: "evidence",
        task_id: "T8",
        actor: "lt1634",
        summary: "via http",
      });
      const result = await new Promise((resolve, reject) => {
        const req = http.request(
          { method: "POST", path: "/append", port, host: "127.0.0.1" },
          (res) => {
            let body = "";
            res.on("data", (c) => (body += c));
            res.on("end", () => {
              if (res.statusCode !== 200)
                return reject(new Error(`HTTP ${res.statusCode}: ${body}`));
              resolve(JSON.parse(body));
            });
          }
        );
        req.on("error", reject);
        req.write(payload);
        req.end();
      });
      if (!result.ok) throw new Error(`server returned ok=false: ${JSON.stringify(result)}`);
      if (!result.event?.seq) throw new Error("no seq in returned event");
      const lines = tailBoard(board);
      if (lines.length !== 1) throw new Error(`expected 1 line, got ${lines.length}`);
    } finally {
      kill();
      fs.rmSync(dir, { recursive: true });
    }
  });

  await test("serve: GET /health returns ok:true", async () => {
    const dir = mkTmpDir();
    const board = tmpBoard(dir);
    const { port, kill } = await startServer({ COMPANY_BOARD_FILE: board });
    try {
      const result = await new Promise((resolve, reject) => {
        http.get({ path: "/health", host: "127.0.0.1", port }, (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => resolve(JSON.parse(body)));
        }).on("error", reject);
      });
      if (!result.ok) throw new Error(`health returned ok=false: ${JSON.stringify(result)}`);
      if (!result.board) throw new Error("health missing board path");
    } finally {
      kill();
      fs.rmSync(dir, { recursive: true });
    }
  });

  await test("serve: POST /append with invalid JSON returns 400", async () => {
    const dir = mkTmpDir();
    const board = tmpBoard(dir);
    const { port, kill } = await startServer({ COMPANY_BOARD_FILE: board });
    try {
      const result = await new Promise((resolve, reject) => {
        const req = http.request(
          { method: "POST", path: "/append", port, host: "127.0.0.1" },
          (res) => {
            let body = "";
            res.on("data", (c) => (body += c));
            res.on("end", () => resolve({ statusCode: res.statusCode, body }));
          }
        );
        req.on("error", reject);
        req.write("not json{");
        req.end();
      });
      if (result.statusCode !== 400) throw new Error(`expected 400, got ${result.statusCode}`);
    } finally {
      kill();
      fs.rmSync(dir, { recursive: true });
    }
  });

  await test("serve: POST /append with blocked+empty question + REJECT=1 returns 400", async () => {
    const dir = mkTmpDir();
    const board = tmpBoard(dir);
    const { port, kill } = await startServer({
      COMPANY_BOARD_FILE: board,
      BOARD_REJECT_EMPTY_BLOCKED_QUESTION: "1",
    });
    try {
      const result = await new Promise((resolve, reject) => {
        const req = http.request(
          { method: "POST", path: "/append", port, host: "127.0.0.1" },
          (res) => {
            let body = "";
            res.on("data", (c) => (body += c));
            res.on("end", () => resolve({ statusCode: res.statusCode, body }));
          }
        );
        req.on("error", reject);
        req.write(JSON.stringify({ type: "blocked", task_id: "T9", actor: "albert", question: "" }));
        req.end();
      });
      if (result.statusCode !== 400) throw new Error(`expected 400, got ${result.statusCode}`);
      if (!result.body.includes("non-empty question"))
        throw new Error(`expected 'non-empty question' error, got: ${result.body}`);
    } finally {
      kill();
      fs.rmSync(dir, { recursive: true });
    }
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.error(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
