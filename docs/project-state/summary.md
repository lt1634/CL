# CL Project State — 晨報摘要

> **更新：** 2026-05-20  
> **用途：** Hermes「雙星系統晨報」讀取；每條含 `Snippet`（約 80 字）  
> **詳細 SSOT：** 各專案見同目錄 `*.md` 或 `docs/PROJECTS-INDEX.md`

---

## 1. 投資組合（investment.md）

**Snippet:** 股票淨值 **$1,465,083**（+6.08% vs 成本 $1.38M）｜港股 49%：03110、02834｜美股：VT +15.6%｜02318 已不在倉｜5/18 截圖已入 SSOT。

**狀態:** Active · 最後更新 2026-05-18  
**檔案:** `investment.md`

---

## 2. OpenClaw + Hermes 雙軌

**Snippet:** Gateway 正常；memory cron 全綠；QMD 871 檔已索引；MEMORY 統一 symlink；磁碟清理後可用 ~75GB。Telegram 偶發網絡 timeout 需 VPN 留意。

**狀態:** Active · 2026-05-18 修復 cron/QMD  
**檔案:** `~/.openclaw/` `~/.hermes/`

---

## 3. T58 五十周年展覽

**Snippet:** 2027-04-08 至 14 日（首選檔期）｜HKAC 改期 email 已發｜18 幅作品｜Rico 口述影像 + 觸覺圖；Tim 落地執行。Sheet + Drive 素材庫運作中。

**狀態:** Active  
**檔案:** `docs/project-state/T58.md`（待建或見 PROJECTS-INDEX）

---

## 4. Art Prompt Generator

**Snippet:** V8.1 支援 Midjourney；v3 pipeline 圖片上傳正常｜教育 × AI 搞錢方向核心產品之一｜夜間 cron 可繼續 research/refine（部分已停用）。

**狀態:** Active  
**路徑:** `art-prompt-generator/` `art-prompt-generator-v2/`

---

## 5. 豆豆粵語兒歌 IP（小紅書）

**Snippet:** 約 4.6K 粉絲｜爆款《有情緒唔緊要》6.7 萬瀏覽｜Notion pipeline 運作｜下一步：IP 品牌化；發文前停一停（Moments > Money）。

**狀態:** Active  
**Skills:** `doudou-darwin-content` / `doudou-learnings-archive`

---

## 6. Antfarm OAuth（Paytron）

**Snippet:** 文章閱讀 **18/50** 停滯｜需 Tim 親自開瀏覽器完成 OAuth｜屬「Tim 親自做」瓶頸之一，agent 只能提醒跟進。

**狀態:** Blocked · 待復工  
**待辦:** MEMORY.md P1

---

## 7. JUMP 視藝教師空缺

**Snippet:** 每週一至五 9am 掃描｜現有 7 個職位｜**HS26034371** 需登入 JUMP 查學校名稱｜留意「科主任優先」信號。Cron 本身 ok。

**狀態:** Active scan · 一項待 Tim 登入  
**待辦:** MEMORY.md

---

## 8. Content Digestion（Hobby）

**Snippet:** collect/triage/grade 管線正常｜29/30 feeds healthy｜`hobby/triage/summary.md` 由夜間 triage 更新｜Hermes 午後 Research 讀 triage，晨報讀本檔。

**狀態:** Active  
**路徑:** `~/.openclaw/workspace/hobby/`

---

## 9. 世界感知層（World）

**Snippet:** 四域 ingest（投資/本地梅窩/hk 文化展覽/tech）｜match `tim-opportunity-profile`｜晚報重本地+T58+豆豆，投資≤40%｜今日 ingest 正常。

**狀態:** Active · watchlist v3 · 2026-05-20 ingest OK  
**檔案:** `docs/WORLD_MODEL_PROJECT.md` · `memory/kb/world/tim-opportunity-profile.md`

---

## 10. 搞錢 Phase 1

**Snippet:** OpenClaw 部署服務 + 企業 Prompt Workshop｜目標：跑通第一單付費｜槓桿：Art Prompt + 教育×AI｜一人公司關鍵詞 #11 Agent #14 Prompt #32 Infoproduct。

**狀態:** Planning · Phase 1  
**參考:** MEMORY.md [P1] 搞錢方向

---

## 維護說明

- 有重大專案變動時更新對應條目 `Snippet` 同「更新」日期。
- `investment.md` 更新後請同步改 **§1** Snippet（或一句指向 investment 日期）。
- 唔好刪 `Snippet:` 行 — 晨報 cron 靠呢個欄位抽頭條。
