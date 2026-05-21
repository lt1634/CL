# Agent 行為 scenario（手動／半自動驗收）

每次改 `templates/openclaw-company/**/AGENTS.md` 後，建議重跑下列 scenario（對照 `company-board.jsonl` 實際事件）。

| 檔案 | 驗證點 |
|------|--------|
| `lt1634-double-fail.md` | 兩次 error 後 Albert escalation |
| `research-first-order.md` | evidence → critique → state_set 順序 |
| `hermes-handoff.md` | hermes_dispatch → hermes_result → state_set |
| `boss-unblock.md` | blocked → boss_reply → working/done |
