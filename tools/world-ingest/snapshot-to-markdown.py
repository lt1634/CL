#!/usr/bin/env python3
"""
Memory-Tree style daily snapshot: JSON/jsonl → compact Markdown for agents (no LLM).
Run after fetch_feeds.py (morning ingest). Not indexed by qmd unless you add path.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

CL_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WORLD = Path.home() / ".openclaw/workspace/memory/world"
MAX_EVENTS = 40


def main() -> int:
    world = Path(os.environ.get("OPENCLAW_WORLD_DIR", str(DEFAULT_WORLD)))
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    staging = world / "staging"
    events_path = world / "events" / f"{today}.jsonl"
    summary_path = staging / f"ingest-summary-{today}.json"
    health_path = staging / "feed_health.json"

    lines: list[str] = [
        f"# World daily snapshot — {today}",
        "",
        f"_generated: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}_",
        "",
    ]

    if summary_path.is_file():
        s = json.loads(summary_path.read_text(encoding="utf-8"))
        lines.extend(
            [
                "## Ingest summary",
                "",
                f"- **new_events**: {s.get('new_events', 0)}",
                f"- **filtered**: {s.get('filtered_count', 0)}",
                f"- **est. downstream tokens**: {s.get('estimated_downstream_tokens', 0)}",
            ]
        )
        by_dom = s.get("new_events_by_domain") or {}
        if by_dom:
            lines.append("- **by domain**: " + ", ".join(f"{k}={v}" for k, v in sorted(by_dom.items())))
        errs = s.get("errors") or []
        if errs:
            lines.append(f"- **feed errors**: {len(errs)}")
        lines.append("")

    if health_path.is_file():
        h = json.loads(health_path.read_text(encoding="utf-8"))
        feeds = h.get("feeds") or {}
        bad = [k for k, v in feeds.items() if not v.get("last_success")]
        lines.extend(
            [
                "## Feed health",
                "",
                f"- **feeds tracked**: {len(feeds)}",
                f"- **failing**: {len(bad)}",
            ]
        )
        if bad[:8]:
            lines.append("- " + ", ".join(bad[:8]))
        lines.append("")

    if events_path.is_file():
        events: list[dict] = []
        for line in events_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line:
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        lines.extend([f"## Top events ({min(len(events), MAX_EVENTS)} shown)", ""])
        for ev in events[:MAX_EVENTS]:
            title = (ev.get("title") or "")[:120]
            dom = ev.get("domain") or "?"
            src = ev.get("source_name") or ""
            url = ev.get("source_url") or ""
            lines.append(f"- **[{dom}]** {title}" + (f" ({src})" if src else ""))
            if url:
                lines.append(f"  - {url}")
        lines.append("")
    else:
        lines.extend(["## Events", "", "_No events file for today._", ""])

    lines.append("---")
    lines.append("_Full jsonl: `memory/world/events/` · Hot state: `WORLD_STATE.md`_")

    out_dir = world / "snapshots"
    out_dir.mkdir(parents=True, exist_ok=True)
    daily = out_dir / f"daily-{today}.md"
    latest = out_dir / "latest.md"
    text = "\n".join(lines) + "\n"
    daily.write_text(text, encoding="utf-8")
    latest.write_text(text, encoding="utf-8")
    print(json.dumps({"ok": True, "daily": str(daily), "latest": str(latest)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
