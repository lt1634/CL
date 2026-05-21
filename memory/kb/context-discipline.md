# Context Refresh Discipline — 單一真相源

**# relates_to:** team-workflow.md, tool-permission-matrix.md, failure-recovery.md, hermes-level2.md, ai-agent-memory-systems.md

**Graph-aware Retrieval（重要性標記 + 關係）：**
- 讀取時：睇 `# relates_to:` 標記，主動拉相關檔
- 重要性：★★ 核心、★ 重要、留記錄就得
- 寫入時：更新相關檔嘅 `# relates_to:`

---

## 記憶系統優先級

| 優先 | 來源 | 時效 | 誰寫 |
|------|------|------|------|
| 🥇 P0 | `memory/YYYY-MM-DD.md` | 當日 | 所有 agent |
| 🥈 P1 | `~/.hermes/MEMORY.md` | 長期 | Hermes |
| 🥉 P2 | `memory/kb/*.md` | 半永久 | 1號/相關 agent |
| 📁 P3 | `~/Desktop/CL/docs/*` | 長期 | User 或 agent |

---

## Context 刷新規則

### 當你收到派工時

1. **先讀** `memory/YYYY-MM-DD.md`（今日 + 昨日）
2. **再讀** 任務相關嘅 `memory/kb/` 文件
3. **若新資訊與舊資訊衝突**，以 P0 為準，但注明「與 P2 矛盾，待確認」
4. **若唔確定**，問 1號，唔好假設

### 當你完成任務時

1. **寫入** `memory/YYYY-MM-DD.md`（格式見下）
2. **若影響長期決策**，同步更新 `memory/kb/` 相關文件
3. **確保下一個 agent 可以找到你做咗乜**

### 當你交接時

- 確保下一個 agent 有足夠 context（不僅係 output，仲有 reasoning）
- 交接格式：

```
## [task_id] 完成摘要

**交付物：**
[檔案路徑 / 輸出摘要]

**關鍵決策：**
- [ decision 1]
- [ decision 2]

**遗留問題：**
- [未解決的問題]

**下一步：**
- [下一個 agent 需要做咩]
```

---

## 每日 Session Start Checklist

每個 agent 收到派工前必須確認：

```
□ memory/YYYY-MM-DD.md（今日）已讀
□ memory/YYYY-MM-DD.md（昨日）已讀  
□ 若有相關 KB 文件，已讀
□ 確認冇看到過時資訊（若看到，注明）
```

---

## 杜絕「幽靈記憶」

以下習慣要杜絕：

| 壞習慣 | 點解 | 正確做法 |
|--------|------|---------|
| 「我記得上次...」 | 記憶唔準確 | 查 memory/YYYY-MM-DD |
| 「大概係...」 | 唔精確 | 讀具體檔案 |
| 「應該係咁...」 | 假設 | 確認後先行動 |
| 「上次係咁做...」 | 可能已過時 | 查最新記錄 |

---

## Single Source of Truth（SSOT）

| 資料類型 | SSOT 位置 |
|---------|----------|
| 當日對話 | `memory/YYYY-MM-DD.md` |
| 持倉/投資 | `memory/kb/portfolio-holdings.md` + `~/Desktop/CL/docs/project-state/investment.md` |
| Cron jobs | OpenClaw cron job list |
| User 偏好 | `~/.hermes/USER.md` |
| 團隊任務 | Company board (`~/.openclaw/workspace/company-board.jsonl`) |
| 密碼/credential | `~/.openclaw/.env`（唔好讀俾 user 聽） |

---

## Conflict Resolution

當 P0 與 P2 衝突：
1. 以 P0 為準（P0 = 最新事實）
2. 在回報中注明衝突
3. 若衝突影響大，通知 1號

當兩個 agent 對同一事實有唔同理解：
- 以最直接或最新寫入者為準
- 若有懷疑，問 1號裁決
