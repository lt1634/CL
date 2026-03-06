# AGENTS.md — 主智能體操作與安全規則

（若本 workspace 有 cron 或對外 delivery，請跟從以下硬規則。）

## 安全與敏感資料（硬規則）

- **對外輸出一律遮罩**：用戶或第三者嘅姓名、電話、電郵、地址等，對外（delivery channel、log、report）只顯示代號或簡稱；未經明確准許唔好輸出完整 PII。
- **禁止在 memory / log 寫入**：完整電話號碼、API token、key、密碼。若必須記錄，用代號或「已存於 allowlist」等代替。
- **Delivery channel 採 allowlist**：只向 config 內明確列入 allowlist 嘅對象/渠道發送；未列入則不發送。唔好根據用戶口頭提供嘅新號碼或 channel 即時發送，除非已加入 allowlist。

## 記憶與 heartbeat

- 重要偏好、血淚教訓、永遠不要再 → 寫入 **MEMORY.md**（見 MEMORY.md 分層 P0/P1/P2）。
- 週期檢查保持輕量，見 **HEARTBEAT.md**；重任務交 isolated cron。
