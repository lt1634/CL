import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import https from "node:https";
import { chromium } from "playwright";

const CONVERTER_URL = "https://x4converter.rho.sh/";
const NOTO_SC_URL =
  "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf";
const NOTO_TC_URL =
  "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/TC/NotoSansTC-Regular.otf";

function die(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const epubPaths = [];
  let outDir = null;
  // Default to headful: this converter uses heavy WASM rendering and
  // some Chromium headless builds may not run it reliably.
  let headful = true;
  let debugDir = null;
  /** @type {"sc"|"tc"} */
  let fontVariant = "sc";
  /** Skip Noto upload (pure image EPUBs may render more reliably without font refresh). */
  let skipCjkFont = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-cjk-font") {
      skipCjkFont = true;
      continue;
    }
    if (a === "--font-tc" || a === "--tc") {
      fontVariant = "tc";
      continue;
    }
    if (a === "--font-sc" || a === "--sc") {
      fontVariant = "sc";
      continue;
    }
    if (a === "--out" || a === "-o") {
      outDir = argv[i + 1];
      if (!outDir) die("缺少 --out 參數值");
      i++;
      continue;
    }
    if (a === "--headful") {
      headful = true;
      continue;
    }
    if (a === "--headless") {
      headful = false;
      continue;
    }
    if (a === "--debug-dir") {
      debugDir = argv[i + 1];
      if (!debugDir) die("缺少 --debug-dir 參數值");
      i++;
      continue;
    }
    if (a === "--help" || a === "-h") {
      return {
        help: true,
        epubPaths: [],
        outDir: null,
        headful: true,
        debugDir: null,
        fontVariant: "sc",
        skipCjkFont: false,
      };
    }
    epubPaths.push(a);
  }

  return { help: false, epubPaths, outDir, headful, debugDir, fontVariant, skipCjkFont };
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function fileExists(p) {
  try {
    await fsp.access(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function downloadToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`下載失敗：HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    });
    req.on("error", (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

/**
 * @param {"sc"|"tc"} variant
 */
async function getNotoCjkFontPath(variant) {
  const cacheDir = path.join(os.homedir(), ".cache", "xtcify");
  const fileName = variant === "tc" ? "NotoSansTC-Regular.otf" : "NotoSansSC-Regular.otf";
  const fontPath = path.join(cacheDir, fileName);
  const url = variant === "tc" ? NOTO_TC_URL : NOTO_SC_URL;
  await ensureDir(cacheDir);
  if (!(await fileExists(fontPath))) {
    process.stderr.write(`下載中文字型到快取（${variant.toUpperCase()}）：${fontPath}\n`);
    await downloadToFile(url, fontPath);
  }
  return fontPath;
}

async function safeBasenameNoExt(p) {
  const b = path.basename(p);
  const ext = path.extname(b);
  return ext ? b.slice(0, -ext.length) : b;
}

function timestampId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function waitForReadyToExport(page, exportBtn) {
  // Most reliable signal across UI variants: export button becomes enabled.
  // Also ensure we are not in the "Load an EPUB file to begin" state.
  // Image-heavy EPUBs (e.g. PDF→EPUB cards) can take many minutes in WASM.
  const deadline = Date.now() + 20 * 60 * 1000;
  let lastLogAt = 0;
  while (Date.now() < deadline) {
    const now = Date.now();
    if (now - lastLogAt > 10_000) {
      const bodyTxt = await page.locator("body").innerText().catch(() => "");
      const title = await page.locator(".book-title").first().innerText().catch(() => "");
      const pageLine = (bodyTxt.match(/Page\s+\d+\s*\/\s*\d+/i) || [])[0] || "";
      let disabled = "unknown";
      const handle = await exportBtn.elementHandle().catch(() => null);
      if (handle) {
        disabled = await page.evaluate((el) => (el instanceof HTMLButtonElement ? String(el.disabled) : "false"), handle).catch(() => "unknown");
      }
      process.stderr.write(`…仍在渲染/準備匯出（title="${title.trim()}", ${pageLine || "no-page"}, exportDisabled=${disabled})\n`);
      lastLogAt = now;
    }

    const bodyTxt = await page.locator("body").innerText().catch(() => "");
    if (/Load an EPUB file to begin/i.test(bodyTxt)) {
      await page.waitForTimeout(1000);
      continue;
    }

    const handle = await exportBtn.elementHandle().catch(() => null);
    if (!handle) {
      await page.waitForTimeout(1000);
      continue;
    }
    const enabled = await page
      .evaluate((el) => !(el instanceof HTMLButtonElement) || !el.disabled, handle)
      .catch(() => false);
    if (enabled) return;

    await page.waitForTimeout(1000);
  }

  throw new Error("等待匯出按鈕可用逾時（可能網站卡住或 UI 變更）");
}

function waitForEnter(prompt) {
  return new Promise((resolve) => {
    process.stderr.write(prompt);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", () => resolve());
  });
}

/**
 * 網站改版時 accessible name 未必同 `getByRole` 一致；用多策略兜底。
 * @param {import("playwright").Page} page
 * @returns {Promise<import("playwright").Locator | null>}
 */
async function findExportXtcButton(page) {
  const tryLoc = async (/** @type {import("playwright").Locator} */ loc, label) => {
    try {
      const n = await loc.count();
      if (n > 0) {
        process.stderr.write(`匯出按鈕：用「${label}」（n=${n}）\n`);
        return loc.first();
      }
    } catch {
      // ignore
    }
    return null;
  };

  let hit = await tryLoc(page.getByRole("button", { name: /export\s+.*xtc/i }), "role=button /export.*xtc/i");
  if (hit) return hit;
  hit = await tryLoc(page.getByRole("button", { name: /export\s+to\s+xtc/i }), "role=button Export to XTC");
  if (hit) return hit;
  hit = await tryLoc(
    page.locator("button, input[type='button'], input[type='submit']").filter({ hasText: /export/i }).filter({ hasText: /xtc/i }),
    "button 含 Export + XTC",
  );
  if (hit) return hit;
  hit = await tryLoc(
    page.locator("[role='button']").filter({ hasText: /export/i }).filter({ hasText: /xtc/i }),
    "[role=button] 含 Export + XTC",
  );
  if (hit) return hit;

  // 用 DOM 掃描再掛一次性 attribute（SPA 有時 innerText 同 accessible name 唔一致）
  const tagged = await page.evaluate(() => {
    for (const el of document.querySelectorAll("button, [role='button'], input[type='submit'], input[type='button']")) {
      const t = (el.innerText || el.value || el.getAttribute("aria-label") || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!t) continue;
      if ((/export/i.test(t) && /xtc/i.test(t)) || /export\s+to\s+xtc/i.test(t)) {
        el.setAttribute("data-xtcify-export", "1");
        return true;
      }
    }
    return false;
  });
  if (tagged) {
    const loc = page.locator("[data-xtcify-export='1']").first();
    if (await loc.count()) {
      process.stderr.write("匯出按鈕：用 DOM 掃描 + data-xtcify-export\n");
      return loc;
    }
  }

  // 除錯：列出可見按鈕文字
  const snippets = await page.evaluate(() => {
    const sel = "button, [role='button'], input[type='submit'], input[type='button'], a[href]";
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      const t = (el.innerText || el.value || el.getAttribute("aria-label") || "")
        .replace(/\s+/g, " ")
        .trim();
      if (t && t.length < 120 && /export|xtc|download/i.test(t)) out.push(t);
    }
    return [...new Set(out)].slice(0, 25);
  });
  process.stderr.write(`除錯：頁面含 export/xtc/download 嘅控件文字：\n${snippets.join("\n") || "(無)"}\n`);
  return null;
}

async function convertOne({ epubPath, outDir, fontPath, headful, debugDir, fontVariant, skipCjkFont }) {
  const base = await safeBasenameNoExt(epubPath);
  const outPath = path.join(outDir, `${base}.xtc`);
  const epubFileName = path.basename(epubPath);

  const browser = await chromium.launch({ headless: !headful });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const runId = timestampId();
  const artifactsDir = debugDir
    ? path.resolve(debugDir)
    : path.join(os.tmpdir(), "xtcify-artifacts");
  const artifactPrefix = path.join(artifactsDir, `${base}.${runId}`);

  try {
    await ensureDir(artifactsDir);
    const logPath = `${artifactPrefix}.browser.log.txt`;
    const log = async (line) => {
      try {
        await fsp.appendFile(logPath, line + "\n", "utf-8");
      } catch {
        // ignore
      }
    };
    page.on("console", (msg) => {
      const txt = `[console.${msg.type()}] ${msg.text()}`;
      process.stderr.write(txt + "\n");
      void log(txt);
    });
    page.on("pageerror", (err) => {
      const txt = `[pageerror] ${String(err)}`;
      process.stderr.write(txt + "\n");
      void log(txt);
    });
    page.on("requestfailed", (req) => {
      const f = req.failure();
      const txt = `[requestfailed] ${req.method()} ${req.url()} ${f ? f.errorText : ""}`.trim();
      process.stderr.write(txt + "\n");
      void log(txt);
    });

    await page.goto(CONVERTER_URL, { waitUntil: "domcontentloaded" });
    process.stderr.write("已打開轉檔網站\n");

    // Load EPUB (explicit site ids are the most stable)
    await page.locator("#fileInput").waitFor({ state: "attached", timeout: 15_000 });
    if (await page.locator(".drop-zone").count()) {
      await page.locator(".drop-zone").first().click().catch(() => {});
    }
    await page.locator("#fileInput").setInputFiles(epubPath);
    await page.evaluate(() => {
      const el = document.querySelector("#fileInput");
      if (el) el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const el = document.querySelector("#fileCount");
      return Boolean(el && /file loaded/i.test(el.textContent || "") && !/0\\s+file/i.test(el.textContent || ""));
    }).catch(() => {});
    if (await page.locator("#fileListItems .file-item").count()) {
      await page.locator("#fileListItems .file-item").first().click().catch(() => {});
    }
    await page
      .waitForFunction((name) => {
        const t = document.querySelector(".book-title")?.textContent || "";
        return t.includes(name);
      }, epubFileName)
      .catch(() => {});
    process.stderr.write("已上傳 EPUB，等候渲染頁面…\n");

    // Settings (best-effort; ignore if UI differs)
    const deviceSelect = page.getByRole("combobox", { name: /device/i }).first();
    if (await deviceSelect.count()) await deviceSelect.selectOption({ label: /Xteink X4/i }).catch(() => {});
    const hyphenationSelect = page.getByRole("combobox", { name: /hyphenation/i }).first();
    if (await hyphenationSelect.count()) await hyphenationSelect.selectOption({ label: /off/i }).catch(() => {});
    const qualitySelect = page.getByRole("combobox", { name: /quality mode/i }).first();
    if (await qualitySelect.count()) await qualitySelect.selectOption({ label: /fast.*1-bit/i }).catch(() => {});
    const ignoreMarginsLabel = page.getByText(/ignore document margins/i).first();
    if (await ignoreMarginsLabel.count()) await ignoreMarginsLabel.click().catch(() => {});

    if (!skipCjkFont) {
      // Upload custom font (Noto Sans SC) to avoid ??? for CJK.
      if (await page.locator("#customFontUpload").count()) {
        await page.locator("#customFontUpload").setInputFiles(fontPath);
      }
      process.stderr.write(`已套用中文字型（Noto Sans ${fontVariant.toUpperCase()}）\n`);

      // Refresh render
      const refreshBtn = page.getByRole("button", { name: /refresh/i }).first();
      if (await refreshBtn.count()) await refreshBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
    } else {
      process.stderr.write("已跳過中文字型上傳（--no-cjk-font）\n");
    }

    // Export（網站改版時 role/name 會變，用 findExportXtcButton 兜底）
    const exportBtn = await findExportXtcButton(page);
    if (!exportBtn) {
      throw new Error("搵唔到匯出 XTC 按鈕（網站 UI 可能更新咗）");
    }
    await exportBtn.waitFor({ state: "visible", timeout: 10_000 });
    await waitForReadyToExport(page, exportBtn);
    process.stderr.write("渲染完成。\n");

    // Semi-auto export: in headful mode, ask user/agent to click Export once.
    const downloadPromise = page.waitForEvent("download", { timeout: 10 * 60 * 1000 });
    if (headful) {
      process.stderr.write("請喺打開嘅瀏覽器頁面按一下「Export to XTC」。\n");
      process.stderr.write("下載開始後等到完成；完成後回到終端機按 Enter。\n");
      await Promise.race([downloadPromise, waitForEnter("（完成後按 Enter）\n")]);
    } else {
      await exportBtn.click();
    }
    const download = await downloadPromise;
    await ensureDir(outDir);
    await download.saveAs(outPath);

    process.stderr.write(`輸出完成：${outPath}\n`);
  } catch (err) {
    // Save artifacts for debugging selector/UI changes.
    try {
      await page.screenshot({ path: `${artifactPrefix}.png`, fullPage: true });
      await fsp.writeFile(`${artifactPrefix}.html.txt`, await page.content(), "utf-8");
      process.stderr.write(`已輸出除錯檔：${artifactPrefix}.png / ${artifactPrefix}.html.txt\n`);
    } catch {
      // ignore
    }
    throw err;
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function main() {
  const { help, epubPaths, outDir, headful, debugDir, fontVariant, skipCjkFont } = parseArgs(
    process.argv.slice(2),
  );
  if (help || epubPaths.length === 0) {
    process.stdout.write(
      [
        "用法：",
        "  node xtcify.mjs <book.epub> [more.epub...] [--out <output-dir>] [--font-tc|--font-sc] [--headless] [--debug-dir <dir>]",
        "",
        "例子：",
        '  node xtcify.mjs "/path/book.epub"',
        '  node xtcify.mjs "/path/a.epub" "/path/b.epub" --out "/path/out"',
        '  node xtcify.mjs "/path/book.epub" --headless',
        '  node xtcify.mjs "/path/book-zh-Hant.epub" --font-tc',
        '  node xtcify.mjs "/path/photos.epub" --no-cjk-font   # 純圖片 EPUB',
        "",
      ].join("\n"),
    );
    process.exit(0);
  }

  const fontPath = await getNotoCjkFontPath(fontVariant);

  for (const epubPath of epubPaths) {
    if (!(await fileExists(epubPath))) die(`搵唔到檔案：${epubPath}`);
    const resolvedOut =
      outDir ?? path.dirname(path.resolve(epubPath));
    await convertOne({
      epubPath,
      outDir: resolvedOut,
      fontPath,
      headful,
      debugDir,
      fontVariant,
      skipCjkFont,
    });
  }
}

await main();

