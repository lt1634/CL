# Tim Yuen — AI Agent 系統審閱包

> **用途：** 供 Gemini、Grok 或其他外部模型審閱，評估 OpenClaw + Hermes 雙星系統如何更好支援 Tim。  
> **生成日期：** 2026-05-21  
> **機密：** 本文不含 API key、token、完整帳號 ID；僅保留審閱所需脈絡。  
> **下載路徑：** `~/Desktop/CL/docs/TIM-AI-AGENT-REVIEW-PACK-2026-05-21.md`

---

## 給審閱者的任務（請先讀）

請根據下文，回答：

1. **雙星架構**（OpenClaw + Hermes 並行）對 Tim 係咪合理？應合併定維持？
2. **Cron / 自動化** 有冇過重、重疊、或應改為純腳本（唔開 LLM session）嘅 job？
3. **Telegram 訊息疲勞**：一日多次推送，點樣合併或分級？
4. **阻塞項**（需 Tim 親自登入／OAuth）agent 應點處理先唔會假裝完成？
5. **個人生活目標**（家庭、創作、Moments > Money）同自動化設計有冇衝突？
6. 提出 **3 個高影響、低維護** 改動（下週可做）。

---

# 第一部分：Tim 個人與工作模式

## 1.1 基本資料

| 項目 | 內容 |
|------|------|
| 姓名 | Tim Yuen |
| 居住地 | 香港梅窩 |
| 職業 | 視覺藝術老師（約 15 年）、逆鱗工作室 |
| 家庭 | 太太阿嘉；女兒 Audrey（約 4 歲） |
| 語言 | 粵語為主；工作文件繁中／英混用 |

## 1.2 價值觀與決策原則

- **Moments > Money** — 體驗與關係優先於純追逐收入。
- **藝術** — 「當你願意為它暫停腳步的，那就是最純粹的藝術」；快樂係投入，唔係結果。
- **工作風格** — 決策快、主動執行、「先對齊標準再行」。
- **研究習慣** — Deep research 前用 shallow scan 建 INDEX，再按需深入。
- **內容觸發點（要小心的時刻）** — 發文前想推、寫完想 promote、post 後睇數據、在意 engagement → 容易偏離 Moments > Money。

## 1.3 個人成長主題（摘要）

> 詳見 `docs/personal/tim-self-exploration.md`

- 長期用「變強」框架支撐家庭；踢波係少數 **為自己** 而唔為角色表演嘅時間。
- 傾計時 **感受優先於過度分析**；需要被接住多過被解構。
- 提醒 agent：當 Tim 又開始分析自己 → 可問「感點？」；當話「唔在乎」→ 問「放手之後係輕定係隱隱作痛？」

## 1.4 財務與投資取向（摘要）

> 詳見 `docs/INVESTMENT_PHILOSOPHY.md`、`docs/project-state/investment.md`

- 哲學：長線、分散、指數為主；Howard Marks「Un-Buying Test」；唔用情緒賣出。
- 組合（2026-05-18 快照）：淨值約 **HKD 146 萬**（+6.08% vs 成本）；港股 GX 股息 + 納指 ETF；美股 VT 等；02318 平安已清倉。
- Agent 規則：**禁止**在 world/opportunity 推送寫「立即買賣」；用「考慮／核對」語氣。

## 1.5 2026 優先目標（工作／創作／系統）

| 優先級 | 目標 | 狀態 |
|--------|------|------|
| P0 | T58 五十周年展覽落地（2027-04） | Active |
| P0 | 豆豆粵語兒歌 IP 品牌化（小紅書） | Active |
| P1 | 世界感知層（投資 + 本地梅窩 + 展覽 + 創意）情報管線 | Active |
| P2 | MindForge 個人知識系統 | Active |
| P2 | Art Prompt Generator（教育 × AI 產品） | Active |
| 維護 | 雙星 AI 穩定（少 timeout、少重複 cron） | 進行中 |

