# Agent / Cron 狀態頁 — 用法

**腳本**：`CL/agent-status-page.mjs`  
**輸出**：`CL/docs/agent-status.html`（可在瀏覽器打開）

---

## 點用

```bash
cd /Users/timnewmac/Desktop/CL
node agent-status-page.mjs
```

然後用瀏覽器打開 `docs/agent-status.html`（或 `open docs/agent-status.html`）。

---

## 自訂路徑

- **jobs 來源**：預設讀 `~/.openclaw/cron/jobs.json`  
  `CRON_FILE=/path/to/jobs.json node agent-status-page.mjs`
- **輸出檔**：預設 `docs/agent-status.html`  
  `OUT=/path/to/status.html node agent-status-page.mjs`

---

## 頁面顯示咩

| 欄位 | 說明 |
|------|------|
| Job | 名稱 + id |
| 排程 | cron expr (時區) 或 every Xm |
| 啟用 | ✓ / — |
| 上次跑 | 時間 (Asia/Hong_Kong) |
| 狀態 | ok / error / skipped 等 |
| 耗時 | 秒數 |
| 送達 | lastDeliveryStatus |
| 錯誤 | lastError（若有） |

狀態用顏色：綠 ok、紅 error、黃 warn。

---

## 定時更新（可選）

若想每日自動更新狀態頁，可加一條 cron：用 `exec` 跑  
`cd /Users/timnewmac/Desktop/CL && node agent-status-page.mjs`  
例如每朝 7:00，寫入 `docs/agent-status.html`，你開 file 或用簡單 local server 睇。
