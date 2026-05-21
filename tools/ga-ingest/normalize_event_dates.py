#!/usr/bin/env python3
"""將 events jsonl 內 date / anchor.iso_date 統一為 ISO YYYY-MM-DD 或 null（香港常用 d/m/Y）。"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_GLOB = str(REPO_ROOT / "tools/ga-ingest/output/events*.jsonl")

ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_date(s: object) -> str | None:
    if s is None:
        return None
    if not isinstance(s, str):
        return None
    t = s.strip()
    if not t:
        return None
    if ISO.match(t):
        return t
    # 常見變體
    candidates = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d/%m/%y",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%m/%d/%Y",
    ]
    for fmt in candidates:
        try:
            dt = datetime.strptime(t, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def normalize_row(o: dict) -> tuple[bool, dict]:
    changed = False
    d = parse_date(o.get("date"))
    if d != o.get("date"):
        if d is not None or o.get("date") not in (None, ""):
            changed = True
        o["date"] = d

    anchor = o.get("anchor")
    if isinstance(anchor, dict):
        iso = parse_date(anchor.get("iso_date"))
        if iso != anchor.get("iso_date"):
            if iso is not None or anchor.get("iso_date") not in (None, ""):
                changed = True
            anchor["iso_date"] = iso
    return changed, o


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "inputs",
        nargs="*",
        type=Path,
        help="events*.jsonl（空白則掃 output/events*.jsonl）",
    )
    args = ap.parse_args()

    import glob

    if args.inputs:
        paths = args.inputs
    else:
        paths = [Path(p) for p in sorted(glob.glob(DEFAULT_GLOB))]

    total_changed = 0
    for p in paths:
        if not p.exists():
            print(f"skip missing {p}")
            continue
        lines_out: list[str] = []
        nchg = 0
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                o = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(o, dict):
                ch, o = normalize_row(o)
                if ch:
                    nchg += 1
                lines_out.append(json.dumps(o, ensure_ascii=False))
            else:
                lines_out.append(line)
        p.write_text("\n".join(lines_out) + ("\n" if lines_out else ""), encoding="utf-8")
        total_changed += nchg
        print(f"{p.name}: normalized rows touched ~{nchg}, lines {len(lines_out)}")

    print(f"Done. Rows with date fields updated (approx): {total_changed}")


if __name__ == "__main__":
    main()
