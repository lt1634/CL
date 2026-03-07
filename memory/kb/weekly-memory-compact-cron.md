# Weekly MEMORY Compact Cron — 規格與 Payload

每週執行一次：對齊 `memory/kb/main-agent-workspace-templates/MEMORY.md` 嘅**可驗收門檻**，做量化檢查 + 歸檔產出。

---

## Job 規格

| 項目 | 值 |
|------|-----|
| **id** | `memory-compact-weekly-001` |
| **name** | Weekly MEMORY compact（量化門檻 + archive） |
| **schedule** | `0 9 * * 0`（每週日 09:00 Asia/Hong_Kong） |
| **sessionTarget** | `isolated` |
| **wakeMode** | `now` |
| **timeoutSeconds** | 120 |
| **delivery** | announce → WhatsApp +85267605407（bestEffort） |

---

## Payload 任務（agentTurn message）

1. **讀** workspace 內 `memory/MEMORY.md`（或 `MEMORY.md` 根目錄，視 workspace 結構）。
2. **量化檢查**  
   - 估計 MEMORY.md 長度（約 1 token ≈ 4 字符，或用你嘅 token 估算）；若 **> 3000 tokens**，在報告註明「超標，建議精煉 P1」。  
   - 找出 **P2 區**內每條：若有 `expires_at` 或 `created_at`，過期（>14 日跟進 / >30 日備忘）或 `status` 已解決嘅項，列為「待歸檔」。
3. **產出**  
   - 若有待歸檔項：寫入 `memory/archive/YYYY-MM-DD.md`（今日日期），**檔首第一行**為 compact 摘要，例如：  
     `## 2026-03-09 compact — 移出 3 項 P2`  
   - 下面逐條列出移出嘅內容（可 copy 原文）。  
   - 從 `MEMORY.md` 刪除該批 P2 項（用 edit 刪除對應段落）。
4. **可選**  
   - 若 HEARTBEAT.md 存在：快速掃一眼有冇「對外發送」類描述放咗喺 heartbeat（應交 cron）；若有可記低「建議：HEARTBEAT 只做判斷，外發交 cron」，唔需要改檔。
5. **報告**  
   - 回覆一句摘要（會經 WhatsApp 送出）：例如「MEMORY compact 完成：歸檔 X 項，MEMORY 約 Y tokens」或「無 P2 需歸檔，MEMORY 約 Y tokens」。

---

## 驗收（對齊模板可驗收門檻）

- MEMORY.md ≤ 3000 tokens（超標時報告註明）
- P2 單條保留 ≤ 14/30 日，過期入 archive
- 產出 `memory/archive/YYYY-MM-DD.md` 且檔首有一行 compact 摘要

---

## 加入 Cron

- **手動**：把本檔「Payload 任務」整理成一句 message，在 OpenClaw Cron UI 新增 job，或貼入 `~/.openclaw/cron/jobs.json`。  
- **已預設**：若已用「weekly memory compact」一鍵加入，job id 為 `memory-compact-weekly-001`，可直接在 UI 啟用/停用。
