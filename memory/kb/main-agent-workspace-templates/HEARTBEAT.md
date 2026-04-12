# HEARTBEAT.md — 週期檢查清單（輕量）

（每次 heartbeat 只跑 **2–4 個** 檢查，保持輕量、省 token。重任務交給 isolated cron。）

---

## 運行時段與去重（硬規則）

- **時區與 active hours**：提醒／推送以本地時區為準；可設定只喺工作時段（例如 08:00–22:00）跑提醒，避免深夜噪音。
- **去重/節流**：同一提醒 **N 小時內不重發**（建議 N=24）；若已喺過去 N 小時內推送過，寫入 memory 或 log 備查，回覆 `HEARTBEAT_OK` 即可。
- **只做判斷不做外發**：heartbeat **只產生待辦或建議**（寫入 memory / 回覆用戶）；**對外發送**（WhatsApp、Slack、email）交 **isolated cron**，唔在 heartbeat 內 call message/send。
- 重任務仍交 **isolated cron**，唔塞入 heartbeat。

**可選（成本保護）**：config 可設 `lightContext: true`、heartbeat 間隔接近 cache TTL，降低 token 成本。

---

## 每次只做 2–4 項（輪流或揀最相關）

- [ ] **P0**：有冇過期/緊急事項要提醒用戶？（睇 memory 或 USER 備註）
- [ ] **P1**：今日/本週 focus 有冇更新？（USER.md / FOCUS.md）
- [ ] **P2**：有冇未處理嘅用戶請求或跟進？（sessions / memory 近期）
- [ ] **P2**：有冇「待補做 capture」標記？（cron 只 queue，連返 main 先做）
  - 標記路徑（建議）：`~/.openclaw/workspace/memory/inbox/pending-capture/YYYY-MM-DD.txt`
  - 若存在：
    - 以 **main session** 讀 `agent:main:main` 今日對話 history（例如 `sessions_history`），做一份「今日摘要 / 決策 / 待辦」寫入 `memory/YYYY-MM-DD.md`
    - 成功後刪除該標記檔（避免重複跑）
- [ ] **P2**：gateway / cron 狀態正常？（可選，或交俾專門 cron）

---

## 輸出規則

- **無事**：回覆 `HEARTBEAT_OK` 或一句「無需跟進」即可，唔好長篇。
- **有事**：簡短列出 1–3 項建議動作，唔好展開成段文。

---

## 重任務唔放喺 heartbeat

- 大規模分析、長 report、定時發送（WhatsApp/Slack）→ 用 **isolated cron**，唔好塞入主會話 heartbeat。
- 參考：`~/.openclaw/cron/jobs.json`，`sessionTarget: "isolated"` 做重嘢。
