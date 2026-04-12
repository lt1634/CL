# OpenClaw 文檔索引（Desktop/CL）

本頁聚合倉庫內與 OpenClaw 相關嘅 **`docs/`** 與 **`memory/kb/`** 連結，方便由計劃／安全／cron 一條線查。

---

## 核心概念與目錄

| 文檔 | 用途 |
|------|------|
| [OPENCLAW-TWO-FOLDERS.md](./OPENCLAW-TWO-FOLDERS.md) | 程式 repo vs `~/.openclaw` 狀態目錄 |
| [OPENCLAW_SECURITY_AUDIT_2026.md](./OPENCLAW_SECURITY_AUDIT_2026.md) | 安全審計、`.env` 權限、風險清單 |
| [OPENCLAW_OPTIMIZATION_PLAN.md](./OPENCLAW_OPTIMIZATION_PLAN.md) | 優化與落地項 |
| [WHATSAPP_SELF_CHAT_LOOP.md](./WHATSAPP_SELF_CHAT_LOOP.md) | self-chat／WhatsApp 注意 |
| [CRON-API-FORMAT.md](../CRON-API-FORMAT.md) | `jobs.json` 欄位格式（object 唔好串成 string） |
| [CL-AGENT-HARNESS-CHECKLIST.md](./CL-AGENT-HARNESS-CHECKLIST.md) | Agent 工作區與 harness 檢查 |

---

## 密鑰與設定（唔寫明 token）

