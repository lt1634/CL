#!/usr/bin/env python3
"""合併「校曆結構 CSV」同 events*.jsonl，產出 YEAR_REMINDERS.md。

校曆權威流程（建議）：
1. 複製 templates/calendar_struct_2526.headers.csv → output/calendar_struct_2526.csv
2. 由 handbook 校曆頁（例如 handbook_calendar_p15-17.txt）或 Calendar.jpg OCR 填入每日／節點；
   calendar_date 用 ISO YYYY-MM-DD。
3. 跑本腳本；會列出「未來 --ahead-days 日」內：校曆重要欄 + 對話抽出嘅事件。

無 calendar CSV 時仍會輸出「僅 events」時間窗，方便先用住。
"""

from __future__ import annotations

import argparse
import csv
import glob
import json
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = REPO_ROOT / "tools/ga-ingest/output"
DEFAULT_EVENTS_GLOB = str(DEFAULT_OUT_DIR / "events*.jsonl")
DEFAULT_CALENDAR = DEFAULT_OUT_DIR / "calendar_struct_2526.csv"
TZ = ZoneInfo("Asia/Hong_Kong")


def _parse_iso_date(s: object) -> date | None:
    if s is None or not isinstance(s, str):
        return None
    t = s.strip()
    if len(t) >= 10 and t[4] == "-" and t[7] == "-":
        try:
            return date.fromisoformat(t[:10])
        except ValueError:
            return None
    return None


def load_events(pattern: str) -> list[dict]:
    rows: list[dict] = []
    for path_str in sorted(glob.glob(pattern)):
        p = Path(path_str)
        if not p.name.endswith(".jsonl"):
            continue
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                o = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(o, dict):
                rows.append(o)
    return rows


def load_calendar_rows(csv_path: Path) -> list[dict[str, str]]:
    if not csv_path.is_file():
        return []
    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--calendar",
        type=Path,
        default=DEFAULT_CALENDAR,
        help=f"校曆 CSV（預設 {DEFAULT_CALENDAR}）",
    )
    ap.add_argument(
        "--events-glob",
        default=DEFAULT_EVENTS_GLOB,
        help="events jsonl glob",
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT_DIR / "YEAR_REMINDERS.md",
    )
    ap.add_argument(
        "--ahead-days",
        type=int,
        default=42,
        help="由今日起未來幾日（香港時區）",
    )
    args = ap.parse_args()

    today = datetime.now(TZ).date()
    end = today + timedelta(days=args.ahead_days)

    events = load_events(args.events_glob)
    cal_rows = load_calendar_rows(args.calendar)

    upcoming_ev: list[tuple[date, dict]] = []
    for o in events:
        d = _parse_iso_date(o.get("date"))
        if d is None:
            continue
        if today <= d <= end:
            upcoming_ev.append((d, o))
    upcoming_ev.sort(key=lambda x: (x[0], str(x[1].get("title") or "")))

    upcoming_cal: list[tuple[date, dict[str, str]]] = []
    for row in cal_rows:
        d = _parse_iso_date(row.get("calendar_date"))
        if d is None:
            continue
        if today <= d <= end:
            upcoming_cal.append((d, row))
    upcoming_cal.sort(key=lambda x: x[0])

    lines: list[str] = [
        "# YEAR_REMINDERS（校曆 × 對話事件）",
        "",
        f"- 產生時間（香港）：{datetime.now(TZ).strftime('%Y-%m-%d %H:%M')}",
        f"- 視窗：**{today.isoformat()}** 至 **{end.isoformat()}**（未來 {args.ahead_days} 日）",
        f"- events 來源：`{args.events_glob}`",
        "",
    ]

    if not cal_rows:
        lines.extend(
            [
                "## 校曆 CSV",
                "",
                f"尚未讀到有效校曆表：`{args.calendar}` 不存在或係空檔。",
                "",
                "建立步驟：",
                "",
                f"1. `cp tools/ga-ingest/templates/calendar_struct_2526.headers.csv {DEFAULT_CALENDAR}`",
                "2. 填入 `calendar_date`（ISO）及 `important`／`holiday_or_event`／`activity` 等欄（見檔首行說明）。",
                "3. 再跑 `python3 tools/ga-ingest/emit_year_reminders.py`。",
                "",
            ]
        )
    else:
        lines.extend(["## 校曆節點（視窗內）", ""])
        if not upcoming_cal:
            lines.append("*（此視窗內無校曆列；可檢查日期是否已填成 ISO。）*")
            lines.append("")
        else:
            lines.extend(["| date | category | holiday/event | activity | important |", "|---|---|---|---|---|"])
            for d, row in upcoming_cal:
                cat = (row.get("category") or "").replace("|", "\\|")[:24]
                hol = (row.get("holiday_or_event") or "").replace("|", "\\|")[:40]
                act = (row.get("activity") or "").replace("|", "\\|")[:40]
                imp = (row.get("important") or "").replace("|", "\\|")[:60]
                lines.append(f"| {d.isoformat()} | {cat} | {hol} | {act} | {imp} |")
            lines.append("")

    lines.extend(["## 對話抽出嘅事件（視窗內，按日期）", ""])
    if not upcoming_ev:
        lines.append("*（無具備 ISO `date` 嘅事件落喺此視窗。）*")
        lines.append("")
    else:
        cur: date | None = None
        for d, o in upcoming_ev:
            if d != cur:
                cur = d
                lines.append(f"### {d.isoformat()}")
                lines.append("")
            title = str(o.get("title") or "").replace("|", "\\|")[:120]
            ek = str(o.get("event_kind") or "").replace("|", "\\|")[:32]
            owner = str(o.get("owner") or "").replace("|", "\\|")[:40]
            sc = str(o.get("source_chat") or "").replace("|", "\\|")[:56]
            tail = o.get("long_cycle_note") or o.get("confirmation_needed_from")
            note = ""
            if tail:
                note = str(tail).replace("|", "\\|")[:100]
            lines.append(f"- **{title}** · `{ek}` · {owner}")
            lines.append(f"  - source: `{sc}`")
            if note:
                lines.append(f"  - note: {note}")
            lines.append("")

    lines.extend(
        [
            "---",
            "",
            "**同日對照**：校曆列同事件列皆用 ISO 日期；同一日會自然上下對應（請肉眼核对）。",
            "進階可用試算表 pivot；若要自動 join，之後可加 `--match-anchor` 類選項。",
            "",
        ]
    )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
