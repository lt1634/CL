# Scenario：lt1634 兩次失敗 → escalation

## 前置

- 三 agent 已載入範本；Albert 可呼叫 board-writer。

## 步驟

1. Albert `state_set` task `T-SF-1` → `working`, owner `lt1634`。
2. lt1634 回報第一次失敗 → Albert append `error` attempt=1。
3. lt1634 第二次失敗 → Albert append `error` attempt=2。
4. **預期**：Albert append `state_set` `failed` 或 `hermes_dispatch` 或 `blocked`，符合 escalation matrix。

## 通過條件

- jsonl 內順序合理；`idempotency_key`（若有）無重複派 Hermes。
