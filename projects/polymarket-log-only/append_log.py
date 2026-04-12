#!/usr/bin/env python3
"""
Append one NDJSON line to ~/.openclaw/workspace/memory/polymarket/log-only/log-only-YYYY-MM-DD.jsonl
Validates required fields from openclaw-polymarket-log-only-spec-and-env.md (log-only-v1).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

REQUIRED_KEYS = (
    "schema_version",
    "ts_utc",
    "run_id",
    "mode",
    "source",
    "market_ref",
    "side",
    "action",
    "quote_basis",
    "price_ref",
    "size_usdc_hypothetical",
    "rationale_short",
    "confidence_1_10",
    "kill_criteria_ref",
)


def default_log_dir() -> Path:
    override = os.environ.get("POLY_LOG_ONLY_DIR", "").strip()
    if override:
        return Path(override).expanduser()
    return Path.home() / ".openclaw/workspace/memory/polymarket/log-only"


def validate_row(obj: dict) -> None:
    missing = [k for k in REQUIRED_KEYS if k not in obj]
    if missing:
        raise ValueError(f"缺少必填欄位: {missing}")
    if obj.get("schema_version") != "log-only-v1":
        raise ValueError("schema_version 必須係 log-only-v1")
    if obj.get("mode") != "log_only":
        raise ValueError("mode 必須係 log_only")
    if not isinstance(obj.get("market_ref"), dict):
        raise ValueError("market_ref 必須係 object")
    c = obj.get("confidence_1_10")
    if not isinstance(c, int) or not (1 <= c <= 10):
        raise ValueError("confidence_1_10 必須係 1–10 嘅整數")


def sample_row() -> dict:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return {
        "schema_version": "log-only-v1",
        "ts_utc": now,
        "run_id": str(uuid.uuid4()),
        "mode": "log_only",
        "source": "append_log.py",
        "market_ref": {"slug": "replace-with-real-slug"},
        "side": "N/A",
        "action": "observe_only",
        "quote_basis": "clob_midpoint",
        "price_ref": None,
        "size_usdc_hypothetical": 0,
        "rationale_short": "範例行；請用真實決策取代。",
        "confidence_1_10": 5,
        "kill_criteria_ref": "inline:未設定",
        "spread_bps": None,
        "http_status": None,
        "error": None,
        "policy_flags": {"playbook_autotrade_banned": True},
    }


def load_dotenv_if_present() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.is_file():
        return
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(env_path)


def main() -> int:
    load_dotenv_if_present()
    p = argparse.ArgumentParser(description="Append one log-only NDJSON row.")
    p.add_argument("--sample", action="store_true", help="寫入一條範例（可再手改當日檔）")
    p.add_argument("--stdin", action="store_true", help="從 stdin 讀單行 JSON")
    args = p.parse_args()

    log_dir = default_log_dir()
    log_dir.mkdir(parents=True, exist_ok=True)

    if args.sample:
        row = sample_row()
    elif args.stdin:
        raw = sys.stdin.read().strip()
        if not raw:
            print("stdin 空", file=sys.stderr)
            return 1
        row = json.loads(raw)
    else:
        p.print_help()
        print("\n請用 --sample 或 --stdin", file=sys.stderr)
        return 1

    validate_row(row)
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out = log_dir / f"log-only-{day}.jsonl"
    line = json.dumps(row, ensure_ascii=False, separators=(",", ":"))
    with out.open("a", encoding="utf-8") as f:
        f.write(line + "\n")
    print(str(out))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, json.JSONDecodeError) as e:
        print(str(e), file=sys.stderr)
        raise SystemExit(1)
