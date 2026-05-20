#!/usr/bin/env bash
# Health checks for world layer (feed health, WORLD_STATE, pipeline state).
set -euo pipefail
CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WS="${OPENCLAW_WORLD_DIR:-$HOME/.openclaw/workspace/memory/world}"
export OPENCLAW_WORLD_DIR="$WS"
STAGING="$WS/staging"
mkdir -p "$STAGING"

python3 "$CL_ROOT/tools/world-ingest/world-doctor.py" --workspace "$WS" "$@"
