# OpenClaw / Hermes 週檢短報（2026-05-22）

依據 heartbeat 輕量、cron isolated、MEMORY 分層 + compaction flush、敏感資料 env/allowlist。

---

## 已落地（CL repo）

### 1. 移除 hardcoded Telegram delivery（Medium）

- `tools/world-ingest/world-cron-jobs.json`：`to` → `__OPENCLAW_TELEGRAM_TO__`
- `resolve-cron-delivery.mjs` + `merge-world-cron.mjs`：合併時從 `~/.openclaw/.env` 讀取
- `CRON-API-FORMAT.md`：範例改 placeholder

**本機**：在 `~/.openclaw/.env` 設 `OPENCLAW_TELEGRAM_TO=<allowlist 內 user id>`，再跑 `tools/world-ingest/install-world-cron.sh`。

### 2. Compaction 後恢復（Medium）

- 新增 `WORKFLOW_AUTO.md`（main / sba 模板）
- `AGENTS.md`：啟動第 1 步讀 `WORKFLOW_AUTO.md`
- `ops/openclaw/compaction-recommended.json`：`memoryFlush` 範本

**本機**：合併 snippet 到 `~/.openclaw/openclaw.json` 的 `agents.defaults.compaction`；把 `WORKFLOW_AUTO.md` 複製到各 agent workspace 根目錄。

### 3. 收斂 cron / heartbeat / Hermes（Medium）

- `budget-limits.json`：`on_budget_exceeded` → `skip_optional_llm_scans_digest_continues` + `optional_l1_scans_enabled`
- `scan-preflight.py`：讀 budget／`budget-exceeded.flag`，阻擋 optional L1 scan
- `HEARTBEAT.md`：已訂 2–4 項、lightContext、不外發（模板維持）
- `hermes-b-track-guardrails.md`：B 軌邊界

---

## 仍建議本機手動

| 項 | 動作 |
|----|------|
| 純 exec cron | 長腳本改 LaunchAgent / shell，減 `agentTurn` timeout |
| 超預算 | `touch ~/.openclaw/workspace/memory/world/staging/budget-exceeded.flag` 或設 `optional_l1_scans_enabled: false` |
| JUMP 登入 | OpenClaw 瀏覽器 profile 登入後 `openclaw cron run 790804a3-…` |
| Hermes keys | `~/.hermes/.env` 補 OpenRouter / 測試 bot token |

---

## 原則對照

| 原則 | 狀態 |
|------|------|
| HEARTBEAT 輕量 | 模板 OK；config 可加 `lightContext: true` |
| Cron isolated | world jobs 已 `sessionTarget: isolated` |
| MEMORY 分層 + flush | WORKFLOW_AUTO + memoryFlush snippet |
| 秘密不入 repo | Telegram to 改 placeholder ✅ |
