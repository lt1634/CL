# GA 總務行事曆 — 本機 ingest 與預處理

敏感輸出寫入 `output/`（已加入 repo `.gitignore`）。

## 環境

- Python 3.10+
- 預設 GA 路徑見 `ga_paths.py`，可用環境變數覆蓋：

```bash
export GA_ROOT="/path/to/🏫 GA"
```

## 1. 從 ZIP 抽出 `_chat.txt`

在倉庫根目錄：

```bash
python3 tools/ga-ingest/ingest.py
```

可選：解壓全部附件（安全檔名 + `_filename_mapping.json`）：

```bash
python3 tools/ga-ingest/ingest.py --full
```

摘要：`tools/ga-ingest/output/ingest_summary.json`  
對話副本：`tools/ga-ingest/output/chats/*.txt`

## 2. 預處理 + 重疊 chunk（優先 T Yim）

```bash
python3 tools/ga-ingest/preprocess_chat.py \
  "tools/ga-ingest/output/chats/WhatsApp Chat - T Yim_chat.txt" \
  --drop-media-omitted
```

輸出：`output/chunks/WhatsApp Chat - T Yim/` 下之 `cleaned.txt`、`chunk_*.txt`、`chunk_meta.json`。

## 3. 交接關鍵字機械初筛

```bash
python3 tools/ga-ingest/handover_hints.py \
  "tools/ga-ingest/output/chunks/WhatsApp Chat - T Yim/cleaned.txt"
```

## 4. Hermes / LLM

- JSON 每行 schema：`schemas/event_line.schema.json`
- `event_kind` 詞表：`event_kind_vocab.yaml`
- Prompt 骨架：`hermes_prompts/extract_events_system_zh.md`
- **chunk_*.txt 係 WhatsApp 純文字**（唔係 JSON）；`hermes_extract_events.py` 會將整段文字放入 prompt，**只對 Hermes 嘅 stdout 做 JSON 解析**（模型應輸出一個 JSON 陣列）。
- 若見 `could not parse JSON`：多數係 Hermes 輸出夾雜說明／`---`／fence——腳本已用 `JSONDecoder.raw_decode` 由第一個 `[` 起抽陣列；仍失敗請睇 stderr 尾段或 `output/hermes_*_raw.log`。

**執行（會 CALL 本機 `hermes chat`，每 chunk 一段時間）：**

```bash
# 全新跑晒（清空舊 jsonl／checkpoint／raw log）
python3 tools/ga-ingest/hermes_extract_events.py --timeout 1800

# 中斷後接續（跳過 events_tyim.jsonl.chunks_done 已有嘅 chunk）
python3 tools/ga-ingest/hermes_extract_events.py --timeout 1800 --resume
```

統一 ISO 日期並合併全部對話事件表：

```bash
python3 tools/ga-ingest/normalize_event_dates.py
python3 tools/ga-ingest/emit_events_md.py
```

### 複製貼上即用：Hermes 後處理鏈（倉庫根目錄）

每次改動過 **`output/events*.jsonl`**（無論新跑 Hermes 抑或人手改），跟呢順序跑一次即可同步 **`EVENTS_ALL.md`** 同 **`YEAR_REMINDERS.md`**：

```bash
cd ~/Desktop/CL

python3 tools/ga-ingest/normalize_event_dates.py
python3 tools/ga-ingest/emit_events_md.py
python3 tools/ga-ingest/emit_year_reminders.py
```

或一行（同上，`emit_year_reminders` 嘅參數可附加，例如 `--ahead-days 90`）：

```bash
cd ~/Desktop/CL && bash tools/ga-ingest/run_postprocess.sh
```

可選：若懷疑同一個 jsonl **重複 append** 咗同一事件：

```bash
python3 tools/ga-ingest/dedupe_events.py \
  --in tools/ga-ingest/output/events_tyim.jsonl \
  --out tools/ga-ingest/output/events_tyim.jsonl
```

（其他檔名同理改 `--in`／`--out`。）

拉長「提醒視窗」（預設未來 42 日）：

```bash
python3 tools/ga-ingest/emit_year_reminders.py --ahead-days 90
```

### 複製貼上即用：只重跑某個 chunk（唔清空現有 jsonl）

將下面 **`…`** 換做實際嘅 chunks 目錄、`*.zip` 前綴同名、`events__….jsonl`、`chunk_0003`：

```bash
cd ~/Desktop/CL

python3 tools/ga-ingest/hermes_extract_events.py \
  --chunks-dir "tools/ga-ingest/output/chunks/WhatsApp Chat - …" \
  --prefix "WhatsApp Chat - ….zip" \
  --out tools/ga-ingest/output/events__….jsonl \
  --resume --force --only chunk_0003 \
  --timeout 3600

python3 tools/ga-ingest/normalize_event_dates.py
python3 tools/ga-ingest/emit_events_md.py
python3 tools/ga-ingest/emit_year_reminders.py
```

（可選：`--raw-log tools/ga-ingest/output/events__…_hermes_raw.log`；省略時預設寫入 `<out 檔名>_hermes_raw.log`。）

一次跑晒所有已匯出對話（每個 chat 獨立 `events__*.jsonl`）：

```bash
python3 tools/ga-ingest/preprocess_all_chats.py
python3 tools/ga-ingest/batch_hermes_extract.py --timeout 3600
```

## 5. 校曆 2526（handbook）

目錄指校曆在 handbook **第 15–17 頁**。若已安裝 poppler（`pdftotext`）：

```bash
pdftotext -f 15 -l 17 -layout "$GA_ROOT/2526 teacher handbook.pdf" \
  tools/ga-ingest/output/handbook_calendar_p15-17.txt
```

再人手／試算表／OCR 整理成 **`tools/ga-ingest/output/calendar_struct_2526.csv`**（欄位見 `templates/calendar_struct_2526.headers.csv`）；`calendar_date` 用 **ISO `YYYY-MM-DD`**。完成後跑：

```bash
python3 tools/ga-ingest/emit_year_reminders.py
```

## 8. （可選）下載 Instagram 貼文相片（公開貼文）

會從貼文頁抽 `og:image` 連結並下載到 `output/instagram/`：

```bash
cd ~/Desktop/CL
bash tools/ga-ingest/download_instagram_photo.sh "https://www.instagram.com/p/<SHORTCODE>/"
```

指定輸出資料夾：

```bash
bash tools/ga-ingest/download_instagram_photo.sh "https://www.instagram.com/p/<SHORTCODE>/" \
  --outdir tools/ga-ingest/output/instagram
```

## 6. 與 Google Drive 同步

可選：在 `output/` 內建立 symlink 指向 `GA_ROOT`，避免複製漂移：

```bash
ln -sf "$GA_ROOT" tools/ga-ingest/output/ga_source_link
```

## 7. 規則模板

見 `roll_forward_rules.template.md`。
