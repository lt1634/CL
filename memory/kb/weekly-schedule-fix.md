# 每週檢視排程：改為真正「每週」（高）

**問題**：若觸發資訊顯示 `0 1 1 * *`，即**每月 1 號**跑一次，與「Every week」目標不一致。

**建議**：改成**每週**跑一次。

---

## Cursor Automations（wing 每週檢視）

若你嘅 **wing's Automation** 用 cron 表達式，請改為每週而非每月：

- **錯誤**：`0 1 1 * *`（每月 1 號 00:01）
- **正確示例**：
  - `0 1 * * 1` — 每週一 00:01（本地時區）
  - `0 9 * * 0` — 每週日 09:00（本地時區）
- 在 Cursor Automations 的 Trigger 裡把 Schedule 設為上述其中一個（或 UI 的「Every week」對應項），確保係每週而非每月。

---

## OpenClaw cron（~/.openclaw/cron/jobs.json）

Repo 內文檔已約定為每週：

- **config-check-weekly-001**：週日 08:00 Hong Kong → `expr: "0 8 * * 0"`, `tz: "Asia/Hong_Kong"`
- **memory-compact-weekly-001**：週日 09:00 Asia/Hong_Kong → `expr: "0 9 * * 0"`, `tz: "Asia/Hong_Kong"`

若你手動改過 jobs.json 而寫成 `0 1 1 * *`，請改回上述每週表達式，並保留 Push/CI 事件做安全檢查。

**好處**：避免漏掉週檢查，行為與規格一致。
