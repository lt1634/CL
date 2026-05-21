#!/usr/bin/env python3
"""
Audrey artworks ingest: unzip (JPEG only) → name from zip stem (YYYYMMDD) → dest;
loose JPEGs already named YYYYMMDD… in source are moved into dest unchanged.

Usage:
  python3 scripts/audrey-artworks-workflow.py
  python3 scripts/audrey-artworks-workflow.py --source ~/Downloads --skip-existing
  python3 scripts/audrey-artworks-workflow.py --dry-run
  python3 scripts/audrey-artworks-workflow.py --keep-zips   # do not delete .zip after ingest

Default: each successfully ingested .zip is deleted; with --skip-existing, skipped
duplicate zips are deleted too (JPEG already in dest). Zips with no JPEG inside are kept.

OpenClaw: run the same command; paths may be absolute.
"""
from __future__ import annotations

import argparse
import re
import shutil
import tempfile
import zipfile
from pathlib import Path

JPEG_EXT = {".jpg", ".jpeg", ".JPG", ".JPEG"}
# Loose files: stem is 8-digit calendar date (YYYYMMDD) + optional letter suffix, e.g. 20241020b
YYYYMMDD_STEM = re.compile(r"^20\d{6}[A-Za-z]*$")


def extract_jpegs_from_zip(zpath: Path, tmp: Path) -> list[Path]:
    out: list[Path] = []
    with zipfile.ZipFile(zpath, "r") as zf:
        for name in zf.namelist():
            if name.endswith("/"):
                continue
            p = Path(name)
            if p.suffix not in JPEG_EXT and p.suffix.lower() not in (".jpg", ".jpeg"):
                continue
            dest = tmp / p.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(name) as src, open(dest, "wb") as dst:
                shutil.copyfileobj(src, dst)
            out.append(dest)
    return out


def plan_zip_outputs(zpath: Path, jpeg_paths: list[Path]) -> list[tuple[Path, Path]]:
    """(tmp jpeg path, final filename under dest). Zip basename stem is used as-is (YYYYMMDD)."""
    base = zpath.stem
    planned: list[tuple[Path, Path]] = []
    for i, jp in enumerate(sorted(jpeg_paths, key=lambda p: p.name)):
        ext = jp.suffix
        if len(jpeg_paths) == 1:
            final_name = f"{base}{ext}"
        else:
            final_name = f"{base}_{i + 1}{ext}"
        planned.append((jp, Path(final_name)))
    return planned


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--source",
        type=Path,
        default=Path.home() / "Downloads",
        help="Folder to scan for .zip and loose JPEGs (default: ~/Downloads)",
    )
    ap.add_argument(
        "--dest",
        type=Path,
        default=None,
        help='Output folder (default: SOURCE/"audrey artworks")',
    )
    ap.add_argument(
        "--keep-zips",
        action="store_true",
        help="Keep .zip files after ingest (default: delete zips after success or skip-duplicate)",
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Print actions only; do not write or delete",
    )
    ap.add_argument(
        "--skip-existing",
        action="store_true",
        help="If dest JPEG already exists for a zip, skip that zip instead of aborting",
    )
    args = ap.parse_args()
    delete_zips = not args.keep_zips

    source: Path = args.source.expanduser().resolve()
    dest: Path = (
        args.dest.expanduser().resolve()
        if args.dest
        else (source / "audrey artworks")
    )

    if not source.is_dir():
        print(f"ERROR: source is not a directory: {source}")
        return 1

    dest.mkdir(parents=True, exist_ok=True)

    actions: list[str] = []

    # 1) Zips: JPEGs → dest named {zip_stem}[_{n}].ext (expect zip like 20241204.zip)
    for zpath in sorted(source.glob("*.zip")):
        if not zpath.is_file():
            continue
        try:
            with tempfile.TemporaryDirectory(prefix="audrey-zip-") as td:
                tmp = Path(td)
                jpegs = extract_jpegs_from_zip(zpath, tmp)
                if not jpegs:
                    actions.append(f"skip zip (no JPEG): {zpath.name}")
                    continue
                planned = plan_zip_outputs(zpath, jpegs)
                collision = next(
                    (dest / fn for _, fn in planned if (dest / fn).exists()),
                    None,
                )
                if collision is not None:
                    if args.skip_existing:
                        actions.append(
                            f"skip zip (dest exists): {zpath.name} -> {collision.name}"
                        )
                        if delete_zips:
                            actions.append(f"delete {zpath.name}")
                            if not args.dry_run:
                                zpath.unlink()
                        continue
                    msg = f"ABORT exists: {collision} (from {zpath.name})"
                    print(msg, flush=True)
                    for line in actions:
                        print(line, flush=True)
                    return 1
                for src_tmp, fn in planned:
                    target = dest / fn
                    actions.append(f"mv (from zip {zpath.name}) {src_tmp.name} -> {dest.name}/{fn}")
                    if not args.dry_run:
                        shutil.move(str(src_tmp), str(target))
                if delete_zips:
                    actions.append(f"delete {zpath.name}")
                    if not args.dry_run:
                        zpath.unlink()
        except zipfile.BadZipFile:
            actions.append(f"ERROR bad zip: {zpath.name}")
            return 1

    # 2) Loose YYYYMMDD-named JPEGs in source → dest (same filename)
    for fpath in sorted(source.iterdir()):
        if not fpath.is_file():
            continue
        if fpath.suffix not in JPEG_EXT and fpath.suffix.lower() not in (".jpg", ".jpeg"):
            continue
        if fpath.parent.resolve() == dest.resolve():
            continue
        if not YYYYMMDD_STEM.match(fpath.stem):
            continue
        target = dest / fpath.name
        if target.exists() and target.resolve() != fpath.resolve():
            if args.skip_existing:
                actions.append(
                    f"skip loose (dest exists): {fpath.name} -> {target.name}"
                )
                continue
            msg = f"ABORT exists: {target} (from loose {fpath.name})"
            print(msg, flush=True)
            for line in actions:
                print(line, flush=True)
            return 1
        actions.append(f"mv {fpath.name} -> {dest.name}/")
        if not args.dry_run:
            shutil.move(str(fpath), str(target))

    for line in actions:
        print(line)
    if args.dry_run:
        print("(dry-run: no changes)")
    else:
        print(f"Done. dest={dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
