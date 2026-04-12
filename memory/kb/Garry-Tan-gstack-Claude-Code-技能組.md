# Garry Tan：gstack — Claude Code 專用技能組

**來源**：[garrytan/gstack](https://github.com/garrytan/gstack)（GitHub）  
**一句**：把 Claude Code 從「一個通用助手」變成 **按需召喚嘅專家團隊**：CEO、Eng Manager、Release Manager、QA Engineer 等，用 slash command 切換認知模式。

---

## 核心理念

- **唔要一種「糊狀」模式**：規劃唔係 review，review 唔係 ship，founder 品味唔係工程嚴謹；混埋一齊通常得到四不像。
- **要明確嘅檔位**：用 slash 話俾 model 知「而家要邊種腦」— founder、eng manager、paranoid reviewer、release 機器。
- **對象**：已經常用 Claude Code、想要高嚴謹 workflow 嘅人；唔係給初學者嘅 prompt 包，係「for people who ship」嘅操作系統。

---

## 技能一覽（8 個 slash commands）

| 指令 | 角色 | 做咩 |
|------|------|------|
| `/plan-ceo-review` | Founder / CEO | 重新思考問題，搵「10-star 產品」藏喺 request 入面；唔係照做 ticket，係問「呢個 product 真正為咩而存在？」（Brian Chesky 模式） |
| `/plan-eng-review` | Eng Manager / Tech Lead | 鎖定架構、data flow、圖（sequence/state/component）、edge cases、test matrix；**畫圖**迫隱藏假設浮面。 |
| `/review` | Paranoid Staff Engineer | 搵 CI 過到但 production 會爆嘅 bug：N+1、race condition、trust boundary、漏 index、錯 retry、假陽性 test。 |
| `/ship` | Release Engineer | 對「已 ready 嘅 branch」：sync main、跑 test、處理 Greptile 意見、push、開 PR；唔係傾做咩，係執行最後一哩。 |
| `/browse` | QA Engineer | 俾 agent「眼睛」：登入、點擊、截圖、睇 console；約 60 秒做一輪 QA。用 Playwright，persistent Chromium。 |
| `/qa` | QA Lead | 系統化 QA：讀 git diff → 識別受影響頁面 → 自動測；有 diff-aware / full / quick / regression 模式。 |
| `/setup-browser-cookies` | Session Manager | 從真實 browser（Chrome、Arc、Brave 等）匯入 cookie 到 headless session，測需登入嘅頁面。 |
| `/retro` | Eng Manager | 用 commit 歷史做 team-aware retro：每人 praise + growth 機會、metrics（commits、LOC、test ratio、PR 大小）。 |

---

## 典型流程（一個 feature 用五個模式）

1. **Plan 模式** 描述想要嘅嘢 → `/plan-ceo-review` 壓力測試「係咪做緊對嘅嘢」、搵 10-star 版本。  
2. `/plan-eng-review` 鎖架構、圖、failure mode、test。  
3. 實作。  
4. `/review` 搵 production 會爆嘅問題。  
5. 修好 → `/ship`（sync、test、Greptile triage、push、開 PR）。  
6. `/qa` 或 `/browse` 驗證；要登入頁就先用 `/setup-browser-cookies`。

---

## 安裝（要 Claude Code、Git、Bun v1.0+）

- **本機**：`git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`，再在 CLAUDE.md 加 gstack 段（用 gstack 嘅 `/browse` 做 web browsing，唔用 mcp claude-in-chrome；列出上述 8 個 skill）。  
- **專案**（可選）：複製到 `.claude/skills/gstack`（無 .git），同目錄 `./setup`，在專案 CLAUDE.md 加段。  
- `/browse` 會編譯 native binary（macOS/Linux），約 58MB，放 `browse/dist/browse`。

---

## 同你現有 setup 嘅關係（CL / OpenClaw）

- **gstack 係 Claude Code 嘅 skill**（`~/.claude/skills/`），用 slash 切換認知模式；**OpenClaw** 係多 channel gateway + agent（TUI、WhatsApp 等），兩者唔衝突。  
- 若你喺 **Cursor** 用 Claude / 其他 model：gstack 設計係給 **Claude Code** 用，Cursor 唔會自動有呢批 slash；要類似效果可能要自己把「CEO / Eng / Review / Ship / QA」寫成 Cursor rules 或 skills。  
- **搞錢 / 7 skills**：gstack 對應「Coding + 高嚴謹 workflow」；Agentic Workflow、Prompt Engineering、AI Consulting 仍係你 MEMORY/搞錢計劃裡嘅獨立方向。

---

## 金句（摘）

- "Planning is not review. Review is not shipping. Founder taste is not engineering rigor."  
- "I want explicit gears."  
- "That is not incremental improvement. That is a different way of building software."（講 Conductor 多 session 並行）

---

## 參考

- Repo: https://github.com/garrytan/gstack  
- 詳細 browser/QA：見 repo 內 BROWSER.md  
- Greptile 整合：`/review`、`/ship` 會讀 PR 上 Greptile 評論並 triage（valid / already-fixed / false positive）。
