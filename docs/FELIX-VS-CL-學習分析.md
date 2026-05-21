# Felix 點解做到、我哋點學習 — 對照與行動清單

**對照來源**：Bankless 訪談 Nat Eliason — Felix AI Agent 月營收 8 萬美金、零人類公司  
**目的**：檢視我哋 CL 工作區同 Felix-style 嘅差距，拎出可執行嘅學習步驟。

---

## 一、Felix 成功嘅五條支柱（摘要）

| 支柱 | Felix 點做 | 我哋要學嘅嘢 |
|------|------------|----------------|
| **1. 每晚 1% 自我改進** | 凌晨 2:00 cron：回顧當日所有 session → 找**一個**改進點 → 直接改自己嘅記憶檔/模板/script；對下屬 Agent 凌晨 1:00 先 review 再改其記憶與設定 | **每日**改進迴圈、agent **自己改自己**嘅檔案 |
| **2. 多 Agent 且有「管理關係」** | 有客服 Agent、銷售 Agent；Felix 會「伸手進去」改 Remy（銷售）嘅記憶與系統 | 唔止多 agent，要有一個「主腦」負責 review + 改其他 agent 嘅設定 |
| **3. 營收閉環** | PDF 自動賣、Claw Sourcing 收設定費+月費、自動更新內容、自動監控部署出去嘅 Agent 健康 | 有「收錢」嘅產品/服務，而且流程自動化 |
| **4. 人類幾乎唔寫 code** | Nat 只透過 Discord 語音同 Felix 溝通；API key 等必要時先由人提供 | 行為由 **Markdown + cron + 模板** 驅動，唔靠人手寫邏輯 |
| **5. 成本極低、可複製** | 月成本 ~1,500 美金（訂閱+主機+一次性 Mac Mini） | 用訂閱制工具 + 少量主機，唔使大團隊 |

---

## 二、我哋 CL 有咩、缺咩（對照表）

| 維度 | 我哋已有 | 缺口 | 優先 |
|------|----------|------|------|
| **每日自我改進** | 週回顧 cron（週日）、HEARTBEAT 輕量檢查、weekly memory compact | **無「每日」**回顧；**無「改自己檔案」**嘅 cron（Felix 係每晚改 MEMORY/模板/script） | 🔴 高 |
| **多 Agent 管理** | 1 號 + SBA、subagents、職責分離有規劃 | 無「主 agent 改下屬 agent 記憶/設定」嘅流程；無客服/銷售等**角色化**子 agent | 🟡 中 |
| **營收/商業化** | 無 | 無產品線、無 Stripe/收費、無「Agent 幫人做嘢然後收費」 | 🟡 中（若目標係學習可押後） |
| **人類少寫 code** | ✅ 接近：openclaw-cron.sh、少量腳本；大量靠 kb + 模板 | 已符合「minimal code」 | — |
| **排程與交付** | Cron、WhatsApp delivery、isolated session、config-check | 已有基礎，可再加「每日改進」job | 🟢 低 |
| **記憶與檢索** | 三層記憶設計（P0/P1/P2）、MEMORY.md、archive、weekly compact | 熱/冷分層部分未完全落地（見 OPENCLAW_OPTIMIZATION_PLAN）；**無「agent 自己改 MEMORY/模板」** | 🔴 高 |

**一句對照**：  
Felix 嘅核心係「**每晚自動 review + 改自己（同下屬）嘅 .md / 設定**」；我哋有週回顧同 HEARTBEAT，但**無每日、無「寫入檔案」嘅改進迴圈**，亦無「主 agent 改子 agent」嘅設計。

---

## 三、點學習：三階段行動清單

### 階段 1：先有「每日 1% 改進」迴圈（學 Felix 最核心）

**目標**：唔追求營收，先追求「agent 每晚自己睇 session、改自己」。

1. **加一個每日 cron job**（例如凌晨 2:00 Asia/Hong_Kong）  
   - **Payload**：  
     「讀取今日（及可選昨日）嘅 session 相關紀錄或 memory 摘要。從中找出**一個**可以改進嘅地方（例如：回覆太長、某類問題未按 MEMORY 做、漏做某步驟）。只選一個。然後：若係記憶/流程問題，更新 `MEMORY.md` 或 `memory/kb/` 裡一個相關 .md；若係行為問題，在 `AGENTS.md` 或 `HEARTBEAT.md` 加一句具體指引。改動要具體、可驗證。完成後回覆一句：今日改進點係咩、改咗邊個檔。」
   - **Session**：`isolated`，避免打擾主會話。  
   - **Delivery**：可選 WhatsApp/你慣用管道，方便你朝早睇「昨晚改咗咩」。

