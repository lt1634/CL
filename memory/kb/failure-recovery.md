# Failure Recovery Protocol — 全團隊統一

**# relates_to:** team-workflow.md, tool-permission-matrix.md, context-discipline.md, hermes-level2.md, agent2-level2.md, agent3-level2.md, agent4-level2.md

**目的：** 當任何 agent 任務失敗、block、或超時，點做。

---

## 任務狀態定義

| 狀態 | 意思 | 行動 |
|------|------|------|
| `pending` | 未開始 | 等派工 |
| `in_progress` | 進行中 | 繼續，報告進度 |
| `blocked` | 卡住 | 按呢份 doc 處理 |
| `failed` | 完全失敗 | 記錄，請示 1號 |
| `done` | 完成 | 彙報，整合 |

---

## Blocked 觸發條件

以下任一出現，agent 必須停低，唔好繼續撞：

1. **Error 重複 3 次** — 同一 error 跑 3 次仲係咁
2. **Error message 不明確** — 唔知係乜嘢錯
3. **需要外部資源** — 網站死咗、API key 無效、檔案唔存在
4. **需求模糊** — instructions 唔清楚，唔知點做
5. **跨工具爭議** — 兩個 tools 俾嘅建議矛盾
6. **超出 max_iterations** — 超過派工時設定嘅次數

---

## Blocked 處理流程

```
blocked → 嘗試自助 → 若解決 → 繼續並報告
                         ↓ 若唔得
                   sessions_send 回 1號
                   附：
                   - task_id
                   - blocked 原因（具體 error / 描述）
                   - 已試過咩方法
                   - 目前狀態（部分完成？完全未郁？）
```

**Block 回報格式：**

```
🚧 [task_id] Blocked

原因：[具體 error 或描述]
已試：[方法 A、方法 B]
狀態：[已完成的部分]
建議：[認為下一步應該點]
```

---

## Dead Letter Queue（DLQ）

當以下情况，任務直接寫入 DLQ，唔繼續：

1. **用戶長期無回應** — 超過 48 小時無響應
2. **需要外部確認** — 但 user 唔回覆
3. **目標已失效** — request 嘅嘢已過期
4. **Agent 能力不足** — 需要 user 介入先做到

### DLQ 寫入格式

```
❌ DLQ: [task_id]

user_request: [原始需求摘要]
blocked_at: [邊個步驟]
reason: [具體原因]
attempts: [試咗幾多次]
last_error: [最後 error message]
suggestion: [建議點做]
```

DLQ 位置：`memory/kb/dead-letter-queue.md`

---

## 失敗回報格式

```
❌ [task_id] Failed

原因：[具體錯誤]
嘗試次數：[N]
最後狀態：[完成咗咩部分]
建議：[放棄？重試？降級？]
```

---

## 1號處理 DLQ

1. 每日檢查 DLQ
2. 決定：放棄 / 降級交付 / 派俾另一 agent / 問 user
3. 回應俾相關 agent

---

## 超時處理

| 任務類型 | 超時閾值 |
|---------|---------|
| 簡單問答 | 30s |
| 單次工具執行 | 2min |
| 複雜 research | 10min |
| 檔案操作 | 5min |

超時視為 blocked，按上面流程處理。
