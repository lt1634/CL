## xtcify (X4) — EPUB → XTC 一鍵轉檔（避免中文變 ???）

這個小工具會自動走你剛剛成功嘅流程：
- 使用 `x4converter.rho.sh` 轉檔
- **強制上傳內建的簡中文字型（Noto Sans SC）**
- 輸出 `.xtc`（1-bit，適合 Xteink X4 / Crosspoint）

> 注意：這個工具會用瀏覽器自動化去操作轉檔網站（唔會上傳到任何第三方 server 做運算；但 EPUB 檔案會在你本機瀏覽器記憶體內被讀取/渲染）。

### 安裝（只要一次）

進入資料夾後安裝依賴：

```bash
cd "/Users/timnewmac/Desktop/CL/tools/xtcify"
npm install
```

第一次安裝 Playwright 可能會提示你安裝瀏覽器，如有提示就照佢講做（通常係）：

```bash
npx playwright install chromium
```

### 使用

轉單一本（輸出到同一資料夾）。預設會開出瀏覽器視窗，自動完成設定，最後需要你按一次匯出：

```bash
node xtcify.mjs "/Users/timnewmac/Desktop/XTEINK-書庫/downloads/21天逆袭人生_個人成長.epub"
```

如果你想強制用無頭模式（會嘗試自動按匯出；但有機會因網站 WASM/瀏覽器版本而失敗）：

```bash
node xtcify.mjs "/path/book.epub" --headless
```

指定輸出資料夾：

```bash
node xtcify.mjs "/path/book.epub" --out "/Users/timnewmac/Desktop/XTEINK-書庫/xtc"
```

批量：

```bash
node xtcify.mjs "/path/a.epub" "/path/b.epub" --out "/Users/timnewmac/Desktop/XTEINK-書庫/xtc"
```

### PDF（相簿／卡牌圖）→ 圖片 EPUB → XTC

`xtcify.mjs` 只接受 **EPUB**。若你係 **多頁圖片 PDF**（例如掃描卡牌），可以先用：

```bash
cd "/Users/timnewmac/Desktop/CL/tools/xtcify"
python3 pdf_to_image_epub.py --pdf "/path/cards.pdf" --out "/path/cards_x4.epub" \
  --one-document --format jpeg --scale-to 1200 --title "cards"
```

- **`--one-document`**：一個 `content.xhtml` 裡面排晒所有圖 + CSS `page-break`，部份情況下 x4converter 比「每圖一個 xhtml」易分頁。
- 然後交俾 `node xtcify.mjs`。**純圖**可加上 **`--no-cjk-font`**（跳過上傳 Noto + Refresh，避免 WASM 卡住）。

> **注意**：喺本機測試時，`--headless` 對「圖片為主」EPUB 有時會一直 **`exportDisabled`**（網站顯示 `Page 0/1` 或 `1/1`）。若遇此情況，請 **唔好用 `--headless`**，用預設開瀏覽器，並喺網頁上 **手動撳「Export to XTC」**（同 README 上面「最後需要你按一次匯出」一樣）。

### PDF → 繁中 EPUB（再交俾上面轉 XTC）

若你有 **英文 PDF**（例如 Naval Almanack），可用同資料夾嘅 `pdf_to_zh_tw_epub.py`：先 `pdftotext`，再逐段翻譯，最後打包 EPUB。

- **預設**：若已 `export MINIMAX_API_KEY=...`，會用 **`minimax-direct`**（直連 MiniMax Anthropic 相容 API，**唔經 Gateway**，避免 session lock）。key 同 MiniMax 控制台／OpenClaw 用開嘅一樣。
- **否則** PATH 有 `openclaw` → **`openclaw infer model run`**（經 Gateway；若 TUI 或其他 client 拎鎖可能失敗）。
- **要用某個 agent 人格**（較重）：`--engine openclaw-agent --openclaw-agent main`
- **其他**：`--engine ollama`；或設 `OPENAI_API_KEY` 後 `--engine openai`

例子：

```bash
cd "/Users/timnewmac/Desktop/CL/tools/xtcify"
export MINIMAX_API_KEY="你的key"   # 同 OpenClaw MiniMax 用同一把即可
python3 pdf_to_zh_tw_epub.py --pdf "/path/book.pdf" --work "/path/out_dir"
# 或強制經 Gateway：--engine openclaw-infer
node xtcify.mjs "/path/out_dir/book_zh-Hant.epub" --font-tc --out "/path/out_dir"
```

### 常見問題

- **轉檔途中卡住**：網站 WASM 渲染有時慢，等多一陣；或再跑一次命令。
- **仍然係 ???**：代表字型未成功套用；通常係網站 UI 變更導致定位失效。我可以按你當下畫面更新定位規則。

