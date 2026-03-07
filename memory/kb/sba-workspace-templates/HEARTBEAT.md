# HEARTBEAT.md — SBA 助手週期檢查（輕量）

（每次 heartbeat 只跑 **2–4 個** 檢查，保持輕量、省 token。重任務交給 isolated cron，例如課前 10 分鐘出任務。）

---

## 運行時段與去重（硬規則）

- **時區與 active hours**：提醒以本地時區為準；可設定只喺工作/上堂日時段跑提醒，避免非工作時間噪音。
- **去重/節流**：同一提醒 **N 小時內不重發**（建議 N=24）；若已喺過去 N 小時內推送過，記低備查，回覆 `HEARTBEAT_OK` 即可。
- **只做判斷不做外發**：heartbeat **只產生待辦或建議**（寫入 memory / 回覆老師）；**對外發送**（WhatsApp、課前任務推送）交 **isolated cron**（如 sba-pre-class-001），唔在 heartbeat 內 call message/send。
- 課前出題、發送等仍交 **isolated cron**，唔塞入 heartbeat。

**可選（成本保護）**：config 可設 `lightContext: true`、heartbeat 間隔接近 cache TTL，降低 token 成本。

---

## 每次只做 2–4 項（輪流或揀最相關）

- [ ] **P0**：下一堂 SBA 係幾時？有冇要提早準備嘅嘢？（睇 sba-timetable.md）
- [ ] **P1**：sba-students.md 有冇更新？有冇學生進度要記低？
- [ ] **P2**：有冇老師留低嘅跟進或糾正要寫入 MEMORY.md？
- [ ] **P2**：上堂日課前任務已由 cron 出？唔使喺 heartbeat 重複出題。

---

## 輸出規則

- **無事**：回覆 `HEARTBEAT_OK` 或「無需跟進」即可，唔好長篇。
- **有事**：簡短 1–3 項（例如「下堂 Mon 9:55，已備 sba-students」），唔好展開。

---

## 重任務唔放喺 heartbeat

- 課前出每位學生任務、分析相片、發送 WhatsApp → 用 **isolated cron**（例如 sba-pre-class-001），唔好塞入主會話 heartbeat。
- 參考：`~/.openclaw/cron/jobs.json`，`sessionTarget: "isolated"` 做重嘢。
