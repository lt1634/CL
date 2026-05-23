# 雙星運維（OpenClaw + Hermes）

> **CL = 運維 SSOT**；**執行**仍喺 `~/.openclaw/`、`~/.hermes/`。秘密只放兩邊 `.env`，唔 commit。

## 架構

| 星 | 角色 | 本機運行 | CL repo |
|----|------|----------|---------|
| **OpenClaw** | 自動化、世界層、cron | `~/.openclaw/` · Gateway `:18789` | `ops/openclaw/` |
| **Hermes** | 傾計、GEPA、B 軌 API | `~/.hermes/` · `:8642` | `ops/hermes/` + `vendor/hermes-agent` |

```text
~/Desktop/CL/          ← git：腳本、文檔、版本鎖、Hermes 源碼 submodule
~/.openclaw/           ← OpenClaw 設定、cron、workspace 鏡像
~/.hermes/             ← Hermes 設定、cron、venv 安裝
```

## 新機 / 新 clone

```bash
cd ~/Desktop/CL
git clone --recursive https://github.com/lt1634/CL.git   # 或 clone 後：
./ops/dual-star/install.sh
```

`install.sh` 會：初始化 `vendor/hermes-agent`、對 `versions.lock.yaml` 嘅 tag、跑 `doctor.sh`。  
**唔會**覆寫 `~/.openclaw/.env` / `~/.hermes/.env`。

## 日常指令

| 做咩 | 指令 |
|------|------|
| 健康檢查 | `./ops/dual-star/doctor.sh` |
| 權限硬化 | `./ops/openclaw/harden-openclaw.sh` |
| 分層記憶 setup | `./ops/openclaw/setup-memory-tiered.sh`（可選 `--apply-qmd`） |
| **A 軌三件套**（快照 MD + token + 狀態頁） | `./ops/openclaw/run-a-track-ops.sh` |
| 狀態頁刷新 | `./ops/openclaw/refresh-status-dashboard.sh` |
| 每日 08:05 cron（可選） | `./ops/openclaw/install-a-track-ops-cron.sh` |
| Cron 安全編輯 | `./openclaw-cron.sh validate` / `list`（原子寫入 + lock） |
| OpenClaw cron | `./openclaw-cron.sh list`（wrapper → `ops/openclaw/`） |
| 重啟 OpenClaw Gateway | `./openclaw-cron.sh restart` 或 `openclaw gateway restart` |
| Hermes 重啟 + doctor | `./ops/hermes/post-install.sh` |
| 對照 Hermes 源碼 | `vendor/hermes-agent/`（tag 見 `ops/versions.lock.yaml`） |

## 改 cron 嘅規矩

1. 在 CL **文檔**記錄意圖（例如 `docs/PHASE1-CRON-CHANGES-*.md`）。
2. 用 `openclaw-cron.sh` / Hermes cron API 改 **本機** `jobs.json`，或日後把範本放入 `ops/openclaw/cron/`。
3. 驗證：`./ops/dual-star/doctor.sh`。
4. 重要變更寫入 memory KB 或 project-state。

## 秘密與 delivery（勿 commit）

| 變數 | 位置 | 用途 |
|------|------|------|
| `OPENCLAW_TELEGRAM_TO` | `~/.openclaw/.env` | world cron `delivery.to`（合併時由 `resolve-cron-delivery.mjs` 注入） |
| API keys | `~/.openclaw/.env`、`~/.hermes/.env` | 各星獨立 |

Repo 內 cron 範本只用 placeholder `__OPENCLAW_TELEGRAM_TO__`。

## Compaction 與 WORKFLOW_AUTO

1. 各 agent workspace 根目錄放 **WORKFLOW_AUTO.md**（模板：`memory/kb/main-agent-workspace-templates/`）。
2. `AGENTS.md` 啟動順序：**WORKFLOW_AUTO → SOUL → USER → MEMORY**。
3. 本機 `openclaw.json` 合併 [`ops/openclaw/compaction-recommended.json`](../ops/openclaw/compaction-recommended.json) 的 `memoryFlush`。

週檢記錄：`memory/kb/openclaw-hermes-weekly-ops-2026-05-22.md`

## 版本鎖

[`ops/versions.lock.yaml`](../ops/versions.lock.yaml) 記錄：

- 本機 **CLI** 預期版本（`openclaw`、`hermes`）
- **submodule** tag（`vendor/hermes-agent`）

升級 `hermes update` 或 OpenClaw 後，請更新 `versions.lock.yaml` 並（可選）bump submodule：

```bash
cd vendor/hermes-agent && git fetch --tags && git checkout v2026.5.16
cd ../.. && git add vendor/hermes-agent ops/versions.lock.yaml
```

## 相關文檔

- [openhuman-to-cl-10min.md](../memory/kb/openhuman-to-cl-10min.md) — OpenHuman 三項腳本仿製（唔安裝）
- [openclaw-hermes-weekly-ops-2026-05-22.md](../memory/kb/openclaw-hermes-weekly-ops-2026-05-22.md) — 週檢短報與三項改善
- [hermes-b-track-guardrails.md](../memory/kb/hermes-b-track-guardrails.md)
- [HANDOFF_HERMES.md](./HANDOFF_HERMES.md) — OpenClaw → Hermes 8642
- [OPENCLAW_INDEX.md](./OPENCLAW_INDEX.md)
- [PROJECTS-INDEX.md](./PROJECTS-INDEX.md)
- [PHASE1-CRON-CHANGES-2026-05-21.md](./PHASE1-CRON-CHANGES-2026-05-21.md)
