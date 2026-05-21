# OpenClaw（Albert）→ Hermes（8642）Handoff

> **觸發條件決策樹**（Mermaid + 任務板 `type` 順序）：[HERMES_ROUTING_DECISION_TREE.md](./HERMES_ROUTING_DECISION_TREE.md)

> **OpenClaw workspace 鏡像**（俾 agent 用相對路徑讀）：`~/.openclaw/workspace/memory/kb/HANDOFF_HERMES.md`  
> 改動請同步兩邊，或只改本檔再複製過去。

**前提**：Hermes 獨立 gateway；**唔共用** OpenClaw Telegram bot。本機 API 見 Hermes `API_SERVER_*`（預設概念 `127.0.0.1:8642`）。

## Context payload（固定 JSON）

Albert 決定派工時組裝（再映射到 OpenAI-compatible `chat/completions` 或 `runs`，以 Hermes 版本為準）：

```json
{
  "task_id": "T42",
  "hermes_prompt": "濃縮指令；唔好塞全文上下文",
  "files": ["/absolute/path/one", "/absolute/path/two"],
  "timeout_minutes": 15,
  "idempotency_key": "T42-hermes-20260413-1"
}
```

## 流程

1. Albert append board：`type: hermes_dispatch`，內容含上列欄位（可嵌在 `summary` 旁邊或扁平欄位，以 `COMPANY_BOARD_SCHEMA.md` 為準）。
2. 呼叫 Hermes HTTP client：**timeout ≥ timeout_minutes**（建議多加 30s 緩衝）；唔好用 30s 預設。
3. **Albert（或授權自動化）** 收到 8642 完整回應後，經 **board-writer** append：`type: hermes_result`, `task_id`, **`actor: hermes`**（表語意來源），**`writer: albert`**（表寫入者）, `summary` 或 `error`，同一 `idempotency_key`；建議 **`parent_seq`** 指對應 **`hermes_dispatch.seq`**。

   **（Hermes 自寫範圍例外）**：若 entry 屬 **`hermes_async_dispatch`** 或 **`timeout_warning`**，Hermes 直接呼叫 board-writer，**`writer: hermes`** 由 writer 自動填補（唔經 Albert）。
4. **Albert** 再 append `state_set` 更新 `state`／`owner`。

## 正向管線（唔淨係 failover）

**Hermes 唔只喺 2 號／Antithesis 連續失敗時先用。** 對 **研究／置信度類** 任務（例如醫學命題、要 PubMed／表格核對），預設管線建議：

**2 號（lt1634 輪）→ Antithesis → Hermes（B 軌輕驗證）→ Albert 最終裁決與 `state_set:done`**

- **Hermes 做咩**：短 prompt——核對 2 號列出嘅 DOI／PMID 可解析、抽查一條反證、或補一個對照來源；**唔**重做整套 literature review。
- **Board**：Antithesis 之後、`done` 之前，**必**有同一 `idempotency_key` 嘅 `hermes_dispatch` + `hermes_result`（成功或 `error` 都要寫結果）。
- **例外跳過**：Tim 明確話「趕時間唔經 Hermes」或題目純 workspace 內檔、無需 8642 → 最後一個 `state_set` 嘅 `summary` 註明 **跳過 Hermes 原因** 即可。

## 失敗

HTTP 超時、5xx、或 Hermes 回傳 error → append `error` + `state_set` → `failed` 或 `blocked`（老闆）。

**`hermes_result` 跳過句式（建議原文）：** `Hermes B軌跳過（web timeout，基建問題）` —— 寫入 `summary` 即可與歷史任務（T51／T52 等）對齊口徑。

## 附件（PDF／相片）處理（Hermes 目前只穩定吃文字）

Hermes（同大多數「文字為主」代理）對 **PDF / JPEG / 相片**通常無法「直接讀內容」；**標準做法係先轉成純文字**再派工。

### 推薦流程（可上雲端版本，免費）

- **若 PDF 本身可選字**（電腦輸出 PDF）  
  用 macOS「預覽」直接全選複製 → 貼成文字 → 交俾 Hermes。

- **若係掃描 PDF／照片／截圖**  
  用 Google Drive：上傳 → 右鍵「以 Google 文件開啟」→ 讓 Google OCR → 複製文字 → 交俾 Hermes。  
  （私隱：上傳雲端有風險；敏感文件唔建議）

### 派工 payload 建議

將 OCR 文字包一層 metadata（避免 Hermes 亂理解）：

```text
【來源】<檔名>
【檔案類型】PDF-scan / photo / screenshot / PDF-text
【語言】zh-TW / en / mixed
【任務】請做摘要 / 抽取欄位 / 翻譯 / 核對與列疑點

【OCR 文字開始】
...
【OCR 文字結束】
```

### Research prompt 長時間無回（實務）

**Web fetch timeout（已調整 2026-04）：** Hermes `web_tools.py` 原本將 **Tavily HTTP** 同 **Firecrawl scrape** **硬編碼 60s**，PubMed/PMC 類頁面好易撞牆。已改為 **`_web_fetch_timeout_seconds()`**：預設 **180s**，可用 **`HERMES_WEB_FETCH_TIMEOUT_SECONDS`**（15–900，你本機已寫 **240**）或 `config.yaml` → `auxiliary.web_extract.fetch_timeout_seconds` 覆蓋；改完 **重啟 Hermes gateway**。若仍 timeout，再查 DNS／代理／Firecrawl 額度／改用 `browser_navigate` 等。

若 **短 prompt（幾秒內）正常**，但 **帶 PubMed／PMC／多 URL／一般 web fetch** 嘅 prompt **仍 timeout**：Albert 應 **append `hermes_result`**（`summary` 寫明 timeout／跳過）再 **`state_set:done`**，喺 `summary` 註明「Hermes B 軌跳過、原因、日後可補驗」——唔建議長期用 `blocked` 卡收件匣（除非係等你業務拍板）。修好 Hermes 後用 **新 `idempotency_key`** 或子任務 **T51b** 補輕驗證。

**補驗約定（二揀一即可）：** 開 **`T51b`**（新 `task_id`）**或** 同一題目 **新 `hermes_dispatch` + 新 `idempotency_key`**（唔重用已寫 `hermes_result` 嗰條 key，避免語意重疊）。

## Provider 層 ReadTimeout（唔係 web fetch）

Hermes log 若見 **`Connection to provider dropped (ReadTimeout). Reconnecting…`**：屬 **對上游 LLM** 讀取逾時，與本節 **web fetch** 超時係兩件事。排查與加長 **request／read timeout** 見 workspace：**`memory/kb/hermes-provider-readtimeout-reconnecting.md`**。

## Next 代理（可選）

va-bots-home 提供 `POST /api/hermes/proxy`（見該專案 README）可做本機轉發並統一寫 **telemetry**。
