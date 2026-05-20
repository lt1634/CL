# Digest 與 RSS 整合架構（OpenClaw + Hermes + 世界層）

> 一頁搞清：邊度抓 feed、邊度出摘要、幾點 Telegram、點樣唔重複。

## 三層分工

| 層 | 負責 | RSS 來源 | 輸出 | 讀者 |
|----|------|----------|------|------|
| **Hobby** | 好奇心／深度內容 | `~/.openclaw/workspace/hobby/collect.mjs`（~30 feeds：FS、AI labs、HN、中文 podcast） | `graded.md`、`overnight-suggestion.md`、`memory/daily-digest-*.md` | Tim 閱讀／學習 |
| **World** | 投資／香港／專案相關 | `memory/kb/world/watchlist.json` → `fetch_feeds.py` | `memory/world/events/*.jsonl`、`WORLD_STATE.md`、`digest-*.md` | Agent + Telegram 🌍 |
| **Hermes 編排** | 系統狀態 + 接力 | 唔抓 RSS（讀 OpenClaw 產物） | 晨報、午後 Research、overnight Top 3 | Telegram |

**原則：** 同一 URL 唔重複登記兩份 watchlist。全球科技 RSS 歸 **Hobby**；**World** 只做 `investment` / `hk` / 專案向 `brave_queries`。

## 一日時間軸（HKT）

```
03:00  Hermes  overnight-content-pipeline
       └─ overnight-build.mjs = collect → triage → grade → overnight-suggestion.md
       └─ Telegram：🏆 Top 3（含約 50 字摘要）

04:31  OpenClaw overnight-app-001（記憶整理／小改進，唔係內容 digest）

07:30  OpenClaw world-ingest-morning-001【exec + LLM 策展 P0】
       └─ morning-world-ingest.sh → fetch_feeds + agent 精簡 WORLD_STATE
       └─ 無 Telegram

08:00  Hermes  雙星系統晨報（讀 summary / project-state，可選讀 WORLD_STATE [P0]）

08:15  OpenClaw world-opportunity-scan-001（L1 ≤3 條；高相關 Telegram）

14:00  OpenClaw world-opportunity-scan-afternoon-001（L1 ≤2 條；午間新 events）

12:00  OpenClaw content-digest-hybrid-001【僅 exec】
20:00  同上（第二轉）
       └─ hobby pipeline + daily-digest-*.md
       └─ Telegram：📰 內容精選

13:00  Hermes  午後 Research（讀 hobby/triage/summary.md，web 補充）

21:00  OpenClaw world-digest-evening-001
       └─ fetch + Brave（≤12/日）+ 粵語 🌍 晚報；可補寫 opportunity
       └─ 可引用當日 daily-digest Top 3（避免重複講同一條）

週日   world-consolidate + world-reflection
```

**已停用（保留 id、勿刪）：** `daily-content-digest`、`content-digestion-collect`（由 hybrid + overnight 取代）。

## 檔案 SSOT

| 用途 | 路徑 |
|------|------|
| Hobby feed 清單 | `~/.openclaw/workspace/hobby/collect.mjs` |
| World feed 清單 | `~/Desktop/CL/memory/kb/world/watchlist.json` |
| World 事件 | `~/.openclaw/workspace/memory/world/events/` |
| Hobby 日 digest | `~/.openclaw/workspace/memory/daily-digest-YYYY-MM-DD.md` |
| World 晚 digest | `~/.openclaw/workspace/memory/world/digest-YYYY-MM-DD.md` |

## Telegram 頻道（同一 chat 時建議標題區分）

- `🏆` / `📰` — Hobby／內容精選（hybrid、overnight）
- `🌍` — 世界層（evening、opportunity 即時）
- `☀️` — Hermes 雙星晨報
- `📊` — Hermes 午後 Research

## Cron 檔案邊度（易混淆）

| 系統 | 路徑 | 內容 |
|------|------|------|
| **OpenClaw** | `~/.openclaw/cron/jobs.json` | world-*、content-digest-hybrid、overnight-app 等 |
| **Hermes** | `~/.hermes/cron/jobs.json` | 雙星晨報、overnight-content-pipeline、午後 Research 等 |

`content-digest-hybrid-001`（12:00 📰）**只會出現喺 OpenClaw**，唔會喺 Hermes jobs.json。

## 安裝／套用排程

```bash
cd ~/Desktop/CL
chmod +x tools/world-ingest/*.sh
node tools/world-ingest/apply-digest-schedule.mjs   # 合併 world cron + hybrid 12:00 + 關 opportunity scan
./tools/world-ingest/sync-to-workspace.sh
```

## 手動一鍵

```bash
# 只更新世界層（你剛跑嘅）
python3 tools/world-ingest/fetch_feeds.py
python3 tools/world-ingest/update_world_state.py

# Hobby + 世界一齊（晨間）
bash tools/world-ingest/morning-world-ingest.sh
cd ~/.openclaw/workspace/hobby && node overnight-build.mjs
```

## Hermes L2

高相關投資／政策機會：evening digest 註明「建議 Hermes 8642」→ `~/.hermes/skills/world-verify/SKILL.md`，唔自動 call。

## 相關

- [openclaw-world-awareness-setup.md](openclaw-world-awareness-setup.md)
- [tools/world-ingest/README.md](../../tools/world-ingest/README.md)
