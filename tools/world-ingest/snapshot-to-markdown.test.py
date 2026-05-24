#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "tools/world-ingest/snapshot-to-markdown.py"


def test_falls_back_to_latest_available_day() -> None:
    with tempfile.TemporaryDirectory(prefix="world-snapshot-test-") as tmp:
        world = Path(tmp) / "world"
        events = world / "events"
        staging = world / "staging"
        events.mkdir(parents=True)
        staging.mkdir(parents=True)
        (events / "2026-05-23.jsonl").write_text(
            json.dumps(
                {
                    "title": "Important event",
                    "domain": "local",
                    "source_name": "feed",
                    "source_url": "https://example.com/event",
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (staging / "ingest-summary-2026-05-23.json").write_text(
            json.dumps({"new_events": 1, "filtered_count": 0}),
            encoding="utf-8",
        )

        env = {
            **os.environ,
            "OPENCLAW_WORLD_DIR": str(world),
            "OPENCLAW_WORLD_SNAPSHOT_DATE": "2026-05-24",
        }
        subprocess.run([sys.executable, str(SCRIPT)], env=env, check=True, capture_output=True)

        latest = (world / "snapshots/latest.md").read_text(encoding="utf-8")
        assert "# World daily snapshot — 2026-05-23" in latest
        assert "Important event" in latest
        assert "_No events file for today._" not in latest
        assert (world / "snapshots/daily-2026-05-23.md").is_file()
        assert not (world / "snapshots/daily-2026-05-24.md").exists()


if __name__ == "__main__":
    test_falls_back_to_latest_available_day()
    print("snapshot-to-markdown tests passed")
