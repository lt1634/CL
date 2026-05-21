# Mac 發熱與 Activity Monitor 分析（存檔）

**日期參考**：2026-04-03（對話當日整理）  
**用途**：之後若再出現 `fseventsd`／`mds_stores` 長期高 CPU、機身發熱，可按此文逐步處理。

---

## 1. 觀察摘要（來自活動監視器截圖 + 終端取樣）

### CPU

- **`fseventsd`**、`**mds_stores**` 長期各約 **100%+ CPU**（佔用多於一個核心）。
- 取樣曾見：**`fseventsd` ~132% CPU**、**`mds_stores` ~93% CPU**。
- **`openclaw-gateway`** 曾出現 **~128% CPU**（間歇性；唔使時可停）。
- **`kernel_task`** 有一定比例時，可能與系統溫控／資源調度有關。

### 記憶體

- **`fseventsd`** 曾達 **~8.76 GB**（對此程序而言異常偏大；正常多為較小記憶體占用）。
- **`mds_stores`** 約 **~4 GB** 級別。
- **記憶體壓力** 曾呈橘色；**Swap** 曾約 **4.49 GB**（`vm.swapusage` 亦曾見 **~4.6 GB / 5 GB** 已用）。

### 能耗

- **Spotlight** 在「能耗」分頁曾顯示極高 **能耗影響**（例如 ~539.7），與索引行為一致。

### 磁碟

- **`fseventsd`** 累計讀取量極大（截圖曾見數百 GB 級）。
- 曾見 **每秒寫入次數極高**（例如數千次/秒）與不低嘅持續寫入頻寬；配合 Swap 會加重 SSD 讀寫與發熱。

### 本機環境線索

- **`/Users/timnewmac/Desktop/CL`** 整體約 **5 GB**；**`openclaw/node_modules`** 約 **2.5 GB**；其下曾統計約 **34 個 `node_modules` 目錄**。
- 大量細檔與頻繁變更會觸發 **檔案事件監看（FSEvents）** 與 **Spotlight 索引**，形成高負載。

---

## 2. 結論：主要成因

1. **主因**：**`fseventsd` + Spotlight（`mds` / `mds_stores`）** 因 **巨型依賴目錄與頻繁檔案變動** 而長時間高 CPU／高磁碟活動。
2. **放大器**：**RAM 壓力 + 大量 Swap** → SSD 讀寫增加 → 整體發熱與卡頓感上升。
3. **次要／間歇**：**`openclaw-gateway`**、**Cursor／Brave** 多分頁、雲端同步（如 Dropbox）若同步大型專案目錄，可疊加負載。
4. **次要背景 IO**：**`WallpaperAerialsExtension`**（動態／航拍桌布）磁碟讀取多；通常不如索引主因嚴重，但可改靜態桌布減少背景讀檔。

---

## 3. 建議處理步驟（順序）

### A. 立刻降溫（低風險）

- 關閉唔需要嘅 App、**Brave 多分頁**、多餘 **Cursor** 視窗。
- **唔使時停止 `openclaw-gateway`**（例如以 `pnpm start gateway` 啟動者，唔需要對外服務時應停）。
- **重新開機**：對 **`fseventsd` 異常佔用大量 RAM** 往往最有效（清隊列／釋放狀態）；之後再配合 B，避免立刻再次打滿索引。

### B. 治本（強烈建議）：Spotlight「私隱」排除目錄

**路徑**：系統設定 → **Siri 與 Spotlight** → **Spotlight 私隱（Privacy）**

建議加入（按實際需要取捨；排除後該路徑**不會**再被 Spotlight 索引）：

- 至少：**`/Users/timnewmac/Desktop/CL/openclaw/node_modules`**
- 若唔依賴 Spotlight 搜程式碼：可考慮整個 **`/Users/timnewmac/Desktop/CL/openclaw`**
- **大量輸出／快取／虛擬環境**（例）：
  - **`/Users/timnewmac/Desktop/CL/art-prompt-generator-v2/infographic_output/`**（內含 **`.venv`** 等海量細檔，極適合排除）

加完後 **等待 10–30 分鐘**，再觀察 **`mds_stores` / `fseventsd`** 是否明顯下降。

### C. 減少開發工具造成的檔案監看壓力

- 盡量不要長期開住唔需要嘅巨型 monorepo；或使用 **`.cursorignore`** 忽略 **`node_modules`、`dist`、`build`、`.next`、大型 `assets`** 等（實際效果視編輯器行為而定）。

### D. 桌布（可選）

- 改為**靜態**桌布，停用動態航拍／影片桌布，減少背景磁碟讀取。

### E. 不建議自行亂試（除非 Apple 支援指引）

- 勿隨意強殺 **`fseventsd` / `mds_stores`**（系統會重啟，行為可能更不穩定）。
- **`mdutil -E /` 重建索引** 短期通常**更熱**；僅在懷疑索引損壞時再考慮。

---

## 4. 如何確認已改善

活動監視器 → **CPU**，依 **`% CPU`** 排序：

- **`fseventsd`**：多數時間應接近 **0～個位數 %**。
- **`mds_stores`**：不應長期卡在 **80～130%** 級別。

若 **已做 Spotlight 排除 + 重開機** 後仍長期異常，需再追查是否有程式**瘋狂寫檔**（進一步可用系統／開發者工具針對 IO 取樣）。

---

## 5. 附錄：影片輸出／render cache 常見位置（非單一路徑）

- **使用者自選**：`~/Movies`、`~/Desktop`、`~/Downloads`（Finder 搜尋 `.mp4` / `.mov` 并按最近使用最快）。
- **Remotion**：多在專案內 **`out/`** 或 CLI／設定指定目錄（視專案而定）。
- **CapCut／剪映**：多在「影片」或 app 內專案／匯出記錄（視版本而定）。

**本 repo 內**若需減少索引負擔，可優先將 **`art-prompt-generator-v2/infographic_output/`** 加入 Spotlight 私隱（見上文 B）。

---

## 6. 免責說明

此文為 **系統行為與實務排查整理**，非法律或 Apple 官方支援文件；macOS 版本更新後選單名稱或行為可能略有差異，以當前系統為準。
