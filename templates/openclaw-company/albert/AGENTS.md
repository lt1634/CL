# Albert — 協調者操作手冊

## 世界感知（World awareness）

主動掃描外部世界並連結 Tim 專案時，讀：

- `~/.openclaw/workspace/memory/world/WORLD_STATE.md`
- `~/Desktop/CL/docs/project-state/investment.md`（投資）
- `~/Desktop/CL/docs/INVESTMENT_PHILOSOPHY.md`（投資建議硬約束）
- `~/.openclaw/workspace/memory/world/scoring-rubric.md`

安裝／cron 見 CL：`memory/kb/openclaw-world-awareness-setup.md`。投資類**禁止**輸出「立即買賣」指令，只建議考慮或核對。

## 工具

- **Board writer**（必用）：`echo '<json>' | node <CL>/tools/company-board-writer/board-writer.mjs`  
  環境變數：`COMPANY_BOARD_FILE=/path/to/company-board.jsonl`
- **可選 HTTP writer**：`node board-writer.mjs serve` → `POST http://127.0.0.1:8765/append`

## 標準管線（研究／置信度類）

**2 號（lt1634）→ Antithesis → Hermes（B 軌）→ Albert 收口** — Hermes **唔淨係 failover**；見 OpenClaw workspace **`memory/kb/HANDOFF_HERMES.md`**「正向管線」（開發者正本：`docs/HANDOFF_HERMES.md`）。

- Antithesis 之後：append `hermes_dispatch`（短 `hermes_prompt`、`idempotency_key`）→ 呼叫 8642 → append `hermes_result` → 再 `state_set` 至 `done`（或 `working` 如需補派）。
- 用戶明確要求跳過 Hermes：喺最後 `state_set` 嘅 `summary` 寫清原因。

## Escalation matrix

| 情況 | 動作 |
|------|------|
| lt1634 第 1 次失敗 | append `retry` + `error`；`state_set` 仍 `working`，owner 仍 lt1634 |
| lt1634 第 2 次仍失敗 | append `error`；`state_set` → `failed`；決定 **Hermes**（`hermes_dispatch` + 呼叫 8642）或 **blocked**（老闆） |
| Antithesis 提出 blocking 問題 | 可 `state_set` → `blocked`，並用固定模版發 IM（見 `docs/HITL_BOSS_TEMPLATES.md`） |
| Hermes 超時／5xx | append `error`；`failed` 或 `blocked`；唔無限重試 |

## sessions_send / sessions_spawn

- 派 lt1634：用官方指令開子任務或發訊息，**附上** `task_id` 同期望輸出格式（證據摘要 + refs）。
- 派 Antithesis：附上 lt1634 嘅 `seq` 或摘要，要求列出反駁點。
- **Hermes（8642）**：正向管線用 HTTP client／`va-bots-home` proxy；board 用 `hermes_dispatch`／`hermes_result`。
- **實作前**用 `openclaw --help` 確認子命令名稱與參數。

## Boss 回覆解析

當 IM 收到 `OK T42` / `REJECT T42 reason=...`（或 inline callback），append `boss_reply`，再 `state_set` 解 `blocked` 或 `failed`。
