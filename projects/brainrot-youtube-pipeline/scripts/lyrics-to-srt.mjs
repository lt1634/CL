#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
const inPath = process.argv[2];
if (!inPath) {
  console.error("Usage: node scripts/lyrics-to-srt.mjs <lyrics.txt> [secPerLine=2.8] [out.srt]");
  process.exit(1);
}
const sec = parseFloat(process.argv[3] || "2.8", 10);
const outPath = process.argv[4] || inPath.replace(/\.txt$/i, ".srt");
function toTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}
const raw = readFileSync(inPath, "utf8");
const lines = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.length > 0 && !l.match(/^\[[^\]]+\]$/));
let t = 0;
const blocks = [];
for (let i = 0; i < lines.length; i++) {
  const start = t;
  const end = t + sec;
  blocks.push(`${i + 1}\n${toTimestamp(start)} --> ${toTimestamp(end)}\n${lines[i]}\n`);
  t = end;
}
writeFileSync(outPath, blocks.join("\n"), "utf8");
console.log("Wrote:", outPath, blocks.length, "cues");
