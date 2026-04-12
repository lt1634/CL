# OpenClaw 讀取 Notion 封存／加密檔：穩定做法（檢查清單）

> **目的**：減少「有時搜到、有時要靠 Background exec 先撞到」嘅不穩定；唔保證能破解 **真正 E2E 加密**（見下文）。  
> **相關**：[文檔索引](./OPENCLAW_INDEX.md)、[兩個目錄點分](./OPENCLAW-TWO-FOLDERS.md)、[優化計劃](./OPENCLAW_OPTIMIZATION_PLAN.md)。

---

## 1. 先分清：唔穩定通常唔係「運氣」，係三類原因之一

| 情況 | 徵兆 | 方向 |
|------|------|------|
| **A. 路徑唔喺 agent 預設工作範圍** | 直接問檔案內容失敗，但某次用長指令／背景執行時 cwd 或路徑剛好對 | 將封存 **納入 workspace** 或 **設定允許讀取嘅根目錄**（以你嘅 `openclaw.json` 實際欄位為準，常見名稱：`workspace`、`agents.*.workspace`、`sandbox`、`tools` 內路徑相關設定） |
| **B. 語意搜尋／索引冇包到** | `memory`／qmd 只索引 `workspace/memory` 等，封存 **從未被索引** | 將 `notion-archive` 加入 **RAG／qmd paths**，或 **定期同步摘要** 到 `memory/kb/` |
| **C. 真係加密或二進位格式** | 副檔名係 `.encrypted`、匯出 JSON 內有加密欄位、或唔係純文字 | Agent **無金鑰就讀唔出明文**；要 **解密工具**、或 **另存一份明文** 到 workspace |

---

## 2. 建議步驟（由易到難）

### 2.1 令「路徑」一致（最常見）

1. 確認封存實際路徑，例如：  
   `~/Documents/notion-archive/隨筆/Jan 2023`（以你機上為準）。
2. **二選一**（或兩樣都做）：
   - **符號連結** 放到預設 workspace 底下，令相對路徑永遠存在：  
     `ln -s "<真實封存路徑>" ~/.openclaw/workspace/notion-archive`
   - 喺 **`~/.openclaw/openclaw.json`** 搜尋 `workspace`、`sandbox`、`allow`、`path`、`root` 等關鍵字，將封存 **根目錄** 加入允許讀取範圍（欄位名以你安裝版本文件為準）。
3. **重啟 Gateway**（改咗路徑／沙盒相關多數要重啟先一致）。

### 2.2 `memory.qmd.paths` 格式（唔好用純字串）

OpenClaw 驗證要求 **`paths` 每一項係物件**，唔可以係單一路徑字串；錯誤例子：`"paths": [ "/path/to/notion-archive" ]`。  
正確例子：

```json
"memory": {
  "backend": "qmd",
  "qmd": {
    "includeDefaultMemory": true,
    "paths": [
      {
        "name": "notion-archive",
        "path": "/Users/你的用戶/.openclaw/workspace/memory/notion-archive",
        "pattern": "**/*.md"
      }
    ]
  }
}
```

若封存唔係 `.md`，可將 `pattern` 改為 `"**/*"`（以效能同噪音平衡為準）。

### 2.3 令「搜尋」同「讀檔」一致

- **語意搜尋**：若只靠 RAG，封存未入索引就會「以為冇」。將封存路徑加入 **qmd／memory 索引設定**，或 **每週 cron** 將重要事實寫入 `memory/kb/*.md`（見優化計劃內 archive 思路）。
- **直接讀檔**：對已知路徑，喺對話裡 **寫明完整相對 workspace 路徑**，減少模型亂猜。

### 2.4 若係 Notion 匯出嘅「加密頁」

- 官方匯出若 **唔包含解密後正文**，任何工具都讀唔到「內文」，唔係 OpenClaw bug。
- **務實做法**：對家庭里程碑（例如「最後去迪士尼」），維護 **`memory/kb/家庭里程碑.md`** 或 Notion 內 **一頁非加密、專門俾 agent 用嘅摘要**，由你或 cron 更新。

---

## 3. 點解「Background exec」有時先得？

可能包括（唔需要全部成立）：

- **逾時較長**：大目錄掃描喺前景超時，背景任務做完先回報。
- **工作目錄／權限唔同**：背景用戶與互動回合嘅 cwd 唔同。
- **工具組合唔同**：某次先觸發 `exec`／`grep` 讀到實體檔。

對齊 **2.1 + 2.3**（路徑 + 索引）之後，呢類「靠運氣」通常會減少。

---

## 4. 安全提醒

- 「讀晒一切」會包括 **憑證、私隱**；封存若有大把個人資料，建議 **分拆**：公開摘要入 `memory/kb`，敏感封存 **唔入 RAG** 或 **用子目錄 + exclude**。  
- 見 [OPENCLAW_SECURITY_AUDIT_2026.md](./OPENCLAW_SECURITY_AUDIT_2026.md)。

---

## 5. 你而家可以做的最小驗證

1. `ls -la ~/.openclaw/workspace/` 睇有冇 `notion-archive` 或你預期嘅連結。  
2. 用編輯器開 `~/.openclaw/openclaw.json`，全文搜 `workspace`、`sandbox`、`path`、`qmd`。  
3. 改完 → **重啟 Gateway** → 再問同一條問題，睇係咪穩定。

若你願意貼 **`openclaw.json` 內與 workspace／sandbox／tools 有關嘅段落**（遮 token／API key），可以再幫你對照應改邊幾行（以你版本為準）。

---

## 修訂記錄

- 2026-03-21：初版（封存路徑、索引、加密分層、背景執行差異）。
