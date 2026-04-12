#!/usr/bin/env python3
"""
PDF（純文字層）→ 繁體中文（臺灣用語）→ 簡易 EPUB（單一章 HTML），供 xtcify.mjs 轉 XTC。

依賴：本機已安裝 pdftotext（poppler）。

翻譯後端（擇一）：
  - **minimax-direct**（預設若已設 `MINIMAX_API_KEY`）：直接 HTTP 呼叫 MiniMax **Anthropic 相容** `/v1/messages`，**唔經 OpenClaw Gateway**，唔會撞 session lock。
  - **openclaw-infer**（預設若 PATH 有 `openclaw` 且無 MiniMax key）：`openclaw infer model run`，用 OpenClaw 已配好嘅 MiniMax。
  - **openclaw-agent**：`openclaw agent --agent <名>`，用該 agent 人格（較重）。
  - **openai**：需 `OPENAI_API_KEY`。
  - **ollama**：本機 http://127.0.0.1:11434 。

著作權：請僅作個人閱讀；勿散佈翻譯檔。
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path


def run_pdftotext(pdf: Path, out_txt: Path) -> None:
    out_txt.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["pdftotext", str(pdf), str(out_txt)],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        sys.stderr.write(r.stderr or "")
        raise SystemExit(f"pdftotext 失敗（exit {r.returncode}）")


def normalize_raw_text(s: str) -> str:
    s = s.replace("\x0c", "\n\n")
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip() + "\n"


def paragraph_chunks(text: str, max_chars: int) -> list[str]:
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[str] = []
    buf: list[str] = []
    n = 0
    for p in paras:
        if n + len(p) + 2 > max_chars and buf:
            chunks.append("\n\n".join(buf))
            buf = [p]
            n = len(p)
        else:
            buf.append(p)
            n += len(p) + 2
    if buf:
        chunks.append("\n\n".join(buf))
    return chunks


def ollama_translate(chunk: str, model: str, host: str, timeout: int) -> str:
    # 簡短英文提示較適合小模型；過長中英混排容易導致「原樣回傳英文」。
    prompt = (
        "Translate the following English excerpt into Traditional Chinese (Taiwan, zh-TW).\n"
        "Rules: Use Traditional Han characters only (no Simplified Chinese). "
        "Keep proper nouns in Latin script when they appear (e.g. Naval Ravikant, Eric Jorgenson, "
        "Navalmanack.com, Nav.al, Twitter, AngelList, Uber, Tim Ferriss). "
        "Preserve blank-line paragraph breaks. Output only the translation.\n\n"
        "---\n\n"
        + chunk
    )
    payload = json.dumps(
        {"model": model, "prompt": prompt, "stream": False}
    ).encode("utf-8")
    req = urllib.request.Request(
        f"{host.rstrip('/')}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    return (body.get("response") or "").strip()


def openai_translate(chunk: str, model: str, api_key: str, timeout: int) -> str:
    payload = json.dumps(
        {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Translate the user's English into Traditional Chinese (Taiwan, zh-TW). "
                        "Keep proper names in Latin script when standard (Naval Ravikant, Tim Ferriss, "
                        "AngelList, Twitter, etc.). Preserve paragraph breaks (blank lines). "
                        "Output only the translation, no preamble."
                    ),
                },
                {"role": "user", "content": chunk},
            ],
            "temperature": 0.2,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    return body["choices"][0]["message"]["content"].strip()


def minimax_anthropic_translate(
    chunk: str,
    api_key: str,
    base_url: str,
    model: str,
    timeout: int,
) -> str:
    """POST {base}/v1/messages（Anthropic 格式），與 OpenClaw 內 `api.minimax.io/anthropic` 一致。"""
    url = base_url.rstrip("/") + "/v1/messages"
    system = (
        "Translate the user's English into Traditional Chinese (Taiwan, zh-TW). "
        "Use Traditional Han characters only (no Simplified Chinese). "
        "Keep proper names in Latin script when standard (Naval Ravikant, Eric Jorgenson, "
        "Navalmanack.com, Nav.al, Tim Ferriss, AngelList, Twitter, Uber, etc.). "
        "Preserve paragraph breaks (blank lines). Output only the translation, no preamble."
    )
    payload = {
        "model": model,
        "max_tokens": 8192,
        "temperature": 0.2,
        "system": system,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": chunk}],
            }
        ],
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")[:4000]
        raise RuntimeError(f"MiniMax HTTP {e.code}: {err_body}") from e

    parts: list[str] = []
    for block in body.get("content") or []:
        if isinstance(block, dict) and block.get("type") == "text" and "text" in block:
            parts.append(str(block["text"]))
    text = "".join(parts).strip()
    if not text:
        raise RuntimeError("MiniMax 回傳無 text 內容（可能只有 thinking）")
    return text


def parse_openclaw_infer_stdout(raw: str) -> str:
    """openclaw infer model run 會把 [exec]、provider、outputs: 等印在 stdout，譯文喺 `outputs:` 之後。"""
    lines = raw.splitlines()
    for i, line in enumerate(lines):
        if re.match(r"^outputs:\s*\d+\s*$", line.strip()):
            return "\n".join(lines[i + 1 :]).strip("\n")
    cleaned = [
        ln
        for ln in lines
        if not ln.startswith("[exec]")
        and ln != "model.run via local"
        and not ln.startswith("provider:")
        and not ln.startswith("model:")
        and not re.match(r"^outputs:\s*\d+\s*$", ln.strip())
    ]
    return "\n".join(cleaned).strip("\n")


def openclaw_infer_translate(chunk: str, oc_bin: str, timeout: int) -> str:
    prompt = (
        "You are a translation engine. Translate the English excerpt into Traditional Chinese (Taiwan, zh-TW).\n"
        "Use Traditional Han characters only (no Simplified Chinese). "
        "Keep proper nouns in Latin script when they appear (Naval Ravikant, Eric Jorgenson, "
        "Navalmanack.com, Nav.al, Twitter, AngelList, Uber, Tim Ferriss, etc.). "
        "Preserve blank-line paragraph breaks. Output only the translation, no preamble.\n\n"
        "---\n\n"
        + chunk
    )
    r = subprocess.run(
        [oc_bin, "infer", "model", "run", "--prompt", prompt],
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if r.returncode != 0:
        err = (r.stderr or "").strip() or (r.stdout or "").strip()
        raise RuntimeError(f"openclaw infer model run 失敗（exit {r.returncode}）：{err[:2000]}")
    text = parse_openclaw_infer_stdout(r.stdout or "")
    if not text.strip():
        raise RuntimeError("openclaw infer 回傳空白譯文")
    return text.strip()


def openclaw_agent_translate(chunk: str, oc_bin: str, agent_id: str, timeout: int) -> str:
    msg = (
        "【單次翻譯任務】只輸出繁體中文（臺灣）譯文，不要加任何前言、結語或解釋。\n"
        "保留英文專有名詞（Naval Ravikant、Eric Jorgenson、Navalmanack.com、Nav.al、Twitter、AngelList 等）。\n"
        "保留原文的空行分段。\n\n---\n\n"
        + chunk
    )
    r = subprocess.run(
        [oc_bin, "agent", "--agent", agent_id, "--message", msg],
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if r.returncode != 0:
        err = (r.stderr or "").strip() or (r.stdout or "").strip()
        raise RuntimeError(f"openclaw agent 失敗（exit {r.returncode}）：{err[:2000]}")
    text = (r.stdout or "").strip()
    if not text:
        raise RuntimeError("openclaw agent 回傳空白")
    return text


def build_epub(title: str, author: str, body_zh: str, out_epub: Path) -> None:
    out_epub.parent.mkdir(parents=True, exist_ok=True)
    paras = [p.strip() for p in re.split(r"\n\s*\n", body_zh) if p.strip()]
    inner_parts = []
    for p in paras:
        inner_parts.append(f"<p>{html.escape(p)}</p>")
    xhtml = f"""<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-Hant">
