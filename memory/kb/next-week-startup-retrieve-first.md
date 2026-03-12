# 下週驗證：啟動讀檔改為「檢索優先」＋壓縮保護（中）

**來源**：每週檢視短報告建議 #3。

**現況**：AGENTS.md 啟動會直接讀今日/昨日日誌與 MEMORY；長期可能增加 token 壓力。

**建議**：先 memory_search（或關鍵詞檢索）再局部讀取；補一條量化門檻（如超過某長度只讀摘要），並在配置說明加入 compaction.memoryFlush/閾值策略。

**好處**：更貼近 2025–2026 最佳實務（記憶分層 + compaction 前落盤），降低上下文膨脹。

---

## 下週驗證項目

- 觀察 **token 使用量**（會話啟動前後）
- 觀察 **heartbeat 輸出長度**
- 觀察 **weekly compact 成功率**（memory-compact-weekly-001）

若數據顯示啟動讀取明顯推高 token，再落實「檢索優先」＋長度閾值與 compaction 策略；必要時更新 AGENTS.md 啟動流程與相關 kb。
