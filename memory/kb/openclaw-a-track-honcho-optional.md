# A 軌可選：OpenClaw + Honcho（用戶建模／跨 session）

**時機**：想補「自動觀察偏好」而唔想換 Hermes 時先做呢步。與 **QMD 本機索引**可並存（官方說法）。

## 前置

- 有 **Honcho** API key（[honcho.dev](https://honcho.dev/)）**或** 自架 instance（可唔使雲端 key）。
- 願意將對話同步去 Honcho 服務（自架則留在本機）。

## 安裝（官方流程摘要）

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway restart
```

`honcho setup` 會提示憑證、寫入 `plugins.entries["openclaw-honcho"].config`，並可選 **遷移現有** `USER.md`／`MEMORY.md`／`memory/`（**非破壞性**，原檔唔刪）。

## 設定形狀（參考）

見 [OpenClaw Honcho Memory](https://docs.openclaw.ai/concepts/memory-honcho)：`apiKey`、`workspaceId`、`baseUrl`（自架改 `http://localhost:8000` 等）。

## 驗收

- `openclaw honcho status`
- 私聊試 `honcho_search`／對話幾輪後再問偏好相關問題有無變準

## 私隱

- 群組／非 DM 若唔想入 Honcho，要另外對照 Honcho／OpenClaw 文檔嘅 session 與 workspace 隔離設定。
