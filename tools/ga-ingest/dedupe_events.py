#!/usr/bin/env python3
"""De-duplicate JSONL events by (title, date, source_chat). Keeps first occurrence."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT = REPO_ROOT / "tools/ga-ingest/output/events_tyim.jsonl"


def key_row(obj: dict) -> str:
    t = (obj.get("title") or "").strip()
    d = (obj.get("date") or "") or ""
    s = (obj.get("source_chat") or "") or ""
    return f"{t}\u0000{d}\u0000{s}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", type=Path, default=DEFAULT)
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args()
    out = args.out or args.inp

    text = args.inp.read_text(encoding="utf-8")
    n_in = 0
    seen: set[str] = set()
    kept: list[dict] = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            o = json.loads(line)
        except json.JSONDecodeError:
            continue
        if not isinstance(o, dict):
            continue
        n_in += 1
        k = key_row(o)
        if k in seen:
            continue
        seen.add(k)
        kept.append(o)

    with out.open("w", encoding="utf-8") as f:
        for o in kept:
            f.write(json.dumps(o, ensure_ascii=False) + "\n")

    dup = n_in - len(kept)
    print(f"Deduped {args.inp} -> {out}: {len(kept)} lines kept ({dup} duplicates dropped from {n_in} parsed)")


if __name__ == "__main__":
    main()