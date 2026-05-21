# Hermes：gateway disconnect 點重連

## 先分兩種「斷」

| 情況 | 意思 | 常見處理 |
|------|------|----------|
| **Provider ReadTimeout**（log 寫 `Reconnecting… attempt x/3`） | Hermes **仲跑緊**，只係對 **LLM API** 讀取逾時，程式會自己重試 | 多數 **唔使** 重啟整個 gateway；見 [hermes-provider-readtimeout-reconnecting.md](./hermes-provider-readtimeout-reconnecting.md) |
| **Gateway 真係掛咗／disconnect** | process 無咗、LaunchAgent 停咗、長期收唔到 Telegram 等 | 下面 **重啟 gateway** |

---

## 做法 A：CLI（最常用）

```bash
export PATH="${HOME}/.local/bin:${PATH}"
hermes gateway status
hermes gateway restart
sleep 2
hermes gateway status
```

改咗 **`~/.hermes/config.yaml`** 或 **`~/.hermes/.env`** 之後，一樣要 **`hermes gateway restart`** 先食到新設定。

本 repo 有一鍵檢查尾 log + doctor（會順便 restart）：  
[`projects/hermes-standalone/post-install.sh`](../../projects/hermes-standalone/post-install.sh)

```bash
bash /path/to/CL/projects/hermes-standalone/post-install.sh
```

---

## 做法 B：macOS LaunchAgent（你用 `hermes gateway install` 裝過）

Hermes 常見 label：**`ai.hermes.gateway`**（以你本機 plist 為準）。

```bash
# 睇有冇 load
launchctl list | grep -i hermes

# 重啟（路徑按你實際 plist）
launchctl kickstart -k gui/$(id -u)/ai.hermes.gateway
```

若 kickstart 無效，再試 **unload → load**（plist 路徑請 `ls ~/Library/LaunchAgents/*hermes*` 確認）：

```bash
launchctl unload ~/Library/LaunchAgents/ai.hermes.gateway.plist
launchctl load ~/Library/LaunchAgents/ai.hermes.gateway.plist
```

---

## 睇 log 同自檢

```bash
tail -f ~/.hermes/logs/agent.log
hermes doctor
```

仍斷：檢 **網絡／VPN**、**Telegram token**、**OpenRouter（或你 provider）狀態**；必要時對照官方 [NousResearch/hermes-agent](https://github.com/nousresearch/hermes-agent) 文件。

---

## 相關

- [hermes-web-control-dashboard.md](./hermes-web-control-dashboard.md)（瀏覽器睇狀態／管理：`hermes web`）
- [openclaw-b-track-hermes-checklist.md](./openclaw-b-track-hermes-checklist.md)（安裝與 `gateway install`）
- [hermes-provider-readtimeout-reconnecting.md](./hermes-provider-readtimeout-reconnecting.md)（provider 層 timeout，唔係 gateway 死）
