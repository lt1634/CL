#!/usr/bin/env python3
"""
每日合法書庫更新：華語／中文館藏為主，輸出到 Desktop/XTEINK-書庫。

資料來源（僅目錄與公版全文連結，不抓取商業 DRM 內容）：
- Open Library Search API（書目、是否可借閱、Internet Archive 公版掃描）
- 可選：Gutendex（Project Gutenberg 中文公版，網路不通時自動略過）

使用：
  python3 daily_research.py              # 互動終端：跑完書目後會問「要不要下載公版」
  python3 daily_research.py -y           # 不詢問，直接下載（最多 N 本，見 --max-downloads）
  python3 daily_research.py --no-download # 不詢問、不下載（等同 cron 背景執行）

Cron 只產生書目、不下載；下載請你在終端手動跑並答 y，或用 -y。

macOS 排程請用 LaunchAgent + install-launchd.sh（cron 讀唔到 Desktop 路徑）；見 crontab.example。
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime
from pathlib import Path

USER_AGENT = "free-chinese-book-daily/1.0 (personal research; +https://openlibrary.org/developers)"
OUTPUT_REL = Path("Desktop") / "XTEINK-書庫"


def get_output_dir() -> Path:
    """預設寫入 ~/Desktop/XTEINK-書庫；設 XTEINK_DATA_DIR 則改寫（供 LaunchAgent／無 Desktop 權限環境）。"""
    override = (os.environ.get("XTEINK_DATA_DIR") or "").strip()
    if override:
        return Path(override).expanduser().resolve()
    return Path.home() / OUTPUT_REL
KEYWORDS_PER_TOPIC = 2  # 每日每主題實際查詢的關鍵字數（避免對 Open Library 過度請求）
MIN_DOWNLOAD_BYTES = 2048  # 小於此視為失敗／空檔，刪除並試下一本
DEFAULT_MAX_DOWNLOADS = 3

# 每日輪播：每個主題用「單一關鍵字」各查幾筆，避免 OR 過寬誤命中（Open Library 建議：關鍵字在前，language:chi 在後）
TOPICS: list[tuple[str, list[str]]] = [
    ("個人成長", ["習慣", "心態", "時間管理", "專注力"]),
    ("AI 與科技社會", ["人工智能", "機器學習", "演算法", "科技與社會"]),
    ("哲學", ["哲學", "倫理學", "存在主義", "中國哲學"]),
    ("藝術", ["美學", "藝術史", "書法", "設計"]),
    ("投資理財", ["投資", "理財", "財務規劃", "行為財務"]),
    ("教育", ["教育", "學習方法", "教學設計", "終身學習"]),
    ("育兒", ["育兒", "兒童發展", "親子", "教養"]),
]

STATIC_TIPS = """
## 免費、合法閱讀管道（純中文、不必買斷電子書時）

1. **香港公共圖書館電子書**（HyRead／OverDrive 等，需借書證）：新書與繁體選書較齊，適合「AI 世界變快」追新。
2. **台灣國家圖書館／各縣市圖**：部分線上資源免費註冊可讀。
3. **維基文庫（中文）**：公版古籍與部分文獻，可匯出文字再自行存成 TXT 放入閱讀器。
4. **Open Library + Internet Archive**：僅對標示為公版掃描（public domain）的館藏下載；有版權的只會顯示「借閱」而非下載檔。

### 英文好書要不要「翻成中文」？

