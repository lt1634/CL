# Tw93：Agent 架構與工程實踐 — 摘要與對齊 CL

> **來源**：Tw93 / @HiTw93 — [你不知道的 Agent：原理、架构与工程实践](https://x.com/HiTw93/status/2034627967926825175)（2026 年前後長文／Thread；本地備份可參考 `Downloads/HiTw93-0. 太长不读-20260320-101948.md`，注意該檔曾斷尾）。  
> **本文性質**：讀者摘錄 + 與本倉庫（CL）對齊；數字與案例以原文為準。  
> **相關**：全項目檢查清單見 [`docs/CL-AGENT-HARNESS-CHECKLIST.md`](../../docs/CL-AGENT-HARNESS-CHECKLIST.md)。

---

## 核心發現（摘錄）

### 1. 模型貴唔係最關鍵

- 更貴嘅模型帶嚟嘅提升「冇想像中咁大」。
- **Harness 同驗證測試嘅質量**對成功率影響往往更大。
- 調試時應優先檢查 **工具定義** — 多數工具揀錯係因為 **描述唔準確**。
- **評測系統本身**出問題有時難過發現 Agent 出問題。

### 2. Agent Loop（核心迴圈極簡）

抽象後主結構穩定：感知 → 決策（tool use）→ 執行 → 將結果塞返 messages，直到唔再 `tool_use` 而輸出正文。新能力多數靠 **加工具／改 system prompt／狀態外置**，唔好將 loop 變巨型狀態機。

（偽代碼概念）`while` 迴圈、`stop_reason === tool_use` 則執行工具並 push 結果，否則 return。

### 3. 五種控制流模式

| 模式 | 要義 | 適用聯想 |
|------|------|----------|
| **Prompt Chaining** | 線性多步 | 大綱 → 正文 |
| **Routing** | 分類後定向 | 簡單→輕量模型，複雜→強模型 |
| **Parallelization** | 分段並行或投票 | 高風險／多視角 |
| **Orchestrator–Workers** | 中央分解、委派 | 子 Agent、spawn |
| **Evaluator–Optimizer** | 生成→評估→迭代直至達標 | 質量難用程式完全定義嘅任務 |

### 4. Context 工程

- **Context Rot**：無關內容佔大多數時，決策質量明顯下滑。
- **壓縮原則**：保留決策價值最高嘅資訊；可重建嘅移出上下文（檔案、摘要、替換工具輸出）。
- **Skills**：描述寫成 **路由條件**（何時用／唔好用／產出），唔係長篇功能介紹。
- **Dynamic Context Discovery**（文中所述 Cursor 方向）：預設少畀，唔夠先讀。

### 5. 工具設計（ACI 方向）

- **Tool Search**（動態發現工具）：減少一次過塞滿工具定義；文中提及 Cursor 在 MCP 上 A/B 與 **token 消耗**相關實驗數據。
- **Programmatic Tool Calling**：用代碼編排多步工具，中間結果喺執行環境流轉，減少穿過 LLM 嘅冗餘（文中係量級示例）。
- **Tool Use Examples**：每個工具 **1–5 個**真實調用示例；文中稱可顯著提升 **工具調用準確率**（對比數字以原文為準）。

### 6. 記憶層次（概念）

- **Context / 工作記憶**：當前對話窗口，token 有限。
- **Skills**：程序性記憶，按需加載。
- **JSONL／日誌**：情景記憶，持久化、可檢索。
- **MEMORY.md（或等價）**：語義記憶，Agent **主動**寫入要保留嘅事實；整合要 **可回退**，唔係粗暴覆蓋。

### 7. OpenClaw

長文後段以 **OpenClaw** 串起原則（Gateway → Channel 適配 → Pi Agent → 工具 → 上下文與記憶等）。本倉庫已有：`docs/OPENCLAW_OPTIMIZATION_PLAN.md`、`docs/OPENCLAW_SECURITY_AUDIT_2026.md`、`memory/kb/openclaw-*.md`。

---

## 對本倉庫（CL）嘅對齊意義

### VA Star-Getter（`art-prompt-generator-v2`）

- **Evaluator–Optimizer** 聯想：生成題目／提示 → **可定義嘅品質檢查**（例如結構是否齊、是否合 DSE 四準則）→ 再改；關鍵係要有 **可自動或半自動驗證**，唔係純「感覺好啲」。

### OpenClaw 優化

- Skills **延遲加載**、**記憶整合**觸發與回退、工具 **ACI** 粒度同描述；見檢查清單 **B、E、F** 節。

### 多 Agent

- **先隔離、再並行**；狀態用 **檔案／PR／工件** 對齊，唔好只靠對話記憶。

---

## 一句到尾

> **Agent 能否穩定，唔淨係睇模型，亦睇 Harness（驗證、邊界、工具、上下文、記憶）。**

---

## 下一步可深挖（需要時開新條目）

1. **Evaluator–Optimizer** 點樣落地喺 VA 題庫（規則表、細模型評分、人審一欄）。  
2. **OpenClaw** 與本文 **工具消息隔離**、**compact 保留優先級** 逐條對照你現有 config。  
3. **多 Agent**：JSONL inbox / worktree 與你 `main-agent` vs `sba` 模板嘅分工。

---

*建立日期：2026-03-20 · 與 Tim（CL）工作區對齊。*
