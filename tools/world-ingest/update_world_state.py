#!/usr/bin/env python3
"""Merge scored world events into WORLD_STATE.md [P0]; age stale lines to [P2]."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

CL_ROOT = Path(__file__).resolve().parents[2]
WATCHLIST = CL_ROOT / "memory/kb/world/watchlist.json"
DEFAULT_WORLD = Path.home() / ".openclaw/workspace/memory/world"
MAX_P0 = 12
P0_MAX_AGE_DAYS = 21
EVENT_LOOKBACK_DAYS = 3
P0_LINE_RE = re.compile(
    r"^- \((\d{4}-\d{2}-\d{2})\) \[([\w-]+)\] (.+?) — (https?://\S+)\s*$"
)


def load_watchlist(path: Path) -> dict:
    if not path.is_file():
        return {"domains": {}}
    return json.loads(path.read_text(encoding="utf-8"))


def domain_trust(wl: dict, domain: str) -> float:
    cfg = wl.get("domains", {}).get(domain) or {}
    try:
        return max(0.1, min(1.0, float(cfg.get("source_trust", 0.7))))
    except (TypeError, ValueError):
        return 0.7


def parse_event_date(published_at: str) -> datetime:
    raw = (published_at or "")[:10]
    try:
        return datetime.strptime(raw, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return datetime.now(timezone.utc)


def age_days(published_at: str, now: datetime) -> float:
    pub = parse_event_date(published_at)
    return max(0.0, (now - pub).total_seconds() / 86400.0)


def load_events(events_dir: Path, days: int) -> list[dict]:
    if not events_dir.is_dir():
        return []
    now = datetime.now(timezone.utc)
    out: list[dict] = []
    for path in sorted(events_dir.glob("*.jsonl"))[-days:]:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except json.JSONDecodeError:
                continue
            if age_days(ev.get("published_at", ""), now) <= P0_MAX_AGE_DAYS + 7:
                out.append(ev)
    return out


DOMAIN_BOOST = {
    "local": 1.2,
    "hk": 1.12,
    "tech-ai": 1.05,
    "investment": 1.0,
}


def score_event(ev: dict, wl: dict, now: datetime) -> float:
    domain = ev.get("domain", "")
    trust = float(ev.get("source_trust") or domain_trust(wl, domain))
    days = age_days(ev.get("published_at", ""), now)
    age_factor = max(0.15, 1.0 - min(days, 30) / 30.0)
    conf = float(ev.get("confidence") or 0.75)
    boost = DOMAIN_BOOST.get(domain, 1.0)
    title_blob = f"{ev.get('title', '')} {ev.get('summary') or ''}"
    if any(k in title_blob for k in ("梅窩", "大嶼山", "T58", "佛行", "康文署", "展覽", "豆豆", "粵語")):
        boost *= 1.08
    return trust * age_factor * conf * boost


def format_p0_line(ev: dict) -> str:
    title = ev.get("title", "").strip()
    url = ev.get("source_url", "")
    pub = (ev.get("published_at") or "")[:10]
    domain = ev.get("domain", "")
    return f"- ({pub}) [{domain}] {title} — {url}"


def parse_p0_line(line: str) -> dict | None:
    m = P0_LINE_RE.match(line.strip())
    if not m:
        return None
    return {
        "published_at": m.group(1),
        "domain": m.group(2),
        "title": m.group(3),
        "source_url": m.group(4),
        "line": line.strip(),
    }


def line_url(line: str) -> str | None:
    p = parse_p0_line(line)
    if p:
        return p["source_url"]
    m = re.search(r"https?://\S+", line)
    return m.group(0) if m else None


def merge_p0_section(content: str, scored_lines: list[tuple[float, str]], aged_to_p2: list[str]) -> str:
    p0_marker = "## [P0] 本週確定事實（附來源日期）"
    p2_marker = "## [P2]"
    if p0_marker not in content:
        return content

    before, rest = content.split(p0_marker, 1)
    p0_part = rest.split(p2_marker, 1)[0] if p2_marker in rest else rest
    tail_after_p0 = rest[len(p0_part) :] if p2_marker not in rest else ""

    p2_body_lines: list[str] = []
    tail_after_p2 = ""
    if p2_marker in content:
        _, p2_rest = content.split(p2_marker, 1)
        p2_parts = p2_rest.split("##", 1)
        p2_body_lines = [
            ln.strip()
            for ln in p2_parts[0].splitlines()
            if ln.strip().startswith("- ") and "定期 consolidate" not in ln
        ]
        tail_after_p2 = ("##" + p2_parts[1]) if len(p2_parts) > 1 else ""

    existing = [
        ln.strip()
        for ln in p0_part.splitlines()
        if ln.strip().startswith("- ") and "待 ingest" not in ln
    ]

    now = datetime.now(timezone.utc)
    kept: list[str] = []
    aged: list[str] = list(aged_to_p2)
    for ln in existing:
        parsed = parse_p0_line(ln)
        if parsed and age_days(parsed["published_at"], now) > P0_MAX_AGE_DAYS:
            aged.append(ln)
        else:
            kept.append(ln)

    seen_urls: set[str] = set()
    merged_scored: list[tuple[float, str]] = []
    for sc, ln in scored_lines:
        u = line_url(ln)
        if u and u in seen_urls:
            continue
        if u:
            seen_urls.add(u)
        merged_scored.append((sc, ln))

    for ln in kept:
        u = line_url(ln)
        if u and u not in seen_urls:
            seen_urls.add(u)
            merged_scored.append((0.5, ln))

    merged_scored.sort(key=lambda x: x[0], reverse=True)
    final_p0 = [ln for _, ln in merged_scored[:MAX_P0]]

    p0_text = "\n\n" + ("\n".join(final_p0) if final_p0 else "- （待 ingest 填入）") + "\n\n"
    mid = tail_after_p0.split(p2_marker, 1)[0] if p2_marker in tail_after_p0 else tail_after_p0
    if "##" in mid and not mid.strip().startswith("##"):
        mid = mid.split("##", 1)
        mid = ("##" + mid[1]) if len(mid) > 1 else ""

    p2_seen: set[str] = set()
    p2_merged: list[str] = []
    for ln in p2_body_lines + aged:
        u = line_url(ln) or ln
        if u in p2_seen:
            continue
        p2_seen.add(u)
        p2_merged.append(ln)
    p2_merged = p2_merged[-30:]

    updated = before + p0_marker + p0_text + mid
    if p2_marker in content or aged:
        p2_title = p2_marker if p2_marker in content else "## [P2] 雜訊／已過期"
        p2_block = "\n\n" + (
            "\n".join(p2_merged) if p2_merged else "- （定期 consolidate 移入 archive）"
        ) + "\n\n"
        updated = updated.rstrip() + f"\n\n{p2_title}{p2_block}{tail_after_p2}"

    stamp = f"*最後更新：{datetime.now().strftime('%Y-%m-%d %H:%M')} HKT*"
    if "*最後更新：" in updated:
        updated = re.sub(r"\*最後更新：.*\*", stamp, updated, count=1)
    else:
        updated = updated.rstrip() + f"\n\n{stamp}\n"
    return updated


def main() -> int:
    world = Path(os.environ.get("OPENCLAW_WORLD_DIR", str(DEFAULT_WORLD)))
    wl = load_watchlist(WATCHLIST)
    state_path = world / "WORLD_STATE.md"
    now = datetime.now(timezone.utc)

    events = load_events(world / "events", EVENT_LOOKBACK_DAYS)
    if state_path.is_file():
        content = state_path.read_text(encoding="utf-8")
    else:
        tpl = CL_ROOT / "memory/kb/world/WORLD_STATE.md"
        content = tpl.read_text(encoding="utf-8") if tpl.is_file() else ""

    seen_urls: set[str] = set()
    scored: list[tuple[float, str]] = []
    for ev in events:
        url = (ev.get("source_url") or "").strip()
        if not url or url in seen_urls:
            continue
        if age_days(ev.get("published_at", ""), now) > P0_MAX_AGE_DAYS:
            continue
        seen_urls.add(url)
        scored.append((score_event(ev, wl, now), format_p0_line(ev)))

    if not events and not state_path.is_file():
        print(json.dumps({"updated": False, "reason": "no events"}))
        return 0

    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(merge_p0_section(content, scored, []), encoding="utf-8")

    pipeline = world / "opportunity-pipeline-state.json"
    if pipeline.is_file():
        st = json.loads(pipeline.read_text(encoding="utf-8"))
        st["last_ingest_at"] = now.strftime("%Y-%m-%dT%H:%M:%SZ")
        pipeline.write_text(json.dumps(st, indent=2) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "updated": True,
                "p0_candidates": len(scored),
                "path": str(state_path),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
