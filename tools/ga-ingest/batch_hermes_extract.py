#!/usr/bin/env python3
"""對 output/chunks 下每個對話資料夾跑 hermes_extract_events.py（獨立 jsonl / checkpoint / raw log）。"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CHUNKS_ROOT = REPO_ROOT / "tools/ga-ingest/output/chunks"
EXTRACT = REPO_ROOT / "tools/ga-ingest/hermes_extract_events.py"


def out_jsonl_for_folder(folder_name: str) -> Path:
    out = REPO_ROOT / "tools/ga-ingest/output"
    if folder_name == "WhatsApp Chat - T Yim":
        return out / "events_tyim.jsonl"
    short = folder_name.replace("WhatsApp Chat - ", "").strip()
    safe = short.replace("/", "_").replace(" ", "_")
    return out / f"events__{safe}.jsonl"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--only-chat",
        default="",
        help="只處理資料夾名稱子串（例如 總務組）",
    )
    ap.add_argument("--timeout", type=int, default=3600)
    ap.add_argument(
        "--strip-until-first-message",
        action="store_true",
        help="每個 chunk 剝到第一條訊息",
    )
    args = ap.parse_args()

    subdirs = sorted(
        d for d in CHUNKS_ROOT.iterdir() if d.is_dir() and list(d.glob("chunk_*.txt"))
    )
    if args.only_chat:
        sub = args.only_chat.strip()
        subdirs = [d for d in subdirs if sub in d.name]

    if not subdirs:
        print(f"No chunk dirs under {CHUNKS_ROOT}", file=sys.stderr)
        sys.exit(1)

    for d in subdirs:
        folder = d.name
        out_jsonl = out_jsonl_for_folder(folder)
        raw_log = out_jsonl.parent / f"{out_jsonl.stem}_hermes_raw.log"
        prefix = f"{folder}.zip"
        cmd = [
            sys.executable,
            str(EXTRACT),
            "--chunks-dir",
            str(d),
            "--prefix",
            prefix,
            "--out",
            str(out_jsonl),
            "--raw-log",
            str(raw_log),
            "--resume",
            "--timeout",
            str(args.timeout),
        ]
        if args.strip_until_first_message:
            cmd.append("--strip-until-first-message")

        print(f"=== {folder} -> {out_jsonl.name} ===", flush=True)
        r = subprocess.run(cmd, cwd=str(REPO_ROOT))
        if r.returncode != 0:
            sys.exit(r.returncode)

    print(f"Done. {len(subdirs)} chat(s).")


if __name__ == "__main__":
    main()
