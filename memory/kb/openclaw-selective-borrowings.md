# OpenClaw 主線 + 選擇性借鑑（唔換平台）

**原則**：繼續 **OpenClaw + CL + Hermes B 軌**；從 OpenHuman 等項目只抄**概念**，唔引入第二套 gateway。

---

## 1. Memory Tree 式 auto-fetch → Markdown

| 項目 | 路徑 |
|------|------|
| RSS ingest | `tools/world-ingest/fetch_feeds.py` |
| **每日 Markdown 快照** | `tools/world-ingest/snapshot-to-markdown.py` |
| 輸出 | `~/.openclaw/workspace/memory/world/snapshots/daily-YYYY-MM-DD.md`、`latest.md` |
| 掛鉤 | `morning-world-ingest.sh`（cron 早晨 ingest 後自動跑） |

Agent 讀 **`snapshots/latest.md`** 即可掌握今日世界層摘要，唔使掃完整 jsonl。

---

## 2. Token 壓縮 / janitor

| 項目 | 路徑 |
|------|------|
| 行數守門 | `tools/openclaw-memory-janitor/memory-janitor.sh` |
| 歸檔 daily | `archive-daily-logs.sh` |
| **Token 估算** | `token-estimate.sh` → `~/.openclaw/backup/token-budget.json` |
| 週守門 cron | `memory-weekly-janitor-001` |

---

## 3. 狀態 UI

| 項目 | 路徑 |
|------|------|
| HTML 儀表板 | `agent-status-page.mjs` → `docs/agent-status.html` |
| 一鍵刷新 | `ops/openclaw/refresh-status-dashboard.sh` |

顯示：cron 摘要、錯誤列表、gateway 提示、memory token 預算。

## 一鍵跑齊三件套（A 軌）

```bash
~/Desktop/CL/ops/openclaw/run-a-track-ops.sh all
# 只做快照（唔重新 fetch RSS）：
SKIP_FETCH=1 ~/Desktop/CL/ops/openclaw/run-a-track-ops.sh all
```

可選每日 macOS cron：`install-a-track-ops-cron.sh`（08:05，純 shell）  
可選 OpenClaw isolated cron：`node ops/openclaw/merge-a-track-ops-cron.mjs`（Telegram 兩句摘要）

---

## 唔做

- 唔安裝 OpenHuman 取代 OpenClaw
- 唔把 118 個 OAuth 全接進 main bot
- 唔把 GPL 核心 fork 進 CL

---

## 相關

- **[openhuman-to-cl-10min.md](./openhuman-to-cl-10min.md)** — 10 分鐘對照表（3 功能、操作清單）
- [openclaw-weekly-workspace-2026-05-22.md](./openclaw-weekly-workspace-2026-05-22.md)
- [DUAL-STAR-OPS.md](../../docs/DUAL-STAR-OPS.md)
