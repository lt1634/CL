# Tool Permission Matrix — 全團隊統一

**# relates_to:** team-workflow.md, failure-recovery.md, context-discipline.md, hermes-level2.md, agent2-level2.md, agent3-level2.md, agent4-level2.md

**目的：** 邊個 agent 可以用邊個工具，唔同 scope 嘅時候點處理。

---

## Agent × Tool 權限

| Tool | Albert (1) | Hermes (2) | Agent 2 技術 | Agent 3 創意 | Agent 4 把關 |
|------|-----------|-----------|-------------|-------------|-------------|
| `sessions_send` | ✅ 派工/協調 | ✅ 升級/求助 | ❌ | ❌ | ❌ |
| `board-writer` | ✅ 寫 board | ✅ append | ✅ cursor_dispatch/result | ❌ | ✅ state_set |
| `memory/write` | ✅ | ✅ | ⚠️ 僅限 project files | ❌ | ❌ |
| `memory/delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `cronjob/create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `cronjob/delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `terminal/exec` | ✅ | ✅ | ✅ with constraints | ❌ | ❌ |
| `file/write` | ✅ | ✅ | ✅ workspace 內 | ❌ | ❌ |
| `file/delete` | ✅ | ⚠️ ask first | ❌ | ❌ | ❌ |
| `send_message` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `delegate_task` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `mcp_*` | ✅ | ✅ | ⚠️ depends | ❌ | ❌ |
| `web_search` | ✅ | ✅ | ⚠️ research only | ✅ | ⚠️ verification |
| `search_files` | ✅ | ✅ | ✅ | ⚠️ assets | ❌ |

---

## Scope 等級

| 等級 | 標記 | 意思 |
|------|------|------|
| ✅ Full | `exec=full` | 可自由執行 |
| ⚠️ Conditional | `exec=ask` | 需要 user 確認或 1號批准 |
| ❌ Forbidden | `exec=deny` | 完全唔可以使用 |

---

## 關鍵紅線

### 永遠唔好（任何 agent）

1. **唔好刪 memory/board** — 只有 Albert 可以寫 board，`state_set` 只可由 1號或 4號做
2. **唔好 reveal credential** — API key、token、password 唔好進入 output
3. **唔好 cross-workspace write** — 唔屬於呢個 workspace 嘅檔案，唔好郁
4. **唔好自動刪嘢** — `trash` > `rm`，但最好 ask first
5. **唔好派工俾自己** — sessions_send 唔可以 targeting 同一個 agent

### 破壞性操作分級

| 操作 | 需要 |
|------|------|
| Delete file (>100KB) | Albert confirm |
| Delete cron job | Albert confirm |
| 清空 memory | User confirm |
| Revoke credential | User confirm |
| `rm -rf` | User confirm + double check path |

---

## 緊急事故

若 agent 懷疑：
- **credential 洩漏** → 立即停止，通知 1號
- **異常執行** → 停低，記低，請示 1號
- **無限 loop** → 停止，報告已完成部分，請示下一步

---

## 審計

每次大操作（創建/刪除 cron、寫入非 workspace）完成後，簡短彙報俾 1號話「已做 + 後果」。
