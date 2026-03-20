# CL 專案 · Agent / Harness 檢查清單

> **用途**：對齊「清晰目標 + 可驗證反饋 + 邊界外置」嘅工程習慣（參考 Tw93 對 Agent 架構嘅整理：[X 帖文](https://x.com/HiTw93/status/2034627967926825175)）。  
> **點用**：開新任務／deploy／開多 Agent 前撳一次；做完一階段勾一項。

---

## A. 倉庫與邊界（做任何改動前）

- [ ] **改邊個子專案**寫清楚（例如只動 `art-prompt-generator-v2/`，唔亂改 `memory/kb/` 入面教學內容除非係你有意歸檔）。
- [ ] **敏感資料**：`.env`、`*.pem`、token **唔 commit**（根目錄 `.gitignore` 已含 `.env`；子專案亦有 `art-prompt-generator-v2/.gitignore`）。
- [ ] **大型二進位／匯出**：例如 `infographic_output/`、隨機下載嘅 PDF，預設 **唔加入 git**，除非你明確要版本化。
- [ ] **Submodule／巢狀 repo**（`.gitignore` 有提）：唔好當普通資料夾亂改 upstream。

---

## B. 主智能體工作區（OpenClaw / cron / 對外 delivery）

若你套用 `memory/kb/main-agent-workspace-templates/` 或 `sba-workspace-templates/`：

- [ ] 啟動順序跟 **該目錄嘅 `AGENTS.md`**：SOUL → USER → 今日/昨日日誌 → MEMORY（長期）。
- [ ] **安全硬規則**：PII 遮罩、allowlist 渠道、禁止寫 token 入 memory；寫檔路徑限制（見模板內文）。
- [ ] **記憶分層**：程式性流程 → Skills／文檔；情景 → `memory/YYYY-MM-DD.md`；穩定事實 → `MEMORY.md`（P0/P1/P2）；唔好單靠對話窗口撐長任務。
- [ ] **壓縮／整合**：若有 compact，保留優先級寫喺文檔（決策、已改檔、驗證狀態、TODO）；**唔好改壞** UUID / commit hash / 路徑。

參考文檔（若有用 OpenClaw）：[`docs/OPENCLAW-TWO-FOLDERS.md`](./OPENCLAW-TWO-FOLDERS.md)（程式目錄 vs `~/.openclaw` 狀態）、`docs/OPENCLAW_OPTIMIZATION_PLAN.md`、`docs/OPENCLAW_SECURITY_AUDIT_2026.md`、`memory/kb/openclaw-config-check-setup.md`。

---

## C. 編碼與 Harness（改 code 時）

- [ ] **可執行約束**：優先用 lint / typecheck / CI / 測試表達規則；唔好只寫長文期望 Agent「自己記住」。
- [ ] **改完要驗**：至少跑過與改動相關嘅一步（例如靜態頁面用本機或 `vercel dev` 開一次、API 用 curl／瀏覽器確認）。
- [ ] **第一個真實 bug → 測試或檢查步驟**：寫入 README 或小測試，避免同錯再犯。
- [ ] **工具／指令**：描述要似「路由」（何時用、何時唔用、預期輸出）；寧可少工具、粒度啱 Agent 目標。

---

## D. `art-prompt-generator-v2`（Web / Vercel / PWA）

- [ ] **靜態行為**：`index.html` + `prompts-dse.js` 改完喺 **HTTPS 或 localhost** 測（推播、SW 唔好依賴 `file://`）。
- [ ] **部署**：Vercel **Root Directory** 指向 `art-prompt-generator-v2`；有 `package.json` 時確保 build 會 `npm install`。
- [ ] **推播（若用）**：環境變數見 `.env.example`；`PUSH_TEST_SECRET` / VAPID **私鑰唔入庫**。
- [ ] **Service Worker**：改 `service-worker.js` 時適當 **bump `CACHE_NAME`**，方便客戶端更新。

---

## E. 上下文與 Skills（Cursor / 長對話）

- [ ] **常駐提示精簡**：詳情放 `docs/`、`memory/kb/`、子專案 `README`；需要再 `@` 或讀檔。
- [ ] **Skill 式文檔**：檔頭寫清 **Use when / Don’t use when / 產出**（免模型揀錯文檔）。
- [ ] **長輸出**：大段 log／JSON 優先 **落地做檔** 再 grep／分段讀，唔塞爆對話。

---

## F. 多 Agent / 並行（進階）

- [ ] **狀態外置**：進度用檔案或 PR／分支，唔好只靠「大家記住對話」。
- [ ] **隔離**：Worktree 或明確負責範圍，減少同事改同一層問題。
- [ ] **未有事實圖／inbox 協議**：未搞定協調格式前，**唔好**盲目加多幾個 Agent 並行。

---

## G. 做完一輪（收尾）

- [ ] **README / changelog**：對外可見行為有變就更細；Breaking change 寫明。
- [ ] **Deploy 後**：開 production URL 手動試一條關鍵路徑。
- [ ] **若曾撞安全或隱私問題**：CHK `memory/kb` 有冇要打補丁文檔，避免下個會話冇記錄。

---

## 相關路徑速查

| 內容 | 路徑 |
|------|------|
| 主 Agent 模板 | `memory/kb/main-agent-workspace-templates/` |
| SBA 模板 | `memory/kb/sba-workspace-templates/` |
| OpenClaw 計劃／安全 | `docs/OPENCLAW_*.md` |
| VA 題目 Web App | `art-prompt-generator-v2/` |
| 產品用語／設計 | `memory/kb/product-design/` |

---

*最後更新：2026-03-20（與 CL 倉庫結構對齊；随專案演進可改此檔。）*
