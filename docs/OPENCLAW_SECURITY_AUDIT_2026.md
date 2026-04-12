# OpenClaw on Mac mini 安全审计报告

**审计日期**: 2026-02-14  
**审计依据**: OpenClaw 官方 Security 文档 + 《OpenClaw on Mac mini 完整部署指南》Checklist  
**环境**: macOS 26.3 (25D125), 用户 timnewmac (admin)

---

## 一、红/黄/绿问题清单（按风险排序）

### 🔴 红（高优先级）

| # | 检查项 | 当前状态 | 风险说明 |
|---|--------|----------|----------|
| R1 | **`.env` 权限过宽** | `644` (rw-r--r--) | 若含 API key，同机其他用户可读 |
| R2 | **无独立 agent 用户** | 以 timnewmac (admin) 运行 | agent 与管理员同权，一旦被控影响面大 |
| R3 | **workspace/memory 含明文凭证** | `instagram-credentials.md` 在 memory 路径 | 可能被 RAG/记忆检索，增加泄露面 |

### 🟡 黄（建议修复）

| # | 检查项 | 当前状态 | 风险说明 |
|---|--------|----------|----------|
| Y1 | **trustedProxies 未配置** | 空 | 若将来走反向代理，本地信任检测可能被伪造 |
| Y2 | **Tailscale 未部署** | 未安装 | 远程访问需 SSH 端口转发，无 tailnet 隔离 |
| Y3 | **Browser control 启用** | `browser.enabled: true` | 浏览器已登录的账户可被 agent 操作 |
| Y4 | **tools.elevated 启用** | 全局开启 | exec 可跑宿主机命令，需配合 allowFrom 限制 |
| Y5 | **API 消费无上限** | 未配置 spending limit | 被滥用时无硬刹车 |
| Y6 | **Time Machine 未运行** | Running=0 | 无本地备份，故障恢复困难 |
| Y7 | **Gateway token 明文在配置** | 在 openclaw.json | 文件已 600，但建议迁入 env 减少意外泄露 |

### 🟢 绿（已达标）

| # | 检查项 | 当前状态 |
|---|--------|----------|
| G1 | **Gateway 仅 loopback** | `gateway.bind: "loopback"`, 127.0.0.1:18789 |
| G2 | **WhatsApp DM/群策略** | `dmPolicy: allowlist`, `groupPolicy: allowlist`, `allowFrom: ["+85267605407"]` |
| G3 | **openclaw.json 权限** | `600` ✓ |
| G4 | **~/.openclaw 权限** | `700` ✓ |
| G5 | **credentials 目录** | `700` ✓ |
| G6 | **auth-profiles.json** | `600` ✓ |
| G7 | **系统防火墙** | 已启用 ✓ |
| G8 | **FileVault** | 已开启 ✓ |
| G9 | **OpenClaw 版本** | 2026.2.12 (stable, 最新) ✓ |
| G10 | **LaunchAgent 常驻** | ai.openclaw.gateway.plist ✓ |

---

## 二、修复步骤（可复制命令）

### R1: 收紧 `.env` 权限

```bash
chmod 600 ~/.openclaw/.env
```

**验证**:
```bash
stat -f "%A" ~/.openclaw/.env   # 应为 600
```

### Y7 补充（env 占位符）

