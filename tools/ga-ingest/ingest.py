#!/usr/bin/env python3
"""
Extract WhatsApp export zips from GA_ROOT:
  - Writes _chat.txt copies to output/chats/
  - Optional --full: extract all members with safe filenames + mapping table
  - Writes ingest_summary.json with attachment suffix stats
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from collections import Counter
from pathlib import Path

from ga_paths import ga_root

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = REPO_ROOT / "tools" / "ga-ingest" / "output"


def decode_zip_filename(name: str, flag_bits: int) -> str:
    if flag_bits & 0x800:
        return name
    for repair in (
        lambda n: n.encode("cp437", errors="surrogateescape").decode(
            "utf-8", errors="surrogateescape"
        ),
        lambda n: n.encode("latin1").decode("utf-8", errors="replace"),
    ):
        try:
            fixed = repair(name)
            if fixed and "\ufffd" not in fixed[: min(len(fixed), 200)]:
                return fixed
        except (UnicodeDecodeError, UnicodeEncodeError):
            continue
    return name


def safe_extract_path(inner: str, mapping: list[dict]) -> str:
    if inner.startswith("/") or ".." in inner.replace("\\", "/"):
        inner = Path(inner).name
    if re.fullmatch(r"[\x00-\x7f./ _\-()+.,\[\]0-9a-zA-Z]+", inner or ""):
        return inner
    h = hashlib.sha1(inner.encode("utf-8", errors="surrogateescape")).hexdigest()[:12]
    ext = Path(inner).suffix[:16] or ".bin"
    out = f"_hashed/{h}{ext}"
    mapping.append({"hashed_path": out, "original_zip_name": inner})
    return out


def iter_whatsapp_zips(ga: Path) -> list[Path]:
    return sorted(ga.glob("WhatsApp Chat*.zip"))


def extract_chat_txt(zf: zipfile.ZipFile) -> tuple[str | None, str | None]:
    for info in zf.infolist():
        if info.is_dir():
            continue
        name = decode_zip_filename(info.filename, info.flag_bits)
        if name.endswith("_chat.txt") or name.endswith("chat.txt"):
            data = zf.read(info)
            return name, data.decode("utf-8", errors="replace")
    return None, None


def zip_extension_stats(zf: zipfile.ZipFile) -> Counter[str]:
    c: Counter[str] = Counter()
    for info in zf.infolist():
        if info.is_dir():
            continue
        name = decode_zip_filename(info.filename, info.flag_bits)
        suf = Path(name).suffix.lower() or "(no_ext)"
        c[suf] += 1
    return c


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ga-root", default=None, help="Override GA folder")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--full", action="store_true", help="Extract all zip members with safe paths")
    args = ap.parse_args()

    ga = Path(args.ga_root or ga_root())
    out: Path = args.out
    chats_dir = out / "chats"
    extract_root = out / "extracted"
    chats_dir.mkdir(parents=True, exist_ok=True)
    extract_root.mkdir(parents=True, exist_ok=True)

    summary: dict[str, object] = {"ga_root": str(ga), "zips": []}

    for zpath in iter_whatsapp_zips(ga):
        zentry: dict[str, object] = {"zip": zpath.name}
        with zipfile.ZipFile(zpath, "r") as zf:
            _inner, text = extract_chat_txt(zf)
            if text is None:
                zentry["error"] = "no _chat.txt"
                summary["zips"].append(zentry)
                continue
            stem = zpath.stem
            chat_out = chats_dir / f"{stem}_chat.txt"
            chat_out.write_text(text, encoding="utf-8")
            zentry["chat_lines"] = text.count("\n") + (1 if text and not text.endswith("\n") else 0)
            zentry["chat_bytes"] = len(text.encode("utf-8"))
            zentry["chat_out"] = str(chat_out.relative_to(out))

            stats = zip_extension_stats(zf)
            zentry["attachment_suffix_top"] = dict(stats.most_common(12))
            zentry["attachment_files"] = max(0, sum(stats.values()) - 1)

            if args.full:
                mapping: list[dict] = []
                dest_dir = extract_root / stem
                dest_dir.mkdir(parents=True, exist_ok=True)
                for info in zf.infolist():
                    if info.is_dir():
                        continue
                    raw_name = decode_zip_filename(info.filename, info.flag_bits)
                    rel = safe_extract_path(raw_name, mapping)
                    target = dest_dir / rel
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(zf.read(info))
                (dest_dir / "_filename_mapping.json").write_text(
                    json.dumps(mapping, ensure_ascii=False, indent=2), encoding="utf-8"
                )
                zentry["extracted_to"] = str(dest_dir.relative_to(out))

        summary["zips"].append(zentry)

    (out / "ingest_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
