#!/usr/bin/env python3
"""Record world-layer feedback (有用/忽略/錯) for rubric tuning."""

from __future__ import annotations

import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_WORLD = Path.home() / ".openclaw/workspace/memory/world"


def main() -> int:
    if len(sys.argv) < 3:
        print(
            "Usage: record_feedback.py <useful|ignore|wrong> <topic_id> [note]",
            file=sys.stderr,
        )
        return 1

    signal = sys.argv[1].lower()
    topic_id = sys.argv[2]
    note = " ".join(sys.argv[3:]) if len(sys.argv) > 3 else ""

    world = Path(os.environ.get("OPENCLAW_WORLD_DIR", str(DEFAULT_WORLD)))
    fb_path = world / "feedback.jsonl"
    world.mkdir(parents=True, exist_ok=True)

    entry = {
        "id": str(uuid.uuid4()),
        "signal": signal,
        "topic_id": topic_id,
        "note": note,
        "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    with fb_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    # Adjust pipeline state: lower weight for ignored topics
    pipeline = world / "opportunity-pipeline-state.json"
    if pipeline.is_file():
        st = json.loads(pipeline.read_text(encoding="utf-8"))
        pushed = st.setdefault("pushed_topic_ids", {})
        if signal == "ignore":
            pushed[topic_id] = {
                "at": entry["at"],
                "weight": 0.3,
                "signal": "ignore",
            }
        elif signal == "useful":
            pushed[topic_id] = {
                "at": entry["at"],
                "weight": 1.2,
                "signal": "useful",
            }
        st["pushed_topic_ids"] = pushed
        pipeline.write_text(json.dumps(st, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(entry, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
