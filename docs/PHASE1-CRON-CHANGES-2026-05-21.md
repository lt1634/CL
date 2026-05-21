# Phase 1 已套用（2026-05-21）

> Tim 要求：刪除審閱包「搞錢 3 步」；執行外部審閱 Phase 1。

## Telegram 推送（目標：每日主動 3–4 次）

| 時間 | 變更 |
|------|------|
| **03:00** | `overnight-content-pipeline` → **只跑腳本，`deliver: local`**（唔再推 Telegram） |
| **08:00** | `梅窩晨報（三合一）` → 合併 Top 3 + summary + 世界 [P0]/機會 |
| **08:15** | OpenClaw `world-opportunity-scan-001` → **已停用** |
| **13:00** | Hermes 午後 Research → **不變** |
| **12:10 / 20:10** | LaunchAgent content-digest → **不變**（純腳本） |
| **14:00** | OpenClaw 午間 world scan → **已停用** |
| **21:00** | World evening digest → **仍跑，但 `delivery: none`**（只寫檔） |
| **21:30** | `睡前回顧（GEPA+晚報）`（原 20:20 GEPA）→ 合併晚報精華 + 靈魂拷問 |

## OpenClaw

- **JUMP 掃描**：prompt 加「登入牆禁止假完成」規則
- **content-digest-hybrid-001**：此前已 `enabled: false`（LaunchAgent 負責）

## Hermes

- **每日回顧** → 改名排程 **21:30**，prompt 見 `~/.hermes/cron/jobs.json` id `29c6a7fc5057`

## 審閱包

- `TIM-AI-AGENT-REVIEW-PACK-2026-05-21.md` 已移除「搞錢 Phase 1」任務與章節

## 生效

Gateway / cron scheduler 通常會自動重讀 `jobs.json`；若未見新排程，執行：

```bash
# Hermes gateway 重啟（擇一）
hermes gateway restart

# OpenClaw 若用 launchd，視你平時重啟方式
```

## Watchdog 修復（2026-05-21 晚）

- 停用重複 **agentTurn** cron：`memory-qmd`、`overnight-compact`、`daily-self-improvement`、`content-digest-hybrid`、`memory-cron-watchdog`（改 LaunchAgent + 純 Python watchdog）
- 新增 LaunchAgent：`ai.openclaw.overnight-compact`、`ai.openclaw.daily-self-improvement`
- 修 `content-digest-hybrid-launchd.sh`：`openclaw` PATH（`command not found`）
- Watchdog 唔再睇已停用 cron 嘅舊 `error` 狀態；改查 LaunchAgent log
- 已 reset `memory-watchdog-state.json`；**唔再經 LLM 發 Telegram**（避免假警報）

## 未做（Phase 2）

- OpenClaw Telegram 全面靜音
- World ingest 改 06:00
- memory watchdog 全改 LaunchAgent
