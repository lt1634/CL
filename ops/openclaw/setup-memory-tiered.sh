#!/usr/bin/env bash
# Bootstrap tiered memory dirs + janitor dry-run (does not overwrite openclaw.json unless --apply-qmd)
set -euo pipefail

CL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WS="${OPENCLAW_WORKSPACE:-$HOME/.openclaw/workspace}"
MEM="${WS}/memory"
APPLY_QMD="${1:-}"

echo "=== OpenClaw tiered memory setup ==="
echo "workspace: $WS"

mkdir -p "${MEM}/archive/dailies" "${MEM}/qmd-root" "${MEM}/kb"
chmod 700 "${HOME}/.openclaw/credentials" 2>/dev/null || true

if [[ ! -f "${WS}/MEMORY.md" ]]; then
  cp "${CL_ROOT}/memory/kb/main-agent-workspace-templates/MEMORY.md" "${WS}/MEMORY.md"
  echo "Created ${WS}/MEMORY.md from template"
fi

if [[ ! -e "${MEM}/MEMORY.md" ]]; then
  ln -sf ../MEMORY.md "${MEM}/MEMORY.md"
  echo "Symlinked memory/MEMORY.md -> ../MEMORY.md"
fi

if [[ ! -e "${MEM}/qmd-root/MEMORY.md" ]]; then
  ln -sf ../MEMORY.md "${MEM}/qmd-root/MEMORY.md"
  echo "Symlinked qmd-root/MEMORY.md"
fi

chmod +x "${CL_ROOT}/tools/openclaw-memory-janitor/"*.sh 2>/dev/null || true

echo ""
echo ">> memory-janitor"
"${CL_ROOT}/tools/openclaw-memory-janitor/memory-janitor.sh" || true

echo ""
echo ">> archive-daily-logs (dry-run)"
DRY_RUN=1 ARCHIVE_DAILY_KEEP_DAYS="${ARCHIVE_DAILY_KEEP_DAYS:-14}" \
  "${CL_ROOT}/tools/openclaw-memory-janitor/archive-daily-logs.sh" || true

if [[ "$APPLY_QMD" == "--apply-qmd" ]]; then
  echo ""
  echo ">> Merging memory.qmd paths (backup openclaw.json first)"
  OPENCLAW_JSON="${HOME}/.openclaw/openclaw.json"
  cp "$OPENCLAW_JSON" "${OPENCLAW_JSON}.bak.$(date +%Y%m%d%H%M%S)"
  OPENCLAW_JSON="$OPENCLAW_JSON" REC="${CL_ROOT}/ops/openclaw/memory-qmd-recommended.json" node -e "
const fs=require('fs');const os=require('os');
const cfg=JSON.parse(fs.readFileSync(process.env.OPENCLAW_JSON,'utf8'));
const rec=JSON.parse(fs.readFileSync(process.env.REC,'utf8'));
const home=os.homedir();
cfg.memory=cfg.memory||{};
cfg.memory.qmd=cfg.memory.qmd||{};
cfg.memory.qmd.includeDefaultMemory=rec.includeDefaultMemory;
cfg.memory.qmd.paths=(rec.paths||[]).map(p=>({
  ...p,
  path:p.path.replace(/^~/,home)
}));
fs.writeFileSync(process.env.OPENCLAW_JSON,JSON.stringify(cfg,null,2)+'\n');
console.log('Updated memory.qmd.paths:',cfg.memory.qmd.paths.length,'entries');
"
  echo "Restart gateway: openclaw gateway restart"
else
  echo ""
  echo "Optional: merge qmd paths from ops/openclaw/memory-qmd-recommended.json"
  echo "  $0 --apply-qmd"
fi

echo ""
echo "Optional: merge cron snippet via install-world-cron or add memory-weekly-janitor-cron.snippet.json"
echo "Optional: merge model fallbacks from ops/openclaw/model-fallbacks-recommended.json"
echo "Done."