2. **俾 agent 寫入權**  
   - 確保 cron 用嘅 workspace 路徑內，agent 有權寫入 `MEMORY.md`、`memory/kb/`（或你指定嘅改進目錄）。  
   - 若你唔想佢亂改，可限制為：只准寫入 `memory/archive/improvements-YYYY-MM-DD.md`，再由你手動 merge 入 MEMORY/AGENTS。

3. **從「一週一次」升級到「每日」**  
   - 你已有週回顧；在唔刪除週回顧嘅前提下，**加**呢個每日 job。  
   - 第一週可先設為「每兩日一次」做測試，確認改動合理再改每日。

**成功標準**：連續 7 日，每日都有一個具體、可追溯嘅「改進點 + 改咗邊個檔」。

---

### 階段 2：「主 agent 改下屬 agent」（學 Felix 嘅多 Agent 管理）

**目標**：唔止多 agent，而係有一個 agent 負責 review 同改其他 agent 嘅設定。

1. **定義一個「主腦」agent**  
   - 例如用現有 1 號做主腦；或專設一個「ops」agent，只做 review + 改設定。

2. **加 cron：主腦 review 子 agent**  
   - 例如每週一次（或每日，若你肯）：主腦 session 讀取「SBA 助手」或指定 agent 嘅 `MEMORY.md`、`AGENTS.md`、最近 session 摘要（若有）。  
   - Payload：「找出一個可改進點，直接修改該 agent workspace 內嘅 MEMORY.md 或 AGENTS.md（或寫入 improvement 建議檔）。」

3. **單一寫者 + 路徑**  
   - 每個子 agent 嘅 MEMORY/AGENTS 只由「主腦」或該子 agent 自己改，避免衝突（你已有「單一寫者」概念，可沿用）。

**成功標準**：至少一次，主腦 cron 跑完後，子 agent 嘅 MEMORY 或 AGENTS 多咗一條可辨識、合理嘅改進。

---

### 階段 3：營收/產品化（可選）

**目標**：學 Felix 嘅「有產品、有收錢、自動化」。

1. **揀一個最小可賣嘅產品**  
   - 例如：一份 PDF（像 Felix 嘅 OpenClaw 設定指南）、或一個「幫人建一個專用 Agent」嘅服務（像 Claw Sourcing）。  
   - 先唔追求 8 萬，追求「有一條自動化嘅營收線」。

2. **用現有工具串起來**  
   - 網站 + Stripe：可交俾 agent 用 skill/腳本生成靜態頁 + 支付連結；或你用 No-code 做一版，agent 負責內容更新。  
   - 關鍵：**更新、出貨、通知**盡量由 cron + agent 做，你只負責關鍵審批或 API key。

3. **健康檢查**  
   - 若有「部署出去嘅 Agent」，學 Felix：每 15 分鐘檢查健康，壞咗自己修或通知你（你已有 config-check cron，可擴展成「服務健康」檢查）。

---

## 四、技術上要補嘅嘢（對照優化計畫）

你 **OPENCLAW_OPTIMIZATION_PLAN.md** 已經有：

- 🔴 Multi-Model fallback、三層記憶落地 → 建議繼續做，同「每日改進」無衝突。  
- 🟡 持續進化 → **「每日改進 cron」就係「持續進化」嘅具體落地**，可當成提示 6 嘅第一優先實作。

**Markdown 係最有價值嘅檔案**（文中觀點）：  
你已經用大量 .md 做 SOUL/IDENTITY/USER/AGENTS/MEMORY/HEARTBEAT；Felix 嘅 1% 複利，正正係「每晚改呢啲 .md」。所以下一步唔係寫多啲 code，而係**讓 agent 有規律地改呢啲 .md**。

---

## 五、一句總結

- **Felix 做到嘅**：每晚 cron 回顧 session → 找一個改進點 → **自己改自己（同下屬）嘅記憶/模板/設定**；再加營收閉環同多 Agent 管理。  
- **我哋做唔到嘅（目前）**：無「每日」改進、無「agent 寫入 MEMORY/AGENTS/模板」嘅自動迴圈、無主 agent 改子 agent 嘅設計、無營收線。  
- **最值得學、最快見效**：加一個**每日凌晨嘅 cron**，payload 明確叫 agent「回顧 → 找一個改進 → 改一個 .md」，並俾佢寫入權（或先寫 improvement 檔你再 merge）。  
- **之後**：再加「主腦改下屬」cron；若目標係賺錢，再揀一條最小產品線用現有 OpenClaw + 交付通道串起來。

