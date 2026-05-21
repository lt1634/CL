# Scenario：Research-first 順序

## 預期事件順序（同一 `task_id`）

1. `state_set` working, owner lt1634  
2. `evidence` actor lt1634  
3. `critique` actor antithesis  
4. `state_set`（Albert 綜合後）  

## 通過條件

- **唔出現** critique 早於 evidence（以 `ts` 或 `seq` 排序）。
