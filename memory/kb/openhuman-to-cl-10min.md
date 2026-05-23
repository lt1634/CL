# OpenHuman → CL 腳本仿製（10 分鐘對照表）

**前提**：唔安裝 OpenHuman、唔換主線。只抄 **3 個** 可腳本化、同你現有 **OpenClaw + world ingest + janitor** 疊加嘅能力。

**閱讀時間**：約 10 分鐘（表 + 每項 2 分鐘操作）。

---

## 總表（3 項值得做）

| # | OpenHuman 功能 | 為何值得仿製 | CL 對應（已落地） | 安裝 OpenHuman？ |
|---|----------------|--------------|-------------------|------------------|
| **1** | **Memory Tree：定期 auto-fetch → 本機 Markdown** | 減「每次 prompt 先撈資料」；agent 開工已有昨日上下文 | `fetch_feeds.py` + **`snapshot-to-markdown.py`** → `memory/world/snapshots/latest.md` | ❌ 唔需要 |
| **2** | **Token／記憶壓縮（熱層有上限）** | 控制 bootstrap 成本；避免 MEMORY／daily 無限膨脹 | **`memory-janitor.sh`** + **`archive-daily-logs.sh`** + **`token-estimate.sh`** | ❌ 唔需要 |
| **3** | **簡單狀態儀表板（一眼睇 cron／健康）** | 唔使開 Telegram／log 逐個查 | **`agent-status-page.mjs`** + **`refresh-status-dashboard.sh`** | ❌ 唔需要 |

---

## 對照：OpenHuman vs 你而家

| 維度 | OpenHuman | 你（CL + OpenClaw） |
|------|-----------|---------------------|
| 核心執行 | 桌面 app + Rust core | Gateway :18789 + LaunchAgent |
| 資料進記憶 | 118 OAuth，~20min sync | RSS world + project-state + 手動 kb |
| 熱記憶 | Memory Tree（SQLite+MD） | `MEMORY.md` ≤200 行 + qmd-root |
| 狀態 UI | 內建 Dashboard | `docs/agent-status.html` |
| 24/7 自動化 | 內建 | `jobs.json` cron（isolated） |
| 授權 | GPL-3.0 整包 | 你只維護腳本，唔 fork 佢 core |

---

## 1️⃣ Memory Tree 式快照（最值得）

### OpenHuman 做咩

- 連接帳號後，**定時**把外部資料拉落本機，壓成 **Markdown 樹**，agent 開工前已有上下文。

### CL 仿製（唔要佢個 app）

| 步驟 | 命令／路徑 |
|------|------------|
| 拉資料（已有） | `python3 tools/world-ingest/fetch_feeds.py` |
| **JSON → 可讀 MD** | `python3 tools/world-ingest/snapshot-to-markdown.py` |
| 輸出 | `~/.openclaw/workspace/memory/world/snapshots/latest.md` |
| 自動掛鉤 | `tools/world-ingest/morning-world-ingest.sh`（早晨 cron 會跑） |

### Agent 點用

- 讀 **`world/snapshots/latest.md`**（今日 ingest 摘要）
- 深資料仍用 `events/*.jsonl`、`WORLD_STATE.md`
- **唔**把 snapshots 加進 qmd（避免噪音；見 `memory-qmd-recommended.json`）

### 未來可加（仍唔裝 OpenHuman）

| 來源 | 仿製方式 |
|------|----------|
| Gmail / Calendar | 獨立 `tools/connectors/gmail-snapshot.py` + OAuth 放 `~/.openclaw/credentials/` |
| GitHub notifications | `gh api` → 每日一行寫入 `snapshots/github-YYYY-MM-DD.md` |
| Notion（若需要） | 官方 API → 只 sync 指定 database id |

**原則**：一個來源一個小腳本，輸出統一進 `snapshots/` 或 `memory/kb/inbox/`。

---

## 2️⃣ Token 壓縮／janitor

