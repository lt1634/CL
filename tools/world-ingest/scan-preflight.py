#!/usr/bin/env python3
"""Decide if today's opportunity L1 scan is warranted (free, no LLM)."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

CL_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WORLD = Path.home() / ".openclaw/workspace/memory/world"
WATCHLIST = CL_ROOT / "memory/kb/world/watchlist.json"
ENTITIES = CL_ROOT / "memory/kb/world/entities.yaml"
BUDGET_LIMITS = CL_ROOT / "memory/kb/world/budget-limits.json"

MIN_NEW_EVENTS = 3
MIN_HK_VOLUME = 8
MAX_OPPORTUNITIES_TODAY = 5
SCAN_COOLDOWN_HOURS = 4

from tim_keywords import load_tim_keywords  # noqa: E402


def parse_iso(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


def load_today_events(events_dir: Path, today: str) -> list[dict]:
    path = events_dir / f"{today}.jsonl"
    if not path.is_file():
        return []
    out: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return out


def load_ingest_summary(staging: Path, today: str) -> dict | None:
    path = staging / f"ingest-summary-{today}.json"
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def count_opportunities_today(world: Path, today: str) -> int:
    path = world / "opportunities" / f"{today}.jsonl"
    if not path.is_file():
        return 0
    return sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())


def load_budget_blocker(world: Path) -> str | None:
    if not BUDGET_LIMITS.is_file():
        return None
    try:
        budget = json.loads(BUDGET_LIMITS.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    if budget.get("optional_l1_scans_enabled") is False:
        return "budget: optional_l1_scans_enabled=false"
    policy = budget.get("on_budget_exceeded", "")
    if policy != "skip_optional_llm_scans_digest_continues":
        return None
    rel = budget.get("budget_exceeded_flag", "staging/budget-exceeded.flag")
    flag = world / rel
    if flag.is_file():
        return "budget exceeded: skip optional L1 scan (evening digest continues)"
    return None


def keywords_from_entities_yaml(path: Path) -> list[str]:
    if not path.is_file():
        return []
    text = path.read_text(encoding="utf-8")
    found = re.findall(r'"([^"]+)"', text)
    for line in text.splitlines():
        if line.strip().startswith("- ["):
            parts = [p.strip().strip('"') for p in line.split(",")]
            for p in parts[3:]:
                if p and not p.endswith(".md"):
                    found.append(p)
    return list(dict.fromkeys(found))


def watchlist_entity_tokens(watchlist: dict) -> list[str]:
    tokens: list[str] = []
    for cfg in watchlist.get("domains", {}).values():
        tokens.extend(cfg.get("entities") or [])
    return list(dict.fromkeys(tokens))


def event_hits_keyword(ev: dict, keywords: list[str]) -> list[str]:
    blob = f"{ev.get('title', '')} {ev.get('summary') or ''} {ev.get('domain', '')}"
    hits = []
    for kw in keywords:
        if kw and kw.lower() in blob.lower():
            hits.append(kw)
    return hits


def main() -> int:
    p = argparse.ArgumentParser(description="L1 opportunity scan preflight")
    p.add_argument(
        "--exit-code",
        action="store_true",
        help="Exit 1 when scan not warranted (for shell && chains)",
    )
    p.add_argument(
        "--afternoon",
        action="store_true",
        help="Stricter: enforce max opportunities cap",
    )
    args = p.parse_args()

    world = Path(os.environ.get("OPENCLAW_WORLD_DIR", str(DEFAULT_WORLD)))
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    now = datetime.now(timezone.utc)
    events = load_today_events(world / "events", today)
    summary = load_ingest_summary(world / "staging", today)
    new_events = int(
        (summary or {}).get("new_events")
        or (summary or {}).get("total_new")
        or 0
    )

    watchlist: dict = {}
    if WATCHLIST.is_file():
        watchlist = json.loads(WATCHLIST.read_text(encoding="utf-8"))

    keywords = list(
        dict.fromkeys(
            load_tim_keywords()
            + watchlist_entity_tokens(watchlist)
            + keywords_from_entities_yaml(ENTITIES)
        )
    )

    hit_events: list[dict] = []
    for ev in events:
        hits = event_hits_keyword(ev, keywords)
        if hits:
            hit_events.append(
                {
                    "title": ev.get("title"),
                    "domain": ev.get("domain"),
                    "keywords": hits[:5],
                }
            )

    hk_count = sum(1 for e in events if e.get("domain") == "hk")
    local_count = sum(1 for e in events if e.get("domain") == "local")
    opp_count = count_opportunities_today(world, today)

    blockers: list[str] = []
    signals: list[str] = []

    budget_block = load_budget_blocker(world)
    if budget_block:
        blockers.append(budget_block)

    if not summary:
        blockers.append("no ingest-summary today (run fetch_feeds first)")
    elif (
        new_events < MIN_NEW_EVENTS
        and not hit_events
        and hk_count < MIN_HK_VOLUME
        and local_count < 3
    ):
        blockers.append(f"few new events from ingest ({new_events} < {MIN_NEW_EVENTS})")

    if args.afternoon and opp_count >= MAX_OPPORTUNITIES_TODAY:
        blockers.append(f"already {opp_count} opportunities today (afternoon cap)")

    pipeline_path = world / "opportunity-pipeline-state.json"
    if pipeline_path.is_file():
        st = json.loads(pipeline_path.read_text(encoding="utf-8"))
        last_scan = parse_iso(st.get("last_scan_at"))
        if last_scan:
            hours = (now - last_scan).total_seconds() / 3600
            if hours < SCAN_COOLDOWN_HOURS:
                blockers.append(f"recent scan within {SCAN_COOLDOWN_HOURS}h ({hours:.1f}h ago)")

    if hit_events:
        signals.append(f"entity/topic hits: {len(hit_events)}")
    if hk_count >= MIN_HK_VOLUME:
        signals.append(f"hk event volume: {hk_count}")
    if local_count >= 3:
        signals.append(f"local event volume: {local_count}")
    if new_events >= MIN_NEW_EVENTS:
        signals.append(f"ingest new_events: {new_events}")

    has_signal = (
        bool(hit_events)
        or hk_count >= MIN_HK_VOLUME
        or local_count >= 3
        or new_events >= MIN_NEW_EVENTS
    )
    warranted = has_signal and not blockers

    reasons: list[str] = []
    if warranted:
        reasons.extend(signals)
    else:
        if blockers:
            reasons.extend(blockers)
        if not has_signal:
            reasons.append("no entity hits, low hk volume, and few new events")

    out = {
        "date": today,
        "checked_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "warranted": warranted,
        "hit_count": len(hit_events),
        "hk_events_today": hk_count,
        "local_events_today": local_count,
        "total_events_today": len(events),
        "new_events": new_events,
        "opportunities_today": opp_count,
        "reasons": reasons,
        "signals": signals,
        "blockers": blockers,
        "sample_hits": hit_events[:8],
        "keywords_checked": len(keywords),
    }

    staging = world / "staging"
    staging.mkdir(parents=True, exist_ok=True)
    out_path = staging / f"scan-warranted-{today}.json"
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    label = "Warranted" if warranted else "Skipped"
    print(json.dumps(out, ensure_ascii=False))
    print(f"Preflight: {label} | reasons={reasons}", file=sys.stderr)

    if args.exit_code and not warranted:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
