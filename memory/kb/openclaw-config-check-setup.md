# OpenClaw config check (C)

Weekly cron that validates workspace and cron config, then reports to memory (and optionally WhatsApp) if something is wrong.

## What it checks

1. **SBA readiness**: `memory/kb/sba-students.md` exists and has content (so the SBA 課前 cron can send student tasks).
2. **Cron config**: No obviously broken entries in the cron job that sends to you (e.g. SBA pre-class job still present and enabled).
3. **Optional**: No credential leaks in recent cron run logs (you can extend the agent message to add this).

## Cron job added

A new job **`config-check-weekly-001`** is in `~/.openclaw/cron/jobs.json`:

- **Schedule**: Weekly, Sunday 8:00 Hong Kong (after your weekly self-iteration).
- **Action**: Isolated agent run that reads `memory/kb/sba-students.md`, checks it exists and has student entries; checks that `sba-pre-class-001` exists in cron state; writes a one-line summary to `memory/config-check-last.md`; if critical (e.g. sba-students missing or empty), also sends a short WhatsApp alert to you.
- **Delivery**: Only on failure/critical (best-effort WhatsApp); no spam when all is OK.

## Manual run

```bash
cd ~/Desktop/CL/openclaw && node openclaw.mjs cron run config-check-weekly-001 --expect-final --timeout 60000
```

## Customising

- To run more often: change `expr` in `jobs.json` (e.g. `0 8 * * *` for daily 8am).
- To add checks: edit the job’s `payload.message` to ask the agent to e.g. verify `memory/kb/sba-timetable.md` or other files and report in the same way.