### OpenHuman 做咩

- 長期資料本地化，**熱層**保持精簡，避免每次會話帶成噸 context。

### CL 仿製

| 工具 | 作用 | 觸發 |
|------|------|------|
| `memory-janitor.sh` | `MEMORY.md` ≤200 行、P2 過多提示 | 手動／週一 cron |
| `archive-daily-logs.sh` | `memory/YYYY-MM-DD.md` >14 日 → `archive/dailies/` | 週一 cron |
| `token-estimate.sh` | 粗估 token（chars÷4）→ `token-budget.json` | `refresh-status-dashboard.sh` |
| `setup-memory-tiered.sh` | qmd 只索引 hot paths | 本機一次 |

### 門檻（可驗收）

| 指標 | 目標 |
|------|------|
| `MEMORY.md` | ≤200 行 |
| 熱記憶 token（估算） | ≤3000 |
| 根目錄 daily | 只留近 14 日 |

### OpenHuman 有、你刻意唔抄

- 全庫 SQLite 索引 → 你已有 **qmd**；重複造輪唔划算。

---

## 3️⃣ 狀態 UI

### OpenHuman 做咩

- 桌面內一眼睇：連線、同步、agent 狀態。

### CL 仿製

```bash
~/Desktop/CL/ops/openclaw/refresh-status-dashboard.sh
open ~/Desktop/CL/docs/agent-status.html
```

| 區塊 | 內容 |
|------|------|
| 摘要 | job 總數、啟用、ok、錯誤數 |
| Gateway | `health-status.json`、port 18789 提示 |
| Memory | `token-budget.json`、hints |
| 表格 | 全部 cron（同以前） |

### 可加（各 ≤30 分鐘）

- 讀 `openclaw cron list` JSON 一欄顯示 **model**
- 連結 `docs/project-state/` 最新 mtime
- 每 5 分鐘 meta refresh（純 HTML，optional）

---

## ❌ 唔建議仿製（10 分鐘內決策）

| OpenHuman 功能 | 點解唔用腳本抄 |
|----------------|----------------|
| 118 一鍵 OAuth hub | 攻擊面大；違反你 allowlist／credentials 隔離 |
| 桌面吉祥物 / Google Meet 入會 | 產品向，同 headless Mac mini 無關 |
| 內建 model 路由訂閱（TokenJuice） | 你已有 MiniMax + OpenRouter fallbacks |
| 整包 GPL 桌面安裝 | 等於第二套 OS，遷移成本 >> 收益 |

---

## 10 分鐘操作清單（照做即驗收）

```bash
cd ~/Desktop/CL

# ① 世界層快照（~2 min）
python3 tools/world-ingest/fetch_feeds.py
python3 tools/world-ingest/snapshot-to-markdown.py
head -30 ~/.openclaw/workspace/memory/world/snapshots/latest.md

# ② Token 預算（~1 min）
tools/openclaw-memory-janitor/token-estimate.sh
tools/openclaw-memory-janitor/memory-janitor.sh

# ③ 儀表板（~1 min）
ops/openclaw/refresh-status-dashboard.sh
open docs/agent-status.html

# ④ Gateway 仍用 OpenClaw（~30 sec）
openclaw gateway status
```

**預期**：snapshot 有今日標題；token-budget.json 有數字；HTML 見 Gateway + Memory 兩格；gateway probe ok。

---

## 一頁決策

| 問題 | 答案 |
|------|------|
| 要裝 OpenHuman 嗎？ | **唔要** |
| 最值得抄幾樣？ | **3 樣**：snapshot MD、janitor+token、status HTML |
| 主線？ | **OpenClaw + CL + Hermes B** |
| 詳細維護指南？ | [openclaw-selective-borrowings.md](./openclaw-selective-borrowings.md) |

---

*對照來源：OpenHuman README（Memory Tree、118 integrations、desktop UI）；CL 實作以 repo 腳本為準。*
