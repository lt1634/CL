# 從 Berryxia / Shubham Saboo「OpenClaw 養成記」學到嘅嘢 — 點改 1號 agent 同 SBA 助手

（參考：[Berryxia.AI 整理翻譯](https://x.com/berryxia/status/2028668902465733084)，原文 Shubham Saboo）

**適用對象：**  
- **1號 agent**（主 agent / default，例如 `~/.openclaw/workspace` 嗰個）  
- **SBA 助手**（專用 SBA workspace，例如 `~/.openclaw/workspace-sba`）

兩者都用同一套三層架構（身份層、操作層、知識層），只係內容唔同。

> **注意（update 對象）：** 之後嘅 **update / 修改** 以 **主 agent（1號）** 為對象，唔係 SBA。除非你明確講「改 SBA」。

---

## 核心觀念

- **智能體唔會因為用得多而變聰明**，變嘅係**佢周圍嘅檔案**：更豐富、更準、更貼你需求。呢啲累積嘅 context 先係護城河。
- 唔好淨係調 prompt、換模型、搞編排框架。**同佢講嘢、畀 feedback、睇住佢寫落檔案**。
- 成個系統就係**磁碟上嘅 Markdown 檔案**；檔案系統本身就係集成層。

---

## 三層架構 → 兩個 agent 對應

| 層級 | 解決咩問題 | 1號 agent（主） | SBA 助手 |
|------|------------|-----------------|----------|
| **身份層** | 係誰？為誰服務？ | SOUL.md, **IDENTITY.md**, **USER.md** | SOUL.md（SBA 規則）, **IDENTITY.md**, **USER.md** |
| **操作層** | 點幹活？點自愈？ | **AGENTS.md**, HEARTBEAT.md | **AGENTS.md**, HEARTBEAT 可選 |
| **知識層** | 學到咩？ | **MEMORY.md**, memory/YYYY-MM-DD.md | **MEMORY.md**, memory/kb/sba-students.md, review-*.md |

---

## 1號 agent（主 agent）要改 / 要加嘅嘢

- **Workspace**：通常係 `~/.openclaw/workspace`（或你 openclaw.json 裡 `agents.list` 第一個 / default 嘅 workspace）。
- **身份層**：SOUL.md（你已有嘅人格）、**IDENTITY.md**（名、氣質、Emoji）、**USER.md**（你本人：名、時區、偏好）。
- **操作層**：**AGENTS.md** — 每次會話讀 SOUL → USER → memory/今日+昨日 → MEMORY（主會話）；記憶規則「文字 > 腦」、安全規則。可沿用 OpenClaw 官方 AGENTS.md 範本，或喺其基礎上加「讀 MEMORY.md」。
- **知識層**：**MEMORY.md** — 精煉長期記憶、血淚教訓、你嘅偏好；memory/YYYY-MM-DD.md 做每日日誌。

範本檔案：**memory/kb/main-agent-workspace-templates/**（見下文「你要做嘅步驟」）。

---

## SBA 助手要改 / 要加嘅嘢

### 1. 身份層

- **SOUL.md** — 已有（或將會放）完整 SBA system prompt。保留。
- **IDENTITY.md** — **新增**。快速參考卡：名「SBA助手」、角色、氣質、Emoji；發去 Telegram/WhatsApp 時會用到。
- **USER.md** — **新增**。智能體服務嘅人：老師名、時區（Asia/Hong_Kong）、中五 SBA、6 位學生、偏好（例如：要粵語、每生 1–2 任務、Success criteria、鼓勵句）。

### 2. 操作層

- **AGENTS.md** — **新增**。定義「每次會話」做咩：
  1. 讀 SOUL.md（身份）
  2. 讀 USER.md（服務對象）
  3. 讀 `memory/kb/sba-students.md`（學生清單與進度）
  4. 若有 `memory/kb/sba-students-work/review-*.md`（課前分析結果），讀最新一份
  5. 若在主會話：讀 MEMORY.md  
  記憶規則：**文字 > 腦**；有人講「記住」或畀糾正 → 更新 MEMORY.md 或 sba-students.md。安全：唔好洩露私人資料、有疑問先問。

### 3. 知識層

- **MEMORY.md** — **新增**。精煉長期記憶：老師嘅出題/評語偏好、血淚教訓（例如「唔好一次出 30 人」）、「永遠不要再建議」嘅範式。一次糾正，寫入一次，以後每次會話都跟。
- **memory/kb/sba-students.md** — 已有。等同「共享情報」：學生主題、進度、督導策略。
- **memory/kb/sba-students-work/review-{日期}.md** — 課前 cron 睇圖分析後生成，當日任務與 comment 可喺度。

---

## 單一寫者原則（若日後多過一個 agent）

Saboo 建議：每個共享檔案只由**一個** agent 寫，多個讀。SBA 目前只有一個助手，若日後加「daily work 分析」agent，要分清楚邊個寫 review、邊個只讀 sba-students.md。

---

## 你要做嘅步驟

### 1號 agent（主 agent）

1. 將 **memory/kb/main-agent-workspace-templates/** 入面嘅 **IDENTITY.md, USER.md, MEMORY.md** 複製去你**主 agent workspace 根目錄**（例如 `~/.openclaw/workspace/`）。
2. 若未有 **AGENTS.md**，可從 OpenClaw 官方範本複製：`openclaw/docs/reference/templates/AGENTS.md`，或直接用 main-agent-workspace-templates 裡嘅簡化版（若有）。
3. 填好 **USER.md**（你嘅名、時區、偏好）。
4. **SOUL.md** 若已有可保留；**MEMORY.md** 留空，之後同 1號 agent 講「記住呢點」佢會寫入。

### SBA 助手

1. 將 **memory/kb/sba-workspace-templates/** 入面嘅 **IDENTITY.md, USER.md, AGENTS.md, MEMORY.md** 複製去你 **SBA agent** 嘅 workspace 根目錄（例如 `~/.openclaw/workspace-sba/`）。
2. 按需要改 **USER.md**（老師名、時區、偏好）。
3. 確保 **SOUL.md** 喺同一 workspace，內容係完整 SBA prompt。
4. 確保 **memory/kb/** 喺同一 workspace 底下（或路徑一致），有 sba-students.md、sba-students-work/。
5. 之後同 SBA 助手講嘢、畀 feedback 時，叫佢「記住呢點」→ 佢會寫入 MEMORY.md，下次就會跟。

---

## 參考

- Berryxia.AI 整理翻譯（X）：https://x.com/berryxia/status/2028668902465733084  
- Shubham Saboo 原文：https://x.com/Saboo_Shubham_/status/2027463195150131572  
