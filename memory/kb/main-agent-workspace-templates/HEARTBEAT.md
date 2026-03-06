# HEARTBEAT.md — 主 agent 週期檢查

用途：定期檢查工作區設定與安全狀態，避免配置漂移。

---

## 每週檢查清單

1. `AGENTS.md`、`MEMORY.md`、`HEARTBEAT.md` 三者是否同步、無缺漏。  
2. 設定檔與記憶檔是否出現敏感資訊（API key、token、完整電話）。  
3. cron / delivery 設定是否新增未知 target 或權限放寬。  
4. 若有 push 安全檢查 automation，確認 trigger 仍是啟用狀態。  

---

## 發現異常時的輸出規範

每個問題都包含：

- 嚴重度（critical/high/medium）  
- `檔案:行號` 或 diff hunk  
- 白話說明（1 句）  
- 原始片段（1 段）  
- 下一步（1–2 條）  

---

## 短報模板

- 結論：`OK` / `Needs action`  
- 主要風險（最多 3 條）  
- 具體改進（固定 3 條）  
