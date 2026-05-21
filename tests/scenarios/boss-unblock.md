# Scenario：老闆解 blocked

## 步驟

1. Albert `state_set` → `blocked`，並發送 HITL 模版訊息。
2. 模擬老闆回覆 `OK T-BU-1`（或 callback）。
3. Albert append `boss_reply` + `state_set` → `working` 或 `done`。

## 通過條件

- `blocked` 與解鎖之間有明確 `boss_reply`；最終 state 唔長留 blocked。
