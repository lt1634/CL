#!/usr/bin/env python3
"""Export high-confidence world events for PLUR plur_learn (manual or agent)."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_WORLD = Path.home() / ".openclaw/workspace/memory/world"
CONFIDENCE_MIN = 0.85


def main() -> int:
    world = Path(os.environ.get("OPENCLAW_WORLD_DIR", str(DEFAULT_WORLD)))
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    events_path = world / "events" / f"{today}.jsonl"
    out_path = world / "plur-export.md"
    lines: list[str] = [
        "# PLUR export — world facts",
        f"# Generated {today}",
        "",
        "Agent: for each bullet below, call `plur_learn` if still valid.",
        "",
    ]

    if events_path.is_file():
        for raw in events_path.read_text(encoding="utf-8").splitlines():
            if not raw.strip():
                continue
            ev = json.loads(raw)
            if ev.get("confidence", 0) < CONFIDENCE_MIN:
                continue
            stmt = (
                f"[world:{ev.get('domain')}] {ev.get('title')} "
                f"(source: {ev.get('source_url')}, date: {ev.get('published_at')})"
            )
            lines.append(f"- {stmt}")

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({"path": str(out_path), "lines": len(lines) - 6}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
