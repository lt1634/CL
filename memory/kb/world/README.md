# 世界感知層（World awareness）

Tim 嘅「認識世界」SSOT：投資、香港政策/文化/教育、科技/AI。

## 檔案

| 檔 | 用途 |
|----|------|
| `watchlist.json` | RSS + Brave；每域可設 `require_any` / `exclude_any`（regex） |
| `WORLD_STATE.md` | 熱狀態 ≤150 行 |
| `scoring-rubric.md` | 機會評分與推送門檻 |
| `entities.yaml` | Graph-lite 三元組 |
| `opportunity-pipeline-state.template.json` | cron 共享狀態模板 |

## 本機運行目錄

`WORLD_STATE.md` **只喺 workspace 生成**（`update_world_state.py`）；`sync-to-workspace.sh` **唔會**用 CL 模板覆蓋。

```
~/.openclaw/workspace/memory/world/
  WORLD_STATE.md
  events/YYYY-MM-DD.jsonl
  opportunities/YYYY-MM-DD.jsonl
  feedback.jsonl
  opportunity-pipeline-state.json
  cache/          # Brave/RSS 緩存
```

## 工具

```bash
# 從倉庫根目錄
python3 tools/world-ingest/fetch_feeds.py          # 輸出含 filtered_count
python3 tools/world-ingest/scan-preflight.py      # warranted? → staging/scan-warranted-*.json
./tools/world-ingest/sync-to-workspace.sh
node tools/world-ingest/apply-digest-schedule.mjs
```

**hk 降噪：** `watchlist.json` → `hk.require_any` / `exclude_any`；已移除明報港聞 feed，保留教育/文化/Google News。

設定全文：[openclaw-world-awareness-setup.md](../openclaw-world-awareness-setup.md)
