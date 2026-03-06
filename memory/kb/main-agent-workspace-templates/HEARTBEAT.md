# HEARTBEAT.md — 週期檢查清單（輕量）

（每次 heartbeat 只跑 **2–4 個** 檢查，保持輕量、省 token。重任務交給 isolated cron。）

---

## 每次只做 2–4 項（輪流或揀最相關）

- [ ] **P0**：有冇過期/緊急事項要提醒用戶？（睇 memory 或 USER 備註）
- [ ] **P1**：今日/本週 focus 有冇更新？（USER.md / FOCUS.md）
- [ ] **P2**：有冇未處理嘅用戶請求或跟進？（sessions / memory 近期）
- [ ] **P2**：gateway / cron 狀態正常？（可選，或交俾專門 cron）

---

## 輸出規則

- **無事**：回覆 `HEARTBEAT_OK` 或一句「無需跟進」即可，唔好長篇。
- **有事**：簡短列出 1–3 項建議動作，唔好展開成段文。

---

## 重任務唔放喺 heartbeat

- 大規模分析、長 report、定時發送（WhatsApp/Slack）→ 用 **isolated cron**，唔好塞入主會話 heartbeat。
- 參考：`~/.openclaw/cron/jobs.json`，`sessionTarget: "isolated"` 做重嘢。
