# Scenario：Hermes handoff

## 步驟

1. Albert append `hermes_dispatch`，含 `idempotency_key`。
2. （模擬或真呼叫）Hermes 完成後 append `hermes_result`，同一 `idempotency_key`。
3. Albert append `state_set` 更新 `state`／`owner`。

## 通過條件

- `hermes_result` 前出現 `hermes_dispatch`；無重複 result（同 key）。
