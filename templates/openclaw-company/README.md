# OpenClaw「一人公司」三 Agent 範本（Albert / Antithesis / lt1634）

將以下內容複製到你本機 OpenClaw 各 agent 嘅 workspace（路徑以 `openclaw --help` 同你 `openclaw.json` 為準；常見為 `~/.openclaw/agents/<id>/` 或 workspace 分目錄）。

## 建立步驟（示例）

```bash
# 指令名以你安裝版本為準，例如：
# openclaw agents add albert
# openclaw agents add antithesis
# openclaw agents add lt1634_research_exec
```

然後把本目錄 `albert/`、`antithesis/`、`lt1634/` 內對應檔案 **合併或覆寫** 到各 agent 嘅工作區根目錄。

## 通信（必核對官方）

實作前請執行 **`openclaw --help`** 並查 [OpenClaw docs](https://docs.openclaw.ai) multi-agent 章節，確認下列名稱是否仍適用：

- `sessions_send` — 向現有 session 傳訊（帶上下文）
- `sessions_spawn` — 開子任務 session
- `session_status` — 查狀態（若有）

## 任務板寫入

**唔好**由各 agent 直接寫 `company-board.jsonl`。請 **`sessions_send` 交 Albert**，由 Albert 呼叫 repo 內：

`tools/company-board-writer/board-writer.mjs`

（見該目錄 README；設定 `COMPANY_BOARD_FILE`。）

## Hermes B 軌

長工具鏈交 Hermes；**唔共用** OpenClaw 嘅 Telegram bot token。見 OpenClaw **`memory/kb/HANDOFF_HERMES.md`**（repo：`docs/HANDOFF_HERMES.md`）、`memory/kb/openclaw-b-track-hermes-checklist.md`。