- **不要**把整本受版權保護的英文書丟進機翻後散佈或上傳，風險高且通常侵權。
- 較穩做法：用圖書館借**已有中文版**、讀作者授權的摘要／演講稿、或只針對**公版英文書**自行翻譯自用。
"""


def http_get_json(url: str, timeout: float = 25.0) -> dict | list | None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        return json.loads(raw)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        return None


def open_library_search(keyword: str, limit: int = 4) -> list[dict]:
    # 順序「關鍵字 language:chi」比「language:chi 關鍵字」更容易命中中文索引
    q = urllib.parse.quote(f"{keyword} language:chi")
    fields = "key,title,author_name,first_publish_year,ia,has_fulltext,ebook_access,public_scan_b,subtitle"
    url = (
        f"https://openlibrary.org/search.json?q={q}"
        f"&limit={limit}&sort=new&fields={fields}"
    )
    data = http_get_json(url)
    if not data or not isinstance(data, dict):
        return []
    return list(data.get("docs") or [])


def work_url(key: str | None) -> str:
    if not key:
        return ""
    # /works/OLxxxW -> https://openlibrary.org/works/OLxxxW
    return "https://openlibrary.org" + key if key.startswith("/") else key


def ia_details_url(identifier: str) -> str:
    return f"https://archive.org/details/{urllib.parse.quote(identifier)}"


def gutendex_zh_sample(page: int) -> list[dict]:
    url = f"https://gutendex.com/books/?languages=zh&page={page}"
    data = http_get_json(url, timeout=12.0)
    if not data or not isinstance(data, dict):
        return []
    return list(data.get("results") or [])


def pick_ia_identifier(doc: dict) -> str | None:
    ia = doc.get("ia")
    if isinstance(ia, list) and ia:
        return str(ia[0])
    return None


def ia_download_candidate(identifier: str) -> tuple[str, str] | None:
    """回傳 (副檔名類型, 完整 URL) 優先 EPUB，其次 UTF-8 TXT。"""
    meta = http_get_json(
        f"https://archive.org/metadata/{urllib.parse.quote(identifier)}",
        timeout=25.0,
    )
    if not meta or not isinstance(meta, dict):
        return None
    files = meta.get("files")
    if not isinstance(files, list):
        return None

    def enc_ok(f: dict) -> bool:
        fmt = (f.get("format") or "").lower()
        name = (f.get("name") or "").lower()
        if "utf-8" in fmt or name.endswith(".utf-8.txt"):
            return True
        return name.endswith(".txt") and "ascii" not in fmt

    epubs: list[dict] = []
    txts: list[dict] = []
    for f in files:
        if not isinstance(f, dict):
            continue
        name = f.get("name")
        if not name or name.startswith("_"):
            continue
        lower = name.lower()
        if lower.endswith(".epub"):
            epubs.append(f)
        elif lower.endswith(".txt") and enc_ok(f):
            txts.append(f)

    def size_key(f: dict) -> int:
        try:
            return int(f.get("size") or 0)
        except (TypeError, ValueError):
            return 0

    chosen: dict | None = None
    kind = ""
    if epubs:
        chosen = sorted(epubs, key=size_key, reverse=True)[0]
        kind = "epub"
    elif txts:
        chosen = sorted(txts, key=size_key, reverse=True)[0]
        kind = "txt"
    if not chosen:
        return None
    fname = chosen["name"]
    safe = "/".join(urllib.parse.quote(part) for part in fname.split("/"))
    return kind, f"https://archive.org/download/{identifier}/{safe}"


def download_file(url: str, dest: Path, timeout_sec: float = 120.0) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            data = resp.read()
        dest.write_bytes(data)
        return True
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def safe_filename_fragment(text: str, max_len: int = 50) -> str:
    s = "".join(c if c.isalnum() or c in "._-" else "_" for c in text.strip())[:max_len]
    return s or "book"


def gutenberg_pick_url(formats: dict) -> tuple[str, str] | None:
    """回傳 (副檔名, url)；優先 EPUB，其次 plain text。"""
    if not isinstance(formats, dict):
        return None
    for label, ext in (
        ("application/epub+zip", "epub"),
        ("text/plain; charset=utf-8", "txt"),
        ("text/plain", "txt"),
    ):
        u = formats.get(label)
        if u:
            return ext, u
    return None


def format_doc_md(doc: dict, index: int) -> str:
    title = doc.get("title") or "(無題名)"
    authors = doc.get("author_name") or []
    author_s = "、".join(authors) if authors else "（作者未列）"
    year = doc.get("first_publish_year") or "—"
    key = doc.get("key")
    subtitle = doc.get("subtitle") or ""
    line_title = f"{index}. **{title}**"
    if subtitle:
        line_title += f" — {subtitle}"
    lines = [
        line_title,
        f"   - 作者：{author_s}；初版年：{year}",
        f"   - Open Library：{work_url(key)}",
    ]
    ia_id = pick_ia_identifier(doc)
    if ia_id:
        lines.append(f"   - Internet Archive：{ia_details_url(ia_id)}")
    access = doc.get("ebook_access")
    pub = doc.get("public_scan_b")
    lines.append(f"   - 電子書狀態：ebook_access={access}；公版掃描 public_scan_b={pub}")
    return "\n".join(lines) + "\n"


@dataclass
class ReportContext:
    merged: list[dict]
    guten: list[dict]
    today: date
    out_path: Path
    dl_dir: Path
    out_dir: Path


def perform_download(
    ctx: ReportContext,
    max_downloads: int,
) -> None:
    merged = ctx.merged
    guten = ctx.guten
    today = ctx.today
    out_path = ctx.out_path
    dl_dir = ctx.dl_dir

    extra_notes: list[str] = []
    cap = max(1, min(max_downloads, 10))
    downloaded = 0

    def try_save(dest: Path, url: str, label: str) -> None:
        nonlocal downloaded
        if downloaded >= cap:
            return
        if dest.exists():
            extra_notes.append(f"- 已存在，略過：{dest.name}\n")
            return
        ok = download_file(url, dest)
        if ok and dest.stat().st_size >= MIN_DOWNLOAD_BYTES:
            downloaded += 1
            line = f"- 成功 [{label}]：{dest.name}（{dest.stat().st_size} bytes）← {url}\n"
            extra_notes.append(line)
            print(line.strip())
        else:
            if ok and dest.exists():
                try:
                    dest.unlink()
                except OSError:
                    pass
            line = f"- 失敗或檔案過小（<{MIN_DOWNLOAD_BYTES}B）[{label}]：{dest.name} ← {url}\n"
            extra_notes.append(line)
            print(line.strip())

    for doc in merged:
        if downloaded >= cap:
            break
        if not doc.get("public_scan_b"):
            continue
        ia_id = pick_ia_identifier(doc)
        if not ia_id:
            continue
        cand = ia_download_candidate(ia_id)
        if not cand:
            continue
        kind, file_url = cand
        idfrag = safe_filename_fragment(ia_id, 36)
        frag = safe_filename_fragment(doc.get("title") or "ia", 40)
        fname = f"{today.isoformat()}_ia_{idfrag}_{frag}.{kind}"
        try_save(dl_dir / fname, file_url, "Internet Archive 公版掃描")
        time.sleep(0.3)

    for b in guten:
        if downloaded >= cap:
            break
        gid = b.get("id")
        if gid is None:
            continue
        picked = gutenberg_pick_url(b.get("formats") or {})
        if not picked:
            continue
        gext, gurl = picked
        frag = safe_filename_fragment(b.get("title") or "pg", 55)
        fname = f"{today.isoformat()}_pg{gid}_{frag}.{gext}"
        try_save(dl_dir / fname, gurl, "Project Gutenberg")
        time.sleep(0.3)

    if not extra_notes:
        extra_notes.append(
            "- 本日無成功下載：Open Library 清單內無 public_scan 可抓檔，且 Gutendex 無可用連線或無 EPUB/TXT。\n"
        )
        print(extra_notes[-1].strip())

    with out_path.open("a", encoding="utf-8") as f:
        f.write("\n## 本日公版下載（僅合法公版；最多 {} 本）\n".format(cap))
        f.writelines(extra_notes)


def run_research() -> ReportContext:
    out_dir = get_output_dir()
    rec_dir = out_dir / "recommendations"
    dl_dir = out_dir / "downloads"
    rec_dir.mkdir(parents=True, exist_ok=True)

    today = date.today()
    d = today.timetuple().tm_yday
    t_main = TOPICS[d % len(TOPICS)]
    t_extra = TOPICS[(d + 3) % len(TOPICS)]

    lines: list[str] = []
    lines.append(f"# 每日華語書庫筆記 — {today.isoformat()}\n")
    lines.append(f"_產生時間（本機）：{datetime.now().isoformat(timespec='seconds')}_\n")
    lines.append("## 今日主題輪播\n")
    def pick_keywords(kws: list[str], salt: int) -> list[str]:
        if not kws:
            return []
        n = min(KEYWORDS_PER_TOPIC, len(kws))
        start = salt % len(kws)
        return [kws[(start + i) % len(kws)] for i in range(n)]

    main_kws = pick_keywords(t_main[1], d)
    extra_kws = pick_keywords(t_extra[1], d + 7)
    lines.append(
        f"- 主題 A：**{t_main[0]}**（本日查詢：{', '.join(main_kws)}；池：{', '.join(t_main[1])}）\n"
    )
    lines.append(
        f"- 主題 B：**{t_extra[0]}**（本日查詢：{', '.join(extra_kws)}；池：{', '.join(t_extra[1])}）\n"
    )

    lines.append("## Open Library 搜尋結果（中文館藏）\n")

    docs_a: list[dict] = []
    for kw in main_kws:
        docs_a.extend(open_library_search(kw, limit=4))
        time.sleep(0.35)
    docs_b: list[dict] = []
    for kw in extra_kws:
        docs_b.extend(open_library_search(kw, limit=4))
        time.sleep(0.35)
    merged: list[dict] = []
    seen: set[str] = set()
    for doc in docs_a + docs_b:
        k = doc.get("key")
        if not k or k in seen:
            continue
        seen.add(k)
        merged.append(doc)

    if not merged:
        lines.append("_（本日 API 無結果或網路失敗，請改日再跑或檢查網路）_\n")
    else:
        for i, doc in enumerate(merged, 1):
            lines.append(format_doc_md(doc, i))

    lines.append("## Project Gutenberg（中文）— Gutendex\n")
    page = (d % 5) + 1
    guten = gutendex_zh_sample(page)
    if not guten:
        lines.append(
            "_Gutendex 連線逾時或失敗；可改用手動瀏覽 https://www.gutenberg.org/browse/languages/zh_\n"
        )
    else:
        for i, b in enumerate(guten[:6], 1):
            title = b.get("title") or ""
            authors = ", ".join(a.get("name", "") for a in (b.get("authors") or []))
            gid = b.get("id")
            lines.append(f"{i}. **{title}** — {authors}\n")
            lines.append(f"   - Gutendex： https://gutendex.com/books/{gid}/\n")
            fmt = b.get("formats") or {}
            for label in ("application/epub+zip", "text/plain; charset=utf-8", "text/plain"):
                u = fmt.get(label)
                if u:
                    lines.append(f"   - 下載（公版）：{u}\n")
                    break

    lines.append(STATIC_TIPS)

    out_path = rec_dir / f"{today.isoformat()}.md"
    out_path.write_text("".join(lines), encoding="utf-8")

    catalog = out_dir / "catalog.jsonl"
    entry = {
        "date": today.isoformat(),
        "topics": [t_main[0], t_extra[0]],
        "work_keys": [doc.get("key") for doc in merged if doc.get("key")],
    }
    with catalog.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    return ReportContext(
        merged=merged,
        guten=guten if isinstance(guten, list) else [],
        today=today,
        out_path=out_path,
        dl_dir=dl_dir,
        out_dir=out_dir,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="每日華語免費書目研究（合法來源）")
    dl_group = parser.add_mutually_exclusive_group()
    dl_group.add_argument(
        "-y",
        "--yes",
        action="store_true",
        help="不詢問，直接下載公版（Internet Archive public_scan + Gutenberg 中文）",
    )
    dl_group.add_argument(
        "--no-download",
        action="store_true",
        help="不詢問、不下載（適合腳本／與 cron 相同效果）",
    )
    parser.add_argument(
        "--max-downloads",
        type=int,
        default=DEFAULT_MAX_DOWNLOADS,
        metavar="N",
        help=f"下載時最多幾本（預設 {DEFAULT_MAX_DOWNLOADS}，上限 10）",
    )
    args = parser.parse_args()
    time.sleep(0.5)  # 略為禮貌間隔

    ctx = run_research()
    print(f"已寫入：{ctx.out_path}")
    print(f"正式書單（100 本表）：{ctx.out_dir / 'shortlist.md'}")

    want_dl = False
    if args.no_download:
        want_dl = False
    elif args.yes:
        want_dl = True
    elif sys.stdin.isatty() and sys.stdout.isatty():
        cap = max(1, min(args.max_downloads, 10))
        try:
            ans = input(
                f"\n要下載合法公版書到「downloads/」嗎？最多 {cap} 本 [y/N] "
            ).strip().lower()
        except EOFError:
            ans = ""
        want_dl = ans in ("y", "yes", "是", "好")
    else:
        want_dl = False

    if want_dl:
        perform_download(ctx, max_downloads=args.max_downloads)

    return 0


if __name__ == "__main__":
    sys.exit(main())
