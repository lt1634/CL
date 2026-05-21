#!/usr/bin/env python3
"""
Call local `hermes chat` on each chunk_*.txt and merge JSON event arrays into events.jsonl.
Requires: hermes CLI on PATH, provider credentials configured in ~/.hermes.

**重要（易誤解）**：
- **chunk_*.txt 輸入** = WhatsApp 匯出純文字（**唔係** JSON），與 `preprocess_chat.py` 產出一致。
- **要 parse JSON 嘅只有 Hermes 嘅 stdout**（模型應只_output 一個 JSON 陣列；實務上可能夾雜
  `session_id:`、說明字、`---` 或 markdown fence，所以用 `JSONDecoder.raw_decode` 從第一個 `[` 起解）。
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CHUNKS = (
    REPO_ROOT
    / "tools/ga-ingest/output/chunks/WhatsApp Chat - T Yim"
)
SCHEMA_KINDS = (
    "TERM_START, TERM_END, EXAM_PREP, EXAM_WEEK, SPORTS_DAY, INFO_DAY, PARENT_DAY, "
    "PD_DAY, MAINTENANCE, SUPPLIER_PAYMENT, STOCK_CHECK, STAFF_MEETING, OTHER"
)

SESSION_LINE = re.compile(r"^session_id:\s*.*$", re.M)

FENCE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.I)

# 模型有時把陣列內相鄰物件寫成 `...}{"date":`（多咗 "），應為 `...},{"date":`
ARRAY_GLUE_BUG = re.compile(r"\}\s*\"\s*\{")
# 另一常見錯：`...}","{"date"`（物件 `}` 後應該 `,{` 但寫成 `,"{`）；唔好用全域 `,\s*"\s*\{` 以免誤傷字串值
OBJ_COMMA_BUG = re.compile(r"\}\s*,\s*\"\s*\{")


def repair_json_array_glue(s: str) -> str:
    s = ARRAY_GLUE_BUG.sub("},{", s)
    s = OBJ_COMMA_BUG.sub("},{", s)
    return s


# anchor 內誤加 `},{` 先至 `"source_chat"`
ANCHOR_SPLIT_SOURCE_CHAT = re.compile(r"\}\s*,\s*\{\s*\"source_chat\"\s*:")
# 模型把 JSON null 寫成字符串 "null"
_QUOTED_NULL_KEYS = (
    "date",
    "lead_days",
    "iso_date",
    "name",
    "ga_role",
    "handover_status",
    "confirmation_needed_from",
)

# Hermes 有時輸出 `{date:` / `,title:`（鍵冇引號）；必須由長到短替換以免截斷（如 confirmation_needed_from）
_UNQUOTED_KEY_FIXES = (
    "confirmation_needed_from",
    "long_cycle_note",
    "handover_status",
    "event_kind",
    "source_chat",
    "confidence",
    "helpers",
    "anchor",
    "owner",
    "title",
    "lead_days",
    "iso_date",
    "notes",
    "ga_role",
    "name",
    "type",
    "date",
)


def repair_llm_json_array(tail: str) -> str:
    """喺 raw_decode 前修復常見 LLM JSON 錯誤。"""
    s = repair_json_array_glue(tail)
    for _k in _UNQUOTED_KEY_FIXES:
        s = re.sub(
            rf'(?<=[{{,])\s*{re.escape(_k)}\s*:',
            f'"{_k}":',
            s,
        )
        # `{date":"2/3/2025"`（鍵無引號，直接接到值嘅開引號）
        s = re.sub(
            rf'(?<=[{{,])\s*{re.escape(_k)}\s*"',
            f'"{_k}"',
            s,
        )
    # 唔好用 PREMATURE_CLOSE_SOURCE_CHAT：合法嘅 `"notes":"…"}, "source_chat"` 都會被誤傷。
    s = ANCHOR_SPLIT_SOURCE_CHAT.sub(', "source_chat":', s)
    for key in _QUOTED_NULL_KEYS:
        s = re.sub(
            rf'"{re.escape(key)}"\s*:\s*"null"(?=\s*[,}}])',
            f'"{key}": null',
            s,
        )
    # date 欄出現非 ISO、非 d/m/y 嘅亂碼（例如 2026-03-底）
    s = re.sub(
        r'"date"\s*:\s*"[^"\\]*(?:底|左右|約|底前|底後)[^"]*"',
        '"date": null',
        s,
    )
    # notes 字串內誤多咗 `]` 先閂引號（例如 `10:00"],`）
    s = re.sub(r'(\d{1,2}:\d{2})"\]\s*,', r'\1",', s)
    # anchor 內 notes 後誤加 `"source_chat"`（同一行或換行）；應先閂 anchor 再寫頂層 source_chat
    s = re.sub(
        r'("notes"\s*:\s*"(?:[^"\\]|\\.)*")\s*,\s*"source_chat"\s*:',
        r'\1}, "source_chat":',
        s,
    )
    # notes 內文後漏閂引號：`…確認,"source_chat"` → `…確認","source_chat"`
    s = re.sub(
        r'([\u4e00-\u9fff]+),\s*"source_chat"\s*:',
        r'\1","source_chat":',
        s,
    )
    # long_cycle_note 值後誤多 `}`：`..."收款"},"source_chat"` → `..."收款","source_chat"`（唔好動 anchor 嘅 notes）
    s = re.sub(
        r'"long_cycle_note"\s*:\s*"((?:[^"\\]|\\.)*?)"\}\s*,\s*"source_chat"\s*:',
        r'"long_cycle_note":"\1","source_chat":',
        s,
    )
    return s

# WhatsApp iOS / 常見：行首 [日/月/年 或 ‎[
FIRST_MSG = re.compile(r"^\s*\u200e?\[\d{1,2}/\d{1,2}/", re.M)


def strip_leading_non_messages(text: str) -> str:
    """若匯出有 =====、媒體提示等非訊息行，剪到第一條似日期戳嘅行。"""
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if FIRST_MSG.match(line):
            return "\n".join(lines[i:])
    return text


def build_prompt(source_tag: str, chunk_text: str) -> str:
    return f"""你是學校總務行政助理。從以下 WhatsApp 片段抽取與學校總務、工程、採購、帳單、活動場地、工友安排有關嘅事件。