---

# 第二部分：活躍專案一覽

| 專案 | 一句話 | 關鍵路徑 |
|------|--------|----------|
| T58 展覽 | HKAC 五十周年，18 幅作品，Rico 口述影像 + Tim 落地 | `docs/project-state/T58.md` |
| T56 / LCSD | 其他展覽／政府相關 | `docs/project-state/T56.md`, `LCSD.md` |
| 豆豆 IP | 小紅書 ~4.6K 粉；爆款《有情緒唔緊要》 | Notion pipeline + doudou skills |
| 風水林 | 佛教筏可紀念中學校本生態花園 | `~/Desktop/CL/docs/` |
| 香城廣場 | 社區項目 | `projects/香城廣場/` |
| World 感知層 | RSS + 機會推送 + 晚報 | `docs/WORLD_MODEL_PROJECT.md` |
| CL 倉庫 | 工具、文檔、world-ingest | `~/Desktop/CL/` |

**晨報 SSOT：** `docs/project-state/summary.md`（10 條 Snippet，Hermes 08:00 讀）

---

# 第三部分：雙星系統 — 為咩兩套？

## 3.1 設計意圖

```text
Tim（Telegram 主力）
    │
    ├─► OpenClaw Telegram（Albert）— 自動化、workspace、cron、RSS、世界層
    │
    └─► Hermes Telegram + 可選 Desktop — 傾計、GEPA 自省、B 軌驗證、8642 API

OpenClaw 編排 ──HTTP 127.0.0.1:8642──► Hermes（研究核對、短驗證）
```

**唔合併嘅原因：**

- 負載隔離：十幾個 LLM cron 唔應同即時傾計搶同一 process。
- 角色分工：OpenClaw = 營運自動化；Hermes = 第二意見 + 質檢 + 獨立 bot。
- 失敗隔離：一邊 digest timeout 唔拖死另一邊。

## 3.2 對照表

| 維度 | OpenClaw | Hermes |
|------|----------|--------|
| 狀態目錄 | `~/.openclaw/` | `~/.hermes/` |
| Gateway 埠 | ~18789 | ~8642（API）+ Telegram |
| Workspace | `~/.openclaw/workspace/` | memories + skills |
| 主模型 | MiniMax-M2.7（agent） | MiniMax-M2.7 |
| Telegram | **OpenClaw bot**（Albert） | **Hermes bot**（另一個） |
| Desktop | 無 | Hermes Agent.app → 8642 |
| 典型任務 | 晨報素材、RSS、world、JUMP 掃描 | GEPA 每日回顧、overnight Top 3、午後 research |
| 多 agent | Albert / Antithesis / lt1634（公司範本） | 單 agent + cron + delegate |

## 3.3 共用記憶

- **PLUR**（`~/.plur/`）：兩邊可掛，跨 session 補充記憶。
- **MEMORY.md**：OpenClaw workspace 與 Hermes `~/.hermes/memories/` **分開**；重要內容靠 `docs/memory-index.md` 與手動同步。
- **CL 文檔**：`~/Desktop/CL/docs/project-state/` 為人類 + agent 共用真相來源。

---

# 第四部分：OpenClaw 系統詳情

## 4.1 版本與入口

- OpenClaw CLI / Gateway：2026.5.7 級別（darwin arm64, MacBook Air）
- 主 workspace：`~/.openclaw/workspace/`
- Harness 原則：`workspace/AGENTS.md`
- 公司 board：`company-board.jsonl`（2026-04 後 **停用寫入**，改 project-state 檔）

## 4.2 三層內容管線

| 層 | 職責 | 輸出 |
|----|------|------|
| **Hobby** | 科技／學習 RSS ~30 feeds | `daily-digest-*.md`、🏆 overnight Top 3 |
| **World** | 投資／HK／梅窩／展覽／豆豆 | `WORLD_STATE.md`、🌍 晚報、機會推送 |
| **Hermes 編排** | 讀 OpenClaw 產物 | ☀️ 晨報、📊 午後 research |

