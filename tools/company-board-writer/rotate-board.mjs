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

const dir = path.dirname(BOARD);
const base = path.basename(BOARD, ".jsonl");
const day = new Date().toISOString().slice(0, 10);
const rotated = path.join(dir, `${base}-${day}.jsonl`);

if (!fs.existsSync(BOARD)) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(BOARD, "", "utf8");
  console.error(`Created empty ${BOARD}`);
  process.exit(0);
}

const stat = fs.statSync(BOARD);
if (stat.size === 0) {
  console.error(`Board empty, nothing to rotate: ${BOARD}`);
  process.exit(0);
}

if (fs.existsSync(rotated)) {
  console.error(`Target exists, skip: ${rotated}`);
  process.exit(1);
}

fs.renameSync(BOARD, rotated);
fs.writeFileSync(BOARD, "", "utf8");
console.error(`Rotated -> ${rotated}, fresh ${BOARD}`);
