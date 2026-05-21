# Company Board（`company-board.jsonl`）Schema — 系統憲法

**單一事實來源（SSOT）**：每行一個 **JSON object**（UTF-8），**append-only**。人類速讀可另用 `TASKS.md`（由 jsonl 摘要生成，唔係真源）。

**寫入規則（權限）**

| 角色 | 可做的事 |
|------|-----------|
| **Albert（總協調）** | 改 **`task` 主狀態**／**`owner`**／**`state`**（透過 `type: state_set` 事件）；派工 Hermes；解 `blocked` |
| **Antithesis、lt1634、系統** | **只准 append** `evidence`、`critique`、`error`、`retry` 等；**唔准**直接改另一行舊 JSON（只追加新行表達更正） |
| **Hermes** | **直接 append** `hermes_async_dispatch`、`hermes_result`、`timeout_warning`（自己發動的任務自行收尾）；其他 entry 仍經 Albert |
| **中控台（Next）** | **唯讀**；copy-on-read |

**實體寫檔**：任何 append **一律經 [board-writer](../tools/company-board-writer/)**。Albert 派工的 entry 由 Albert 呼叫 writer；Hermes 自主派工（`hermes_async_dispatch`）或自行完成的 `hermes_result`／`timeout_warning` 由 **Hermes 直接**呼叫 writer，並以 **`writer: hermes`** 欄位標示。`actor: hermes` 表示**語意來源**係 Hermes 軌。

**必備欄位（每一行）**

| 欄位 | 類型 | 說明 |
|------|------|------|
| `seq` | string | **ULID**（或時間排序唯一 ID）；全檔單調遞增，方便 tail／去重 |
| `ts` | string | **ISO8601** UTC，例 `2026-04-13T08:30:00.000Z` |
| `type` | string | 事件類型，見下表 |
| `task_id` | string | 任務 ID，例 `T42` |
| `actor` | string | `albert` \| `antithesis` \| `lt1634` \| `hermes` \| `system` \| `boss` |

**常用 `type` 枚举**

| type | 用途 | 建議額外欄位 |
|------|------|----------------|
| `state_set` | Albert 設定主狀態／owner | `state`, `owner`, `summary` |
| `evidence` | lt1634 證據／摘要 | `summary`, `refs`（URL 或路徑陣列） |
| `critique` | Antithesis 反駁 | `summary`, `targets_seq`（可選） |
| `retry` | 重試紀錄 | **`attempt`**（整數，建議必填）、`detail` |
| `error` | 失敗 | **`message`**（建議必填）、**`attempted_steps`**（陣列或字串，建議填已試步驟） |
| `blocked` | 等人類（獨立事件行；可與 `state_set`+`state:blocked` 同用） | **`question`（必填、非空字串）**、`boss_channel`（建議填，如 `telegram`） |
| `boss_reply` | 老闆回覆（parse 自 IM） | `action`: `approve` \| `reject` \| `more_info`, `reason` |
| `hermes_dispatch` | 將交 Hermes | `hermes_prompt`, `files`, `timeout_minutes`, `idempotency_key`；建議 **`parent_seq`** 指上一條相關 `critique`／`evidence` 嘅 `seq` |
| `hermes_async_dispatch` | Hermes 自主派工（由 Hermes 直接發動，非 Albert 派） | `hermes_prompt`, `files`, `timeout_minutes`, `idempotency_key`；**`writer`: `hermes`** 標示寫入者 |
| `hermes_result` | Hermes 完成（語意） | `summary` 或 `error`，`idempotency_key`；**實際 append 見上「實體寫檔」** |
| `timeout_warning` | 任務接近截止時間（`due_ts` 臨近觸發） | **`due_ts`**, **`minutes_until_due`**, `summary` |

**`state` 枚举（語意層，存在 `state_set` 或冗餘於其他行方便 filter）**

`idle` | `working` | `blocked` | `failed` | `done`

**可選欄位**

