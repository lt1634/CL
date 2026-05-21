#!/usr/bin/env python3
"""
Heuristic scan of cleaned chat for handover / long-cycle hints (draft only).
Writes output/handover_hints.md — user + T Yim must confirm.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = REPO_ROOT / "tools" / "ga-ingest" / "output"

KEYWORDS = re.compile(
    r"(保養|保固|合約|到期|分期|尾數|跟進|檢查|renew|warranty|invoice|"
    r"payment|報價|維修|工程|供應商|承辦商)",
    re.I,
)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cleaned_txt", type=Path)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT / "handover_hints.md")
    ap.add_argument("--max-lines", type=int, default=80)
    args = ap.parse_args()

    hits: list[str] = []
    for line in args.cleaned_txt.read_text(encoding="utf-8", errors="replace").splitlines():
        if KEYWORDS.search(line):
            hits.append(line.strip())
        if len(hits) >= args.max_lines:
            break

    args.out.parent.mkdir(parents=True, exist_ok=True)
    lines_out = [
        "# HANDOVER 關鍵字初筛（機械草稿）",
        "",
        "> **唔係**完整交接清單。請同 **T Yim** 人面／電話確認後，再寫正式 `HANDOVER_OPEN_ITEMS.md`。",
        "",
        f"來源：`{args.cleaned_txt}`",
        "",
    ]
    if not hits:
        lines_out.append("（未搵到關鍵字行 — 可能關鍵字表要擴充，或改用 Hermes 全文抽）")
    else:
        for h in hits:
            lines_out.append(f"- {h}")
    args.out.write_text("\n".join(lines_out) + "\n", encoding="utf-8")
    print(f"Wrote {args.out} ({len(hits)} lines)")


if __name__ == "__main__":
    main()
