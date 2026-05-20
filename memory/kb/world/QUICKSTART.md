# 世界模型 — 每日指令速查

> 完整說明：`docs/WORLD_MODEL_PROJECT.md`

## 一鍵

```bash
cd ~/Desktop/CL
./tools/world-ingest/install-all.sh          # 首次
node tools/world-ingest/apply-digest-schedule.mjs
bash tools/world-ingest/morning-world-ingest.sh
bash tools/world-ingest/world-doctor.sh
```

## 日常手動

| 動作 | 指令 |
|------|------|
| 晨間 ingest | `bash tools/world-ingest/morning-world-ingest.sh` |
| 健檢 | `bash tools/world-ingest/world-doctor.sh` |
| 只抓 RSS | `python3 tools/world-ingest/fetch_feeds.py` |
| 測試略過去重 | `python3 tools/world-ingest/fetch_feeds.py --force` |
| 更新 P0 | `python3 tools/world-ingest/update_world_state.py` |
| L1 可否掃 | `python3 tools/world-ingest/scan-preflight.py` |
| 午間 preflight | `python3 tools/world-ingest/scan-preflight.py --afternoon --exit-code` |
| 同步 KB → workspace | `./tools/world-ingest/sync-to-workspace.sh` |
| 回饋 | `python3 tools/world-ingest/record_feedback.py useful <topic_id> "note"` |

## 手動跑 cron

```bash
cd ~/Desktop/CL/openclaw
node openclaw.mjs cron run world-digest-evening-001 --expect-final --timeout 120000
node openclaw.mjs cron run world-opportunity-scan-001 --expect-final --timeout 120000
```

## 運行態路徑

| 檔 | 路徑 |
|----|------|
| Events | `~/.openclaw/workspace/memory/world/events/YYYY-MM-DD.jsonl` |
| WORLD_STATE | `~/.openclaw/workspace/memory/world/WORLD_STATE.md` |
| Feed 健康 | `.../staging/feed_health.json` |
| Doctor | `.../staging/doctor-report.json` |
| Preflight | `.../staging/scan-warranted-YYYY-MM-DD.json` |
| Ingest 摘要 | `.../staging/ingest-summary-YYYY-MM-DD.json` |
| Brave 回退建議 | `.../staging/brave-fallback-hints-YYYY-MM-DD.json` |

## HKT 排程摘要

| 時間 | Job |
|------|-----|
| 07:30 | world-ingest-morning |
| 08:15 | world-opportunity-scan（先 preflight） |
| 14:00 | world-opportunity-scan-afternoon |
| 21:00 | world-digest-evening 🌍 |
| 週日 08:30 | world-opportunity-weekly |
| 週日 08:45 | world-consolidate-weekly |
| 週日 09:15 | world-reflection-weekly |

## 常見現象

- `new_events: 0` → 7 日去重正常；用 `--force` 測試
- `filtered_count` 高 → hk 關鍵字過濾正常
- preflight `Skipped` → 慳 token，非故障
