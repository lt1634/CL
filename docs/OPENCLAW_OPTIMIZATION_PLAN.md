# OpenClaw 優化計畫 — 對照「六個小提示」

**對照來源**：Lazar Jovanovic / 社群分享的 OpenClaw 使用心法  
**目標**：從「幫做事」轉向「設計不用做事的系統」

---

## 一、現狀 vs 建議 對照表

| 提示 | 建議做法 | 你目前 | 缺口 | 優先級 |
|-----|----------|--------|------|--------|
| **1. Linear-First** | 任務 → 先開 issue → comment 記錄 | 有 GitHub skill，無 issue-first 流程 | 未養成「先記錄再做事」習慣 | 🟡 中 |
| **2. Multi-Agent** | 工作/個人/coding 分離，獨立記憶 | 1號 + 2/3/4號，但無職責分工 | Agent 未按用途命名、未分工作/生活 | 🟡 中 |
| **3. Sub-Agent** | 複雜任務 spawn 出去 | `subagents.maxConcurrent: 8` ✓ | 已具備，需加強「主動 spawn」意識 | 🟢 低 |
| **4. Multi-Model** | Primary + Fallback | **僅 MiniMax M2.5/M2.1** | ⚠️ 單一 provider，無備援 | 🔴 高 |
| **5. 三層記憶** | 熱/冷/原始，200 行內 | qmd 語意搜尋，~1736 行 memory/*.md | 無 P0/P1/P2、無 archive、無 janitor | 🔴 高 |
| **6. 持續進化** | 週回顧、token 檢視、HEARTBEAT | 無相關 cron / 流程 | 無自動化檢討機制 | 🟡 中 |

---

## 二、逐項實踐計畫

### 🔴 提示 4：Multi-Model 備援（最高優先）

**現狀**：只有 Minimax，額度/服務中斷時全部停擺。

**目標配置**：

```json
"agents": {
  "defaults": {
    "model": {
      "primary": "minimax/MiniMax-M2.5",
      "fallbacks": ["minimax/MiniMax-M2.1", "kimi/kimi-k2-thinking"]
    }
  }
}
```

**實施步驟**：
1. 在 `openclaw.json` 的 `agents.defaults.model` 加入 `fallbacks` 陣列
2. 新增 Kimi 或其他 provider（需有 API key）：
   ```bash
   openclaw models auth add --provider kimi
   ```
3. 在 `models.providers` 新增 kimi / deepseek 等（擇一你有額度的）

**若暫無其他 provider**：至少加 `["minimax/MiniMax-M2.1"]` 作為 M2.5 的 fallback。

---

### 🔴 提示 5：三層記憶

**現狀**：`workspace/memory/` 約 1736 行，全部進 qmd 語意搜尋，易造成噪音。

**目標架構**：

```
workspace/memory/
├── MEMORY.md          # 熱記憶 ≤200 行，加 [P0/P1/P2]
├── archive/           # 冷記憶，語意搜尋召回
└── 2026-02-*.md       # 原始日誌，不主動載入
```

**實施步驟**：

| 步驟 | 動作 | 命令/路徑 |
|------|------|-----------|
| 1 | 建立 MEMORY.md | `touch ~/.openclaw/workspace/memory/MEMORY.md` |
| 2 | 從 tim-context.md 提煉 P0/P1 寫入 MEMORY | 手動編輯，加 `[P0]` `[P1]` 標籤 |
| 3 | 建立 archive/ | `mkdir ~/.openclaw/workspace/memory/archive` |
| 4 | 調整 qmd paths | `memory.qmd.paths` 排除 `archive/`、`**/2026-*.md`，或只索引 `MEMORY.md` + `kb/` |
| 5 | 建立 memory-janitor script | 每天 cron：過期 P1/P2 移入 archive |

**MEMORY.md 範例**：

```markdown
## [P0] 核心身份（永不過期）
- Tim，用 OpenClaw 做 AI 助理與自動化
- 偏好粵語回覆

## [P1] 活躍專案（90 天）
- Antfarm feature-dev OAuth 任務
- daily-learner 腳本

