# 搞錢長期計劃 — 7 個 AI 技能 × Agent 點協作

**路徑**：單一來源 = **`~/.openclaw/workspace/memory/kb/`**。搞錢相關檔（搞錢-*.md）只在 workspace 改，agent 就搵到。CL 呢份只係範本/留底，唔使 sync 去 workspace。

**目標**：用 7 個被低估嘅 AI 技能製造持續收入；agent 唔係代替你搞錢，而係**幫你跑通、記錄、迭代**，令你專注喺「揀客、報價、交付、收錢」。

**對照**：AI Edge 7 Skills、你已有嘅 OpenClaw / 教學 / 第一桶金方向。

---

## 一、7 技能同你現有資產對齊

| 技能 | 你已有咩 | 缺口 | Agent 可以點幫手 |
|------|----------|------|-------------------|
| **1. AI 工具鏈疊加** | Content digestion（collect→triage）、cron 自動跑、多工具串 | 把「你或客戶行業」嘅流程寫成**一條可賣嘅工作流**、有 case | Agent：從 MEMORY/session 抽「邊個流程用咗邊幾個工具」→ 寫入 `memory/kb/搞錢-case-工具鏈.md`；每週一則可變成銷售素材 |
| **2. AI 情報大腦** | 有 cron、可跑 script、可接 API | 一個**可賣嘅**情報產品：例如某垂直嘅趨勢監控、週報、選題預警 | Agent：幫手 draft「情報產品」規格（輸入/輸出/更新頻率）；cron 跑你定嘅 scrape/分析，agent 寫摘要入 memory，你打包成 PDF/Notion 賣 |
| **3. AI 工業化內容** | 教 AI、有內容消化、可寫長文 | 一條**可重複**嘅內容流水線（腳本→配音/數字人→分發）、一個可收月費嘅 niche | Agent：幫手寫腳本大綱、整理「內容日曆」、從 triage 揀題目；你負責出鏡/配音/上架，agent 負責前置產出 |
| **4. 降維開發企業內部工具** | 有 Cursor、可寫 code、crewai／`projects/` 等小項目 | **明確可賣嘅產品**：例如「小店客戶管理面板」「數據看板」「一週交付」報價 | Agent：從 MEMORY 同 session 記低「邊類需求出現過」→ 寫入 `memory/kb/搞錢-內部工具-需求池.md`；幫手 draft 報價單、交付清單、一週計劃 |
| **5. 智能體工作流設計（OpenClaw）** | 你已經有 OpenClaw、daily-self-improvement、主腦 review、cron、多 agent | **Productize**：一份「幫本地企業部署龍蝦」嘅服務說明、定價、一個可 demo 嘅 case | Agent：維護 `memory/kb/搞錢-OpenClaw-服務說明.md`（你寫初版，agent 按你 feedback 改）；cron 或你手動問「今週有咩可寫成 OpenClaw case study」→ 寫入該檔 |
| **6. 提示詞工程降維變現** | 你教 AI 課程、識 prompt、有 SBA/學生 | **企業內訓**：半日 workshop、audit 團隊點 prompt、優化產出 | Agent：從 session 抽「常見 prompt 問題/改進前後」→ 寫入 `memory/kb/搞錢-教學-案例.md`；幫手 draft workshop 大綱、audit 檢查表 |
| **7. 全案 AI 諮詢** | 上面 1–6 嘅組合 | 一個**標準流程**：診斷 → 報價 → 實施 → 月費維護；一個高淨值客戶 | Agent：維護「搞錢 pipeline」：潛在客戶名、階段、下次行動；每週回顧「邊個 skill 有進展、邊個可變成 consulting 單」寫入 MEMORY P1/P2 |

---

## 二、Agent 具體可以幫手做嘅事（寫入 MEMORY / cron / 你口頭指令）

