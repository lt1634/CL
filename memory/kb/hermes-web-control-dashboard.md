# Hermes：瀏覽器「睇狀態／管理」（Agent control）

**唔係** OpenClaw 嘅 `http://127.0.0.1:18789/overview`。

---

## 0. 若出現 `invalid choice: 'web'`

代表你而家個 **`hermes` CLI 冇編入 `web` 子命令**（常見原因：用 **`pip install hermes-agent`** 精簡裝，**冇裝 optional `[web]`**；或版本舊過官方文件）。

**官方做法**：喺 **Hermes 所用嘅 Python venv** 補裝 web extra（路徑以你機為準，常見如下）：

```bash
# 你 plist 用緊嘅 venv（與 gateway 一致最穩）
/Users/timnewmac/.hermes/hermes-agent/venv/bin/pip install -U "hermes-agent[web]"
# 或一次裝齊可選組件
# /Users/timnewmac/.hermes/hermes-agent/venv/bin/pip install -U "hermes-agent[all]"
```

然後確認：

```bash
export PATH="${HOME}/.local/bin:${PATH}"
hermes --help | head -5
hermes web --help
```

仍冇 `web`：跑 **`hermes update`**（官方會跟版本加指令），再睇 [Web Dashboard 文件](https://hermes-agent.nousresearch.com/docs/user-guide/features/web-dashboard) 有冇改入口名。

---

## 1. 官方 Web Dashboard（有 `hermes web` 之後）

```bash
export PATH="${HOME}/.local/bin:${PATH}"
hermes web
```

- 預設 **`http://127.0.0.1:9119`**（本機）。
- **`hermes web --no-open`**、**`--port`**、**`--host`** 見 `--help`。

缺 **FastAPI／Uvicorn** 時，官方亦建議用 **`pip install hermes-agent[web]`** 補齊。

---

## 2. 未有 Web 之前：用 CLI／log 睇狀態

```bash
hermes doctor
hermes status          # 若有此子命令
hermes gateway status
tail -50 ~/.hermes/logs/gateway.log
tail -50 ~/.hermes/logs/agent.log
```

你 repo 嘅 **va-bots-home `/company`** 可睇 **Hermes 摘要**（`HERMES_HOME`、8642 探測等），但唔係 Hermes 官方全套控制台。

---

## 3. 同 `hermes gateway` 嘅關係

- **`hermes gateway`**：訊息 gateway（LaunchAgent `ai.hermes.gateway`）。
- **`hermes web`**：另一個本機 HTTP 服務；埠唔好同 OpenClaw **18789**、你自己 **8642** 撞。

---

## 4. 第三方 WebUI（進階）

例如 [nesquena/hermes-webui](https://github.com/nesquena/hermes-webui)（另開埠、另裝）；自行評估安全與維護。

---

## 相關

- [hermes-gateway-disconnect-reconnect.md](./hermes-gateway-disconnect-reconnect.md)
- [openclaw-b-track-hermes-checklist.md](./openclaw-b-track-hermes-checklist.md)
