# Whisper port 9000 冇 /v1/audio/transcriptions（404）— 三個選擇

你嘅 Whisper 喺 port 9000 跑緊，但只支援 **/asr**，唔支援 **/v1/audio/transcriptions**，所以 404。

---

## 1. 繼續用文字 — 最簡單

唔開語音轉錄，只靠文字同 OpenClaw 溝通。

- **做法**：在 `openclaw.json` 的 `tools.media.audio` 設 `enabled: false`（或刪走/唔設 audio models）。示例：
  ```json5
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  }
  ```
- **優點**：零設定、零依賴。
- **缺點**：冇語音/voice note 轉錄。

---

## 2. 換一個支援 OpenAI compatible endpoint 嘅 Whisper container

唔改 OpenClaw，換成提供 **/v1/audio/transcriptions** 嘅 image，繼續用 port 9000 或改 port 都得。

**即用示例（保留 port 9000）：**

```bash
# 停現有 Whisper container（按你實際名改）
docker stop <現有-whisper-container>

# 用 faster-whisper（有 GPU 可加 --gpus all）
docker run -d --name whisper-openai -p 9000:8600 neosun/faster-whisper:latest
```

- 上面會把 image 嘅 **8600** map 去 host 嘅 **9000**，所以 OpenClaw 嘅 `baseUrl` 用 **`http://<host>:9000/v1`** 就得。
- 若你想用 **local-whisper-backend**（CPU / Apple Silicon 友好），跟 [Hantok/local-whisper-backend](https://github.com/Hantok/local-whisper-backend) 嘅 Docker 說明跑，多數都係 port 9000，`baseUrl` = `http://<host>:9000/v1`。

詳見：`memory/kb/whisper-option1-openai-compatible-steps.md`。

---

## 3. 用現有 Whisper（/asr）— **唔使等 OpenClaw 官方**

你而家 **唔使等** OpenClaw 幾時 update。本 repo 嘅 OpenClaw 已經支援自訂 path，可以直接用 **/asr**。

- **做法**：用本 repo 嘅 OpenClaw（有改過 `transcriptionPath` 嘅版本），在 `tools.media.audio` 設：
  ```json5
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{
          provider: "openai",
          model: "whisper-1",
          baseUrl: "http://<你嘅-Whisper-host>:9000",
          transcriptionPath: "/asr",
        }],
      },
    },
  }
  ```
- **優點**：唔使換 container、唔使等上游，port 9000 嘅現有 Whisper 照用。
- **「改過既 OpenClaw」即係**：Gateway 要用 **CL repo**（`~/Desktop/CL/openclaw`）build / start，唔係 `npm install -g openclaw` 或 `npx openclaw` 用嘅原版。若你而家係用 system 裝嘅 openclaw 嚟 start Gateway，就冇 `transcriptionPath`；改為用 CL repo 入面 build 出嚟嘅 openclaw 嚟 start Gateway，就可以用 Option 3。

詳見：`memory/kb/whisper-asr-openclaw-transcription-endpoint.md`。其他可試嘅 Option 2 container：`memory/kb/whisper-option2-other-containers.md`。

---

## 簡表

| 選擇 | 做法 | 要改 container？ | 要改 OpenClaw？ |
|------|------|------------------|-----------------|
| 1. 用文字 | 關閉 audio 或唔設 models | 唔使 | 只 set enabled: false |
| 2. 換 container | 換成有 /v1/audio/transcriptions 嘅 image | 要 | 只 set baseUrl（例如 /v1） |
| 3. 用 /asr | 用本 repo OpenClaw + transcriptionPath: "/asr" | 唔使 | 用我哋改過嘅 code + 上面 config |

你想行邊個，就跟對應一節做即可。