## [P2] 臨時（30 天）
- （本週重點）
```

---

### 🟡 提示 1：Linear-First（Issue-First）

**實施**：用 GitHub Issues 取代 Linear（你已有 `gh` skill）

1. 在 `main` agent 的 SOUL.md 或 system prompt 加一條規則：
   - 「收到任務時，先問：要不要開一個 GitHub issue 記錄？」
2. 或建立 skill：`issue-first`，觸發時執行 `gh issue create` 並回傳連結
3. 習慣養成：口頭說「呢個開 issue 先」→ agent 幫你開

**最低可行**：手動 `gh issue create`，在 comment 貼與 AI 的討論摘要。

---

### 🟡 提示 2：Multi-Agent 職責分離

**現狀**：1號、2號、3號、4號 無明確用途。

**建議重新命名與用途**：

| Agent | 新用途 | Workspace | 說明 |
|-------|--------|-----------|------|
| main (1號) | 全能 / 個人 | workspace | 預設，生活+工作混合 |
| agent2 | 工作專案 | workspace-agent2 | 只處理專案任務 |
| agent3 | Coding | workspace-agent3 | 寫程式、Antfarm、腳本 |
| agent4 | 生活雜務 | workspace-agent4 | 生活、提醒、購物等 |

**實施**：改 `agents.list` 的 `name` 與 `description`，並在 IDENTITY.md 寫清楚職責。切換方式：「用 agent3 做」或 routing 規則。

---

### 🟡 提示 6：持續進化

**實施項目**：

| 項目 | 做法 | 頻率 |
|------|------|------|
| Token 用量檢視 | `openclaw models usage` 或 logs 分析 | 每週 |
| Communication Guidelines | 建立 `workspace/memory/GUIDELINES.md` 記錄該說/不該說 | 一次 + 需時更新 |
| HEARTBEAT 檢討 | 若有用 heartbeat，每兩週檢討 prompt | 每兩週 |
| 週回顧 Cron | 週日 cron 讓 agent 自問：這週做得好/可改進/該主動做但沒做 | 每週日 |

**週回顧 Cron 範例**（需有對應 skill）：

```json
{
  "schedule": { "kind": "cron", "expr": "0 20 * * 0" },
  "task": "週回顧：這週我在哪些地方做得好？哪些可改進？有沒有該主動做但沒做的事？"
}
```

---

## 三、實施優先順序建議

```mermaid
graph LR
  A[4. Multi-Model 備援] --> B[5. 三層記憶]
  B --> C[2. Multi-Agent 職責]
  C --> D[1. Issue-First]
  D --> E[6. 持續進化]
```

1. **本週**：Multi-Model fallback（加 M2.1 或另一 provider）
2. **兩週內**：建立 MEMORY.md + archive，調整 qmd paths
3. **一個月內**：Agent 職責分離、Issue-First 習慣
4. **持續**：週回顧、token 檢視

---

## 四、可複製的 Config 變更

### 4.1 加 Model Fallback（立刻可做）

```bash
# 在 openclaw.json 的 agents.defaults.model 加：
"fallbacks": ["minimax/MiniMax-M2.1"]
```

### 4.2 記憶路徑調整（qmd）

```json
"memory": {
  "qmd": {
    "paths": [
      { "name": "hot", "path": "~/.openclaw/workspace/memory", "pattern": "MEMORY.md" },
      { "name": "kb", "path": "~/.openclaw/workspace/memory/kb", "pattern": "**/*.md" }
    ]
  }
}
```

（依需要排除 `archive/`、`2026-*.md`）

---

## 五、小結

| 心法 | 你已有 | 待補 |
|------|--------|------|
| Linear-First | GitHub skill | 流程與習慣 |
| Multi-Agent | 4 個 agent | 職責與命名 |
| Sub-Agent | maxConcurrent 8 | 主動 spawn 意識 |
| Multi-Model | ❌ | **fallbacks 必加** |
| 三層記憶 | qmd 語意搜尋 | 熱/冷分層、janitor |
| 持續進化 | ❌ | 週回顧、檢討機制 |

**三個立刻可做**：
1. 加 `model.fallbacks`
2. 建 `MEMORY.md` 並從 tim-context 提煉 P0/P1
3. 把 agent2/3/4 改名為「工作」「Coding」「生活」
