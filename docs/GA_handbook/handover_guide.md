# GA 總務交接指南（for Tim）

---

## 你嘅情況點解合理

今年嘅對話／事件你已經養住咗資料；下年校曆未有係正常——唔使你而家明白晒每一格。

我做嘅嘢很大一部分係：把 WhatsApp 裏同「總務／工程／校園日程」有關嘅嘢，變成表格同提醒檔，方便之後你接手唔使由頭翻群組。

「唔知我做緊乜」唔緊要：**你只要識「邊幾個檔係成品、邊幾句係更新」**就得；細節可以之後逐樣問。

---

## Overall：而家條「系統」喺做乜（一句版）

| 部份 | 做乜 | 你平常會唔會碰 |
|------|------|---------------|
| ZIP / _chat.txt | 學校匯出嘅 WhatsApp 字 | 有新年度匯出時先再諗 |
| chunk_*.txt | 把長對話切成一段段，送去俾 Hermes 讀 | 多數唔使手改 |
| Hermes | 喺你部機用 AI 跟住固定格式，抽「事件」（日期、標題、邊個跟、係咪要交波） | 你唔使識 command，只要知「改完對話要再抽一次」 |
| events__*.jsonl | 每一行一個事件（機器易讀） | 可唔睇，當底稿 |
| normalize + emit_events_md | 日期改齊、合併成 EVENTS_ALL.md | 值得偶爾打開睇 |
| calendar_struct_2526.csv | 校曆表（手冊／OCR）變成一行一日／節點 | 下年有新表再 update |
| emit_year_reminders.py | 校曆 × 對話事件 → YEAR_REMINDERS.md | 接手總務時最有用 |

---

## 用三層嚟記

1. **原材料**：WhatsApp 字（chunk）
2. **機器稿**：jsonl（每行一個事件）
3. **人睇嘅**：EVENTS_ALL.md（全部事件表）、YEAR_REMINDERS.md（校曆視窗內 + 對話抽出嘅嘢）

你唔使識第 2 層；第 3 層就係真正幫你嘅檔。

---

## Todo list 整體狀態

| 項目 | 狀態 | 說明 |
|------|------|------|
| 用固定 schema 分段抽事件 + 合併 | 已做 | Hermes + events*.jsonl + 解析修補 |
| 校曆 → 結構 CSV | 已做 | 今年／2526 你已 population；下年有新 handbook 再換／append |
| OCR Calendar.jpg | 可用 handbook 文字頂住 | 有清晰 jpg 再 OCR 都得，非必須 |
| Join 校曆 + 事件 → 提醒檔 | 已做 | emit_year_reminders.py → YEAR_REMINDERS.md |
| 合併 EVENTS_ALL.md | 已做 | emit_events_md.py |
| OpenClaw cron 每月 digest | 未做、屬可選 | 你想自動化先再做 |
| 「確認學年邊個先」權威來源 | 暫緩 | 下年校曆一出先訂 |

> 即係：主線已閉環；剩低嘅係「你個人幾時接棒、幾時有新校曆」嘅更新，唔係 bug。

---

## 最低限度要識嘅嘢

### 兩份成品 markdown（打開就睇得明）

- **`EVENTS_ALL.md`** — 所有已抽出嘅事件，按日期排
- **`YEAR_REMINDERS.md`** — 未來一段時間嘅校曆節點 × 對話事件對照

### 更新時跑呢串

```bash
cd ~/Desktop/CL
python3 tools/ga-ingest/normalize_event_dates.py
python3 tools/ga-ingest/emit_events_md.py
python3 tools/ga-ingest/emit_year_reminders.py
```

每次改完任何 `events__*.jsonl`（例如 Hermes 重抽完），跑呢串就會更新兩份成品。

---

## 建議優先（邊样先做）

對你而家（未接總務、下年表未有）：

- **低優先**：再鑽研 Hermes／JSON——唔使。
- **中優先**：書籤 `tools/ga-ingest/README.md` 入面「複製貼上即用」嗰段；將來有人俾新 chat export，你要知道「交俾點更新」可以問返我或跟 README。
- **高優先（將來接總務嗰日）**：打開 `YEAR_REMINDERS.md` 同 `EVENTS_ALL.md`，當「最近要留意嘅事 + 群組曾講過嘅跟進」；有新校曆：update CSV → 再跑 emit_year_reminders.py。

---

## 之後點樣再 update 我（你話一句就得）

例如：

- 「下年校曆 PDF 有了，點填 CSV？」
- 「新 export 咗一個群，點加入同一套？」
- 「我只係想每月睇一次提醒，唔想碰 command。」

我就可以按你当时嘅身份（接緊定未接）收窄步驟，唔會假定你已經識晒。

---

## 一句總結

而家做嘅嘢唔係要你即時做總務，而係先把「群組裏散嘅承诺／日期／跟進」變成兩份表 + 一條更新指令；下年校曆同你真係接棒之後，再補 CSV 同重新 generate，就同今次一樣順。
