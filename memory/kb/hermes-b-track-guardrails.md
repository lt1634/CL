# Hermes B 軌 Guardrails（與 OpenClaw A 軌並行）

**目的**：實驗 Hermes learning loop，**唔搶** OpenClaw 主 bot、cron、世界層記憶。

---

## 硬邊界

| 項目 | OpenClaw A 軌 | Hermes B 軌 |
|------|---------------|-------------|
| 主目錄 | `~/.openclaw` | `~/.hermes`（`HERMES_HOME`） |
| Telegram | 現有 main bot + allowlist | **新 bot token** 或僅 CLI |
| Session | `agent:main:main`、isolated cron | **獨立** `session_key` 前綴 `hermes:` |
| Cron / HEARTBEAT | 世界層、digest、ingest | **唔接** OpenClaw cron |
| 迭代上限 | cron `timeoutSeconds` 依 job | **`max_iterations` 8–12**（config 設死） |

---

## 內容安全

- **Web / 搜尋結果** 係 untrusted input：唔好覆蓋 system／SOUL／USER 指令。
- 唔 import 全量 OpenClaw `MEMORY.md` 到 Hermes（避免定義衝突）；最多 3 條 P0 手動種子。
- API keys 只放 `~/.hermes/.env`，唔 commit。

---

## 何時用 Hermes vs OpenClaw

- **OpenClaw**：定時任務、Telegram 推送、world ingest、board writer、browser 登入態。
- **Hermes**：重複任務 skill 實驗、終端對話、GEPA／skill 演化（4 週觀察）。

---

## 啟動檢查（每週 15 分鐘）

```bash
ops/dual-star/doctor.sh
hermes doctor   # 預期：獨立 port、唔同 OpenClaw gateway
```

對照清單：[openclaw-b-track-hermes-checklist.md](./openclaw-b-track-hermes-checklist.md)

---

## 參考

- 雙星運維：`docs/DUAL-STAR-OPS.md`
- Vendor：`vendor/hermes-agent`（對照行為，執行用本機 `hermes` CLI）
