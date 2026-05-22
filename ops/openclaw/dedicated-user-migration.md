# R2：獨立低權限 `openclaw` 用戶（Mac mini 24/7）

> **Critical** — agent 與 admin 同權時，prompt injection / `tools.elevated` / browser 被控 = 整台 Mac 失守。  
> 完整步驟見 [`docs/OPENCLAW_SECURITY_AUDIT_2026.md`](../../docs/OPENCLAW_SECURITY_AUDIT_2026.md) R2。

## 前置

- 維護窗口 30–60 分鐘（Gateway 會停）
- 已 `openclaw security audit --fix`、`.env` 為 `600`
- memory 路徑**無**明文憑證（跑 `./ops/openclaw/harden-openclaw.sh`）

## 建議 UID

```bash
# 選未佔用 UID（勿硬編 501）
dscl . -list /Users UniqueID | awk '{print $2}' | sort -n | tail -5
```

## 遷移概要

1. `sudo sysadminctl -addUser openclaw -fullName "OpenClaw Agent" -password '…' -shell /bin/zsh`（或 `dscl` 手動）
2. `sudo mv ~/.openclaw /Users/openclaw/.openclaw && sudo chown -R openclaw:staff /Users/openclaw/.openclaw`
3. LaunchAgent 改以 `openclaw` 運行，或改用 **LaunchDaemon** + `UserName openclaw`
4. Tim 只保留 **SSH / 本機管理**；日常唔用 admin 帳跑 gateway
5. `openclaw gateway restart` 後 `openclaw security audit --deep`

## ACL（可選）

若需 Tim 只讀日誌、唔改 config：

```bash
sudo chmod -R o-rwx /Users/openclaw/.openclaw
```

## 驗證

```bash
ps aux | grep -i openclaw
launchctl print gui/$(id -u openclaw)/ai.openclaw.gateway  # 若 GUI session
curl -s http://127.0.0.1:18789/health  # 依版本調整
```

## 回滾

保留 `~/.openclaw.bak`  tarball 再遷移；出問題可 `sudo mv` 回 timnewmac 並改回 LaunchAgent UserName。
