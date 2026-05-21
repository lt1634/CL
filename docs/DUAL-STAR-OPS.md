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
| OpenClaw cron | `./openclaw-cron.sh list`（wrapper → `ops/openclaw/`） |
| 重啟 OpenClaw Gateway | `./openclaw-cron.sh restart` 或 `openclaw gateway restart` |
| Hermes 重啟 + doctor | `./ops/hermes/post-install.sh` |
| 對照 Hermes 源碼 | `vendor/hermes-agent/`（tag 見 `ops/versions.lock.yaml`） |

## 改 cron 嘅規矩

1. 在 CL **文檔**記錄意圖（例如 `docs/PHASE1-CRON-CHANGES-*.md`）。
2. 用 `openclaw-cron.sh` / Hermes cron API 改 **本機** `jobs.json`，或日後把範本放入 `ops/openclaw/cron/`。
3. 驗證：`./ops/dual-star/doctor.sh`。
4. 重要變更寫入 memory KB 或 project-state。

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

- [HANDOFF_HERMES.md](./HANDOFF_HERMES.md) — OpenClaw → Hermes 8642
- [OPENCLAW_INDEX.md](./OPENCLAW_INDEX.md)
- [PROJECTS-INDEX.md](./PROJECTS-INDEX.md)
- [PHASE1-CRON-CHANGES-2026-05-21.md](./PHASE1-CRON-CHANGES-2026-05-21.md)
