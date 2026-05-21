#!/usr/bin/env python3
"""合併 output/events*.jsonl → EVENTS_ALL.md（ISO date；唔再做交接篩選）。"""

from __future__ import annotations

import argparse
import glob
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = REPO_ROOT / "tools/ga-ingest/output/EVENTS_ALL.md"
GLOB_PAT = str(REPO_ROOT / "tools/ga-ingest/output/events*.jsonl")


def sort_key(r: dict) -> tuple:
    d = r.get("date") or ""
    if isinstance(d, str) and len(d) >= 10 and d[4] == "-" and d[7] == "-":
        return (0, d)
    return (1, str(d))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--limit", type=int, default=5000, help="表格最多幾列（0=不截斷）")
    args = ap.parse_args()

    rows: list[dict] = []
    for path_str in sorted(glob.glob(GLOB_PAT)):
        p = Path(path_str)
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    rows.sort(key=sort_key)

    lines = [
        "# EVENTS_ALL（由全部 events*.jsonl 合併）",
        "",
        f"總事件數：{len(rows)}（已預期經 `normalize_event_dates.py` 統一日期）",
        "",
        "| date | title | event_kind | owner | source_chat |",
        "|---|---|---|---|---|",
    ]
    cap = len(rows) if args.limit == 0 else min(len(rows), args.limit)
    for r in rows[:cap]:
        date = str(r.get("date") or "").replace("|", "\\|")[:16]
        title = str(r.get("title", "")).replace("|", "\\|")[:100]
        ek = str(r.get("event_kind") or "").replace("|", "\\|")[:40]
        owner = str(r.get("owner") or "").replace("|", "\\|")[:40]
        sc = str(r.get("source_chat") or "").replace("|", "\\|")[:70]
        lines.append(f"| {date} | {title} | {ek} | {owner} | {sc} |")
    if len(rows) > cap:
        lines.append("")
        lines.append(f"… 尚有 {len(rows) - cap} 筆未列出；用 --limit 0 顯示全部。")

    args.out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {args.out} ({len(rows)} events)")


if __name__ == "__main__":
    main()
