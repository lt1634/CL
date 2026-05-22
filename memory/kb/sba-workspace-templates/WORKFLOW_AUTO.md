# WORKFLOW_AUTO.md — SBA compaction 後恢復（第 1 步必讀）

> 每次會話**最先**讀本檔，再讀 SOUL / USER / 學生檔。壓縮後靠本檔對齊「而家堂／而家學生」。

---

## 當前焦點（1–3 行）

- 學生：（名）
- 本堂目標：（一句）
- 待跟進：（comment 分析／作業／督導策略）

---

## 壓縮後勿重複

- 唔好再問老師已確認嘅課程安排或學生代號
- 課前分析結果以最新 `memory/kb/sba-students-work/review-*.md` 為準

---

## 記憶分層

| 層 | 路徑 |
|----|------|
| 學生索引 | `memory/kb/sba-students.md` |
| 學生檔 | `memory/kb/sba-students-work/{名}/student-profile.md` |
| 長期 | `MEMORY.md`（主會話時） |
| 本檔 | `WORKFLOW_AUTO.md` |

OpenClaw 若啟用 `compaction.memoryFlush`：壓縮前把當堂摘要寫入 `memory/YYYY-MM-DD.md` 並更新本檔。

---

## 上次維護

- 日期：（agent 填）
