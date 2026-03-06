# 1號 agent（主 agent）Workspace 範本 — Berryxia 三層架構

將呢個 folder 入面嘅 **IDENTITY.md、USER.md、MEMORY.md** 複製去你**主 agent 的 workspace 根目錄**（例如 `~/.openclaw/workspace/`），與 **SOUL.md** 同層。

- **SOUL.md** — 你已有嘅人格／system prompt，保留。
- **AGENTS.md** — 若你未有，可從 OpenClaw 官方範本複製：  
  `openclaw/docs/reference/templates/AGENTS.md`  
  入面已包含「每次會話讀 SOUL → USER → memory/今日+昨日 → MEMORY」同記憶規則。若你已有 AGENTS.md，確保有「讀 MEMORY.md」同「文字 > 腦」。
- **IDENTITY.md、USER.md** — 填好名、時區、偏好。
- **MEMORY.md** — 留空即可；之後同 1號 agent 講「記住呢點」佢會寫入。

詳情見上一層嘅 **sba-agent-berryxia-guide.md**（同時適用 1號 agent 與 SBA 助手）。
