# OpenClaw Cron API JSON 格式

## 重要：物件要用 nested object，唔係 nested string

Cron API (`cron.add`, `cron.update`) 對 JSON 格式敏感：

### ❌ 錯誤：nested string（物件被 stringify 咗）

```json
{
  "name": "Morning brief",
  "schedule": "{\"kind\":\"cron\",\"expr\":\"0 7 * * *\",\"tz\":\"Asia/Taipei\"}",
  "payload": "{\"kind\":\"agentTurn\",\"message\":\"Summarize\"}"
}
```

### ✅ 正確：flatten / proper nested object

`schedule`、`payload`、`delivery` 必須係 **真・object**，唔係 JSON string：

```json
{
  "name": "Morning brief",
  "schedule": {
    "kind": "cron",
    "expr": "0 7 * * *",
    "tz": "Asia/Taipei"
  },
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "Summarize overnight updates."
  },
  "delivery": {
    "mode": "announce",
    "channel": "whatsapp",
    "to": "+85212345678"
  }
}
```

### cron.add 完整參數

| 欄位 | 類型 | 必須 | 說明 |
|------|------|------|------|
| `name` | string | ✓ | 工作名稱 |
| `schedule` | **object** | ✓ | 排程（見下表） |
| `sessionTarget` | string | ✓ | `main` 或 `isolated` |
| `wakeMode` | string | ✓ | `next-heartbeat` 或 `now` |
| `payload` | **object** | ✓ | 內容（見下表） |
| `delivery` | **object** | | 僅 isolated，`{ mode, channel?, to? }` |
| `enabled` | boolean | | 預設 true |
| `deleteAfterRun` | boolean | | 一次性工作預設 true |

### schedule 物件格式

**cron：**
```json
{ "kind": "cron", "expr": "0 7 * * *", "tz": "Asia/Taipei" }
```

**every（毫秒）：**
```json
{ "kind": "every", "everyMs": 3600000 }
```

**at（ISO 8601）：**
```json
{ "kind": "at", "at": "2026-02-10T09:00:00Z" }
```

### payload 物件格式

**main session（systemEvent）：**
```json
{ "kind": "systemEvent", "text": "Reminder text" }
```

**isolated session（agentTurn）：**
```json
{ "kind": "agentTurn", "message": "Summarize today" }
```

### 若用 curl / HTTP 呼叫

確保 `Content-Type: application/json`，並且 `schedule`、`payload` 等係 object 而唔係 string。例如用 `jq`：

```bash
# 正確：jq 會輸出 proper JSON
curl -X POST ... -d "$(jq -n '
  {
    name: "Test",
    schedule: { kind: "cron", expr: "0 7 * * *", tz: "Asia/Taipei" },
    sessionTarget: "isolated",
    wakeMode: "next-heartbeat",
    payload: { kind: "agentTurn", message: "Hello" }
  }
')"
```

---

**替代方案：** 若 API 有問題，可用 `openclaw-cron.sh` 直接編輯 `~/.openclaw/cron/jobs.json`，繞過 API。
