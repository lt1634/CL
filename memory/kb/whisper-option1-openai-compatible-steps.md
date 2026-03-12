# Option 1：Whisper container 改用 OpenAI 相容模式 — 步驟

目標：令 Whisper 提供 **`/v1/audio/transcriptions`**（或 `/audio/transcriptions`），OpenClaw 就可以只 set `baseUrl` 唔使改 code。

---

## Step 0：睇你而家用緊邊個 image

喺跑 Whisper 嘅機上：

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
# 或
docker compose ps
```

記低 **Image 名** 同 **port**（例如 9000）。

---

## 做法 A：換成已支援 /v1/audio/transcriptions 嘅 image（建議）

下面揀一個，用佢 **取代** 現有 Whisper container。

### A1. faster-whisper（有 GPU 用呢個）

- **Image**：`neosun/faster-whisper`（或 `neosun100/faster-whisper-web` 睇 repo 最新）
- **Endpoint**：`POST http://<host>:8600/v1/audio/transcriptions`
- **示例**（按需要改 port / GPU）：

```bash
# 有 NVIDIA GPU
docker run -d --name whisper-asr --gpus all -p 8600:8600 neosun/faster-whisper:latest

# 只用 CPU（較慢）
docker run -d --name whisper-asr -p 8600:8600 neosun/faster-whisper:latest
```

- **OpenClaw baseUrl**：`http://<host>:8600/v1`  
  （OpenClaw 會 call `baseUrl + "/audio/transcriptions"` → `http://<host>:8600/v1/audio/transcriptions`）

### A2. local-whisper-backend（faster-whisper，可 CPU/Apple Silicon）

- **Repo**：https://github.com/Hantok/local-whisper-backend
- **Endpoint**：`/v1/audio/transcriptions`
- 按該 repo 的 Docker / 啟動方式跑（通常 port 9000），然後 **baseUrl** 設為 `http://<host>:9000/v1`。

### A3. 你本來用開 ahmetoner/whisper-asr-webservice

- 官方 release 主要係 **`/asr`**，未正式支援 `/v1/audio/transcriptions`。
- 可以：
  - 換成上面 A1 或 A2；或
  - 用本 repo 已做嘅 **Option 2**（`transcriptionPath: "/asr"`），唔使改 container。

---

## 做法 B：現有 image 有「OpenAI 相容」env 就開

若你唔想換 image，睇現用 image 嘅 README / 環境變數有冇例如：

- `OPENAI_COMPATIBLE=1`
- `ENABLE_OPENAI_API=1`
- 或類似「OpenAI compatible」「/v1/audio/transcriptions」嘅選項

有就 set 好再 **restart container**：

```bash
docker compose down
# 改 .env 或 docker-compose.yml 加上述變數
docker compose up -d
```

然後用下面「OpenClaw 設定」驗證。

---

## Step 2：驗證 container 有正確 endpoint

```bash
# 假設 container 喺 localhost:8600，path 係 /v1/audio/transcriptions
curl -X POST "http://localhost:8600/v1/audio/transcriptions" \
  -H "Authorization: Bearer dummy" \
  -F "file=@一段短音檔.wav" \
  -F "model=whisper-1"
```

若返回 JSON 有 `"text": "..."` 就 OK。若 404，多數係 path 或 port 錯，對返上面各 image 嘅說明。

---

## Step 3：OpenClaw 設定

喺 `openclaw.json`（或你放 gateway config 嘅地方）嘅 **tools.media.audio** 設：

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{
          provider: "openai",
          model: "whisper-1",
          baseUrl: "http://<Whisper 主機>:<port>/v1",
          // 若 container 係 /v1/audio/transcriptions，baseUrl 要包 /v1
          // 若 container 係 /audio/transcriptions（冇 v1），baseUrl 就 http://host:port
        }],
      },
    },
  },
}
```

- **OpenClaw 實際 call**：`baseUrl + "/audio/transcriptions"`  
  - 例如 `baseUrl = "http://host:8600/v1"` → `http://host:8600/v1/audio/transcriptions`
- API key：自架 Whisper 通常可填 dummy（例如 `dummy`），要睇你個 image 有冇做驗證。

改完 **restart OpenClaw Gateway** 再試發一段語音。

---

## 若 Option 1 搞唔掂

用 **Option 2**：唔換 container，喺 OpenClaw 加 `transcriptionPath: "/asr"`（見 `whisper-asr-openclaw-transcription-endpoint.md`）。
