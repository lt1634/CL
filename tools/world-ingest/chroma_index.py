#!/usr/bin/env python3
"""
Optional Phase 4a: index world events into local Chroma (if chromadb installed).

Usage:
  python3 chroma_index.py              # index today's events
  python3 chroma_index.py --query "Fed rate Hong Kong"

Requires: pip install chromadb  (not installed by this repo)
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_WORLD = Path.home() / ".openclaw/workspace/memory/world"
CHROMA_DIR = Path.home() / ".openclaw/vector/world-chroma"


def main() -> int:
    try:
        import chromadb
    except ImportError:
        print(
            json.dumps(
                {
                    "ok": False,
                    "skipped": True,
                    "reason": "chromadb not installed; use QMD only",
                }
            )
        )
        return 0

    world = Path(os.environ.get("OPENCLAW_WORLD_DIR", str(DEFAULT_WORLD)))
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    events_path = world / "events" / f"{today}.jsonl"

    if "--query" in sys.argv:
        idx = sys.argv.index("--query")
        query = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else ""
        client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        col = client.get_or_create_collection("world_events")
        res = col.query(query_texts=[query], n_results=5)
        print(json.dumps(res, ensure_ascii=False, default=str))
        return 0

    if not events_path.is_file():
        print(json.dumps({"ok": False, "reason": "no events file"}))
        return 0

    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    col = client.get_or_create_collection("world_events")
    ids, docs, metas = [], [], []
    for line in events_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        ev = json.loads(line)
        ids.append(ev["id"])
        docs.append(f"{ev.get('title','')}\n{ev.get('summary') or ''}")
        metas.append(
            {
                "domain": ev.get("domain"),
                "source_url": ev.get("source_url"),
                "published_at": ev.get("published_at"),
            }
        )
    if ids:
        col.upsert(ids=ids, documents=docs, metadatas=metas)
    print(json.dumps({"ok": True, "indexed": len(ids), "path": str(CHROMA_DIR)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