- 在 `openclaw.json` 中可用 **`${VAR_NAME}`** 引用環境變數（見官方 [Environment](https://docs.clawd.bot/help/environment)）。
- 已將 **`gateway.auth.token`** 改為 **`${OPENCLAW_GATEWAY_TOKEN}`**、**`tools.web.search.apiKey`** 改為 **`${BRAVE_API_KEY}`** 時，請把對應值寫入 **`~/.openclaw/.env`**，勿在文檔或截圖中泄露。
- 若密鑰曾暴露：輪換後更新 `.env` 並重啟 Gateway。

---

### R2: 创建独立 agent 用户（可选，春节版可暂缓）

```bash
# 1. 创建 agent 用户（无管理员）
sudo dscl . -create /Users/openclaw
sudo dscl . -create /Users/openclaw UserShell /bin/zsh
sudo dscl . -create /Users/openclaw RealName "OpenClaw Agent"
sudo dscl . -create /Users/openclaw UniqueID 501   # 选未占用的 UID
sudo dscl . -create /Users/openclaw PrimaryGroupID 20
sudo dscl . -create /Users/openclaw NFSHomeDirectory /Users/openclaw
sudo dscl . -passwd /Users/openclaw '<强密码>'

# 2. 迁移 ~/.openclaw 到 agent 用户
sudo mv /Users/timnewmac/.openclaw /Users/openclaw/.openclaw
sudo chown -R openclaw:staff /Users/openclaw/.openclaw

# 3. 修改 LaunchAgent 以 openclaw 运行
# 编辑 ~/Library/LaunchAgents/ai.openclaw.gateway.plist
# 将 UserName 改为 openclaw，或改用 LaunchDaemon 以 openclaw 运行
```

**春节版建议**：可暂不执行，在“最低可接受基线”中作为后续强化项。

---

### R3: 移除或隔离 memory 中的凭证文件

```bash
# 方案 A：移出 memory 路径
mv ~/.openclaw/workspace/memory/instagram-credentials.md ~/.openclaw/workspace/memory/.exclude/
# 或放到 ~/.openclaw/credentials/ 并限制权限

# 方案 B：从 memory 索引中排除（在 openclaw.json 的 memory.qmd.paths 中排除该文件）
# 或直接删除：若不再需要
# rm ~/.openclaw/workspace/memory/instagram-credentials.md
```

---

### Y1: 配置 trustedProxies（若使用反向代理）

若 **未** 使用 nginx/Caddy 等反向代理，可保持空，此告警可忽略。

若使用，在 `openclaw.json` 添加：

```json
"gateway": {
  "trustedProxies": ["127.0.0.1"]
}
```

---

### Y2: 安装 Tailscale（可选）

```bash
brew install --cask tailscale
# 或从 https://tailscale.com/download 安装

# 安装后
sudo tailscale up
tailscale status
```

---

### Y3: 浏览器控制风险缓解

- 使用 **独立的 Chrome/Arc 配置文件** 给 agent（默认 `openclaw` profile）
- 该 profile 内 **关闭密码同步、登录敏感账号**
- 文档建议：对启用 browser 的 agent，开启重要账户的 2FA（硬件 key 优先）

---

### Y5: 设置 API 消费限额

在 Minimax / Anthropic 等控制台设置每月预算上限。OpenClaw 配置中暂无内置 spending limit，需在 Provider 控制台完成。

---

### Y6: 启用 Time Machine

```bash
# 系统设置 → 通用 → Time Machine → 添加备份磁盘
# 或命令行（需已连接备份盘）
tmutil enable
tmutil enablelocal   # 本地快照
tmutil status
```

---

### 一键收紧权限（OpenClaw 官方）

```bash
npx openclaw security audit --fix
```

会执行：
- `~/.openclaw` → 700
- `openclaw.json` → 600
- `credentials/*.json`、`agents/*/agent/auth-profiles.json`、`sessions.json` 等 → 600

---

## 三、春节版最低可接受安全基线

适用于「春节期间无人值守、Mac mini 作为 headless 网关」场景。

### 必须满足（基线）

| 项目 | 配置/动作 |
|------|-----------|
| **网络暴露** | Gateway `bind: "loopback"`，不对公网开端口 ✓ |
| **远程访问** | 仅通过 SSH（端口转发）或 Tailscale，不开放 18789 到公网 |
| **消息通道** | WhatsApp `allowFrom` + `groupPolicy: allowlist` ✓ |
| **目录权限** | `~/.openclaw` 700，`openclaw.json` 600 ✓ |
| **敏感文件** | `.env` 改为 600；memory 路径不放置明文凭证 |
| **磁盘加密** | FileVault 开启 ✓ |
| **防火墙** | 系统防火墙开启 ✓ |
| **常驻方式** | LaunchAgent 或 LaunchDaemon，便于重启后自启 ✓ |

### 建议满足（加强）

| 项目 | 配置/动作 |
|------|-----------|
| **API 限额** | 在 Provider 控制台设置月预算上限 |
| **备份** | Time Machine 或等价备份，定期验证 |
| **审计** | 每周或每月执行 `openclaw security audit --deep` |
| **Browser** | 若启用，使用独立 profile + 不在 profile 登录敏感账户 |

### 可延后（节后强化）

| 项目 | 说明 |
|------|------|
| 独立 agent 用户 | 需要迁移目录和 LaunchAgent，操作较多 |
| Tailscale | 可替代 SSH 端口转发，简化远程访问 |
| trustedProxies | 仅在接入反向代理时需配置 |

---

## 四、快速执行清单（复制粘贴）

```bash
# 1. 收紧 .env
chmod 600 ~/.openclaw/.env

# 2. 应用 OpenClaw 官方权限修复
npx openclaw security audit --fix

# 3. 处理 memory 中的凭证（按需二选一）
# mv ~/.openclaw/workspace/memory/instagram-credentials.md ~/.openclaw/credentials/
# 或删除

# 4. 验证
npx openclaw security audit --deep
stat -f "%A %L" ~/.openclaw ~/.openclaw/.env ~/.openclaw/openclaw.json
```

---

## 五、定期审计建议

```bash
# 每次修改配置或暴露网络后
npx openclaw security audit --deep

# 每周/每月
npx openclaw security audit
npx openclaw update status
```

---

*报告生成：OpenClaw 安全审计官 | 基于 openclaw/docs/gateway/security/index.md 与部署指南 Checklist*