## 4.3 OpenClaw 已啟用 Cron（HKT，2026-05-21 快照）

| 時間 | 名稱 | 類型 | 備註 |
|------|------|------|------|
| 04:01 | Daily self-improvement | agentTurn（應僅 exec） | 腳本 |
| 04:31 | overnight-build-or-compact | agentTurn | 記憶整理 |
| 05:xx | memory-cron-watchdog | agentTurn | 建議改 LaunchAgent |
| 05:10 | memory-qmd-nightly | agentTurn | QMD 索引 |
| 05:00 | content-digestion-watchdog | agentTurn | |
| 07:30 | World ingest (RSS) | agentTurn | 重；900s |
| 08:00 | JUMP 視藝教師空缺 | agentTurn | 需瀏覽器；常 stall |
| 08:15 | World opportunity scan | agentTurn | |
| 14:00 | World opportunity scan (afternoon) | agentTurn | 曾 stall 2.5h |
| 21:00 | World evening digest | agentTurn | 1200s |
| 21:15 | memory-sync-daily | agentTurn | |
| 21:45 | 每日對話 capture | systemEvent | |
| 週日多項 | MEMORY compact、world consolidate、reflection… | agentTurn | |

**已停用（重要）：** `content-digest-hybrid-001` OpenClaw cron — 改由 **LaunchAgent** `ai.openclaw.content-digest-hybrid` 於 **12:10、20:10** 跑純腳本 + Telegram。

## 4.4 OpenClaw 已知痛點（2026-05-21）

- **MiniMax timeout**（凌晨 04:00 附近）：self-improvement、overnight、cron 疊加。
- **Telegram polling stall**：雙 gateway + 網絡；00–04 點高發；多數自恢復。
- **agentTurn 做純 exec**：仍會開 LLM session，易 timeout（content digest 20:00 曾 300s 超時）。
- **阻塞需人手**：JUMP 登入查學校名、Antfarm OAuth 18/50、部分瀏覽器任務。

---

# 第五部分：Hermes 系統詳情

## 5.1 版本與入口

- Hermes Agent：~v0.13.0（CLI）；Desktop v0.4.5
- 安裝：`~/.hermes/hermes-agent/`（venv）
- Gateway：LaunchAgent `ai.hermes.gateway`；API `127.0.0.1:8642`
- Telegram：**獨立 bot**（與 OpenClaw 唔同）

## 5.2 Hermes 能力（Telegram 預設已開）

Telegram 使用 `hermes-telegram` toolset，包含：Web、Browser、Terminal、File、Memory、Skills、Cronjob、Messaging 等（terminal 有危險指令審批）。

Desktop（api_server）預設 toolset 較少；Tools 頁開關主要影響 **Desktop 通道**，唔使為 Telegram 而開。

## 5.3 Hermes 已啟用 Cron（HKT）

| 時間 | 名稱 | 交付 |
|------|------|------|
| 03:00 | overnight-content-pipeline | Telegram 🏆 Top 3 |
| 08:00 | 雙星系統晨報 | Telegram ☀️ |
| 13:00 | 午後 Research | Telegram 📊 |
| 20:20 | 每日回顧報告（GEPA） | Telegram 🎯 |
| 每月等 | 月度總結、MPF 提醒、課堂 reminder | Telegram |

## 5.4 Hermes ↔ OpenClaw 協作（B 軌）

- 研究類：**lt1634 → Antithesis → Hermes（8642 輕驗證）→ Albert 定案**
- Hermes 做：核對 DOI、抽查反證、短補充；**唔**重做全套 literature review
- 文檔：`docs/HANDOFF_HERMES.md`、`docs/HERMES_ROUTING_DECISION_TREE.md`

## 5.5 Hermes 已知痛點

