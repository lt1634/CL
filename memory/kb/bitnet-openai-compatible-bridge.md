# BitNet → OpenClaw：等 OpenAI-compatible endpoint 時點接（省錢版）

目標：BitNet/bitnet.cpp（或社群包裝）一旦提供 **OpenAI-compatible HTTP API**，你可以用最少改動把佢接入 OpenClaw，當成本更低嘅本地推理 fallback。

> 核心原則：**而家唔寫 proxy**；只做「接口位 + 檢查清單」，等 endpoint ready 先接。

---

## 0) 你要等嘅「入場門檻」

BitNet 端需要至少其中一個：

- **`POST /v1/chat/completions`**（OpenAI Chat Completions 相容）
- **`POST /v1/responses`**（OpenAI Responses 相容）

同時要支援：

- Request 裏面接受 `model`（可忽略但要唔 crash）
- Response 有可抽取文本的欄位（例如 `choices[0].message.content` 或 `output_text`）

---

## 1) 先做「佔位設定」（而家就做，之後只改 URL）

### 1.1 建議先定一個本地 URL

假設你將來會用：

- `http://127.0.0.1:8080/v1`

> 記住：OpenClaw 通常用 `baseUrl + /v1/...` 形式。你把 `/v1` 放到 baseUrl，將來就穩定。

### 1.2 OpenClaw 的 fallback 策略（先照用現有 provider）

先保持你而家最穩嘅主力（例如 MiniMax），再加一個「平/免費」fallback（例如 OpenRouter Pony Alpha）：

```json5
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "minimax/MiniMax-M2.5",
        "fallbacks": ["openrouter/pony-alpha"]
      }
    }
  }
}
```

將來 BitNet endpoint ready，你就會把 `fallbacks` 中其中一個換成「BitNet provider/model」。

---

## 2) 接入當日 Checklist（endpoint ready 嗰日照住做）

### 2.1 用 curl 驗證 endpoint（必做）

#### A) 若係 `/v1/chat/completions`

```bash
curl -sS http://127.0.0.1:8080/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer dummy' \
  -d '{
    "model": "bitnet",
    "messages": [{"role":"user","content":"Say OK"}]
  }'
```

你要見到類似：

- `choices[0].message.content` 有文字

#### B) 若係 `/v1/responses`

```bash
curl -sS http://127.0.0.1:8080/v1/responses \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer dummy' \
  -d '{
    "model": "bitnet",
    "input": "Say OK"
  }'
```

你要見到類似：

- `output_text`（或可抽取嘅輸出文字）

> 如果 curl 已經唔過，OpenClaw 一定接唔到；先修 endpoint。

### 2.2 再決定 OpenClaw 用邊種接法

#### 方案 A（最理想）：OpenClaw 有「OpenAI-compatible provider/baseUrl」可直接指去你本地

當 BitNet server 係 OpenAI-compatible，你就：

- 設 `baseUrl = http://127.0.0.1:8080/v1`
- 設 `apiKey` 可以用 dummy（除非你個 server 需要驗證）

> 由於你 repo 內 OpenClaw 版本/配置可能因時而異，實際「baseUrl 寫喺邊」要對你而家用緊嘅 provider 設定文件。到時我可以按你當時的 `openclaw.json` 幫你填好。

#### 方案 B（可接受）：用統一 gateway（LiteLLM/vLLM）包一層

若 BitNet server 唔係 100% OpenAI spec，但又接近，可以用 LiteLLM/vLLM 做兼容層，OpenClaw 指向 LiteLLM/vLLM。

---

## 3) 成本/體驗判斷（值唔值得接）

就算 endpoint 可用，你仍然要驗證：

- **延遲**：短 prompt 首 token 速度；agent 多回合會好敏感
- **穩定**：長輸出、連續 20 次請求會唔會崩/變慢
- **工具/JSON**：你常用嘅結構化輸出是否穩（例如 JSON、指令格式）

建議用同一個 prompt 跑 10 次，對比：

- 你而家主力模型（雲）
- BitNet 本地

如果 BitNet 只係「平但錯好多」，就只放做 fallback，唔做 primary。

---

## 4) 安全提醒（省錢不等於零風險）

- **本地 endpoint** 建議只 bind loopback（127.0.0.1），唔好直接暴露到 LAN/WAN。
- 若你要遠程用，優先用 Tailscale / 反向代理 + 認證，唔好裸奔。