規則：
1. 只根據片段內容；無明確日期就 date=null。
2. event_kind 必須係以下之一：{SCHEMA_KINDS}
3. 保養期、合約到期、分期、尾數、下次檢查、保固等**未來仍須跟進**→ handover_status=your_action，long_cycle_note 簡述。
4. 需向 T Yim 確認先→ confirmation_needed_from="T Yim"
5. source_chat 必須完全等於：{source_tag}
6. 若片段只有日常寒暄、與總務無關，輸出空陣列 []

只輸出**一個** JSON 陣列（不要 markdown、不要解釋）。每個元素欄位：
"date","title","owner","helpers","event_kind","lead_days","anchor","source_chat","confidence","ga_role","handover_status","confirmation_needed_from","long_cycle_note"

anchor 為 object：{{"type":"calendar_named_event|absolute_date|relative_to_term|dynamic_holiday_anchor|unknown","name":null,"iso_date":null,"notes":null}}
ga_role："predecessor_tyim"|"incoming_you"|"team"|null
handover_status："tyim_done"|"tyim_pending"|"your_action"|null
helpers 為字串陣列。

來源標籤：{source_tag}

【對話片段】
{chunk_text}
"""


def normalize_hermes_stdout(raw: str) -> str:
    """Remove session banner、--- 尾段；若有 markdown fence 則取 fence 內文字。"""
    s = raw.strip()
    s = SESSION_LINE.sub("", s).strip()
    if "\n---" in s:
        s = s.split("\n---", 1)[0].strip()
    m = FENCE.search(s)
    if m:
        inner = m.group(1).strip()
        if "[" in inner:
            s = inner
    return s


def extract_json_array(text: str) -> list[dict] | None:
    """
    從 Hermes stdout 抽出第一個 JSON array。
    支援：前文說明 + 陣列、陣列後垃圾字、`[]`。
    """
    s = normalize_hermes_stdout(text)
    if not s:
        return None
    start = s.find("[")
    if start < 0:
        return None
    tail = repair_llm_json_array(s[start:])
    dec = json.JSONDecoder()
    try:
        obj, _end = dec.raw_decode(tail, 0)
    except json.JSONDecodeError:
        return None
    if not isinstance(obj, list):
        return None
    return [x for x in obj if isinstance(x, dict)]


def run_hermes(prompt: str, timeout: int) -> str:
    r = subprocess.run(
        [
            "hermes",
            "chat",
            "-q",
            prompt,
            "-Q",
            "--ignore-rules",
            "--max-turns",
            "8",
            "--source",
            "tool",
        ],
        capture_output=True,
        text=True,
        timeout=timeout,
        cwd=str(REPO_ROOT),
    )
    out = (r.stdout or "") + ("\n" + r.stderr if r.stderr else "")
    if r.returncode != 0:
        raise RuntimeError(f"hermes exit {r.returncode}: {out[:2000]}")
    return r.stdout or ""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--chunks-dir",
        type=Path,
        default=DEFAULT_CHUNKS,
        help="Folder containing chunk_*.txt",
    )
    ap.add_argument(
        "--prefix",
        default="WhatsApp Chat - T Yim.zip",
        help="Zip name used in source_chat tag",
    )
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument(
        "--timeout",
        type=int,
        default=1800,
        help="hermes chat 子程序超時（秒）；大 chunk 建議 1800–3600",
    )
    ap.add_argument("--limit", type=int, default=0, help="Max chunks (0=all)")
    ap.add_argument(
        "--resume",
        action="store_true",
        help="Skip chunk stems in events_tyim.jsonl.chunks_done; append jsonl",
    )
    ap.add_argument(
        "--only",
        default="",
        help="逗號分隔，只跑指定 stem，例如 chunk_0001,chunk_0006（唔會清空現有 jsonl）",
    )
    ap.add_argument(
        "--force",
        action="store_true",
        help="配合 --resume：從 checkpoint 跳過清單暫時剔除 --only 嘅 stem，方便重跑失敗 chunk",
    )
    ap.add_argument(
        "--reset",
        action="store_true",
        help="強制清空 jsonl / checkpoint / raw log 再開始（慎用）",
    )
    ap.add_argument(
        "--strip-until-first-message",
        action="store_true",
        help="剝走開頭直至第一行似 WhatsApp 日期戳（少數匯出有前言時用）",
    )
    ap.add_argument(
        "--raw-log",
        type=Path,
        default=None,
        help="Hermes 原始 stdout 日誌路徑（預設：<out_stem>_hermes_raw.log）",
    )
    args = ap.parse_args()

    out_dir = REPO_ROOT / "tools/ga-ingest/output"
    out_jsonl = args.out or (out_dir / "events_tyim.jsonl")
    out_raw = args.raw_log or (out_jsonl.parent / f"{out_jsonl.stem}_hermes_raw.log")
    checkpoint = out_jsonl.parent / (out_jsonl.name + ".chunks_done")

    chunks = sorted(args.chunks_dir.glob("chunk_*.txt"))
    only_stems = [x.strip() for x in args.only.split(",") if x.strip()]
    if only_stems:
        allow = set(only_stems)
        chunks = [c for c in chunks if c.stem in allow]

    if args.limit:
        chunks = chunks[: args.limit]

    out_jsonl.parent.mkdir(parents=True, exist_ok=True)

    # 清空：全新跑晒（無 --only、無 --resume）或顯式 --reset
    wipe = args.reset or (not args.resume and not only_stems)
    done: set[str] = set()
    if wipe:
        out_jsonl.write_text("", encoding="utf-8")
        checkpoint.write_text("", encoding="utf-8")
        out_raw.write_text("", encoding="utf-8")
    elif checkpoint.exists():
        done = {
            ln.strip()
            for ln in checkpoint.read_text(encoding="utf-8").splitlines()
            if ln.strip()
        }
        if args.force and only_stems:
            done -= set(only_stems)
        if args.resume or only_stems:
            print(f"Checkpoint: {len(done)} chunk(s) skip unless forced", file=sys.stderr)

    total_written = 0
    for cp in chunks:
        stem = cp.stem
        if stem in done:
            print(f"SKIP {stem} (--resume)", file=sys.stderr)
            continue
        tag = f"{args.prefix}#{stem}"
        chunk_text = cp.read_text(encoding="utf-8", errors="replace")
        if args.strip_until_first_message:
            chunk_text = strip_leading_non_messages(chunk_text)
        prompt = build_prompt(tag, chunk_text)

        with out_raw.open("a", encoding="utf-8") as rf:
            rf.write(f"=== {tag} ===\n")
            try:
                raw = run_hermes(prompt, args.timeout)
            except Exception as e:
                rf.write(f"ERROR: {e}\n\n")
                print(f"FAIL {tag}: {e}", file=sys.stderr)
                continue
            rf.write(raw)
            rf.write("\n")

        parsed = extract_json_array(raw)
        if parsed is None:
            tail = raw.strip().replace("\n", " ")[-350:]
            print(
                f"WARN {tag}: could not parse JSON from Hermes stdout (tail): …{tail}",
                file=sys.stderr,
            )
            continue
        with out_jsonl.open("a", encoding="utf-8") as jf:
            for ev in parsed:
                if isinstance(ev, dict):
                    ev.setdefault("source_chat", tag)
                    jf.write(json.dumps(ev, ensure_ascii=False) + "\n")
                    total_written += 1
        with checkpoint.open("a", encoding="utf-8") as cf:
            cf.write(stem + "\n")
        done.add(stem)
        print(f"OK {tag}: {len(parsed)} events (lines appended: {total_written})")

    print(f"Done. {out_jsonl} total new lines: {total_written}; log {out_raw}")


if __name__ == "__main__":
    main()
