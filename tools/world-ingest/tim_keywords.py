#!/usr/bin/env python3
"""Load Tim opportunity match keywords from profile + watchlist."""

from __future__ import annotations

import json
import re
from pathlib import Path

CL_ROOT = Path(__file__).resolve().parents[2]
PROFILE = CL_ROOT / "memory/kb/world/tim-opportunity-profile.md"
WATCHLIST = CL_ROOT / "memory/kb/world/watchlist.json"
ENTITIES = CL_ROOT / "memory/kb/world/entities.yaml"


def keywords_from_profile(path: Path) -> list[str]:
    if not path.is_file():
        return []
    text = path.read_text(encoding="utf-8")
    found: list[str] = []
    for line in text.splitlines():
        if "|" in line and ("關鍵字" in line or "entities" in line.lower()):
            continue
        for m in re.finditer(r"[\u4e00-\u9fff]{2,8}|[A-Za-z][A-Za-z0-9]{2,}", line):
            tok = m.group(0)
            if len(tok) >= 2 and tok not in ("Tim", "SSOT", "JSON", "Brave", "RSS"):
                found.append(tok)
    # Explicit high-value tokens from tables
    for tok in re.findall(r"`([^`]+)`", text):
        if 2 <= len(tok) <= 40:
            found.append(tok)
    return found


def load_tim_keywords() -> list[str]:
    wl: dict = {}
    if WATCHLIST.is_file():
        wl = json.loads(WATCHLIST.read_text(encoding="utf-8"))
    tokens: list[str] = []
    for cfg in wl.get("domains", {}).values():
        tokens.extend(cfg.get("entities") or [])
    tokens.extend(keywords_from_profile(PROFILE))
    if ENTITIES.is_file():
        for m in re.findall(r'"([^"]{2,30})"', ENTITIES.read_text(encoding="utf-8")):
            tokens.append(m)
    # Dedupe preserve order
    seen: set[str] = set()
    out: list[str] = []
    for t in tokens:
        key = t.lower()
        if key not in seen:
            seen.add(key)
            out.append(t)
    return out
