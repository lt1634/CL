# 用 CL repo OpenClaw 重啟 Gateway（Option 3）

目的：令 Gateway 用 **CL repo**（`~/Desktop/CL/openclaw`）嘅版本，咁就可以用 `transcriptionPath: "/asr"` 接你 port 9000 嘅 Whisper。

---

## 事前：CL repo 要 build 好

```bash
cd ~/Desktop/CL/openclaw
pnpm install
pnpm build
```

---

## Step 1：停咗而家用緊嘅 Gateway

若 Gateway 係用 **LaunchAgent** 跑（例如 `ai.openclaw.gateway.plist`）：

```bash
launchctl unload ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

若你係手動喺 terminal 開嘅，就喺嗰個 terminal 用 **Ctrl+C** 停。

---

## Step 2：用 CL repo 起 Gateway

### 做法 A：手動喺 terminal 起（建議先試）

```bash
cd ~/Desktop/CL/openclaw
pnpm start gateway
```

保持呢個 terminal 開住，Gateway 就會一直跑。試下 TUI / WhatsApp 同語音轉錄（設好 `transcriptionPath: "/asr"`）係咪正常。

### 做法 B：改 LaunchAgent 長期用 CL repo

1. 編輯 plist：
   ```bash
   open -e ~/Library/LaunchAgents/ai.openclaw.gateway.plist
   ```
2. 將 **ProgramArguments** 改為用 CL repo 嘅 `node` + script，例如：
   - **WorkingDirectory**：`/Users/timnewmac/Desktop/CL/openclaw`
   - **ProgramArguments**：用你機上嘅 `node` 同 CL 路徑，例如：
     ```xml
     <key>ProgramArguments</key>
     <array>
       <string>/usr/local/bin/node</string>
       <string>/Users/timnewmac/Desktop/CL/openclaw/scripts/run-node.mjs</string>
       <string>gateway</string>
     </array>
     <key>WorkingDirectory</key>
     <string>/Users/timnewmac/Desktop/CL/openclaw</string>
     ```
   （若你用 nvm/fnm，第一個改做嗰個 node 嘅 path，可用 `which node` 睇。）
3. 儲存後 load 返：
   ```bash
   launchctl load ~/Library/LaunchAgents/ai.openclaw.gateway.plist
   ```

---

## Step 3：OpenClaw config 加 transcriptionPath

喺 **openclaw.json**（通常 `~/.openclaw/openclaw.json`）嘅 `tools.media.audio` 設：

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

若 Whisper 同 Gateway 喺同一部機，host 用 `localhost`；若喺另一部機就改做該機 IP 或 hostname。改完唔使再 restart Gateway（除非你改咗其他設定）。

---

## 檢查

- 喺另一個 terminal：`openclaw gateway status`（若 PATH 有 CL repo 嘅 openclaw）或直接 `cd ~/Desktop/CL/openclaw && pnpm start gateway --help` 確認 command 存在。
- TUI 連返、發一段語音 / voice note 試轉錄。

---

## 若想還原用 global openclaw

1. 停 CL 版 Gateway（Ctrl+C 或 `launchctl unload` 若你改咗 plist）。
2. 若改過 plist：還原返 **ProgramArguments** / **WorkingDirectory** 用返 global openclaw，再 `launchctl load`。
3. 若只係手動起過：用返你平時起 Gateway 嘅方法（例如 LaunchAgent 原本就係 global，就 `launchctl load` 返）。
