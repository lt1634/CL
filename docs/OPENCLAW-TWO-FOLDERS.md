# OpenClaw：兩個目錄點分（程式 vs 本機狀態）

> **用途**：減少 `~/Desktop/CL/openclaw` 同 `~/.openclaw` 混淆。  
> **相關**：Harness 檢查清單 [`CL-AGENT-HARNESS-CHECKLIST.md`](./CL-AGENT-HARNESS-CHECKLIST.md)、優化計劃 [`OPENCLAW_OPTIMIZATION_PLAN.md`](./OPENCLAW_OPTIMIZATION_PLAN.md)。  
> **注意**：本文 **唔** 記載任何 token／password。建議用 **`${OPENCLAW_GATEWAY_TOKEN}`**、**`${BRAVE_API_KEY}`** 等佔位寫入 `openclaw.json`，實際值放 `~/.openclaw/.env`（`chmod 600`）。詳見 [OPENCLAW_INDEX.md](./OPENCLAW_INDEX.md)。

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

## `~/.openclaw` 體積與維護（holistic）

| 路徑（約略） | 說明 | 可否亂刪 |
|--------------|------|----------|
| **`workspace/memory/notion-archive/`** | Notion 匯出／封存，常佔 **數 GB** | **唔好**；要騰空間請你自己決定保留邊啲頁再搬去外置碟。 |
| **`whisper-models/`** | 本機轉寫模型 | 刪咗要重新下載；唔用 Whisper 可先停服再刪。 |
| **`browser/`**、**`media/`** | 瀏覽／下載緩存 | 可刪以騰位；可能令要重新登入／重載。 |
| **`agents/`** | sessions、狀態 | **唔好**亂刪（對話歷史）。 |
| **`workspace/node_modules/`** | workspace 內腳本依賴 | 可 `rm -rf` 後按需再 `pnpm install`（視乎你有咩 workflow）。 |
| **`logs/gateway*.log`** | Gateway 日誌 | 可用 `tail -n N` 截斷保留尾段（已做過一次範例維護）。 |

**已做過嘅低風險清理（可重複）**：刪樹內所有 **`.DS_Store`**；刪與主檔 **內容完全相同** 嘅備份（例如曾出現嘅 **`IDENTITY.md.bak`**）；刪 **`antfarm/landing/index.html.bak`**（與 `index.html` 重複）；**截短** `logs/gateway.err.log`／`gateway.log` 只保留最後萬餘行。

**Spotlight 負載**：若機身發熱／索引狂轉，可將 **`browser/`**、**`media/`**、**`whisper-models/`**、**`workspace/memory/notion-archive/`** 加入 **Spotlight 私隱**（見 [MAC_THERMAL_SPOTLIGHT_ANALYSIS.md](./MAC_THERMAL_SPOTLIGHT_ANALYSIS.md)）。

**若用 Cursor 開本目錄**：已可放 **`~/.openclaw/.cursorignore`**（忽略 `node_modules`、`.venv` 等），與 CL repo 策略一致。

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

- 2026-04-03：補充 `~/.openclaw` 體積／維護與 Spotlight 建議。
- 2026-03-20：初版（對齊 Tim／CL 慣用路徑與「程式 vs 狀態」模型）。
