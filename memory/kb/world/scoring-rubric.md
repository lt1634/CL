# 世界機會評分規則

## 分數

| 維度 | 0–100 | 說明 |
|------|-------|------|
| `relevance_score` | 對 Tim 相關度 | 連結 `linked_projects`、MEMORY、project-state |
| `confidence` | 來源可靠度 | 官方 > 主流媒體 > 社交謠傳 |

## Tim 機會畫像（必讀）

**`memory/kb/world/tim-opportunity-profile.md`** — 定義咩係「對 Tim 嘅機會」：本地、梅窩、展覽、豆豆、教學、合作，唔止投資 macro。

## 領域加權

| domain | 加權提示 |
|--------|----------|
| `local` | 梅窩、大嶼山、離島、社區、親子、佛行 — **最高生活相關** |
| `hk` | 政策、康文署、教育、視藝展覽、T58/LCSD |
| `creative-ip` | 寫入 opportunity 時標 `linked_projects: doudou` |
| `investment` | 必讀 `INVESTMENT_PHILOSOPHY.md`；禁止「立即買賣」 |
| `tech-ai` | OpenClaw/Hermes/MindForge 工作流 |

**晚報／即時推比例：** 投資 ≤40%；本地+文化+創意 ≥40%。

## 通知（平衡模式）

| 條件 | 動作 |
|------|------|
| relevance ≥ 70 且 confidence ≥ 60，24h 內未推 `topic_id` | Telegram 即時 |
| relevance 40–69 | 僅 evening digest |
| relevance < 40 | 只寫 jsonl，不推送 |

## Aggressive mode（2026）

MiniMax 配額約 **4–5 小時 reset**；世界層改為用盡額度，唔關 opportunity scan。

| 變更 | 說明 |
|------|------|
| L1 scan | **08:15 + 14:00** 各跑（晨間最多 3 條、午間最多 2 條 opportunity） |
| 晨間 ingest | 07:30 exec + **LLM 策展** WORLD_STATE [P0] |
| 晚報 | 21:00 可用 **Brave**（見 `budget-limits.json`）；可補寫最多 5 條 opportunity |
| 即時推門檻 | **不變**（仍 ≥70 / ≥60） |
| 超限 | `on_budget_exceeded: continue_scans_and_digest_no_disable` |

## Hermes L2 觸發

- relevance ≥ 80，或 confidence < 70 且涉及投資/政策承諾

## Feedback

Telegram 回「有用」「忽略」「錯」→ append `world/feedback.jsonl`，週日 reflection 調權重。

```bash
python3 ~/Desktop/CL/tools/world-ingest/record_feedback.py ignore "<topic_id>" "太噪音"
python3 ~/Desktop/CL/tools/world-ingest/record_feedback.py useful "<topic_id>"
```

## 自動調整

（`world-reflection-weekly-001` 會喺此區 append 建議，唔手改 HEARTBEAT。）
