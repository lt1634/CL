# Pony-Alpha（智谱）喺 OpenClaw 設定 + 執行準確率測試

**模型**：Pony Alpha（智谱 GLM-5，經 OpenRouter）— 200K context、免費、標榜編程/Agent 準確率高。  
**OpenRouter model id**：`openrouter/pony-alpha`

---

## 1. 喺 OpenClaw 加 Pony-Alpha

### 1.1 攞 OpenRouter API Key

- 去 https://openrouter.ai 註冊／登入。
- 創建或複製 API Key（格式通常 `sk-or-...`）。
- Pony Alpha 喺 OpenRouter 係 **$0**，唔使入錢都可試。

### 1.2 用 CLI 入 Key（建議）

```bash
openclaw onboard --auth-choice apiKey --token-provider openrouter --token "sk-or-你的key"
```

（或把 key 放入 `~/.openclaw/.env`：`OPENROUTER_API_KEY=sk-or-...`，記得 `chmod 600`。）

### 1.3 改 openclaw.json

**只加 Pony-Alpha 做其中一個選擇（同 MiniMax 並存）：**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "minimax/MiniMax-M2.5",
        fallbacks: ["openrouter/pony-alpha"],
      },
    },
  },
}
```

**或直接改用 Pony-Alpha 做主力試準確率：**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "openrouter/pony-alpha",
      },
    },
  },
}
```

改完 **restart Gateway**（或 reload config，視你點跑）。

---

## 2. 執行準確率 — 簡單測試清單

用同一批任務，分別用 **Pony-Alpha** 同 **MiniMax-M2.5** 各做一次，對比結果。

| # | 任務（示例） | 點算「準」 |
|---|--------------|------------|
| 1 | 「用一句話解釋 recursion，再寫一段 Python 用 recursion 計 factorial。」 | 解釋合理、code 可運行、結果正確 |
| 2 | 「列出 3 個 openclaw.json 常見設定項同各自用途。」 | 項目存在、用途描述正確 |
| 3 | 「我而家喺 ~/Desktop/CL，幫我寫一條 command 列出所有 .md 檔名。」 | 命令可執行、輸出符合預期 |
| 4 | 「用 JSON 格式俾一個簡單的 todo 列表，要有 title、due、done 三個欄位，2 個項目。」 | 合法 JSON、欄位齊、可 parse |
| 5 | 「唔用專業術語，用 20 字以內解釋咩係 API。」 | 字數唔超、意思正確 |

**點試：**

1. 設 `primary: "openrouter/pony-alpha"`，喺 TUI 或 WhatsApp 逐條發上面任務，記低回覆（或截圖）。
2. 改 `primary: "minimax/MiniMax-M2.5"`，restart/reload 後再發同一 5 條，記低回覆。
3. 對比：邊個更貼指令、少 hallucination、格式更啱（例如 JSON、command 可直接用）。

若你想試 **tool/function 準確率**：加一兩條要佢「用某個 skill 或執行一步」嘅指令，睇佢有冇正確 call、參數啱唔啱。

---

## 3. 參考

- OpenRouter Pony Alpha：https://openrouter.ai/openrouter/pony-alpha/api  
- OpenClaw OpenRouter：`openclaw/docs/providers/openrouter.md`