- Desktop 需 gateway 行緊，否則 `ECONNREFUSED :8642`
- `.env` Chrome 路徑曾未加引號 → LaunchAgent 啟動失敗（已修）
- GEPA 報告曾誤寫「Telegram push 失敗」；實際 scheduler 已送達（prompt 已改）
- `uvx` 缺失 → MiniMax MCP 連接警告（唔影響主聊天）

---

# 第六部分：一日訊息時間軸（Telegram）

```text
03:00  🏆 Hermes overnight Top 3
04:xx  OpenClaw 記憶／整理（多為背景）
07:30  World ingest（無推送）
08:00  ☀️ Hermes 雙星晨報  +  JUMP 掃描（OpenClaw）
08:15  World 機會（若有）
12:10  📰 Hobby digest（LaunchAgent 腳本）
13:00  📊 Hermes 午後 research
14:00  World 午間機會（若有）
20:10  📰 Hobby digest（LaunchAgent）
20:20  🎯 Hermes GEPA 每日回顧
21:00  🌍 World 晚報
```

**審閱者請評估：** 是否過多？邊幾個可合併為「一份每日摘要」？

---

# 第七部分：硬體與維護

- **機器：** MacBook Air Apple Silicon（主力）
- **磁碟：** 曾清理 ~14GB+；Hermes 備份曾 ~5GB
- **網絡：** Telegram 在中國大陸環境偶發需 VPN
- **LaunchAgents（精選）：** `ai.hermes.gateway`、`ai.openclaw.content-digest-hybrid`、memory 相關 plist

---

# 第八部分：Agent 應避免／應多做

## 應避免

- 建議 Tim **合併** OpenClaw → Hermes（除非明確要單一系統）
- 未登入就報告 JUMP／OAuth 任務「完成」
- 投資推送用「立即買/賣」
- 再增加 **agentTurn** cron 做本可用 shell 完成嘅事
- 忽略 **Moments > Money**（催 post、催睇 analytics）

## 應多做

- 幫 Tim **合併通知**、標「需你 5 分鐘親做」vs「純資訊」
- T58／豆豆：**下一個最小可交付**（一個 deadline、一個檔案）
- 維護：**cron 健康儀表板**（昨日 timeout 幾次、邊個 job）

---

# 第九部分：關鍵檔案索引（俾審閱者延伸）

| 主題 | 路徑 |
|------|------|
| 記憶索引 | `~/Desktop/CL/docs/memory-index.md` |
| 專案索引 | `~/Desktop/CL/docs/PROJECTS-INDEX.md` |
| 自我探索 | `~/Desktop/CL/docs/personal/tim-self-exploration.md` |
| 投資狀態 | `~/Desktop/CL/docs/project-state/investment.md` |
| 世界模型 | `~/Desktop/CL/docs/WORLD_MODEL_PROJECT.md` |
| Digest 架構 | `~/Desktop/CL/memory/kb/digest-rss-architecture.md` |
| OpenClaw 索引 | `~/Desktop/CL/docs/OPENCLAW_INDEX.md` |
| Hermes handoff | `~/Desktop/CL/docs/HANDOFF_HERMES.md` |
| OpenClaw cron | `~/.openclaw/cron/jobs.json` |
| Hermes cron | `~/.hermes/cron/jobs.json` |

---

# 第十部分：審閱輸出格式（請 Gemini / Grok 跟此回覆）

請用以下結構回覆（粵語或繁中）：

```markdown
## 總評（1 段）

## 架構建議（合併 / 維持雙星 / 調整分工）

## Cron 優化清單（刪 / 改腳本 / 改時間）

## 對 Tim 生活目標嘅對齊度（1–10 分 + 理由）

## 風險與盲點（最多 5 點）

## 下週可執行 — Top 3 行動（每項 ≤30 分鐘人力）
```

---

*本檔由 Tim 本機 CL 倉庫自動彙編，供外部 AI 審閱；不含密鑰。最後更新：2026-05-21。*
