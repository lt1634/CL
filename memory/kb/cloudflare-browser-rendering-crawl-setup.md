# Cloudflare Browser Rendering `/crawl`：Token 設定 + 測通 + 給 OpenClaw 用

（你張圖嗰個 endpoint：`/client/v4/accounts/{account_id}/browser-rendering/crawl`）

---

## A) 建 Cloudflare API Token（最小權限）

Cloudflare 官方要求：API Token 需要 **`Browser Rendering - Edit`** 權限（REST API）  
參考：[Get started — REST API prerequisites](https://developers.cloudflare.com/browser-rendering/get-started/)

### 1) 去 Token 頁面

打開 Cloudflare Dashboard → Profile → API Tokens  
或直接用 Cloudflare 官方指引：[Create API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)

### 2) 建一個 Custom token

- **Token name**：例如 `browser-rendering-crawl`
- **Permissions**：揀 `Browser Rendering - Edit`
- **Resources**：建議先揀你需要嘅 account（最小範圍），唔好 All accounts
- （可選）加 IP allowlist / TTL（如果你有固定出口 IP）

> Token 只會顯示一次，唔好貼喺 chat / repo / log。

### 3) 驗證 token 有效

```bash
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  --header "Authorization: Bearer <API_TOKEN>"
```

成功會見到 `\"status\": \"active\"`（Cloudflare 官方例子見同一頁）。  

---

## A-2) 取得 account_id

你需要 Cloudflare account id 放入 URL。官方指引：  
[Find your zone and account IDs](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/)

---

## B) 測通 `/crawl`（兩步：POST → GET job）

Cloudflare changelog 例子（含 POST/GET）：  
[Crawl entire websites with a single API call using Browser Rendering](https://developers.cloudflare.com/changelog/post/2026-03-10-br-crawl-endpoint/)

### 1) 開 crawl job

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/<account_id>/browser-rendering/crawl" \
  -H "Authorization: Bearer <apiToken>" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://blog.cloudflare.com/"}'
```

你會攞到 `job_id`（通常喺 `result.id`）。

### 2) poll 結果

```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts/<account_id>/browser-rendering/crawl/<job_id>" \
  -H "Authorization: Bearer <apiToken>"
```

狀態常見：`running` / `completed` / `errored` / `cancelled_*`（以官方 docs 為準）。

---

## B-2) 常見「點解仲係 access denied」

Cloudflare 官方亦講明：`/crawl` **唔可以 bypass bot detection/captcha**，而且會自我標識為 bot。  
（見上面 changelog 末段。）

所以如果目標站有更嚴嘅 bot 防護/登入牆，仍然可能失敗。

---

## C) B：用 CLI 小工具（方便 agent/OpenClaw 呼叫）

我已喺 repo 根目錄加咗一個 **零依賴**腳本：`cf-crawl.mjs`

### 用法

1) 設環境變數（建議放 `~/.openclaw/.env` 或你嘅 shell env；唔好寫入 repo）

- `CF_ACCOUNT_ID`
- `CF_API_TOKEN`

2) 跑：

```bash
CF_ACCOUNT_ID=... CF_API_TOKEN=... node cf-crawl.mjs --url "https://example.com/" --out crawl.json
```

- 會先 POST 開 job，再 GET poll，完成後輸出完整 JSON（或寫到 `--out`）。

### 點俾 OpenClaw/agent 用

- 最簡單：把 `node cf-crawl.mjs --url ... --out ...` 當成一個外部 command，在需要抓網頁時手動跑/或由 cron 叫。
- 如果你想變成 OpenClaw 的正式 tool（例如 `crawl_url`），下一步可以把呢個 script 包裝成 plugin/tool schema；但要先確認你嘅 OpenClaw plugin 流程同安全策略。

