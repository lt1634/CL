# SBA Daily Work：課前自動睇圖、Update、出 Comment 同新任務

## 流程總覽

1. **每堂後**：你將學生當日作品／Workbook 相片 upload 去  
   `~/.openclaw/workspace/memory/kb/sba-students-work/{學生名}/`  
   檔名用日期，例如 `2025-03-10.jpg` 或 `2025-03-10_workbook.jpg`。
2. **下堂前**：Cron 喺指定時間（例如 9:45）自動運行。
3. **Cron 做**：  
   - 掃 `sba-students-work/` 每個學生 folder 嘅**最新一批圖**（按日期）；  
   - **睇圖分析**（用 vision 模型）：做咗咩、媒材、有冇跟主題、值得讚／要跟進嘅地方；  
   - **Update**：將「上堂完成咗咩」寫入進度（優先更新該生 **`sba-students-work/<名>/student-profile.md`**，或寫入 `sba-students-work/review-{日期}.md`）；  
   - **出 comment + 新任務**：為每位學生出簡短評語同下堂 1–2 個任務 + success criteria；  
   - **Delivery**：結果送去你指定地方（例如 WhatsApp、或寫入檔案你開 SBA 助手時用）。

---

## 1. 路徑與結構（你要做嘅）

- **Daily work 根目錄**：`~/.openclaw/workspace/memory/kb/sba-students-work/`  
  （若你嘅 workspace 唔係 `~/.openclaw/workspace`，請將 `memory/kb/` 放喺你實際 workspace 底下，保持 `memory/kb/sba-students-work/` 同 `sba-students.md` 同層。）
- **學生 folder**：每個學生一個，名要同 `sba-students.md` 完全一致：  
  `Cassy`, `Crystal`, `Megumi`, `Daisy`, `Jayden`, `Ichigo`。
- **相片檔名**：建議 `YYYY-MM-DD` 或 `YYYY-MM-DD_描述`，方便 cron 揀「最新一堂」嘅圖。

---

## 2. Cron 時間

- **中五 SBA 課節**：Mon / Tue / Fri 9:55–10:55（你已有「SBA 中五課前10分鐘提醒」9:45）。
- **建議**：同一日 9:45 先跑 **daily work 分析**（睇圖、update、出 comment 同任務），再發課前提醒（或合併成一條 cron：先分析，再出「今日任務 list」送去 WhatsApp）。

---

## 3. 「睇圖分析」點做（要睇到圖、分析到學生做咗咩）

要**睇到圖**同**分析內容**，一定要用有 **vision** 能力嘅模型。兩種做法：

### 做法 A：Cron 觸發 SBA 助手（agent 有 vision + 讀 workspace 檔案）

- Cron 用 **Isolated agent turn**，揀 **SBA 助手**，payload 用**一段固定指令**。
- 指令要講明：  
  「讀 `memory/kb/sba-students.md`。對 `memory/kb/sba-students-work/` 入面每個學生 folder，列出該學生**最新日期**嘅所有圖片 path，然後**逐個學生**：用 vision 讀取呢批圖，對照該學生嘅主題同進度，分析佢今次做咗咩、做得好唔好、有咩要讚或跟進；最後為每位輸出：1) 簡短 comment，2) 下堂 1–2 個任務同 success criteria。將結果寫入 `memory/kb/sba-students-work/review-{今日日期}.md`，並（若已設定）送到 WhatsApp。」
- **條件**：SBA 助手嘅 model 要支援 vision，同要有權限讀 workspace 內嘅檔案（包括圖片）。OpenClaw 若支援 agent 讀取 workspace 檔案並將 image 當成 message part 傳俾 model，就可以用呢種方式。

### 做法 B：先跑腳本做 vision 分析，Cron 再送結果

