# Whisper 轉錄：/v1/audio/transcriptions 與 /asr 對齊

## 問題

- **Docs（OpenClaw）**：語音轉錄用 OpenAI 相容 API，路徑為 `/v1/audio/transcriptions`（或 `baseUrl` + `/audio/transcriptions`）。
- **你嘅 Whisper container**：只支援 `/asr`，唔支援 `/v1/audio/transcriptions`。
- **結果**：set 咗 `baseUrl` 指去 container 都唔 work，因為 OpenClaw 會 call `baseUrl + "/audio/transcriptions"`。

## 兩個做法

### Option 1：Whisper container 用 OpenAI-compatible 模式（建議先試）

唔使改 OpenClaw，只改 container 設定或換 image。

- **做法**：用支援 OpenAI 相容 endpoint 嘅 image，或喺現有 image 開「OpenAI 相容」模式。
- **常見做法**：
  - 換成已支援 `/v1/audio/transcriptions` 嘅 image，例如：
    - `onerahmet/openai-whisper-asr-webservice`（有 env 可設 ASR_ENGINE 等）
    - `ventz/whisper-openai-container`、`local-whisper-backend` 等
  - 睇你現用 image 嘅 README / env，有冇「OpenAI compatible」或「/v1/audio/transcriptions」嘅選項，有就開咗佢。
- **OpenClaw 設定**：`tools.media.audio` 用 `provider: "openai"`，`baseUrl` 指去 container（例如 `http://whisper:9000` 或 `http://whisper:9000/v1`，視乎 container 係 `/v1/audio/transcriptions` 定 `/audio/transcriptions`）。

### Option 2：OpenClaw 支援自訂 path（例如 /asr）

Container 唔改，繼續用 `/asr`，等 OpenClaw 支援自訂「轉錄 path」。

- **做法**：喺 `tools.media.audio` 嘅 model entry 加一個「轉錄 path」設定（例如 `transcriptionPath: "/asr"`），OpenClaw 就會用 `baseUrl + transcriptionPath` 而唔係硬編碼 `/audio/transcriptions`。
- **狀態**：已在本 repo 的 `openclaw/` 代碼中加上支援，可用 `transcriptionPath` 指去 `/asr`。
- **設定例**（在 `openclaw.json` 的 `tools.media.audio`）：
  ```json5
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{
          provider: "openai",
          model: "whisper-1",
          baseUrl: "http://你的-whisper-container:9000",
          transcriptionPath: "/asr",
        }],
      },
    },
  }
  ```
- 改動檔案：`openclaw/src/media-understanding/types.ts`（request 加 `transcriptionPath`）、`openclaw/src/config/types.tools.ts`（config 加 `transcriptionPath`）、`openclaw/src/media-understanding/providers/openai/audio.ts`（用 path 砌 URL）、`openclaw/src/media-understanding/runner.entries.ts`（傳入 transcriptionPath）。若上游 OpenClaw 未合併類似改動，要等官方 update 或自己 maintain patch。

## 建議

1. **先試 Option 1**：睇你現用 Whisper image 有冇 OpenAI 相容模式或換成支援 `/v1/audio/transcriptions` 嘅 image，改 container 設定/重啟，再喺 OpenClaw 用 `baseUrl` 指過去。
2. **若 container 一定只能用 /asr**：用 Option 2，喺 OpenClaw 用 `transcriptionPath: "/asr"`（本 repo 已實作），或等上游支援後再升級。

## 相關

- OpenClaw 語音轉錄：`openclaw/docs/nodes/audio.md`
- 實際 call 嘅程式：`openclaw/src/media-understanding/providers/openai/audio.ts`（URL = baseUrl + path，path 預設 `/audio/transcriptions`，可改為用 `transcriptionPath`）
