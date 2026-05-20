#!/usr/bin/env node
/**
 * Fix common OpenClaw CLI failures: missing typebox, plur-claw not on load.paths.
 */
import fs from "fs";
import path from "path";
import os from "os";
import { spawnSync } from "child_process";

const home = os.homedir();
const configPath = process.env.OPENCLAW_CONFIG || path.join(home, ".openclaw/openclaw.json");
const plurPath = path.join(home, ".openclaw/npm/node_modules/@plur-ai/claw");
const openclawRoot =
  process.env.OPENCLAW_ROOT || path.join(home, "Desktop/CL/openclaw");

function ensurePlurPath() {
  if (!fs.existsSync(configPath)) {
    console.error("Missing config:", configPath);
    process.exit(1);
  }
  if (!fs.existsSync(plurPath)) {
    console.warn("PLUR claw not installed at", plurPath, "— skip plugins.load.paths");
    return;
  }
  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  cfg.plugins = cfg.plugins || {};
  cfg.plugins.load = cfg.plugins.load || { paths: [] };
  const paths = cfg.plugins.load.paths || [];
  if (!paths.includes(plurPath)) {
    paths.push(plurPath);
    cfg.plugins.load.paths = paths;
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n");
    console.log("Added plugins.load.paths:", plurPath);
  } else {
    console.log("plur-claw path already in openclaw.json");
  }
}

function ensureTypebox() {
  const typeboxDir = path.join(openclawRoot, "node_modules/typebox");
  if (fs.existsSync(typeboxDir)) {
    console.log("typebox already present");
    return;
  }
  if (!fs.existsSync(path.join(openclawRoot, "package.json"))) {
    console.warn("No openclaw checkout at", openclawRoot, "— skip typebox install");
    return;
  }
  console.log("Installing typebox in", openclawRoot);
  const r = spawnSync("pnpm", ["add", "-w", "typebox@1.1.31"], {
    cwd: openclawRoot,
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

ensurePlurPath();
ensureTypebox();
console.log("OpenClaw CLI prerequisites OK");
