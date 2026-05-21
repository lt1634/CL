#!/usr/bin/env python3
"""World layer doctor: feed health, WORLD_STATE freshness, pipeline staleness."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_WORLD = Path.home() / ".openclaw/workspace/memory/world"
FEED_FAIL_RATE = 0.30
FEED_STALE_DAYS = 7
STATE_STALE_HOURS = 36
PIPELINE_STALE_HOURS = 48


def parse_iso(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


def hours_ago(dt: datetime, now: datetime) -> float:
    return (now - dt).total_seconds() / 3600.0


def check_feed_health(path: Path, now: datetime) -> tuple[list[str], list[str]]:
    warnings: list[str] = []
    critical: list[str] = []
    if not path.is_file():
        warnings.append("missing feed_health.json — run fetch_feeds.py first")
        return warnings, critical

    data = json.loads(path.read_text(encoding="utf-8"))
    updated = parse_iso(data.get("updated_at"))
    if updated and hours_ago(updated, now) > 24:
        warnings.append("feed_health.json older than 24h (no recent ingest?)")
    feeds = data.get("feeds") or {}
    if not feeds:
        warnings.append("feed_health.json has no feeds tracked yet")
        return warnings, critical

    for key, entry in feeds.items():
        sc = int(entry.get("success_count") or 0)
        ec = int(entry.get("error_count") or 0)
        total = sc + ec
        if total >= 3:
            rate = ec / total
            if rate >= FEED_FAIL_RATE:
                critical.append(f"feed {key}: error rate {rate:.0%} ({ec}/{total})")
        last_ok = parse_iso(entry.get("last_success_at"))
        last_item = entry.get("last_item_date")
        if last_ok and hours_ago(last_ok, now) > FEED_STALE_DAYS * 24:
            warnings.append(f"feed {key}: no success for >{FEED_STALE_DAYS}d")
        if last_item:
            try:
                item_dt = datetime.strptime(last_item, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                if hours_ago(item_dt, now) > FEED_STALE_DAYS * 24:
                    warnings.append(f"feed {key}: last item date {last_item} stale")
            except ValueError:
                pass
    return warnings, critical


def check_world_state(path: Path, now: datetime) -> tuple[list[str], list[str]]:
    warnings: list[str] = []
    critical: list[str] = []
    if not path.is_file():
        critical.append("WORLD_STATE.md missing")
        return warnings, critical
    text = path.read_text(encoding="utf-8")
    lines = len(text.splitlines())
    if lines > 160:
        warnings.append(f"WORLD_STATE.md long ({lines} lines); run weekly consolidate")
    m = re.search(r"\*最後更新：([^*]+)\*", text)
    if m:
        # loose parse "2026-05-18 12:30 HKT"
        raw = m.group(1).strip().replace(" HKT", "")
        try:
            updated = datetime.strptime(raw, "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
            if hours_ago(updated, now) > STATE_STALE_HOURS:
                warnings.append(f"WORLD_STATE last updated {m.group(1).strip()} (>{STATE_STALE_HOURS}h)")
        except ValueError:
            pass
    p0 = re.findall(r"^\- \(", text, re.MULTILINE)
    if len(p0) == 0 or "待 ingest" in text.split("## [P0]")[1][:200] if "## [P0]" in text else "":
        warnings.append("WORLD_STATE [P0] empty or placeholder")
    return warnings, critical


def check_brave_hints(world: Path, today: str) -> tuple[list[str], list[str]]:
    warnings: list[str] = []
    critical: list[str] = []
    path = world / "staging" / f"brave-fallback-hints-{today}.json"
    if not path.is_file():
        return warnings, critical
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        warnings.append("brave-fallback-hints.json unreadable")
        return warnings, critical
    hints = data.get("hints") or []
    if hints:
        names = ", ".join(h["feed"] for h in hints[:4])
        more = f" (+{len(hints) - 4})" if len(hints) > 4 else ""
        warnings.append(
            f"{len(hints)} feed(s) need Brave fallback: {names}{more} — see {path.name}"
        )
    return warnings, critical


def check_pipeline(path: Path, now: datetime) -> tuple[list[str], list[str]]:
    warnings: list[str] = []
    critical: list[str] = []
    if not path.is_file():
        warnings.append("opportunity-pipeline-state.json missing")
        return warnings, critical
    st = json.loads(path.read_text(encoding="utf-8"))
    for field in ("last_ingest_at", "last_digest_at"):
        dt = parse_iso(st.get(field))
        if dt and hours_ago(dt, now) > PIPELINE_STALE_HOURS:
            warnings.append(f"pipeline {field} stale ({st.get(field)})")
    budget = st.get("daily_token_budget") or {}
    used = int(budget.get("used_estimate") or 0)
    cap = int(budget.get("max_estimated_tokens") or 0)
    if cap and used > cap:
        warnings.append(f"token budget exceeded estimate {used}/{cap}")
    return warnings, critical


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--workspace", default=os.environ.get("OPENCLAW_WORLD_DIR", str(DEFAULT_WORLD)))
    p.add_argument("--json", action="store_true", help="JSON output only")
    args = p.parse_args()
    world = Path(args.workspace)
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")

    warnings: list[str] = []
    critical: list[str] = []
    for fn in (
        lambda: check_feed_health(world / "staging" / "feed_health.json", now),
        lambda: check_brave_hints(world, today),
        lambda: check_world_state(world / "WORLD_STATE.md", now),
        lambda: check_pipeline(world / "opportunity-pipeline-state.json", now),
    ):
        w, c = fn()
        warnings.extend(w)
        critical.extend(c)

    status = "healthy"
    if critical:
        status = "critical"
    elif len(warnings) >= 3:
        status = "degraded"

    report = {
        "checked_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "workspace": str(world),
        "status": status,
        "ok": len(critical) == 0,
        "warnings": warnings,
        "critical": critical,
    }
    out_path = world / "staging" / "doctor-report.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.json:
        print(json.dumps(report, ensure_ascii=False))
    else:
        print(f"World doctor — {report['status'].upper()}")
        for w in warnings:
            print(f"  ⚠️  {w}")
        for c in critical:
            print(f"  ❌ {c}")
        print(f"Report: {out_path}")

    return 1 if critical else 0


if __name__ == "__main__":
    raise SystemExit(main())
