# OpenClaw 點開 TUI / 客戶端

**用途**：TUI（Terminal User Interface）係同 main session agent 對話嘅介面。開住 TUI = main session 在線，可以收到 cron 打去 main 嘅 **systemEvent**（例如每日 21:00 嘅 daily-thought-capture）。

---

## 點開

1. **Gateway 要跑緊**（你已用 LaunchAgent，通常已常駐；可 `openclaw gateway status` 確認）。

2. **開另一個 terminal**，任選其一：
   - **全局安裝**：  
     `openclaw tui`
   - **從 OpenClaw 源碼目錄**：  
     `cd /Users/timnewmac/Desktop/CL/openclaw && pnpm tui`

3. **（可選）一開就開 delivery**：  
   `openclaw tui --deliver`  
   否則入到 TUI 後打 `/deliver on` 先會把回覆送去 WhatsApp 等 channel。

4. 入到 TUI 後直接打字同 main agent 傾；可用 `/session main`、`/agent ...` 等指令切 session/agent。

---

## 同 daily-thought-capture 嘅關係

- **main session** 嘅 cron（例如 daily-thought-capture）會向 main 打 **systemEvent**。
- 若 **21:00 時 TUI 有開住**（即 main session 在線），agent 會收到 event 並可以執行「用 sessions_history 整理今日對話 → 寫 memory/YYYY-MM-DD.md」。
- 若 21:00 時 **冇開 TUI**，event 可能會留低等下次有人連上 main 先處理（視乎 Gateway 行為）。

**參考**：[TUI - OpenClaw](https://docs.openclaw.ai/web/tui)、你已有 `tui-gateway-disconnected-whatsapp-works.md`（TUI 斷線時 WhatsApp 仍正常）。
