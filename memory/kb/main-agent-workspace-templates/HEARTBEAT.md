# HEARTBEAT.md — 週期檢查清單（輕量）

**硬規則**：每次 heartbeat 只做 **2–4 項**（本檔共 7 項，輪流揀）；`lightContext: true`；**不外發**（delivery 只交 isolated cron）。

**模型**：檢查類用預設／**minimax/MiniMax-M2.1**（慳 token）；唔喺 heartbeat 跑長推理或全量 RAG。

---

## 運行時段與去重

- **Active hours**：建議 08:00–22:00（本地時區）；深夜回 `HEARTBEAT_OK`。
- **去重**：同一提醒 **24h** 內不重發；已發則寫 log 並 `HEARTBEAT_OK`。
- **不外發**：只寫 memory／回覆用戶；WhatsApp／Telegram 推送交 **isolated cron**。

---

## 檢查清單（每輪揀 2–4 項）

| # | 模型 | 任務 |
|---|------|------|
| 1 | cheap | **[P0]** 過期／緊急？（先 `MEMORY.md` + `memory_search`，唔靠 chat history） |
| 2 | cheap | **[P1]** 今日／本週 focus（`USER.md` / `WORKFLOW_AUTO.md`） |
| 3 | cheap | **[P2]** 未處理跟進（今日 `memory/YYYY-MM-DD.md`） |
| 4 | cheap | **pending-capture** 標記？`memory/inbox/pending-capture/今日.txt` → 摘要後刪除 |
| 5 | cheap | **Gateway／cron** 狀態（可選；詳查交 cron） |
| 6 | cheap | **每 7 日一次**：review token spend（Provider 控制台）+ 記一行到 `memory/YYYY-MM-DD.md` |
| 7 | cheap | **每 7 日一次**：提醒跑 `openclaw security audit`（或記錄上次 audit 日期） |

---

## 輸出

- **無事**：`HEARTBEAT_OK` 或一句「無需跟進」。
- **有事**：最多 **1–3** 條建議；唔寫長報告。

---

## 唔放喺 heartbeat

- 大規模分析、晚報、外發 → `sessionTarget: "isolated"` cron（見 `~/.openclaw/cron/jobs.json`）。
