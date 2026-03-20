# OpenClaw：兩個目錄點分（程式 vs 本機狀態）

> **用途**：減少 `~/Desktop/CL/openclaw` 同 `~/.openclaw` 混淆。  
> **相關**：Harness 檢查清單 [`CL-AGENT-HARNESS-CHECKLIST.md`](./CL-AGENT-HARNESS-CHECKLIST.md)、優化計劃 [`OPENCLAW_OPTIMIZATION_PLAN.md`](./OPENCLAW_OPTIMIZATION_PLAN.md)。  
> **注意**：本文 **唔** 記載任何 token／password；秘密喺 `~/.openclaw/.env`、`openclaw.json` 嘅 `gateway.auth` 等。

---

## 一句分清

| 路徑 | 角色 |
|------|------|
| **`~/Desktop/CL/openclaw`** | **原始碼 repo**（`.git`、`src/`、`pnpm start gateway`、`node scripts/run-node.mjs …`）。 |
| **`~/.openclaw`** | **本機狀態目錄**：設定、workspace、credentials、sessions、已安裝 skills、cron、browser／media 緩存等。 |

兩者 **唔應合併**；**唔好** 將 `~/.openclaw` 整個提交到 git。

---

## `~/.openclaw` 常見內容（概念）

- **`openclaw.json`**：主設定（Gateway、agents、模型、工具等）。
- **`workspace/`**、**`workspace-agent2`**～**`workspace-agent4`**、**`workspace-sba`**：各 agent 工作目錄與記憶。
- **`agents/`**：agent 狀態、**sessions**（對話持久化）。
- **`skills/`**、**`workspace/.../skills/`**：本機技能（**唔等於** repo 內 `openclaw/skills/`）。
- **`credentials/`**、**`.env`**：敏感資料，權限宜嚴（見安全審計文檔）。
- **`browser/`**、**`media/`**：緩存／下載，體積可很大；清理前先 **備份**。

---

## `~/Desktop/CL/openclaw` 常見用途

- 開發／對齊上游、執行：
  - `pnpm start gateway`
  - `node scripts/run-node.mjs tui --session=main`（具體參數以你安裝版本 `--help` 為準）
- **`node_modules/`**、**`dist/`**：可重建；刪除後 `pnpm install` / build 即可。

---

## 日常操作口訣

1. **起 Gateway / 跑 CLI**：先 `cd ~/Desktop/CL/openclaw`。
2. **改模型、Channel、安全**：改 **`~/.openclaw/openclaw.json`**，然後按你流程 **重啟 Gateway**。
3. **TUI**：本機若已設好 Gateway，多用 **`tui --session=main`**；若手動 `--url=…`，通常要 **`--token`**（與 `gateway.auth` 一致）— 以當前 CLI 錯誤提示為準。

---

## 可選：zsh 別名

```bash
alias ocdev='cd ~/Desktop/CL/openclaw'
# 編輯設定請用自己慣用編輯器開 ~/.openclaw/openclaw.json
```

---

## 修訂記錄

- 2026-03-20：初版（對齊 Tim／CL 慣用路徑與「程式 vs 狀態」模型）。
