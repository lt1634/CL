#!/usr/bin/env node
/**
 * Ensure memory.qmd.paths includes world layer (kb symlink + world md).
 */
import fs from "fs";
import path from "path";
import os from "os";

const configPath =
  process.env.OPENCLAW_CONFIG ||
  path.join(os.homedir(), ".openclaw/openclaw.json");

const worldPath = path.join(
  os.homedir(),
  ".openclaw/workspace/memory/world"
);
const clWorldKb = path.join(
  process.cwd().includes("world-ingest")
    ? path.join(process.cwd(), "../..")
    : process.cwd(),
  "memory/kb/world"
);

function main() {
  if (!fs.existsSync(configPath)) {
    console.error("Missing", configPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(configPath, "utf8");
  const cfg = JSON.parse(raw);
  const qmd = cfg.memory?.qmd;
  if (!qmd) {
    console.error("No memory.qmd in config");
    process.exit(1);
  }
  const paths = qmd.paths || [];
  const want = [
    {
      name: "memory-world",
      path: worldPath,
      pattern: "**/*.{md,json}",
    },
  ];
  let changed = false;
  for (const entry of want) {
    const exists = paths.some(
      (p) => p.name === entry.name || p.path === entry.path
    );
    if (!exists) {
      paths.push(entry);
      changed = true;
      console.log("Added qmd path:", entry.name, "->", entry.path);
    }
  }
  if (changed) {
    qmd.paths = paths;
    cfg.memory.qmd = qmd;
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n");
    console.log("Updated", configPath);
  } else {
    console.log("QMD world path already present");
  }
}

main();
