# Tim 機會畫像（Opportunity Profile）

> **用途：** 世界層 L1 scan、晚報、P0 策展時 **match Tim 本人**，唔好淨係 macro 投資。  
> **SSOT：** 本檔 + `entities.yaml` + `docs/PROJECTS-INDEX.md` + `docs/memory-index.md`

---

## 核心原則

1. **機會 ≠ 只有股價** — 展覽檔期、康文署 grant、梅窩社區活動、學校職位、豆豆內容靈感、合作邀請都算。
2. **本地優先** — 梅窩、大嶼山、離島、香港教育現場、可週末帶 Audrey 嘅活動。
3. **可執行** — 72 小時內能有一個具體下一步（打電話、報名、寫一則 post、更新 Sheet）。
4. **Moments > Money** — 純粹炒賣信號降權；能創造作品／關係／教學影響力升權。

---

## Tim 是誰（匹配錨點）

| 維度 | 關鍵字 / 情境 |
|------|----------------|
| 居住地 | 梅窩、大嶼山、離島、東涌、 ferry |
| 身份 | 視藝老師 15 年、逆鱗工作室、校董、爸爸（Audrey 4 歲） |
| 工作地 | 佛教筏可紀念中學（佛行）、T58 校慶展、JUMP 教師招聘 |
| 創意 | 豆豆粵語兒歌、小紅書、MindForge、藝術哲學 |
| 展覽 | T58 50 周年、T56、LCSD、香港大會堂、口述影像、觸覺圖、Rico |
| 系統 | OpenClaw、Hermes、agent 工作流 |
| 投資 | VT、03110、02834、IDEV、ICE（考慮／核對，唔即時交易） |

---

## 機會類型（`opportunity_type` 建議寫入 jsonl）

| type | 例子 | linked_projects |
|------|------|-----------------|
| `local-life` | 梅窩市集、離島交通、社區活動、家長課程 | `personal`, `audrey` |
| `education-hk` | 教育局、課程、津貼、JUMP 職位、校本活動 | `T58`, `feng-shui-lin`, `jump` |
| `arts-culture` | 康文署展覽、grant、藝術家駐場、HKAC 檔期 | `T58`, `LCSD`, `T56` |
| `creative-ip` | 兒歌趨勢、小紅書算法、粵語內容靈感 | `doudou`, `mindforge` |
| `collab` | 合作邀請、RFP、工作室接案 | `studio`, `T58` |
| `investment` | 宏觀、持倉相關、Fed、港股 | `investment` |
| `tech-ai` | Agent、Claude、本地 LLM 工具 | `openclaw`, `hermes` |

---

## Relevance 加權（給 LLM）

| 信號 | 加分 |
|------|------|
| 標題含：梅窩、大嶼山、佛行、筏可、T58、康文署、LCSD、展覽、校慶、視藝、豆豆、粵語兒歌 | +15–25 |
| 有明確 deadline / 報名 / 檔期 | +10 |
| 可連結 Tim 已有 project-state | +10 |
| 純美股 macro、與 Tim 專案無關 | -10（仍可入 digest 一行） |
| 內地社會新聞、與港無關 | 過濾（已在 watchlist exclude） |

**晚報比例建議：** 投資 ≤40% 條目；**本地＋文化＋創意 ≥40%**；工具 ≤20%。

---

## 必讀 project-state（策展前）

| 專案 | 路徑 |
|------|------|
| 投資 | `docs/project-state/investment.md` |
| T58 展覽 | `docs/project-state/T58.md` |
| LCSD / T56 | `docs/project-state/LCSD.md` `T56.md` |
| 專案總覽 | `docs/PROJECTS-INDEX.md` |
| Tim 自我 | `docs/personal/tim-self-exploration.md` |
| 晨報摘要 | `docs/project-state/summary.md` |

---

## Brave 補洞（非 RSS 專題）

當 `brave-fallback-hints` 或 local 信號弱時，可輪替查詢：

- `梅窩 社區 活動 2026`
- `大嶼山 文化 展覽`
- `香港 視覺藝術 教育 課程`
- `康文署 資助 計劃`
- `佛教筏可 紀念中學 活動`
- `粵語 兒歌 親子 香港`
- `香港大會堂 展覽 檔期`

---

*有新增專案時：更新本檔 + `watchlist.json` entities + `entities.yaml`。*
