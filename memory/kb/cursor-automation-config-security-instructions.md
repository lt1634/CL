# Cursor Automation: Config Security Check on Push — Instructions (A)

將以下內容貼到「Config Security Check on Push」的 Cursor Automation 指令區。

---

## 1) Trigger（必須）

請先確保此 automation 已綁定：

- **On push**（CL repo，建議 default branch + PR branches）

可選（如果要自動留言到 PR）：

- **On pull request opened/updated**

> 若沒有 push/PR trigger，這個檢查不算啟用。

---

## 2) Agent Instructions（貼到 automation）

Review only the **changed files in the push/PR diff** for config security risks.

### In-scope paths (only if changed)
- `openclaw/AGENTS.md`, `openclaw/MEMORY.md`, `openclaw/HEARTBEAT.md` (if present)
- Any `**/AGENTS.md`, `**/MEMORY.md`, `**/HEARTBEAT.md`
- `memory/kb/sba-students.md`, `memory/kb/sba-*.md`
- Any `**/cron/jobs.json` (especially `.openclaw/cron/jobs.json`)
- Any `**/.env*`, `**/secrets*`, `**/*secret*`

### Checks
1. **Secrets/PII exposure**
   - API keys, tokens, passwords, webhook secrets, full phone numbers.
   - New `delivery.to`, new recipient IDs, or new channel credentials.
2. **Access control drift**
   - Broadened allowlists, wider trigger scope, new external delivery targets.
3. **Unsafe config patterns**
   - Overly permissive agent/tool settings, unrestricted write paths, risky exec scope.
4. **Integrity errors**
   - Broken JSON/schema, malformed cron fields, missing required keys.

### Severity rubric
- **critical**: active secret leakage or publicly reachable unsafe change
- **high**: significant permission expansion or dangerous execution scope
- **medium**: misconfiguration, weak defaults, or missing safeguards

### Output format (short)
- If issues exist, list bullets with:
  - `severity`
  - `path:line` or diff hunk
  - short plain explanation
  - original evidence line/snippet
  - concrete next step
- If no issues:
  - `Config security check: no issues found in changed files.`

Keep it concise and PR-comment friendly.

---

## 3) PR Comment step（可選）

如果你要「Comment on Pull Request」：

1. 同一個 run 先執行安全檢查 agent。  
2. 再把 agent 輸出直接送到 PR comment。  
3. 若出現 **Missing Trigger**，把 PR comment step 連到 **On pull request** 觸發器。  

---

參考：`memory/kb/openclaw-config-check-setup.md`（每週 config check）。
