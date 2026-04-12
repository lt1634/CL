# B 軌：Hermes 小範圍實驗 Checklist（與 OpenClaw／A 軌並行）

**目標**：驗證 Hermes **learning loop**（自動生成／改進 skills 等）係咪真省維護；**主戰場仍係 OpenClaw**（現有 Telegram、cron、A 軌記憶）。

**官方入口**：[hermes-agent.org](https://hermes-agent.org/) · [NousResearch/hermes-agent](https://github.com/nousresearch/hermes-agent)

---

## 0. 開波前（必做）

- [ ] **確認邊啲係 OpenClaw 專用**：而家已綁嘅 **Telegram bot／帳號、WhatsApp、cron、Polymarket** → **唔好**喺 Hermes 用同一條 channel 重複接線（避免兩個 gateway 搶同一條路）。
- [ ] **決定 Hermes 第一階段邊界**：**只 CLI**（最穩）或 **全新測試用 bot token／測試群**（仍唔碰 main bot）。
- [ ] **預留時間**：安裝 + 第一次對話 **約 30–60 分鐘**；之後 **4 週** 每週約 **15 分鐘** 做觀察筆記。
- [ ] **模型／API**：準備 Hermes 支援嘅 provider（例如 OpenRouter／Anthropic／Nous Portal 等，以官方 docs 為準）；記低 **預算上限**。

---

## 1. 安裝（本機）

- [x] 跟官方 **Quickstart** 安裝（`curl … install.sh | bash -s -- --skip-setup` 已跑；OpenClaw migrate 未做）。
- [x] 使用 **獨立 `~/.hermes`**（唔覆蓋 `~/.openclaw`）；`hermes` → `~/.local/bin/hermes`。
- [x] **`config.yaml`**：`model.provider=openrouter`，`model.default=google/gemma-4-31b-it`。
- [ ] **`~/.hermes/.env`**：補齊 **`OPENROUTER_API_KEY`**、**`TELEGRAM_BOT_TOKEN`**（Hermes 專用新 bot）；`TELEGRAM_ALLOWED_USERS` 已預填。
- [x] **`hermes gateway install`**（LaunchAgent `ai.hermes.gateway`）；填好 token 後跑 [`projects/hermes-standalone/post-install.sh`](../../projects/hermes-standalone/post-install.sh) 或 `hermes gateway restart`。
- [ ] 完成 **`hermes` CLI** 試對話：`hermes`（需 OpenRouter key 先有效）。
- [ ] （可選）README 若仍寫 **從 OpenClaw import**：**第一階段建議唔做全量 import**，避免同 A 軌 **MEMORY／skills 定義混淆**；最多手動種子：`USER`／3 條 P0 事實。

---

## 2. 接線策略（避免同 OpenClaw 衝突）

- [ ] **第一週**：**唔接** Telegram／WhatsApp；只用 **terminal／Hermes 內建 CLI 對話**。
- [ ] **若要接 IM**：只加 **新 bot（新 token）** 或 **只畀你自己入嘅測試群**；**禁止**用 OpenClaw `bindings` 已用嘅 **同一 bot**。
- [ ] **Port／服務**：若 Hermes 有 local gateway，確認 **唔同 OpenClaw gateway port**（你 OpenClaw 曾用 `18789`）；有衝突就改 Hermes 或關掉一邊測試。

---

## 3. 第一週：驗證「會唔會學」

- [ ] 揀 **一類會重複做嘅任務**（例如：固定格式摘要、同一類檔案整理、重複嘅研究步驟），**故意做 5+ 次**（呼應常見「重複多次→skill」敘事；實際門檻以 Hermes 版本為準）。
- [ ] 檢查有冇 **自動新增／更新 skills**（路徑以官方 docs 為準，例如 `~/.hermes/...`）。
- [ ] 記低：**有冇減少你手寫同一段規則嘅次數**。

---

## 4. 第 2–4 週：對照 A 軌

每週填一次（可複製到 `memory/YYYY-MM-DD.md`）：

| 週次 | Hermes 自動 skill 次數（約） | 有冇省時間／Token 感覺 | 翻車／要人手執嘅事 |
|------|------------------------------|-------------------------|---------------------|
| W2   |                              |                         |                     |
| W3   |                              |                         |                     |
| W4   |                              |                         |                     |

- [ ] **對照 OpenClaw**：同一週 A 軌（codesfly／janitor／QMD）有冇已滿足你大部份「記憶」需求？Hermes **獨特價值**係邊啲？

---

## 5. 第 4 週末：決策

- [ ] **加碼 B**：擴大 Hermes 使用範圍（仍建議 **唔接管** OpenClaw 現有 main channel，除非你有遷移計畫）。
- [ ] **維持雙軌**：OpenClaw＝執行／渠道；Hermes＝實驗／特定類任務。
- [ ] **收掉 B**：關 Hermes 服務、刪測試 bot；保留筆記當決策紀錄。
- [ ] **（進階）全遷 Hermes**：只喺 B 軌證明極值得且願意付 **遷移＋重綁渠道＋重審 exec 權限** 成本時先做；另開遷移 checklist。

---

## 6. 安全與私隱（快速）

- [ ] **唔好**把 **token、API key** 寫入可被同步嘅 memory／公開 repo。
- [ ] 測試 bot **allowlist** 只加自己；群測試用 **私密測試群**。
- [ ] Hermes 若接 **Honcho／雲端記憶**：讀清楚 **資料存邊、點刪除**（本機 only 與雲端方案唔同）。

---

## 7. 與本倉庫文檔嘅關係

- **A 軌**：[docs/OPENCLAW_OPTIMIZATION_PLAN.md](../../docs/OPENCLAW_OPTIMIZATION_PLAN.md)、[openclaw-codesfly-local-setup.md](./openclaw-codesfly-local-setup.md)
- **Hermes 唔係 Honcho-on-OpenClaw**：要「Hermes 式閉環」→ 用 **Hermes 本體**（B 軌）；OpenClaw 上 **Honcho plugin** 係另一條路（見 [openclaw-a-track-honcho-optional.md](./openclaw-a-track-honcho-optional.md)）。

---

*最後更新：2026-04-11（配合 A／B 軌並行計畫）。官方指令以 Hermes 當前 docs 為準。*
