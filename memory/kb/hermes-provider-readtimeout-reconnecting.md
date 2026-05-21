# Hermes：`Connection to provider dropped (ReadTimeout). Reconnecting…`

## 簡單講係咩

- 呢句係 **Hermes agent → 上游 LLM provider**（例如 OpenRouter、自建 API、Nous Portal 等）條 HTTP／**串流（SSE）**連線，喺 **讀取階段**等唔到資料，觸發 **`ReadTimeout`**。
- **唔等於** `HANDOFF_HERMES.md` 講嘅 **web fetch**（Tavily／Firecrawl／PubMed 頁）——嗰邊係 **`HERMES_WEB_FETCH_TIMEOUT_SECONDS`** 等；**provider timeout 係另一組設定**（喺 Hermes／HTTP client 對 **chat/completions** 嗰層）。

## `Reconnecting… (attempt 2/3)` 點睇

- 代表 Hermes **會自動重連／重試**；好多時係 **provider 一瞬慢、網絡抖動、長生成中間隔耐**。
- 若 **3/3 都失敗**：多數要查 **provider 健康、模型負載、本機網絡**，而唔係淨係加 web fetch 秒數。

## 建議排查（由快到慢）

1. **睇同一時間 provider 狀態**（OpenRouter status、自建 endpoint log）；換一個 **較細／較快**模型試一句，確認係 **timeout** 定 **401／429**。
2. **網絡**：VPN／公司代理／DNS；本機 `curl` 直打 provider base URL（短 request）是否穩定。
3. **長回覆／streaming**：若用 stream，**read timeout** 往往要涵蓋「**兩段 token 之間最長靜默**」；大模型思考長、或 provider 排隊，都會拉長靜默。→ 喺 Hermes 官方／`config.yaml` 內搵 **request／read／client timeout** 類欄位（名稱以你安裝版本為準），**適度加大**後 **`hermes gateway restart`**。
4. **唔好無上限**：過長會佔住連線；可配合 **較短 max_tokens** 或分拆任務，減少單次生成時間。
5. **8642 經 va-bots-home proxy**：若錯誤出喺 **OpenClaw 呼叫 Hermes API** 嗰條線，要查 **`HERMES_PROXY_TIMEOUT_MS`** 同 proxy log；與 Hermes UI 內「provider」可能係兩條路。

## 同 OpenClaw 分工

- **OpenClaw**：IM／cron 主入口；唔會自動修 Hermes 對 provider 嘅 timeout。
- **Hermes**：自己 gateway 連 model；呢類訊息喺 **Hermes log** 最準。

## 相關

- [docs/HANDOFF_HERMES.md](../../docs/HANDOFF_HERMES.md)（B 軌、web timeout、補驗）
- [openclaw-b-track-hermes-checklist.md](./openclaw-b-track-hermes-checklist.md)

---

*Hermes 具體 config key 以 [NousResearch/hermes-agent](https://github.com/nousresearch/hermes-agent) 或你本機 `config.yaml` 為準。*
