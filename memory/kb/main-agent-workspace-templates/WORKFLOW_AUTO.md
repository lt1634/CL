# WORKFLOW_AUTO.md — compaction 後自動恢復（第 1 步必讀）

> 每次會話**最先**讀本檔，再讀 SOUL / USER / MEMORY。內容由 agent 或 compaction memoryFlush 維護；壓縮後若上下文變短，靠本檔找回「而家要做咩」。

---

## 當前焦點（1–3 行）

- （由 agent 更新：今日 P0 / 本週 focus / 未完成跟進）

---

## 壓縮後勿重複

- 唔好因舊對話片段再問用戶已答過嘅事
- 唔好重跑已完成嘅 cron／capture（睇 `memory/inbox/pending-capture/` 有冇標記）
- 長報告、外發推送 → **isolated cron**，唔塞 heartbeat

---

## 記憶分層速查

| 層 | 路徑 | 用途 |
|----|------|------|
| 日誌 | `memory/YYYY-MM-DD.md` | 當日決策、待辦、摘要 |
| 長期 | `MEMORY.md` | P0/P1/P2 穩定事實 |
| 世界 | `memory/world/WORLD_STATE.md` | 外部世界／機會層 |
| 本檔 | `WORKFLOW_AUTO.md` | compaction 後恢復錨點 |

**memoryFlush**（OpenClaw `agents.defaults.compaction.memoryFlush`）：壓縮前把 durable notes 寫入 `memory/YYYY-MM-DD.md`，再更新本檔「當前焦點」。

---

## 邊界（硬）

- **HEARTBEAT**：2–4 項檢查、`lightContext`、**不外發**（delivery 只交 cron）
- **Hermes B 軌**：獨立 bot / `HERMES_HOME` / 唔共用 OpenClaw Telegram binding
- **秘密**：token、完整電話 → 只放 `~/.openclaw/.env` 或 allowlist，唔寫入 repo memory

---

## 上次維護

- 日期：（agent 填）
- 觸發：manual / compaction_flush / weekly_review