- 寫一個**小腳本**（例如 Python / Node）：  
  - 掃 `sba-students-work/{學生名}/`，按日期揀每個學生最新一批圖；  
  - 用 **OpenAI GPT-4V / Claude Vision / 其他 vision API** 逐個學生呼叫：輸入 = 該學生喺 `sba-students.md` 嘅摘要 + 圖片，prompt = 「分析呢位學生今次交嘅 daily work：做咗咩、媒材、有冇跟主題、值得讚／要跟進；用 2–3 句總結，再建議下堂 1–2 個任務同 success criteria」；  
  - 將每位嘅輸出寫入一個 **review 檔**，例如 `sba-students-work/review-{下堂日期}.md`。
- Cron 先跑呢個腳本，跑完之後：  
  - 再觸發一次 SBA 助手（或另一條 cron），payload = 「讀 `memory/kb/sba-students-work/review-{日期}.md` 同各生 `student-profile.md`／`sba-students.md`，將 review 入面嘅進度 update 入對應 **`student-profile.md`**（如有需要），然後將 comment + 新任務 list 送去 WhatsApp」；  
  或  
  - 直接將 `review-{日期}.md` 嘅內容（或精簡版）經 webhook / 電郵 / 你現有嘅 WhatsApp 管道送去你。

---

## 4. Update 同 Output 格式

- **Update**（二揀一或一齊做）：  
  - 更新該生 **`sba-students-work/<名>/student-profile.md`**：加「上堂完成（YYYY-MM-DD）」或改「進度」；必要時先改 **`sba-students.md`** 速覽一句；或  
  - 只寫入 **`sba-students-work/review-{日期}.md`**，唔改 profile，下堂叫助手「讀 review-{日期}.md 同相關 `student-profile.md`」再出任務。
- **Comment + 新任務**：每位學生一段，包含  
  - **Comment**：2–3 句（做咗咩、好唔好、要跟進咩）；  
  - **下堂任務**：1–2 項，每項有簡單 **Success criteria**；  
  - 可加一句**鼓勵說話**（跟返你 SBA 助手風格）。

---

## 5. Cron Payload 示例（做法 A：直接靠 SBA 助手）

若你用 OpenClaw cron **Isolated run** + **SBA 助手**，payload 可以係：

```
下堂係中五視藝 SBA。請你做「課前 daily work 分析」：

1. 讀取 memory/kb/sba-students.md 嘅完整內容。
2. 掃描 memory/kb/sba-students-work/ 底下每個學生 folder（Cassy, Crystal, Megumi, Daisy, Jayden, Ichigo），找出每位學生**最新日期**嘅所有圖片（按檔名 YYYY-MM-DD）。
3. 對每位學生：用 vision 讀取佢嘅該批圖片，對照 sba-students.md 入面佢嘅主題、進度、督導策略，分析：
   - 今次做咗咩（媒材、內容、有冇跟主題）；
   - 做得點、有咩值得讚、有咩要跟進；
   - 建議下堂 1–2 個任務同 success criteria，加一句鼓勵。
4. 將結果寫入 memory/kb/sba-students-work/review-{今日日期 YYYY-MM-DD}.md，格式：每位學生一段，包含 Comment、下堂任務、Success criteria。
5. 若已設定 delivery，將同一份 list 送去指定 channel（例如 WhatsApp），方便我上堂前睇。
```

（若你嘅 cron 唔支援「今日日期」替換，可改做「寫入 review-next.md」固定檔名，每次覆寫。）

---

## 6. 小結

| 步驟 | 你做 | 系統做 |
|------|------|--------|
| 每堂後 | 將學生 daily work 相片放入 `sba-students-work/{學生名}/YYYY-MM-DD*.jpg` | — |
| 下堂前 9:45 | — | Cron 跑：睇圖分析 → update 進度 → 出 comment + 新任務 → 送結果畀你 |
| 上堂 | 拎住 comment + 任務 list 逐個跟 | — |

要**睇到圖分析**，必須用 **vision 模型**（做法 A 或 B）。若你揀做法 B，我可以再幫你寫一個好短嘅 Python/Node 腳本骨架（掃 folder、call vision API、寫 `review-{日期}.md`），你再填 API key 同 cron 呼叫就得。
