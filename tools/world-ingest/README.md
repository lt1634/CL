# world-ingest

本機世界層 RSS 抓取與 OpenClaw 同步。

## 快速開始

```bash
cd ~/Desktop/CL
./tools/world-ingest/install-all.sh
```

每日速查：`memory/kb/world/QUICKSTART.md`

## 腳本

| 腳本 | 用途 |
|------|------|
| `fetch_feeds.py` | RSS ingest → events + `staging/feed_health.json` + `ingest-summary`（`--force` 略過去重） |
| `world-doctor.sh` / `world-doctor.py` | 檢查 feed 成功率、WORLD_STATE 新鮮度、pipeline → `staging/doctor-report.json` |
| `sync-to-workspace.sh` | 複製 KB → workspace；初始化 pipeline state；symlink project-state |
| `install-world-cron.sh` | 合併 `world-cron-jobs.json` 到 `jobs.json`（解析 `OPENCLAW_TELEGRAM_TO`）並重啟 gateway |
| `resolve-cron-delivery.mjs` | 把 `__OPENCLAW_TELEGRAM_TO__` 換成 `~/.openclaw/.env` 值 |
| `world-cron-jobs.json` | 世界層 cron 定義（ingest / scan / digest / weekly）；repo 內無真實 chat id |
| `install-all.sh` | sync + ingest + state + cron + qmd |
| `update_world_state.py` | 從 events 更新 WORLD_STATE |
| `record_feedback.py` | 記錄用戶 feedback |
| `chroma_index.py` | 可選 Chroma（Phase 4a） |
| `plur_export_high_confidence.py` | PLUR 匯出 |
| `ensure-qmd-path.mjs` | QMD 路徑 |
| `scan-preflight.py` | L1 preflight（ingest、`--afternoon`、`--exit-code`） |
| `evening-digest-prompt.md` | 晚報 agent 模板（KB） |

## 環境變數

- `OPENCLAW_WORLD_DIR` — 預設 `~/.openclaw/workspace/memory/world`
- `OPENCLAW_TELEGRAM_TO` — 合併 cron 時必填（Telegram user id，與 allowlist 一致）；放 `~/.openclaw/.env`

## 成本

- `fetch_feeds.py`：免費（HTTP only）
- cron：OpenClaw LLM token（見 `memory/kb/openclaw-world-awareness-setup.md`）
