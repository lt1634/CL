# codesfly（openclaw-memory-final）本機安裝 — 與現有 QMD／A 軌並存

**來源**：[codesfly/openclaw-memory-final](https://github.com/codesfly/openclaw-memory-final)（開源，無雲端記憶費；僅本機 QMD + OpenClaw cron。）

## 前置

- Node ≥ 22、`openclaw` CLI、Gateway 可 `openclaw status`
- QMD：`/Users/timnewmac/.bun/bin/qmd`（或你實際路徑）

## macOS：`timeout` 缺失

官方 `setup.sh` 預設要 GNU `timeout`。本機已 **patch** 倉內：

`tools/openclaw-memory-final/scripts/setup.sh` — `run_oc()` 改為：有 `timeout`／`gtimeout` 先用，**否則直接 `openclaw`**。

**重新 clone 後**要重做呢段 patch，或 `brew install coreutils` 後用 `gtimeout`。

## 安裝（已對你帳戶跑過一次）

```bash
cd ~/Desktop/CL/tools/openclaw-memory-final
bash scripts/install-ai.sh \
  --tz Asia/Hong_Kong \
  --workspace "$HOME/.openclaw/workspace" \
  --qmd-path /Users/timnewmac/.bun/bin/qmd \
  --command-timeout 120 \
  --retrieval-model minimax/MiniMax-M2.1
```

成功標記：`AI_INSTALL_OK` 及 JSON 內 `"ok": true`。

## 本機調校（Tim）

| 項目 | 做法 |
|------|------|
| 週精煉 vs self-iteration | `memory-weekly-tidy` 改為 **週日 23:30**（避開週日 22:00 `weekly-self-iteration`） |
| QMD 索引 | `openclaw.json` 已加 `memory/weekly`、`memory/tasks`；`qmd-root` 已加 `CURRENT_STATE.md`、`INDEX.md` symlink |
| 再安裝／強制重建 cron | 加上 `--force-recreate`；會刪同名 job 再建 |

## 與 A 軌 janitor

- **A 軌**：週一 09:00 Telegram 報 `memory-janitor.sh` 行數。
- **codesfly**：另有一套 daily／weekly／watchdog／nightly QMD；**並存**，唔互斥。

## 重啟

改 `openclaw.json` 或 `jobs.json` 後：`openclaw gateway restart`。