---

## 附錄：每日自我改進 Cron 範例

下面係一個可直接加入 `~/.openclaw/cron/jobs.json` 嘅 job 範例（格式符合 CRON-API-FORMAT：schedule / payload / delivery 為 **object**，唔係 string）。

**Job 名稱**：`daily-self-improvement-001`  
**時間**：每日凌晨 2:00 Asia/Hong_Kong  
**Session**：isolated  

```json
{
  "id": "daily-self-improvement-001",
  "name": "Daily self-improvement (Felix-style)",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "0 2 * * *",
    "tz": "Asia/Hong_Kong"
  },
  "sessionTarget": "isolated",
  "wakeMode": "now",
  "payload": {
    "kind": "agentTurn",
    "message": "【每日改進任務】請讀取今日（及若可昨日）與本 workspace 相關的 session 或 memory 摘要。從中找出「一個」可改進的地方（例如：回覆太長、某類問題未按 MEMORY 做、漏做某步驟）。只選一個。然後：若係記憶/流程問題，更新 MEMORY.md 或 memory/kb 內一個相關 .md；若係行為問題，在 AGENTS.md 或 HEARTBEAT.md 加一句具體指引。改動要具體、可驗證。完成後回覆一句：今日改進點係咩、改咗邊個檔。若無合適改進，回覆「今日無改動」即可。"
  },
  "delivery": {
    "mode": "announce",
    "channel": "whatsapp",
    "to": "YOUR_ALLOWLISTED_NUMBER"
  }
}
```

**使用前**：  
1. 將 `YOUR_ALLOWLISTED_NUMBER` 改成你 cron delivery allowlist 裡已有嘅號碼（勿把完整號碼寫入 memory/kb）。  
2. 確認 isolated session 用嘅 workspace 有權寫入 MEMORY.md、AGENTS.md、HEARTBEAT.md、memory/kb。  
3. 若用 `openclaw-cron.sh` 管理，可先手動把上述 job 加入 `~/.openclaw/cron/jobs.json`，再 `restart` gateway。

---

## 附錄 B：階段 1 檢查結果（2026-03-13）

對住「階段 1」做過嘅檢查：

| 檢查項 | 結果 | 備註 |
|--------|------|------|
| **Cron 格式** | ✅ 通過 | `~/.openclaw/cron/jobs.json` 內現有 job 的 schedule / payload / delivery 均為 object；isolated + agentTurn 配 WhatsApp 已有先例（如 overnight-app-001、memory-compact-weekly-001）。 |
| **Delivery 號碼** | ✅ 已有 | 其他 job 已用 `+85267605407` 作 WhatsApp 收件；daily-self-improvement-001 已用同一號碼，無需改。 |
| **Workspace 寫入權** | ✅ 合理 | Isolated session 使用 default workspace（~/.openclaw/workspace）；現有 overnight-app-001、memory-compact-weekly-001、config-check-weekly-001 等已成功寫入 MEMORY.md、memory/archive、memory/kb、config-check-last.md。 |
| **潛在注意** | ⚠️ 一處 | 有 job（content-digestion-collect）曾報錯「Edit: in memory/automation-master.md failed」— 若每日改進 job 寫檔失敗，可先限寫入 `memory/archive/improvements-YYYY-MM-DD.md` 或檢查該 workspace 路徑權限。 |
| **main vs isolated** | ✅ 正確 | 每日改進用 `sessionTarget: "isolated"` + `payload.kind: "agentTurn"`；若用 main 則必須用 `systemEvent`（見 daily-thought-capture 的 lastError）。 |

**結論**：階段 1 條件已滿足，已加入 `daily-self-improvement-001`；跑幾日後可開啟階段 2 job `master-review-sba-001`。

**已做嘅改動**：  
- 在 `~/.openclaw/cron/jobs.json` 已加入 **daily-self-improvement-001**（每日 02:00 Asia/Hong_Kong，isolated，WhatsApp 送 +85267605407），`enabled: true`。  
- 同檔案內已加入 **master-review-sba-001**（階段 2：每週六 21:00 主腦 review SBA），`enabled: false`。跑順階段 1 後，把該 job 的 `"enabled": false` 改為 `true` 並 `openclaw-cron.sh restart` 即可。若 SBA workspace 唔係 `~/.openclaw/workspace-sba/`，請改 payload 內路徑。
