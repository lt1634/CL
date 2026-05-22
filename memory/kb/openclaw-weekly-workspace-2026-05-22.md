# OpenClaw Workspace + Hermes 週檢（2026-05-22）

三項改善已落地到 **CL repo 模板 + ops 腳本**；本機 `~/.openclaw` 需執行一次 setup。

---

## 1. 分層記憶（Tiered Memory）

| 狀態 | 說明 |
|------|------|
| ✅ 本機 | `MEMORY.md` 53 行；`includeDefaultMemory: false`；qmd 已用 `qmd-root` + `kb`（唔索引根目錄 daily） |
| ✅ Repo | `archive-daily-logs.sh`、`setup-memory-tiered.sh`、`memory-qmd-recommended.json` |
| ✅ 本機 | 已跑 setup；**25** 個 daily → `archive/dailies/`；`--apply-qmd` 已套用（5 paths） |
| ✅ Cron | `memory-weekly-janitor-001` 週一 09:00 已入 `jobs.json` |

```bash
chmod +x ~/Desktop/CL/ops/openclaw/setup-memory-tiered.sh
~/Desktop/CL/ops/openclaw/setup-memory-tiered.sh
# 確認後：
~/Desktop/CL/ops/openclaw/setup-memory-tiered.sh --apply-qmd
openclaw gateway restart
```

---

## 2. Model Fallbacks + HEARTBEAT

| 狀態 | 說明 |
|------|------|
| ✅ 本機 | fallbacks：`M2.1` → OpenRouter Gemini Flash → Moonshot Kimi；`heartbeat.lightContext: true` |
| ✅ Repo | `model-fallbacks-recommended.json` |
| ✅ Repo | `HEARTBEAT.md`：2–4 項／模型 hint／每 7 日 token + security 檢查 |

手動合併 `agents.defaults.model.fallbacks` 後重啟 Gateway；heartbeat 設 `lightContext: true`（若尚未）。

---

## 3. AGENTS.md 安全與記憶紀律

| 狀態 | 說明 |
|------|------|
| ✅ Repo | main + sba `AGENTS.md`：`memory_search` 優先、credentials 路徑、audit --fix |
| ✅ 本機 | `AGENTS.md` / `HEARTBEAT.md` / `WORKFLOW_AUTO.md` 已同步到 workspace |

```bash
cp ~/Desktop/CL/memory/kb/main-agent-workspace-templates/AGENTS.md ~/.openclaw/workspace/
cp ~/Desktop/CL/memory/kb/main-agent-workspace-templates/HEARTBEAT.md ~/.openclaw/workspace/
cp ~/Desktop/CL/memory/kb/main-agent-workspace-templates/WORKFLOW_AUTO.md ~/.openclaw/workspace/ 2>/dev/null || true
```

---

## 驗證

```bash
openclaw security audit --deep
~/Desktop/CL/ops/openclaw/harden-openclaw.sh
~/Desktop/CL/ops/dual-star/doctor.sh
```

**Hermes**：B 軌見 `hermes-b-track-guardrails.md`；唔共用 OpenClaw `MEMORY.md` 全量 import。
