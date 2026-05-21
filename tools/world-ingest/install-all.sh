#!/usr/bin/env bash
# Full world-awareness setup: sync, ingest, state update, cron merge, qmd
set -euo pipefail

CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$CL_ROOT"

chmod +x tools/world-ingest/*.sh
node tools/world-ingest/ensure-openclaw-cli.mjs
./tools/world-ingest/sync-to-workspace.sh
python3 tools/world-ingest/fetch_feeds.py
python3 tools/world-ingest/update_world_state.py
python3 tools/world-ingest/chroma_index.py || true
./tools/world-ingest/install-world-cron.sh

echo "Done. Jobs: world-ingest-morning, opportunity-scan, digest-evening, consolidate/reflection weekly."
