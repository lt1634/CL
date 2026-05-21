#!/usr/bin/env python3
"""
archive-to-drive.py — Parallel upload using Python multiprocessing
===============================================================
Uses a pool of workers to upload files in parallel for 5-10x speedup.

Usage:
    python3 archive-to-drive.py <local_folder> <drive_parent_id> [--delete-local]
"""

import os
import sys
import subprocess
import shutil
from multiprocessing import Pool, cpu_count
from pathlib import Path

SKIP_DIRS = {
    "node_modules", ".git", "__pycache__", ".next", ".venv",
    "venv", ".venv", ".env", "dist", "build", "out",
    ".cache", ".turbo", ".vercel", ".github"
}

SKIP_FILES = {".DS_Store", ".env.local", "package-lock.json"}
SKIP_EXTENSIONS = {".pyc", ".pyo", ".class", ".o", ".so", ".dylib"}


def should_skip(path: str, is_dir: bool) -> bool:
    name = os.path.basename(path)
    if is_dir:
        return name in SKIP_DIRS
    return name in SKIP_FILES or any(name.endswith(ext) for ext in SKIP_EXTENSIONS)


def scan_folder(folder_path: str):
    root_len = len(folder_path) + 1
    files = []
    for dirpath, dirnames, filenames in os.walk(folder_path):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fname in filenames:
            full = os.path.join(dirpath, fname)
            if should_skip(full, False):
                continue
            rel = full[root_len:]
            files.append((full, rel))
    return files


def upload_one(args):
    parent_id, full_path, rel_path = args
    cmd = [
        "gog", "drive", "upload",
        "--parent", parent_id,
        full_path,
        "--name", rel_path
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return (rel_path, r.returncode == 0)


def archive_folder(folder_path: str, parent_id: str, delete_local: bool = False):
    folder_path = os.path.abspath(folder_path)
    folder_name = os.path.basename(folder_path)

    print(f"\n📦 Archiving: {folder_path}")
    print(f"   → Drive: {parent_id}")
    print(f"   → Workers: {cpu_count()}\n")

    files = scan_folder(folder_path)
    if not files:
        print("⚠️  No files to upload")
        return

    total_size = sum(os.path.getsize(f) for f, _ in files)
    print(f"📊 {len(files)} files, {total_size / 1024 / 1024:.1f} MB")

    # Prepare args
    args = [(parent_id, f, r) for f, r in files]

    # Upload with multiprocessing pool
    ok, fail = 0, 0
    with Pool(processes=min(8, cpu_count())) as pool:
        for i, (rel_path, success) in enumerate(pool.imap_unordered(upload_one, args), 1):
            if success:
                ok += 1
            else:
                fail += 1
                print(f"  ❌ {rel_path}")
            if i % 50 == 0:
                print(f"  Progress: {i}/{len(files)}...")

    print(f"\n✅ Uploaded {ok} files, {fail} failed")

    if delete_local and fail == 0:
        shutil.rmtree(folder_path)
        print(f"🗑️  Deleted local: {folder_path}")
        print(f"💾 Space saved: {total_size / 1024 / 1024:.1f} MB")
    elif fail > 0:
        print(f"\n⚠️  {fail} failed — local NOT deleted")


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    folder_path, parent_id = sys.argv[1], sys.argv[2]
    delete_local = "--delete-local" in sys.argv
    if not os.path.isdir(folder_path):
        print(f"❌ Not a directory: {folder_path}")
        sys.exit(1)
    archive_folder(folder_path, parent_id, delete_local)


if __name__ == "__main__":
    main()
