# Company board-writer（單一寫入代理）

避免多 Agent 直接寫 `company-board.jsonl` 造成 `locked_by`／狀態 race。流程：**各 agent → `sessions_send` → Albert → 呼叫本工具 append**。

## 用法

```bash
# 環境變數
export COMPANY_BOARD_FILE="$HOME/.openclaw/workspace/company-board.jsonl"

# 單次：從 stdin 讀一行 JSON（唔含換行則整段當一行）
echo '{"type":"evidence","task_id":"T1","actor":"lt1634","summary":"test"}' | node board-writer.mjs

# 單次：命令行 JSON 字串
node board-writer.mjs append '{"type":"state_set","task_id":"T1","actor":"albert","state":"working","owner":"lt1634","summary":"go"}'

# 本機 HTTP（預設 127.0.0.1:8765，只 bind localhost）
node board-writer.mjs serve
# POST /append  Content-Type: application/json  body = 一個事件 object
# GET  /health
```

會自動補上 `seq`（ULID-like）同 `ts`（若你未提供）。

## 鎖

使用同目錄 `company-board.jsonl.lock`（`wx` 建立，寫完 unlink）。超時預設 30s。

## 輪替

```bash
COMPANY_BOARD_FILE=/path/board.jsonl node rotate-board.mjs
```

將「當前檔」按 **今日日期** 改名為 `company-board-YYYY-MM-DD.jsonl`，再觸碰空的新 `company-board.jsonl`（或由你指定 `COMPANY_BOARD_FILE`）。適合 cron 每日 00:00。

## OpenClaw 接入

在 Albert 嘅 `AGENTS.md` 寫明：收到其他 agent 嘅 board 請求後，組裝 JSON 再執行：

`echo '<json>' | node /path/to/CL/tools/company-board-writer/board-writer.mjs`

（或用 `serve` + `curl -X POST localhost:8765/append -d @payload.json`）
