# Company board-writer HTTP 安全（2026-05-22）

## 問題

`board-writer.mjs serve` 的 `POST /append` 曾無認證：本機任意進程或惡意網頁 CSRF 可 append 假事件到 `company-board.jsonl`。

## 修復（CL `tools/company-board-writer/`）

1. **`BOARD_WRITER_TOKEN`**（≥16 字元）— `serve` 啟動前必設；`POST /append` 要 `Authorization: Bearer …`
2. **Origin/Referer** — 有值時只允許 `127.0.0.1` / `localhost`；curl 無 Origin 仍可用
3. **`GET /health`** — 仍公開（只讀），唔寫入

Token 放 `~/.openclaw/.env`，唔 commit。範例見 `tools/company-board-writer/.env.example`。

## 測試

```bash
node tools/company-board-writer/board-writer.test.mjs
```
