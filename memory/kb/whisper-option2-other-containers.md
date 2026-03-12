# Option 2：其他支援 /v1/audio/transcriptions 嘅 Whisper container

若你試過某個 image 都係 404，可以試下面幾個 **明確支援 OpenAI `/v1/audio/transcriptions`** 嘅專案（用 Docker 跑）。

---

## 1. faster-whisper-openai-api（推薦試）

- **Repo**：https://github.com/a8851625/faster-whisper-openai-api  
- **Endpoint**：`POST /v1/audio/transcriptions`（與 OpenAI 格式一致）
- 跟 repo 嘅 Docker / Docker Compose 說明跑，記低 port（常見 8000 或 9000），OpenClaw `baseUrl` = `http://<host>:<port>/v1`。

---

## 2. Hantok/local-whisper-backend

- **Repo**：https://github.com/Hantok/local-whisper-backend  
- **Endpoint**：`/v1/audio/transcriptions`，支援 Apple Silicon / NVIDIA / CPU
- 用 repo 內嘅 Docker 或 uvicorn 方式跑，多數 port 9000，`baseUrl` = `http://<host>:9000/v1`。

---

## 3. 3choff/FastWhisperAPI

- **Repo**：https://github.com/3choff/fastwhisperapi  
- 標明 **fully compatible with OpenAI's API**，有 Docker 部署。
- 按 README 跑起後，用 `baseUrl` 指去該服務嘅 `/v1`。

---

## 4. Mubashir4/Faster-Whisper-API

- **Repo**：https://github.com/Mubashir4/Faster-Whisper-API  
- FastAPI + Docker / Docker Compose，有 GPU 加速。
- 睇 README 確認是否提供 `/v1/audio/transcriptions`，有就 `baseUrl` 設成 `http://<host>:<port>/v1`。

---

## 驗證

跑起 container 後：

```bash
curl -X POST "http://localhost:<port>/v1/audio/transcriptions" \
  -H "Authorization: Bearer dummy" \
  -F "file=@test.wav" \
  -F "model=whisper-1"
```

有 JSON 入面有 `"text": "..."` 就代表 OK，再喺 OpenClaw 設 `baseUrl`。
