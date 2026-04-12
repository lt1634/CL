# Agent / Cron 錯誤修復記錄

**日期**：2026-03-13

---

## 錯誤原因與修復

| Job | 錯誤 | 原因 | 修復 |
|-----|------|------|------|
| **daily-thought-capture** | main job requires payload.kind="systemEvent" | 用 `sessionTarget: main` 時必須用 systemEvent，唔可以用 agentTurn | 已改為 `sessionTarget: isolated`；並清除 state 內舊 lastError |
| **config-check-weekly-001** | cron: job execution timed out | 原本 60s timeout 唔夠 | 已將 `timeoutSeconds` 設於 **job 層** 900（15 分鐘） |
| **daily-self-improvement-001** | cron: job execution timed out | 之前 5/10 分鐘 timeout 唔夠、sessions_history 慢 | 已簡化 payload（唔 call sessions_history）、**job 層** timeout 900；先寫 record 再回覆 |
| **content-digestion-watchdog** | Edit: in memory/automation-master.md failed | agent 用 Edit 寫 automation-master.md 失敗（權限/路徑） | 已改 payload：用 **exec printf ... >> memory/automation-master.md** 代替 Edit（job 現 disabled，日後啟用會用新寫法） |
| **（待查）** | Edit: in memory/kb/... (554 chars) failed | agent 寫入 workspace kb 失敗（路徑/權限） | 已改為只用 **50周年展覽.md**；寫入路徑 `~/.openclaw/workspace/memory/kb/50周年展覽.md` |
| **（待查）** | Edit: in memory/kb/50周年展覽.md (145 chars) failed | 同上：agent Edit 寫 workspace 失敗 | 本機檔案可寫；agent 須用 **絕對路徑** 或改 payload 用 **exec** 寫入（見下方「workspace kb 寫入」） |
| **（待查）** | Edit: in memory/kb/hkch-booking.md (136 chars) failed | 同上：agent Edit 寫 workspace kb 失敗 | 見下方「點解不時出現 + 統一處理」 |
| **proactive-task-scan** | cron: job execution timed out | 任務重、600s 唔夠 | 現 **enabled: false**；若再啟用可加 timeoutSeconds 900 或縮細 payload |
| **weekly-self-iteration** | Edit: in HEARTBEAT.md failed | isolated cron 下 Edit HEARTBEAT 易失敗 | 已改 payload：**禁止 Edit HEARTBEAT**；改寫 USER/AGENTS 或 `memory/archive/self-iter-note-*.md`；delivery 加 **bestEffort** |

---

## 注意

- **timeoutSeconds** 建議放在 **job 層**（與 delivery 同層），唔好只放 payload 內，確保 gateway 讀到。
- **main session** 的 cron 只可用 `payload.kind: "systemEvent"`；要用 agentTurn + delivery 就必須 `sessionTarget: "isolated"`。
- 寫入 workspace 檔案若 Edit 失敗，可改用 **exec**（例如 `printf ... >> file`）避免權限問題。
- **workspace kb 寫入**（如 `memory/kb/50周年展覽.md`）：agent 寫入時用 **絕對路徑** `~/.openclaw/workspace/memory/kb/50周年展覽.md`；若 Edit 仍失敗，payload 改為用 exec 將內容 append 到該路徑。

---

## 點解不時出現「Edit memory/kb/xxx.md failed」？

- **原因**：在 **cron / isolated**（或部分 session）入面，Edit 工具用嘅相對 path `memory/kb/xxx.md` 可能唔係 resolve 去 workspace，或該 context 冇權寫 workspace，所以失敗。本機用 Terminal 寫同一個檔係可以嘅。
- **統一處理（建議）**：
  1. **Cron / 自動化 job**：唔好依賴 agent 的 Edit；在 **payload 直接用 exec** 寫入，路徑用 **絕對**：
     ```bash
     KB="$HOME/.openclaw/workspace/memory/kb"
     echo '要加嘅內容' >> "$KB/hkch-booking.md"
     # 或整段覆寫：printf '%s' '...' > "$KB/hkch-booking.md"
     ```
  2. **Agent 指引**：在 workspace 的 AGENTS.md 已加「若 Edit memory/kb 失敗 → 改用 exec + 絕對路徑」；新 job 若需要寫 kb，優先設計成 **exec 寫入**，避免依賴 Edit。
  3. **要改嘅現有 job**：找出邊個 job 會寫 `memory/kb/hkch-booking.md`、`50周年展覽.md` 等，把該步驟改為 exec（或先試絕對路徑，再 fallback exec）。