<head>
  <meta charset="UTF-8"/>
  <title>{html.escape(title)}</title>
  <style type="text/css">
    body {{ font-family: serif; line-height: 1.45; margin: 1em; }}
    p {{ margin: 0.6em 0; }}
  </style>
</head>
<body>
<h1>{html.escape(title)}</h1>
{"".join(inner_parts)}
</body>
</html>
"""

    opf = f"""<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>{html.escape(title)}</dc:title>
    <dc:creator>{html.escape(author)}</dc:creator>
    <dc:language>zh-Hant</dc:language>
    <dc:identifier id="uid">urn:uuid:naval-zh-tw-epub</dc:identifier>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="c1" href="chapter.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="c1"/>
  </spine>
</package>
"""

    nav = f"""<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="zh-Hant">
<head><meta charset="UTF-8"/><title>目錄</title></head>
<body>
<nav epub:type="toc"><h1>目錄</h1><ol><li><a href="chapter.xhtml">{html.escape(title)}</a></li></ol></nav>
</body>
</html>
"""

    container = """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
"""

    if out_epub.exists():
        out_epub.unlink()
    with zipfile.ZipFile(out_epub, "w") as z:
        zi = zipfile.ZipInfo("mimetype")
        zi.compress_type = zipfile.ZIP_STORED
        z.writestr(zi, "application/epub+zip")
        z.writestr("META-INF/container.xml", container, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/content.opf", opf, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/nav.xhtml", nav, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/chapter.xhtml", xhtml, compress_type=zipfile.ZIP_DEFLATED)


def main() -> None:
    ap = argparse.ArgumentParser(description="PDF → 繁中 EPUB（供 xtcify）")
    ap.add_argument("--pdf", required=True, type=Path, help="輸入 PDF 路徑")
    ap.add_argument("--work", type=Path, default=None, help="工作目錄（預設：PDF 同層 naval_xtc_work）")
    ap.add_argument("--title", default="納瓦爾寶典（繁中試譯）")
    ap.add_argument("--author", default="Eric Jorgenson / 中譯由本機模型產生")
    ap.add_argument("--max-chunks", type=int, default=0, help="只處理前 N 段（除錯用；0=全部）")
    ap.add_argument("--chunk-chars", type=int, default=2800, help="每段約字數上限（英文）")
    ap.add_argument("--sleep", type=float, default=0.35, help="每段之間休眠秒數（避免打爆 Ollama）")
    ap.add_argument("--ollama-model", default="llama3.2:3b")
    ap.add_argument("--ollama-host", default=os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434"))
    ap.add_argument("--openai-model", default="gpt-4o-mini")
    ap.add_argument(
        "--minimax-base",
        default=os.environ.get("MINIMAX_ANTHROPIC_BASE_URL", "https://api.minimax.io/anthropic"),
        help="minimax-direct：Anthropic 相容 base（預設與 OpenClaw minimax 一致）",
    )
    ap.add_argument(
        "--minimax-model",
        default=os.environ.get("MINIMAX_MODEL", "MiniMax-M2.5"),
        help="minimax-direct：模型 id（例如 MiniMax-M2.7）",
    )
    ap.add_argument("--timeout", type=int, default=600, help="單段請求逾時秒數")
    ap.add_argument(
        "--engine",
        choices=("minimax-direct", "openclaw-infer", "openclaw-agent", "openai", "ollama"),
        default=None,
        help="預設：有 MINIMAX_API_KEY 則 minimax-direct；否則 PATH 有 openclaw 則 openclaw-infer；否則 openai／ollama",
    )
    ap.add_argument(
        "--openclaw-bin",
        default=None,
        help="openclaw 可執行檔路徑（預設：PATH 或環境變數 OPENCLAW_BIN）",
    )
    ap.add_argument(
        "--openclaw-agent",
        default="main",
        help="僅 --engine openclaw-agent：要跑一輪嘅 agent id（例如 main）",
    )
    ap.add_argument("--force-extract", action="store_true", help="重新 pdftotext 覆寫英文稿")
    args = ap.parse_args()

    pdf = args.pdf.expanduser().resolve()
    if not pdf.is_file():
        raise SystemExit(f"搵唔到 PDF：{pdf}")

    work = (args.work or (pdf.parent / "naval_xtc_work")).expanduser().resolve()
    raw_path = work / "extracted_en.txt"
    chunks_dir = work / "chunks_zh"
    merged_path = work / "merged_zh-Hant.txt"
    epub_path = work / f"{pdf.stem}_zh-Hant.epub"

    oc_bin = args.openclaw_bin or os.environ.get("OPENCLAW_BIN") or shutil.which("openclaw")

    engine = args.engine
    minimax_key = os.environ.get("MINIMAX_API_KEY", "").strip()
    if engine is None:
        if minimax_key:
            engine = "minimax-direct"
        elif oc_bin:
            engine = "openclaw-infer"
        elif os.environ.get("OPENAI_API_KEY"):
            engine = "openai"
        else:
            engine = "ollama"

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if engine == "openai" and not api_key:
        raise SystemExit("選用 openai 但未設定 OPENAI_API_KEY")
    if engine == "minimax-direct" and not minimax_key:
        raise SystemExit(
            "選用 minimax-direct 但未設定 MINIMAX_API_KEY（用 MiniMax 控制台嘅 key，"
            "與 OpenClaw 用開嘅係同一把；export 後再跑）"
        )
    if engine in ("openclaw-infer", "openclaw-agent") and not oc_bin:
        raise SystemExit("選用 openclaw-* 但搵唔到 openclaw（請安裝並加入 PATH，或用 --openclaw-bin / OPENCLAW_BIN）")

    sys.stderr.write(f"翻譯引擎：{engine}\n")

    work.mkdir(parents=True, exist_ok=True)
    if args.force_extract or not raw_path.is_file():
        sys.stderr.write(f"擷取文字 → {raw_path}\n")
        run_pdftotext(pdf, raw_path)
        raw_path.write_text(normalize_raw_text(raw_path.read_text("utf-8", errors="replace")), "utf-8")
    else:
        sys.stderr.write(f"沿用已存在英文稿：{raw_path}\n")

    raw = raw_path.read_text("utf-8", errors="replace")
    chunks = paragraph_chunks(raw, args.chunk_chars)
    if args.max_chunks and args.max_chunks > 0:
        chunks = chunks[: args.max_chunks]
        sys.stderr.write(f"⚠ 只翻譯前 {len(chunks)} 段（--max-chunks）\n")

    chunks_dir.mkdir(parents=True, exist_ok=True)
    done: list[str] = []
    for i, ch in enumerate(chunks):
        out_part = chunks_dir / f"part_{i:04d}.txt"
        if out_part.is_file() and out_part.stat().st_size > 0:
            done.append(out_part.read_text("utf-8"))
            sys.stderr.write(f"略過已譯段 {i+1}/{len(chunks)}\n")
            continue
        sys.stderr.write(f"翻譯段 {i+1}/{len(chunks)}（{len(ch)} 字元）…\n")
        for attempt in range(1, 4):
            try:
                if engine == "openai":
                    zh = openai_translate(ch, args.openai_model, api_key, args.timeout)
                elif engine == "minimax-direct":
                    zh = minimax_anthropic_translate(
                        ch,
                        minimax_key,
                        args.minimax_base,
                        args.minimax_model,
                        args.timeout,
                    )
                elif engine == "openclaw-infer":
                    zh = openclaw_infer_translate(ch, oc_bin, args.timeout)
                elif engine == "openclaw-agent":
                    zh = openclaw_agent_translate(ch, oc_bin, args.openclaw_agent, args.timeout)
                else:
                    zh = ollama_translate(ch, args.ollama_model, args.ollama_host, args.timeout)
                break
            except (
                urllib.error.URLError,
                urllib.error.HTTPError,
                TimeoutError,
                json.JSONDecodeError,
                subprocess.TimeoutExpired,
                RuntimeError,
            ) as e:
                sys.stderr.write(f"  重試 {attempt}/3：{e}\n")
                time.sleep(2 * attempt)
        else:
            raise SystemExit(f"段 {i} 翻譯失敗")
        out_part.write_text(zh.strip() + "\n", "utf-8")
        done.append(zh.strip())
        time.sleep(args.sleep)

    merged = "\n\n".join(done).strip() + "\n"
    merged_path.write_text(merged, "utf-8")
    sys.stderr.write(f"合併 → {merged_path}\n")

    build_epub(args.title, args.author, merged, epub_path)
    sys.stderr.write(f"EPUB → {epub_path}\n")
    sys.stderr.write("\n下一步（轉 XTC，繁體字型）：\n")
    sys.stderr.write(
        f'  cd "{Path(__file__).resolve().parent}" && node xtcify.mjs "{epub_path}" --font-tc --out "{work}"\n'
    )


if __name__ == "__main__":
    main()