- **每週一次**（可加 cron 或你手動）：  
  「從本週 session 同 memory 抽：1) 一個可變成工具鏈 case 嘅流程 2) 一個可變成 OpenClaw case 嘅用法 3) 一個可變成教學案例嘅 prompt 改進。寫入 memory/kb/搞錢-xxx.md，每類一則。」  
  → 等你搞錢時有現成素材。

- **當你講「我想接 XXX 單」**：  
  Agent 讀 `搞錢-OpenClaw-服務說明.md` 或 `搞錢-內部工具-需求池.md`，幫手 draft 報價、交付範圍、一週計劃。

- **當你講「我要做企業 workshop」**：  
  Agent 讀 `搞錢-教學-案例.md` 同 MEMORY 裡嘅 prompt 血淚教訓，幫手 draft 半日大綱、audit 檢查表。

- **長期**：  
  MEMORY 裡設 P1「搞錢方向」：例如「本季主攻 #5 OpenClaw 部署 + #6 企業 prompt workshop」；agent 在 daily/weekly 改進時唔會偏離呢個重心。

---

## 三、分階段執行（建議）

### Phase 1：0–3 個月 — 揀 1–2 個技能、跑通第一單

- **揀**：你最順手嘅一條。建議從 **#5 OpenClaw** 或 **#6 提示詞/企業 workshop** 起步（你已有基礎）。
- **目標**：一個**付費**客戶（setup 費 $2k–6k 或 workshop 幾千）。
- **Agent**：  
  - 維護 `搞錢-OpenClaw-服務說明.md` 或 `搞錢-教學-案例.md`；  
  - 每週從 session 抽 1 則可變成 case/教學素材，寫入對應 md。

### Phase 2：3–6 個月 — 產品化、月費

- **目標**：同一技能有 2–3 個客戶；其中 1 個簽**月費**（維護/更新/顧問）。
- **Agent**：  
  - 幫手 draft 報價、交付清單、retainer 範圍；  
  - MEMORY P1 寫「搞錢 pipeline」：客戶名、階段、下次行動。

### Phase 3：6–12 個月 — 全案諮詢、放大

- **目標**：**#7 全案 AI 諮詢** — 診斷 $5k → 實施 $10k–20k → 月費 $2k–5k；或請人做執行，你做頂層設計。
- **Agent**：  
  - 從 MEMORY 同 搞錢-*.md 抽「邊個 skill 有成果」→ 變成 consulting 案例庫；  
  - 每週回顧：邊個潛在客戶可推上 consulting、邊個可寫成文章/帖做 distribution。

---

## 四、即刻可做（今週）

1. **開 3 個檔**（若未有）：  
   `memory/kb/搞錢-OpenClaw-服務說明.md`、`memory/kb/搞錢-教學-案例.md`、`memory/kb/搞錢-內部工具-需求池.md`。  
   每份寫 3–5 句「呢個係咩、賣俾邊個、收幾多」。

2. **在 MEMORY 寫一條 P1**：  
   例如「2026 搞錢：本季主攻 OpenClaw 部署 + 企業 prompt workshop；每週 agent 抽 1 則 case 入搞錢-*.md」。

3. **同 agent 講一次**：  
   「之後我講搞錢、接單、workshop，你就睇 memory/kb/搞錢-*.md 同 MEMORY 搞錢方向，幫手 draft 報價或大綱。」

4. **（可選）加一條週 cron**：  
   payload = 「從本週 session 同 MEMORY 抽 1 則可變成搞錢 case/教學案例，寫入 memory/kb/搞錢-xxx.md」。

---

## 五、一句總結

7 個技能嘅終局都係**有人肯為你嘅「系統/洞察/交付」付費**。Agent 嘅角色係：幫你**沉澱 case、維持 pipeline、draft 報價同大綱**，等你專注喺揀客、講數、交付同收錢。先揀一條技能跑通第一單，再讓 agent 幫你把成果變成可複製嘅流程同下一單。
