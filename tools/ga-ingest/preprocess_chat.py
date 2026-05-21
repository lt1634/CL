#!/usr/bin/env python3
"""
Clean WhatsApp _chat.txt and emit overlapping chunks for Hermes / LLM.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = REPO_ROOT / "tools" / "ga-ingest" / "output"

SYSTEM_PATTERNS = (
    re.compile(r"Messages and calls are end-to-end encrypted", re.I),
    re.compile(r"Your security code with .+ changed", re.I),
    re.compile(r"Tap to learn more", re.I),
    re.compile(r"This message was deleted", re.I),
    re.compile(r"You deleted this message", re.I),
    re.compile(r"‎Waiting for this message", re.I),
    re.compile(r"‎You created group", re.I),
    re.compile(r"‎You added", re.I),
    re.compile(r"‎You left", re.I),
    re.compile(r"‎You pinned a message", re.I),
)


def is_noise_line(line: str) -> bool:
    s = line.strip()
    if not s:
        return True
    for p in SYSTEM_PATTERNS:
        if p.search(s):
            return True
    return False


def chunk_with_overlap(lines: list[str], size: int, overlap: int) -> list[str]:
    if size <= 0:
        raise ValueError("size")
    if overlap >= size:
        overlap = max(0, size // 5)
    chunks: list[str] = []
    i = 0
    step = size - overlap
    while i < len(lines):
        block = lines[i : i + size]
        chunks.append("\n".join(block))
        if len(block) < size:
            break
        i += step
    return chunks


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("chat_file", type=Path, help="Path to *_chat.txt")
    ap.add_argument("--out-dir", type=Path, default=None)
    ap.add_argument("--chunk-lines", type=int, default=400)
    ap.add_argument("--overlap", type=int, default=20)
    ap.add_argument("--drop-media-omitted", action="store_true")
    args = ap.parse_args()

    stem = args.chat_file.stem
    if stem.endswith("_chat"):
        stem = stem[: -len("_chat")]
    out_dir = args.out_dir or (DEFAULT_OUT / "chunks" / stem)
    out_dir.mkdir(parents=True, exist_ok=True)

    raw = args.chat_file.read_text(encoding="utf-8", errors="replace")
    lines: list[str] = []
    for line in raw.splitlines():
        if args.drop_media_omitted and "<Media omitted>" in line:
            continue
        if is_noise_line(line):
            continue
        lines.append(line.rstrip("\n"))

    cleaned_path = out_dir / "cleaned.txt"
    cleaned_path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")

    chunks = chunk_with_overlap(lines, args.chunk_lines, args.overlap)
    meta = []
    for idx, ch in enumerate(chunks):
        p = out_dir / f"chunk_{idx:04d}.txt"
        p.write_text(ch + "\n", encoding="utf-8")
        meta.append({"index": idx, "lines": ch.count("\n") + (1 if ch else 0), "file": p.name})

    (out_dir / "chunk_meta.json").write_text(
        json.dumps(
            {
                "source": str(args.chat_file),
                "cleaned_lines": len(lines),
                "chunk_lines": args.chunk_lines,
                "overlap": args.overlap,
                "chunks": meta,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {cleaned_path} and {len(chunks)} chunks under {out_dir}")


if __name__ == "__main__":
    main()
