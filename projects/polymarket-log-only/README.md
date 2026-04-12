# Polymarket Log-only — 寫日誌用

**唔下單。** 只係把決策寫入 `~/.openclaw/workspace/memory/polymarket/log-only/*.jsonl`。

詳細欄位：[memory/kb/openclaw-polymarket-log-only-spec-and-env.md](../../memory/kb/openclaw-polymarket-log-only-spec-and-env.md)

## 一次過試

```bash
cd projects/polymarket-log-only
python3 append_log.py --sample
```

會喺 log-only 目錄寫入今日檔案 `log-only-YYYY-MM-DD.jsonl` 一行範例。

## 自己寫一行（stdin）

```bash
python3 append_log.py --stdin < my-row.json
```

`my-row.json` 必須係**單行** JSON，且含 spec 必填欄位。

## 環境（可選）

```bash
cp .env.example .env
# 編輯 .env；腳本會用 python-dotenv 讀取（有裝先）
```

代理／重試主要畀你其他拉價腳本用；`append_log.py` 本身唔打 Polymarket API。