| 欄位 | 說明 |
|------|------|
| `locked_by` | 誰持有邏輯鎖（通常 `actor` + task） |
| `lock_until_ts` | 鎖過期時間（ISO） |
| `backup_agent` | 後備接手人 |
| `idempotency_key` | 防重複派工／重複 Hermes 呼叫 |
| `writer` | 實體寫入者（hermes \| albert \| system）；Hermes 直接 append 時標示 `hermes` |
| `due_ts` | 任務截止時間（ISO8601 UTC）；用於 `timeout_warning` 觸發判斷 |
| `parent_seq` | 因果鏈上一行 `seq`（補派、`hermes_dispatch` 對準上一條 `critique`／舊 `hermes_result` 等） |
| `supersedes_seq` | （慣例、可選，**append-only 友善**）寫喺**新**一行：填「被本行取代」嘅上一條 **`hermes_result.seq`**（或上一條 `hermes_dispatch.seq`）；中控台以 **時間序最新 `seq`** 為主，此欄作輔助 |
| `superseded_by` | （少用）若工具鏈支援「補寫 metadata」至舊行則可；**純 append jsonl** 時請改用 **`parent_seq`／`supersedes_seq`** 由新行指舊行 |

**`state_set` 與 `summary`**：`summary` 喺欄位層為**建議**；**操作約束**：跳過 Hermes、收口、blocked 等，**強烈建議** Albert 寫非空 `summary`（或獨立 `type:blocked` 嘅 `question`），否則難 tail／難審計。

**board-writer 驗證**（可選）：設環境變數 **`BOARD_REJECT_EMPTY_BLOCKED_QUESTION=1`** 時，獨立 `type: blocked` 若 **`question` 空或缺** → writer **throw**、唔寫檔。預設 **唔開**（免破壞舊腳本）；正式管線建議開。

**併發**：**唔好**多 process 直接 append 同一檔。請用 [tools/company-board-writer](../tools/company-board-writer/) **單一寫入代理**。OpenClaw 側各 agent 經 `sessions_send` 交 **Albert** 代為呼叫 writer；**Hermes** 喺 **`hermes_async_dispatch`／自寫 `hermes_result`／`timeout_warning`** 範圍內可 **直接**呼叫 writer（仍係單一 append 入口，避免 raw 多 process 寫檔）。

**輪替**：建議按日檔名 `company-board-YYYY-MM-DD.jsonl`；中控台 tail **當日 + 最近 3 日**。見 `rotate-board.mjs`。

---

## 範例行（每行完整 JSON）

```json
{"seq":"01JQXYZ...","ts":"2026-04-13T08:00:00.000Z","type":"state_set","task_id":"T42","actor":"albert","state":"working","owner":"lt1634","summary":"開始搜證"}
```

```json
{"seq":"01JQXYZ...","ts":"2026-04-13T08:05:00.000Z","type":"evidence","task_id":"T42","actor":"lt1634","summary":"三條來源已核對","refs":["https://example.com/a"]}
```

```json
{"seq":"01JQXYZ...","ts":"2026-04-13T08:10:00.000Z","type":"hermes_result","task_id":"T42","actor":"hermes","summary":"腳本輸出摘要…","idempotency_key":"T42-hermes-20260413-1","writer":"hermes"}
```

```json
{"seq":"01JQXYZ...","ts":"2026-04-13T08:15:00.000Z","type":"hermes_async_dispatch","task_id":"T43","actor":"hermes","hermes_prompt":"分析競爭者專案","timeout_minutes":30,"writer":"hermes","idempotency_key":"T43-async-20260413-1"}
```

```json
{"seq":"01JQXYZ...","ts":"2026-04-13T09:00:00.000Z","type":"timeout_warning","task_id":"T43","actor":"hermes","due_ts":"2026-04-13T09:30:00.000Z","minutes_until_due":30,"summary":"T43 接近截止","writer":"hermes"}
```

驗證：每行須為合法 JSON；`seq`+`ts`+`type`+`task_id`+`actor` 缺一不可（`hermes_result`、`hermes_async_dispatch`、`timeout_warning` 用 `actor:hermes` 表語意來源，**並以 `writer:hermes` 標示直接寫入**）。獨立 `type: blocked` 須有非空 **`question`**。
