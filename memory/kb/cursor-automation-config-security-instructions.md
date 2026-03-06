# Cursor Automation: Config Security Check on Push — Instructions (A)

Copy the block below into your Cursor Automations **Instructions** for "Config Security Check on Push".

---

## Instructions (paste into Cursor Automations)

Analyze the **pushed code changes** in this repo, focusing on OpenClaw and workspace config files. Scope:

**Paths in scope (only report on files that actually changed in the push):**
- `openclaw/AGENTS.md`, `openclaw/MEMORY.md`, `openclaw/HEARTBEAT.md` (if present in repo)
- Any `**/AGENTS.md`, `**/MEMORY.md`, `**/HEARTBEAT.md` under workspace or config directories
- `memory/kb/sba-students.md`, `memory/kb/sba-*.md` (SBA assistant config; may contain student names — treat as sensitive)
- `.openclaw/cron/jobs.json` or any `**/cron/jobs.json` (delivery targets, phone numbers; treat as PII/sensitive)
- Any file matching `**/.env*`, `**/secrets*`, `**/*secret*`, or referenced in "Cloud Agent Environment" / env config

**Checks to perform:**
1. **Security / misconfiguration**: Invalid or overly permissive agent/memory definitions (e.g. unsafe tool allowlists, path traversal).
2. **Credential / secret exposure**: Hardcoded API keys, tokens, passwords, or full phone numbers in config or memory files. Flag if new `delivery.to` or channel credentials appear in diff.
3. **Access control**: Changes that broaden who can trigger crons or receive deliveries (e.g. new WhatsApp numbers, new announce targets).
4. **Unsafe patterns**: In agent or memory definitions — dangerous exec scope, unrestricted file write paths, or patterns that could leak workspace data.

**Output:**
- If issues found: list each with **severity** (critical / high / medium), **file:line or hunk**, and **recommended fix** in a short bullet list.
- If no issues: reply with a single line: "Config security check: no issues found in changed files."

Keep the report concise and suitable for a PR comment (no long prose). Prefer repo-root-relative paths in findings.

---

## B — Comment on Pull Request trigger

To fix **"Missing Trigger"** for "Comment on Pull Request":

1. In the same automation, open **Triggers** (or the section where you define when the automation runs).
2. Add a trigger: **"On pull request"** or **"When a pull request is opened/updated"** (wording may vary: "Pull request", "PR", "GitHub Pull Request").
3. Ensure the **run** that performs the security analysis is the one that **feeds into** "Comment on Pull Request". Typically:
   - Trigger: **On push to default branch** or **On pull request** (so the run has access to the diff).
   - Step 1: Run the agent with the Instructions above (so it gets the pushed/PR diff).
   - Step 2: **Comment on Pull Request** — use the agent’s output (the security report) as the comment body.
4. If "Comment on Pull Request" asks for a **trigger**: connect it to the same **Pull request** event so it receives the PR context (repo, PR number, etc.). Save and re-run the automation once to verify the comment appears on a test PR.

If your Cursor version uses a different UI (e.g. "Add trigger" vs "Connect trigger"), add the **Pull request** trigger first, then attach the **Comment on Pull Request** tool to that trigger’s run.

---

*See also: `openclaw-config-check-setup.md` for the OpenClaw-side config check (C).*
