#!/usr/bin/env bash
# 在倉庫根目錄跑：normalize → EVENTS_ALL.md → YEAR_REMINDERS.md
# 用法：bash tools/ga-ingest/run_postprocess.sh
#       bash tools/ga-ingest/run_postprocess.sh --ahead-days 90
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
python3 tools/ga-ingest/normalize_event_dates.py
python3 tools/ga-ingest/emit_events_md.py
python3 tools/ga-ingest/emit_year_reminders.py "$@"
