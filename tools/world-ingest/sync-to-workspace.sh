#!/usr/bin/env bash
# Sync CL world KB → ~/.openclaw/workspace/memory/world/
set -euo pipefail

CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WS_WORLD="${OPENCLAW_WORLD_DIR:-$HOME/.openclaw/workspace/memory/world}"
KB="$CL_ROOT/memory/kb/world"

mkdir -p "$WS_WORLD/events" "$WS_WORLD/opportunities" "$WS_WORLD/staging" "$WS_WORLD/cache" "$WS_WORLD/archive"

# WORLD_STATE.md is runtime-generated in workspace — never overwrite from CL template.
for f in scoring-rubric.md entities.yaml watchlist.json README.md budget-limits.json strategy-patterns.md tim-opportunity-profile.md; do
  if [[ -f "$KB/$f" ]]; then
    cp "$KB/$f" "$WS_WORLD/$f"
  fi
done

if [[ -f "$WS_WORLD/WORLD_STATE.md" ]]; then
  backup_dir="$WS_WORLD/archive"
  mkdir -p "$backup_dir"
  ts="$(date -u +%Y%m%dT%H%M%SZ)"
  cp "$WS_WORLD/WORLD_STATE.md" "$backup_dir/WORLD_STATE-pre-sync-${ts}.md"
  echo "Backed up WORLD_STATE.md → archive/WORLD_STATE-pre-sync-${ts}.md"
fi

if [[ ! -f "$WS_WORLD/WORLD_STATE.md" ]]; then
  cp "$KB/WORLD_STATE.md" "$WS_WORLD/WORLD_STATE.md"
  echo "Initialized WORLD_STATE.md from template (first run only)"
fi

if [[ ! -f "$WS_WORLD/opportunity-pipeline-state.json" ]]; then
  cp "$KB/opportunity-pipeline-state.template.json" "$WS_WORLD/opportunity-pipeline-state.json"
fi

touch "$WS_WORLD/feedback.jsonl"

# QMD path for world/
node "$CL_ROOT/tools/world-ingest/ensure-qmd-path.mjs" || true

# Symlink CL project-state into qmd-root if missing
QMD_ROOT="$HOME/.openclaw/workspace/memory/qmd-root"
mkdir -p "$QMD_ROOT"
for ps in investment T58 T56 LCSD; do
  src="$CL_ROOT/docs/project-state/${ps}.md"
  dst="$QMD_ROOT/project-state-${ps}.md"
  if [[ -f "$src" && ! -e "$dst" ]]; then
    ln -sf "$src" "$dst"
    echo "Linked $dst -> $src"
  fi
done

# Symlink world kb for QMD if workspace uses memory/kb
WS_KB="$HOME/.openclaw/workspace/memory/kb/world"
mkdir -p "$(dirname "$WS_KB")"
if [[ ! -e "$WS_KB" ]]; then
  ln -sf "$KB" "$WS_KB"
  echo "Linked $WS_KB -> $KB"
fi

# Hermes L2 verify skill (directory)
HERMES_SKILL="$HOME/.hermes/skills/world-verify"
mkdir -p "$HERMES_SKILL"
if [[ -f "$KB/hermes-world-verify-prompt.md" ]]; then
  cat > "$HERMES_SKILL/SKILL.md" << EOF
---
name: world-verify
description: Verify world/opportunity claims against sources and investment philosophy (Hermes 8642 L2).
version: 1.0.0
metadata:
  hermes:
    tags: [world, investment, verify]
    category: research
---

$(cat "$KB/hermes-world-verify-prompt.md")
EOF
  echo "Updated $HERMES_SKILL/SKILL.md"
fi

if [[ -f "$WS_WORLD/events/$(date -u +%Y-%m-%d).jsonl" ]] || ls "$WS_WORLD/events/"*.jsonl 1>/dev/null 2>&1; then
  python3 "$CL_ROOT/tools/world-ingest/update_world_state.py" || true
fi

echo "Synced world layer to $WS_WORLD"
