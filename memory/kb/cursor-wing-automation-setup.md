# wing's Automation — 逐步設定

適用於 Cursor Automations 入面嘅 **wing's Automation**（CL repo 每週檢視 + push 時 security check）。

---

## Step 1：揀 Trigger（幾時跑）

你而家已有：**CI completed in CL on failure on PRs**。

**重要**：若你有「每週」schedule trigger，請確保係**真正每週**（例如每週日或每週一），唔好係每月（如 `0 1 1 * *`）。詳見 `memory/kb/weekly-schedule-fix.md`。

- 若果你想 **push 時就做 security check**（唔等 CI fail）：加多一個 trigger。  
  撳 **+ Add Trigger** → 揀 **Push** → Repo 選 **lt1634/CL**，Branch 選 **main**，by **Everyone**。  
  咁每次有人 push 去 main（或你揀嘅 branch）都會跑。
- 若果只想 **CI fail 時** 先跑：保留現有 trigger 就得，唔使加。

---

## Step 2：Instructions（做咩）

你已有兩段：

1. **每週檢視**：Every week, review the OpenClaw workspace config (AGENTS.md, MEMORY.md, HEARTBEAT.md) and suggest 3 concrete improvements in a short report.
2. **Push 時 security check**：When I push to the CL repo, run the agent to check for security issues in the openclaw and workspace config files.

想報告格式統一、易睇，可以改用下面呢段（貼入去取代或補充）：

```
When this automation runs:
- If triggered by Push: Analyze the pushed code changes in the CL repo. Focus on: memory/kb/*.md, any AGENTS.md/MEMORY.md/HEARTBEAT.md, and config. Check for: (1) security/misconfig (2) credential exposure (3) access control (4) unsafe agent/memory patterns. Output: list issues with severity (critical/high/medium) and recommended fixes, or one line "No issues found."
- If triggered by weekly schedule: Review OpenClaw workspace config (AGENTS.md, MEMORY.md, HEARTBEAT.md under repo) and suggest 3 concrete improvements in a short report.
Keep output concise, suitable for PR comment or Slack.
```

（若果你冇 set 每週 schedule trigger，第一段 push 時已經會做 security check。）

---

### 加「上網 research 最新 OpenClaw 設定／用途／心得」嘅 Instructions（可貼入 Automation）

下面呢段叫 agent **先上網搜最新 OpenClaw 設定、用途、best practices**，再喺檢視或 security check 時用呢啲資料。直接貼入 Cursor Automations 嘅 **Instructions** 框（可取代或接喺上面嗰段後面）：

```
Before analyzing the CL repo, do a quick web search for the latest OpenClaw setup guides, configuration best practices, and usage tips (e.g. docs.openclaw.ai, community posts, 2025–2026 guides on AGENTS.md, MEMORY.md, HEARTBEAT.md, cron vs heartbeat, memory compaction, workspace structure). Use that research to inform your review.

Then:
- If triggered by CI/Push: Analyze the pushed or relevant code in the CL repo. Focus on: memory/kb/*.md, any AGENTS.md/MEMORY.md/HEARTBEAT.md, and config. Check for: (1) security/misconfig (2) credential exposure (3) access control (4) unsafe agent/memory patterns. Where relevant, suggest improvements aligned with current OpenClaw best practices (e.g. memory layers, heartbeat vs cron use, compaction settings). Output: list issues with severity (critical/high/medium) and recommended fixes, or "No issues found"; optionally add 1–2 short "latest-practice" tips.
- If triggered by weekly/schedule: Review the OpenClaw workspace config in the repo. Research latest setup and usage guides; then suggest 3 concrete improvements in a short report, citing current best practices (e.g. SOUL.md/USER.md/MEMORY.md structure, HEARTBEAT lean checklist, cron isolated vs main session).
Keep output concise, suitable for PR comment or Slack.
```

---

## Step 3：Model

保持 **Codex 5.3 High** 即可；要省 credits 可試較低 tier。

---

## Step 4：Tools（可選）

- **Memories**：已加就夠；要俾 agent 多啲 context 可撳 Manage 加 relevant memories。
- 若果想 **PR 上留 comment**：撳 **+ Add Tool or MCP** → 加 **Comment on Pull Request**，再喺 trigger 度確保有 **Pull request** 事件（例如 Push 係 on PR branch），咁 run 完會自動 comment。
- 若果想 **Slack 通知**：加 **Send to Slack** → Connect，揀 channel。

---

## Step 5：Cloud Agent Environment

撳 **Manage**，確認有冇要俾 agent 用嘅 env vars（例如 repo access token）。通常 CL 公開讀取就唔使 set。

---

## Step 6：儲存同測試

1. 撳 **Save** 儲存設定。
2. 撳 **Run Test** 跑一次（會用而家嘅 trigger 條件模擬 run）。
3. 去 **Run History** tab 睇有冇成功、output 係咩。

---

## Step 7：同步本地

Automation 改咗 GitHub 上嘅 **lt1634/CL** 之後，本地同步：

```bash
cd /Users/timnewmac/Desktop/CL
git pull origin main
```

---

## 檢查清單

- [ ] Trigger：Push in **lt1634/CL** on **main**（和/或 CI failure on PRs）
- [ ] Instructions 已填（security check + 可選每週檢視）
- [ ] 需要時加 Comment on PR / Slack
- [ ] Save → Run Test → 睇 Run History
- [ ] 之後改 GitHub 就用 `git pull` 同步本地
