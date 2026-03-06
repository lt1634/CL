# SBA Daily Work 上傳區

每堂後將學生當日作品／Workbook 相片上傳到呢度，**下堂前** cron 會自動掃呢個 folder、**睇圖分析**每位做咗咩，再 update 進度、出 comment 同下堂任務。

## 資料夾結構（必須跟住）

```
sba-students-work/
├── README.md                    ← 本說明
├── Cassy/
│   └── 2025-03-10.jpg           ← 按日期命名，可多張
├── Crystal/
│   ├── 2025-03-10_p1.jpg
│   └── 2025-03-10_p2.jpg
├── Megumi/
├── Daisy/
├── Jayden/
├── Ichigo/
└── review-2025-03-11.md         ← 由 cron/分析腳本自動生成（可選）
```

- **每位學生一個 folder**，名要同 `sba-students.md` 入面嘅**學生名一致**（Cassy, Crystal, Megumi, Daisy, Jayden, Ichigo）。
- **檔名建議**：`YYYY-MM-DD`（當堂日期），可加後綴如 `_p1`, `_workbook`, `_detail`。Cron 會用**最新日期**嘅檔案做「上一堂嘅 daily work」分析。

## 上傳方式

- 手動：將相片放入對應學生 folder，例如  
  `~/.openclaw/workspace/memory/kb/sba-students-work/Cassy/2025-03-10.jpg`
- 若用 iCloud / 其他 sync：可將 `sba-students-work` 指去 sync 嘅子 folder，保持同一結構即可。

## Cron 會做咩

1. 掃 `sba-students-work/{學生名}/` 入面**最新一批圖**（按日期）。
2. **睇圖分析**：用 vision 模型分析學生做咗咩（媒材、構圖、有冇跟到主題、可讚/可跟進嘅地方）。
3. **Update**：將「上堂完成咗咩」寫入進度或 `review-{下堂日期}.md`。
4. **Output**：為每位學生出**簡短 comment** 同**下堂 1–2 個任務 + success criteria**，送去你指定地方（例如 WhatsApp / 電郵 / 檔案）。

詳細流程同 cron 設定見：**`memory/kb/sba-daily-work-flow.md`**。
