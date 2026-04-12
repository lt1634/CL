# WhatsApp「向自己傳送」loop（自己嘅回覆打返入 agent）

## 發生咩事（簡單）

- 你用 **向自己傳送訊息**（self-chat）同 OpenClaw 傾。
- Agent **send 出去**嘅內容，會再經 WhatsApp **當作新訊息**流入 Gateway。
- OpenClaw 會用 **echo detection**（記低啱啱 send 嘅文字，撞返就 skip）去避免 loop。
- 若 **回流文字同記錄唔完全一致**（格式、換行、截斷、媒體、分段送），就會 **再入一次 agent** → 似「loop」。

呢個係 **self-chat 模式常見痛點**，唔一定係你設定單一欄位錯。

---

## 你可以點做（由實際到進階）

### 1. 優先用其他「面」傾長任務

- **TUI** 或 **Gateway Dashboard 聊天**（本機）：冇 WhatsApp 回流問題。
- WhatsApp 留俾 **短指令／通知**。

### 2. 喺 WhatsApp 慣用較短回合

- 超長回覆更易出現 **字串唔夾** → echo 防唔到。
- 可喺 `AGENTS.md`／提示叫 agent **WhatsApp 用短句**，詳情用檔案／TUI。

### 3. 確認 `selfChatMode` 同 `allowFrom`

- `~/.openclaw/openclaw.json` 內 `channels.whatsapp`：你之前用 **`selfChatMode: true`** 係合理，但 **唔會單靠佢杜绝 loop**。
- 保持 **`allowFrom`** 只係你嘅號（你已係咁）。

### 4. 睇 log 有冇 echo skip

```bash
pm2 logs openclaw --lines 100 | grep -i echo
```

若見 **`Skipping auto-reply: detected echo`**，代表機制有郁；若 loop 仲有，多數係 **字串唔 match**。

### 5. 重連 WhatsApp、更新 OpenClaw

- 408／斷線會令送件同記錄亂序，間接令 loop 易發生。
- 保持 **`git pull` + `pnpm build` + `pm2 restart openclaw`**。

---

## 若你想從根本改善（上游）

OpenClaw WhatsApp 插件已有 **echo tracker**（`extensions/whatsapp/.../echo.ts`、`on-message.ts`）。若可穩定復現，可向 **openclaw/openclaw** 報 issue：附 **self-chat、長文回覆、loop 截圖** 同 **`pm2 logs` 片段**。

可能方向（畀開發者參考）：對 self-chat 加 **送出訊息 id** 白名單、或 **normalize 再比對**，唔只靠全文相等。

---

## 修訂

- 2026-03-23：初版（向自己傳送／echo／建議分流到 TUI）。
