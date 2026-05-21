#!/usr/bin/env bash
# World-layer RSS ingest (no LLM). Called by world-ingest-morning / evening cron.
set -euo pipefail
CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$CL_ROOT"
echo "Morning world ingest — $(date '+%Y-%m-%d %H:%M %Z')"
python3 tools/world-ingest/fetch_feeds.py "$@"
python3 tools/world-ingest/update_world_state.py
bash tools/world-ingest/world-doctor.sh || true
if python3 -c "import chromadb" 2>/dev/null; then
  python3 tools/world-ingest/chroma_index.py || true
fi
echo "OK world morning ingest $(date +%Y-%m-%dT%H:%M:%S%z)"
