#!/usr/bin/env python3
"""Fetch RSS feeds from watchlist and append world events (stdlib only)."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

CL_ROOT = Path(__file__).resolve().parents[2]
WATCHLIST = CL_ROOT / "memory/kb/world/watchlist.json"
DEFAULT_WORKSPACE_WORLD = Path.home() / ".openclaw/workspace/memory/world"
USER_AGENT = "CL-world-ingest/1.0 (+local)"
DEDUPE_DAYS_DEFAULT = 7
EST_TOKENS_PER_EVENT = 120
STALE_ITEM_DAYS_DEFAULT = 7


def load_watchlist(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def title_hash(title: str, url: str) -> str:
    raw = (title.strip().lower() + "|" + url.strip().lower()).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]


def parse_rss_xml(data: bytes) -> list[dict]:
    items: list[dict] = []
    root = ET.fromstring(data)
    ns = {"atom": "http://www.w3.org/2005/Atom"}

    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or item.findtext("date") or "").strip()
        desc = (item.findtext("description") or "")[:500].strip()
        if title and link:
            items.append({"title": title, "url": link, "published": pub, "summary": desc})

    for entry in root.findall(".//atom:entry", ns):
        title = (entry.findtext("atom:title", default="", namespaces=ns) or "").strip()
        link_el = entry.find("atom:link[@rel='alternate']", ns) or entry.find("atom:link", ns)
        link = link_el.get("href", "").strip() if link_el is not None else ""
        updated = (
            entry.findtext("atom:updated", default="", namespaces=ns)
            or entry.findtext("atom:published", default="", namespaces=ns)
            or ""
        ).strip()
        summary = (
            entry.findtext("atom:summary", default="", namespaces=ns)
            or entry.findtext("atom:content", default="", namespaces=ns)
            or ""
        )[:500].strip()
        if title and link:
            items.append({"title": title, "url": link, "published": updated, "summary": summary})

    return items


def fetch_url(url: str, timeout: int = 25) -> bytes:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=timeout) as resp:
        return resp.read()


def normalize_published(raw: str) -> str:
    if not raw:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        dt = parsedate_to_datetime(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    except (TypeError, ValueError, OverflowError):
        if re.match(r"^\d{4}-\d{2}-\d{2}", raw):
            return raw[:10]
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def published_date_only(published_at: str) -> str:
    return (published_at or "")[:10]


def compile_patterns(patterns: list[str] | None) -> list[re.Pattern[str]]:
    compiled: list[re.Pattern[str]] = []
    for raw in patterns or []:
        if not raw or not isinstance(raw, str):
            continue
        try:
            compiled.append(re.compile(raw, re.IGNORECASE))
        except re.error:
            continue
    return compiled


def filter_rules(feed: dict, domain_cfg: dict) -> dict:
    """Merge domain + per-feed keyword rules; feed overrides when set."""
    merged: dict = {}
    for key in (
        "require_any",
        "exclude_any",
        "include_keywords",
        "exclude_keywords",
    ):
        feed_val = feed.get(key)
        domain_val = domain_cfg.get(key)
        if feed_val:
            merged[key] = feed_val
        elif domain_val:
            merged[key] = domain_val
    return merged


def passes_text_filter(title: str, summary: str | None, rules: dict) -> tuple[bool, str | None]:
    text = f"{title}\n{summary or ''}"
    for pat in compile_patterns(rules.get("exclude_any") or rules.get("exclude_keywords")):
        if pat.search(text):
            return False, "exclude"
    require = compile_patterns(rules.get("require_any") or rules.get("include_keywords"))
    if require and not any(pat.search(text) for pat in require):
        return False, "require"
    return True, None


def load_recent_hashes(events_dir: Path, days: int) -> set[str]:
    seen: set[str] = set()
    if not events_dir.is_dir():
        return seen
    paths = sorted(events_dir.glob("*.jsonl"))
    for path in paths[-days:]:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                h = obj.get("title_hash")
                if h:
                    seen.add(h)
            except json.JSONDecodeError:
                continue
    return seen


def feed_key(domain: str, name: str) -> str:
    return f"{domain}/{name}"


def load_feed_health(path: Path) -> dict:
    if path.is_file():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {"version": 1, "feeds": {}}


def save_feed_health(path: Path, health: dict) -> None:
    health["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(health, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def update_feed_entry(
    health: dict,
    key: str,
    *,
    url: str,
    success: bool,
    items: int = 0,
    last_item_date: str | None = None,
    error: str | None = None,
) -> None:
    feeds = health.setdefault("feeds", {})
    entry = feeds.get(key) or {
        "url": url,
        "success_count": 0,
        "error_count": 0,
        "items_fetched_total": 0,
    }
    entry["url"] = url
    if success:
        entry["success_count"] = int(entry.get("success_count", 0)) + 1
        entry["last_success_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        entry["last_error"] = None
        entry["items_last_run"] = items
        if last_item_date:
            entry["last_item_date"] = last_item_date
        entry["items_fetched_total"] = int(entry.get("items_fetched_total", 0)) + items
    else:
        entry["error_count"] = int(entry.get("error_count", 0)) + 1
        entry["last_error"] = (error or "unknown")[:200]
        entry["items_last_run"] = 0
    feeds[key] = entry


def brave_fallbacks_for_feed(feed: dict, domain_cfg: dict) -> list[str]:
    out: list[str] = []
    for src in (feed.get("brave_fallback"), domain_cfg.get("brave_queries")):
        if isinstance(src, list):
            out.extend(str(q) for q in src if q)
    return list(dict.fromkeys(out))[:4]


def days_since_date(date_str: str | None, today: datetime) -> float | None:
    if not date_str or len(date_str) < 10:
        return None
    try:
        item_dt = datetime.strptime(date_str[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        return (today - item_dt).total_seconds() / 86400.0
    except ValueError:
        return None


def build_brave_fallback_hints(
    health: dict,
    wl: dict,
    feed_meta: dict[str, dict],
    today_dt: datetime,
) -> list[dict]:
    """Suggest Brave queries when RSS fails or latest item is stale."""
    hints: list[dict] = []
    feeds_health = health.get("feeds") or {}

    for fkey, entry in feeds_health.items():
        meta = feed_meta.get(fkey) or {}
        domain = fkey.split("/", 1)[0] if "/" in fkey else ""
        domain_cfg = wl.get("domains", {}).get(domain, {})
        queries = brave_fallbacks_for_feed(meta, domain_cfg)
        if not queries:
            continue

        reason_parts: list[str] = []
        if entry.get("last_error"):
            reason_parts.append(f"error: {entry['last_error'][:80]}")
        stale_days = int(meta.get("stale_item_days") or STALE_ITEM_DAYS_DEFAULT)
        last_item = entry.get("last_item_date")
        age = days_since_date(last_item, today_dt)
        if age is not None and age > stale_days:
            reason_parts.append(f"stale item ({last_item}, {age:.0f}d)")

        if not reason_parts:
            continue

        hints.append(
            {
                "feed": fkey,
                "domain": domain,
                "reason": "; ".join(reason_parts),
                "brave_queries": queries,
            }
        )

    # tech-ai: no RSS — always suggest domain brave at evening
    tech = wl.get("domains", {}).get("tech-ai", {})
    if tech.get("rss_policy") == "brave_only":
        bq = tech.get("brave_queries") or []
        if bq:
            hints.append(
                {
                    "feed": "tech-ai/(rss empty)",
                    "domain": "tech-ai",
                    "reason": "rss_policy=brave_only",
                    "brave_queries": bq[:3],
                }
            )

    return hints


def trust_for_feed(feed: dict, domain_cfg: dict) -> float:
    for src in (feed.get("source_trust"), domain_cfg.get("source_trust")):
        if src is not None:
            try:
                return max(0.1, min(1.0, float(src)))
            except (TypeError, ValueError):
                pass
    return 0.7


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="World layer RSS ingest")
    p.add_argument("workspace", nargs="?", help="OPENCLAW_WORLD_DIR")
    p.add_argument("watchlist", nargs="?", help="watchlist.json path")
    p.add_argument(
        "--force",
        action="store_true",
        help="Bypass dedupe window (still applies keyword filters)",
    )
    p.add_argument(
        "--dedupe-days",
        type=int,
        default=DEDUPE_DAYS_DEFAULT,
        help="Days of title_hash history to skip (default 7)",
    )
    return p.parse_args(argv)


def main() -> int:
    args = parse_args()
    workspace = Path(
        args.workspace or os.environ.get("OPENCLAW_WORLD_DIR", str(DEFAULT_WORKSPACE_WORLD))
    )
    watchlist_path = Path(args.watchlist) if args.watchlist else WATCHLIST

    if not watchlist_path.is_file():
        print(f"Missing watchlist: {watchlist_path}", file=sys.stderr)
        return 1

    wl = load_watchlist(watchlist_path)
    events_dir = workspace / "events"
    events_dir.mkdir(parents=True, exist_ok=True)
    staging_dir = workspace / "staging"
    staging_dir.mkdir(parents=True, exist_ok=True)
    health_path = staging_dir / "feed_health.json"

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out_path = events_dir / f"{today}.jsonl"
    dedupe_days = 0 if args.force else args.dedupe_days
    seen = set() if args.force else load_recent_hashes(events_dir, dedupe_days)
    health = load_feed_health(health_path)
    ingested_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    new_count = 0
    new_by_domain: dict[str, int] = {}
    filtered_count = 0
    filtered_by_domain: dict[str, int] = {}
    filtered_by_reason: dict[str, int] = {}
    errors: list[str] = []
    feed_meta: dict[str, dict] = {}
    today_dt = datetime.now(timezone.utc)

    for domain, cfg in wl.get("domains", {}).items():
        for feed in cfg.get("rss") or []:
            if feed.get("disabled"):
                continue
            url = feed.get("url")
            name = feed.get("name") or url
            if not url or not url.startswith("http"):
                continue
            fkey = feed_key(domain, name)
            feed_meta[fkey] = feed
            rules = filter_rules(feed, cfg)
            try:
                data = fetch_url(url)
                raw_items = parse_rss_xml(data)
                last_dates = [
                    published_date_only(normalize_published(r.get("published") or ""))
                    for r in raw_items[:15]
                ]
                last_item = max(last_dates) if last_dates else None
                update_feed_entry(
                    health,
                    fkey,
                    url=url,
                    success=True,
                    items=len(raw_items),
                    last_item_date=last_item,
                )
            except (URLError, ET.ParseError, TimeoutError, OSError) as e:
                errors.append(f"{domain}/{name}: {e}")
                update_feed_entry(health, fkey, url=url, success=False, error=str(e))
                continue

            added_this_feed = 0
            for raw in raw_items[:15]:
                keep, drop_reason = passes_text_filter(
                    raw["title"], raw.get("summary"), rules
                )
                if not keep:
                    filtered_count += 1
                    filtered_by_domain[domain] = filtered_by_domain.get(domain, 0) + 1
                    if drop_reason:
                        filtered_by_reason[drop_reason] = (
                            filtered_by_reason.get(drop_reason, 0) + 1
                        )
                    continue
                th = title_hash(raw["title"], raw["url"])
                if th in seen:
                    continue
                seen.add(th)
                trust = trust_for_feed(feed, cfg)
                event = {
                    "id": str(uuid.uuid4()),
                    "title": raw["title"],
                    "summary": raw.get("summary") or None,
                    "domain": domain,
                    "source_name": name,
                    "source_url": raw["url"],
                    "published_at": normalize_published(raw.get("published") or ""),
                    "ingested_at": ingested_at,
                    "entities": cfg.get("entities") or [],
                    "linked_projects": cfg.get("linked_projects") or [],
                    "confidence": round(0.5 + 0.5 * trust, 2),
                    "source_trust": trust,
                    "title_hash": th,
                }
                with out_path.open("a", encoding="utf-8") as f:
                    f.write(json.dumps(event, ensure_ascii=False) + "\n")
                new_count += 1
                added_this_feed += 1
                new_by_domain[domain] = new_by_domain.get(domain, 0) + 1
            update_feed_entry(
                health,
                fkey,
                url=url,
                success=True,
                items=added_this_feed,
                last_item_date=health["feeds"][fkey].get("last_item_date"),
            )

    save_feed_health(health_path, health)
    brave_hints = build_brave_fallback_hints(health, wl, feed_meta, today_dt)
    hints_path = staging_dir / f"brave-fallback-hints-{today}.json"
    hints_path.write_text(
        json.dumps(
            {
                "date": today,
                "generated_at": ingested_at,
                "hints": brave_hints,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    est_tokens = new_count * EST_TOKENS_PER_EVENT
    summary = {
        "ingested_at": ingested_at,
        "new_events": new_count,
        "new_events_by_domain": new_by_domain,
        "filtered_count": filtered_count,
        "filtered_by_domain": filtered_by_domain,
        "filtered_by_reason": filtered_by_reason,
        "estimated_downstream_tokens": est_tokens,
        "force": args.force,
        "dedupe_days": dedupe_days,
        "feed_health_path": str(health_path),
        "brave_fallback_hints_path": str(hints_path),
        "brave_fallback_hints_count": len(brave_hints),
        "output": str(out_path),
        "errors": errors,
    }
    summary_path = staging_dir / f"ingest-summary-{today}.json"
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))
    return 0 if not errors or new_count > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