- **`~/.openclaw/openclaw.json`**：建議用 **`${OPENCLAW_GATEWAY_TOKEN}`**、**`${BRAVE_API_KEY}`** 等字串替換（見 [OpenClaw Environment](https://docs.clawd.bot/help/environment)），實際值放 **`~/.openclaw/.env`**，`chmod 600`。
- 若曾將含明文嘅設定截圖、複製到聊天或誤提交 git，請 **輪換** Gateway token 與相關 API key，並 **重啟 Gateway**。

---

## 本機狀態（唔入庫）

| 位置 | 說明 |
|------|------|
| `~/.openclaw/cron/jobs.json` | Cron 定義與 `lastError`／delivery 狀態 |
| `~/.openclaw/workspace/memory/kb/whatsapp-issues.md` | WhatsApp 斷線、Message failed、PATH／sleep 實務 |

---

## 工具腳本

| 項目 | 路徑 |
|------|------|
| Cron 狀態頁產生器 | [agent-status-page.mjs](../agent-status-page.mjs) → 預設輸出 `docs/agent-status.html` |
| 用法說明 | [memory/kb/agent-cron-狀態頁用法.md](../memory/kb/agent-cron-狀態頁用法.md) |

預設讀取：`$HOME/.openclaw/cron/jobs.json`。自訂：`CRON_FILE=... OUT=... node agent-status-page.mjs`。

---

## memory/kb 延伸

- [polymarket-learning-playbook.md](../memory/kb/polymarket-learning-playbook.md) — 月 ≤50 USD 學習實驗、決策日誌邊界；配套 [polymarket-api-cheatsheet.md](../memory/kb/polymarket-api-cheatsheet.md)、[polymarket-cron-instructions.md](../memory/kb/polymarket-cron-instructions.md)、[openclaw-polymarket-log-only-spec-and-env.md](../memory/kb/openclaw-polymarket-log-only-spec-and-env.md)（Log-only 日誌 spec + env）；個人檔案喺 `~/.openclaw/workspace/memory/polymarket/`；NBA 單場見 [nba-match-analysis-framework.md](../memory/kb/nba-match-analysis-framework.md)（`/poly` 會套用）
- [openclaw-config-check-setup.md](../memory/kb/openclaw-config-check-setup.md) — 每週 config check cron
- [agent-cron-錯誤修復記錄.md](../memory/kb/agent-cron-錯誤修復記錄.md) — timeout、Edit 失敗、main vs isolated
- [tui-gateway-disconnected-whatsapp-works.md](../memory/kb/tui-gateway-disconnected-whatsapp-works.md) — TUI disconnected 唔等於 WhatsApp 全壞
- [openclaw-b-track-hermes-checklist.md](../memory/kb/openclaw-b-track-hermes-checklist.md) — B 軌：Hermes 小範圍實驗 checklist（與 OpenClaw 並行、唔搶 channel）

---

## memory/kb 分類速覽（檢索用）

| 類別 | 代表檔案 |
|------|-----------|
| **Cron／狀態頁** | [agent-cron-狀態頁用法.md](../memory/kb/agent-cron-狀態頁用法.md)、[agent-cron-錯誤修復記錄.md](../memory/kb/agent-cron-錯誤修復記錄.md)、[weekly-memory-compact-cron.md](../memory/kb/weekly-memory-compact-cron.md) |
| **OpenClaw 操作／Gateway** | [openclaw-config-check-setup.md](../memory/kb/openclaw-config-check-setup.md)、[gateway-restart-with-cl-repo-openclaw.md](../memory/kb/gateway-restart-with-cl-repo-openclaw.md)、[openclaw-點開-TUI-客戶端.md](../memory/kb/openclaw-點開-TUI-客戶端.md) |
| **Whisper／轉寫** | [whisper-asr-openclaw-transcription-endpoint.md](../memory/kb/whisper-asr-openclaw-transcription-endpoint.md)、[whisper-three-choices.md](../memory/kb/whisper-three-choices.md) |
| **SBA／工作區模板** | [sba-students.md](../memory/kb/sba-students.md)、[sba-daily-work-flow.md](../memory/kb/sba-daily-work-flow.md)、[main-agent-workspace-templates/](../memory/kb/main-agent-workspace-templates/README.md)、[sba-workspace-templates/](../memory/kb/sba-workspace-templates/README.md) |
| **產品／搞錢** | [搞錢長期計劃-7技能與Agent協作.md](../memory/kb/搞錢長期計劃-7技能與Agent協作.md)、[搞錢-OpenClaw-服務說明.md](../memory/kb/搞錢-OpenClaw-服務說明.md) |
| **Polymarket 學習（只讀）** | [polymarket-learning-playbook.md](../memory/kb/polymarket-learning-playbook.md)、[polymarket-github-resources.md](../memory/kb/polymarket-github-resources.md) |
| **外部文章摘要** | [Karpathy-autoresearch-AI自主研究.md](../memory/kb/Karpathy-autoresearch-AI自主研究.md)、[AI-Edge-7-AI-Skills-2026.md](../memory/kb/AI-Edge-7-AI-Skills-2026.md) 等 |

`SBA`：`sba-students.md` 已改為**索引**，長文喺 `sba-students-work/<名>/student-profile.md`；快照見 `memory/archive/sba-students-2026-04-03-monolithic.md`。

---

## 倉庫體積與效率（holistic）

| 位置 | 約略體積 | 建議 |
|------|-----------|------|
| `openclaw/` | ~3GB+ | 屬 **node monorepo**；已列 `.gitignore`。日常用 **只開子資料夾** + 根目錄 [`.cursorignore`](../.cursorignore)；Spotlight 可排除 `node_modules`（見 [MAC_THERMAL_SPOTLIGHT_ANALYSIS.md](./MAC_THERMAL_SPOTLIGHT_ANALYSIS.md)）。 |
| `crewai/`、`projects/` | 大 | 內含 **venv／依賴**；勿整棵 commit；Cursor 已忽略 `**/.venv/`、`**/node_modules/`。 |
| `art-prompt-generator-v2/infographic_output/` | 輸出物 | **唔好**喺輸出目錄建 `.venv`**；需要時喺專案根另建 venv。大圖／PPT 只留必要版本，其餘歸檔或刪。 |

**已清理嘅無用物**：根目錄誤建之 `https:`（URL 殘留）、`prompts-dse.js.bak`、`infographic_output/.venv`。
