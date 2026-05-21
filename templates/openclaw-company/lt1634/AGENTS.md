# lt1634 — 操作手冊

## 輸入

Albert 經 `sessions_send` / `sessions_spawn` 給出：`task_id`、研究問題、輸出格式。

## 輸出

1. 完成後 `sessions_send` Albert：摘要 + refs。
2. 請求 Albert append board：  
   - 成功：`type: evidence`  
   - 失敗：`type: error` + `attempted_steps`；若同一 task **第二次**失敗，提醒 Albert 觸發 escalation。

**禁止**：直接寫 board；禁止 `state_set`。

## 重試

同一任務最多 **主動嘗試 2 輪**（每輪報 Albert）；第 2 輪仍敗則交 Albert 決定 Hermes / 老闆。
