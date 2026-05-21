# Harrison Chase：Coding Agents 如何重塑 Engineering、Product、Design（EPD）

**來源**：X @hwchase17，2026-03-10  
**原文**：https://x.com/hwchase17/status/2031051115169808685  
**PDF**：Downloads/(21) Harrison Chase on X_ _How Coding Agents Are Reshaping..._.pdf

---

## 一句核心

EPD 嘅產出說到底就係 **code**；coding agents 令寫 code 變得好平，所以 **瓶頸從「實作」變成「review」**，角色從「寫 PRD → mock → code」變成 **builder vs reviewer**，人人都要 product sense、系統思維同會用 agent。

---

## 流程變化（三句）

| 標題 | 意思 |
|------|------|
| **PRDs are dead** | 傳統「先寫 PRD → design 做 mock → engineering 寫 code」嘅瀑布式已死；agent 可以從 idea 直接生出可運行軟件。 |
| **Bottleneck → review** | 人人都可以寫 code，所以要做嘅嘢多咗；瓶頸變成「把 prototype 審成 good」——架構好唔好、有冇解決用戶痛點、UI/UX 是否易用。 |
| **Long live PRDs** | 描述產品需求嘅**文字**仍然必要。prototype 交出去 review 時要有伴隨文件（意圖、取捨）；未來 PRD 可能就係 **structured, versioned prompts**。 |

---

## 對角色嘅影響（要點）

- **Generalists 更值錢**：一個識 product + design + engineering 嘅人，同 agent 溝通就搞得掂，快過三人團隊嘅溝通成本。  
- **Coding agents 係必須**：唔用就會被用嘅人取代。PM 用可自己驗證 idea、Design 可在 code 裡迭代、Engineer 可把時間放在 system thinking。  
- **Good PM 好重要，bad PM 好傷**：壞 product thinking 會量產無用 prototype，拖慢 review、增加「反正有咗就 merge 啦」嘅慣性，產品變臃腫。  
- **人人都要 product sense**：agent 要有人 prompt、話佢知做咩；唔知「要 agent 做咩」就會變成組織負累。  
- **專才門檻更高**：要唔止專精本行，仲要 review 快、溝通強；純專才崗位數量有限。  
- **你要麼係 builder，要麼係 reviewer**：  
  - **Builder**：有 product thinking、會用 coding agents、有基本 design 直覺；在 test suite、component library 等 guardrails 下可把小功能 idea→production，或為大功能做 functional prototype。  
  - **Reviewer**：對大而複雜嘅功能做 EPD 審查；要係極強嘅 system thinker、審得快。  
- **人人覺得自己個 role 最受惠於 coding agents——而且可能都啱**：背景重要性下降，理想型可以來自 product / design / engineering；真正「文化 × 深技術」雙語、知咩可行同咩潮流實在嘅人仍然極少。

---

## 要練嘅能力：System thinking

執行成本低咗，**系統思維**變成差異化：

- **Engineering**：對架構、API、數據庫有清晰 mental model。  
- **Product**：對用戶**真正需要咩**（唔係佢哋話要咩）有清晰 mental model。  
- **Design**：對「點解某樣嘢用落啱」有清晰 mental model。  

好嘅 system thinker 可以 upfront 確保做啱嘢，也可以事後 review 他人產出；兩邊都令 system thinking 更重要。

---

## 同 CL / 你嘅對照

- **左子禎**：指令 vs 目標、電腦懂你 → Chase 講嘅「人人要 product sense、知叫 agent 做咩」同「PRD 可能變 versioned prompts」一致。  
- **余温**：高中生用 OpenClaw 兩個月拿結果 → 對應「builder」型：product thinking + 用 agent + 行動力；你教 AI／SBA 可強調「唔使等準備好、先做 builder」。  
- **Felix / daily-self-improvement**：agent 自己 review、改自己嘅 .md → 對應「bottleneck 係 review」；你嘅 cron 就係讓 agent 做輕量 review + 改進記錄。  
- **你嘅定位**：若偏教學 + 產品/設計 + 少寫 code → 可刻意練 **reviewer**（審架構/流程/設計）或 **builder**（用 OpenClaw 做 prototype、改 MEMORY/AGENTS）；兩條路 Chase 都認為有價值。

---

## 金句（可背）

- "The rarest skill now is knowing what **not** to build."（評論區 Smit Patel）  
- "What if PRDs of the future are just **structured, versioned prompts**?"  
- "You're either a **builder** or a **reviewer**."  
- "Execution is cheap → **system thinking** is the differentiator."
