# OpenClaw 世界感知層 — 安裝與成本

**與 Hobby digest / Hermes 整合：** 見 [digest-rss-architecture.md](digest-rss-architecture.md)。

## 一鍵安裝

```bash
cd ~/Desktop/CL
chmod +x tools/world-ingest/*.sh
./tools/world-ingest/sync-to-workspace.sh
python3 tools/world-ingest/fetch_feeds.py
./tools/world-ingest/install-world-cron.sh
```

## Cron jobs（合併後）

| id | 排程 | 用途 |
|----|------|------|
| `world-ingest-morning-001` | 07:30 HKT | RSS + `update_world_state.py` |
| `world-opportunity-scan-001` | 08:15 HKT | L1 評分 + 高優先 Telegram |
| `world-opportunity-scan-afternoon-001` | 14:00 HKT | 午間 L1（≤2 條） |
| `world-digest-evening-001` | 21:00 HKT | 晚間摘要 Telegram |
| `world-consolidate-weekly-001` | 週日 08:45 | 週整合 WORLD_STATE |
| `world-reflection-weekly-001` | 週日 09:15 | rubric/feedback 反思 |

一鍵：`./tools/world-ingest/install-all.sh`

關閉某 job：編輯 `~/.openclaw/cron/jobs.json` 的 `enabled`，重啟 gateway。

手動跑：

```bash
cd ~/Desktop/CL/openclaw && node openclaw.mjs cron run world-digest-evening-001 --expect-final --timeout 120000
```

## QMD

確認 `~/.openclaw/openclaw.json` 的 `memory.qmd` paths 包含 `memory/kb/world` 或 symlink（`sync-to-workspace.sh` 會建 `workspace/memory/kb/world` → CL）。

## 成本（要用錢嘅部分）

| 項目 | 費用 |
|------|------|
| `fetch_feeds.py` | 免費 |
| `world-digest-evening` cron | MiniMax token（每日 1 次中等 prompt） |
| `world-opportunity-scan` | +即時推送時更多 token |
| Brave search（cron 內 web_search） | 按 Brave 方案；MVP 可只靠 RSS |
| Hermes 8642 L2 | 僅高價值機會；可選 |

**Aggressive**：全部 world LLM jobs 已開；MiniMax 約 4–5h reset 用盡。回退慳錢：關 scan jobs、改 `apply-digest-schedule` 前備份。

## 工具腳本

| 腳本 | 用途 |
|------|------|
| `fetch_feeds.py` | RSS → events jsonl |
| `update_world_state.py` | 更新 WORLD_STATE [P0] |
| `record_feedback.py` | `有用/忽略/錯` → feedback.jsonl |
| `chroma_index.py` | 可選向量索引（需 chromadb） |
| `plur_export_high_confidence.py` | 高置信事實 → plur-export.md |
| `ensure-qmd-path.mjs` | 加入 QMD world 路徑 |

## Feedback（Telegram 回覆後人手）

```bash
python3 tools/world-ingest/record_feedback.py ignore "topic-id-here" "原因"
```

## 檔案索引

- 規格：`memory/kb/world/README.md`
- Schema：`schemas/world_event.schema.json`、`schemas/opportunity.schema.json`
- 評分：`memory/kb/world/scoring-rubric.md`
- 預算：`memory/kb/world/budget-limits.json`
