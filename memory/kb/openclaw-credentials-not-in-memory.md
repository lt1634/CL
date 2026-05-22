# 憑證勿入 memory／RAG 路徑（R3）

**規則**：API key、密碼、完整帳密檔 **不可** 放在 `~/.openclaw/workspace/memory/**`（會被 qmd／RAG 索引）。

**應放**：

- `~/.openclaw/credentials/`（目錄 `700`，檔案 `600`）
- 或 `~/.openclaw/.env`（`600`）

**遷移**：

```bash
~/Desktop/CL/ops/openclaw/harden-openclaw.sh
```

**openclaw.json**：確認 `memory.qmd.paths` 唔包含 `credentials/`。
