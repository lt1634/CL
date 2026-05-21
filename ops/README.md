# Dual-star ops (OpenClaw + Hermes)

CL 係 **運維 SSOT**；實際運行仍喺 `~/.openclaw/` 同 `~/.hermes/`（秘密唔入 git）。

| 路徑 | 用途 |
|------|------|
| [`dual-star/doctor.sh`](./dual-star/doctor.sh) | 一次檢查兩邊 gateway、CLI 版本、submodule |
| [`dual-star/install.sh`](./dual-star/install.sh) | 初始化 submodule、驗證本機安裝 |
| [`openclaw/openclaw-cron.sh`](./openclaw/openclaw-cron.sh) | 編輯 `~/.openclaw/cron/jobs.json`（停 gateway → 改 → 起） |
| [`hermes/post-install.sh`](./hermes/post-install.sh) | Hermes gateway 重啟 + doctor（secret 只放 `~/.hermes/.env`） |
| [`versions.lock.yaml`](./versions.lock.yaml) | 釘住文檔／submodule 對應版本 |
| [`../vendor/hermes-agent`](../vendor/hermes-agent) | Hermes **源碼** submodule（對照用；執行仍用本機 `hermes` CLI） |

文檔：[docs/DUAL-STAR-OPS.md](../docs/DUAL-STAR-OPS.md)
