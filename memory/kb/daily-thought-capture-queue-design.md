# 9pm daily-thought-capture（方案 A）— cron 只 queue，main 連線後補做

## 背景

OpenClaw cron 多數會喺獨立 session 跑（例如 `agent:main:cron:...`），而且 **唔可以讀 `agent:main:main` 嘅對話 history**（visibility restricted to tree）。所以「9pm 自動回顧今日對話」如果硬要喺 cron 做，會出現假成功（例如只注入文字、19ms 完成）或誤判「冇對話」。

方案 A 係接受呢個限制：**cron 唔做 capture，只做 queue；真正 capture 等你下次連返 main 先做。**

---

## 設計目標

- **可靠**：唔會因 session 可視性而漏做／誤判。
- **可驗收**：有標記、有產出、有去重。
- **輕量**：cron payload 短、main 只係多一個簡單檢查。

---

## 核心機制：pending 標記檔

- **標記目錄**：`~/.openclaw/workspace/memory/inbox/pending-capture/`
- **標記檔名**：`YYYY-MM-DD.txt`
- **內容**：一行文字即可（例如「capture today」），重點係「檔存在」。

---

## 9pm cron（isolated）要做乜

**只做兩件事：**

1. 寫入 pending 標記檔（若已存在就唔使再寫）
2. （可選）對你 announce 一句「已 queue，等你連返 main 會補做」

> 重要：唔好嘗試喺 cron 讀 main history／直接產生 `memory/YYYY-MM-DD.md`，因為 session 可視性限制。

---

## main session 連線後要做乜（HEARTBEAT 觸發）

當你開 TUI／WhatsApp 令 main session 有一個 turn（或 heartbeat），主智能體做：

1. 檢查今日標記檔 `~/.openclaw/workspace/memory/inbox/pending-capture/YYYY-MM-DD.txt` 是否存在
2. 若存在：用 main session 嘅對話 history 做今日 capture，寫入 `memory/YYYY-MM-DD.md`
3. 成功後刪除標記檔（去重）

這個檢查已寫入 `memory/kb/main-agent-workspace-templates/HEARTBEAT.md`。

---

## 驗收

- 21:00 後標記檔存在（代表 cron 已 queue）
- 下次連返 main 後：
  - `memory/YYYY-MM-DD.md` 有更新
  - 標記檔被刪除（代表已完成）

