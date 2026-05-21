#!/usr/bin/env python3
"""對 output/chats/*_chat.txt 逐個跑 preprocess_chat.py（產 chunk_*）。"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CHATS = REPO_ROOT / "tools/ga-ingest/output/chats"
SCRIPT = REPO_ROOT / "tools/ga-ingest/preprocess_chat.py"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--chunk-lines", type=int, default=400)
    ap.add_argument("--overlap", type=int, default=20)
    args = ap.parse_args()

    chats = sorted(CHATS.glob("*_chat.txt"))
    if not chats:
        print(f"No chats under {CHATS}", file=sys.stderr)
        sys.exit(1)

    for chat in chats:
        r = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                str(chat),
                "--chunk-lines",
                str(args.chunk_lines),
                "--overlap",
                str(args.overlap),
            ],
            cwd=str(REPO_ROOT),
        )
        if r.returncode != 0:
            sys.exit(r.returncode)
        print(f"OK {chat.name}")

    print(f"Done. {len(chats)} chat(s).")


if __name__ == "__main__":
    main()
