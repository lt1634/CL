# Memory Index — Tim Yuen 持久知識

> ⚠️ Memory（2,200 chars）只夾得下落葉方針式 index，詳細資訊喺呢度。
> 有衝突以呢個檔為準。

---

## Tim 基本資料
- **身份**：Tim Yuen | 梅窩 | 視藝老師 15 年 | 逆鱗工作室 | 有個4歲囡 Audrey
- **核心原則**：Moments > Money | 藝術=願意為它停低 | 快樂係投入唔係結果
- **工作風格**：決策快、主動做、「先對齊標準再行」、deep research 用 shallow scan 先建立 INDEX
- **CHANNEL**：小紅書（豆豆粵語兒歌 IP）、MindForge（個人知識系統）
- **觸發點（post 前要停）**：post 前想推、寫完想 promote、post 後睇數據、在意 engagement

---

## 財務
- **中國平安（02318）**：2,000股 @$60.95（-$8.69%），目標 $82-83，長線持有、分批加倉、3-5年、年化10-15%
- **MPF**：50/50 HSBC
- **VHIS 自願醫保**：5年繳費（2021-2026）喺 ~/Documents/保險/，可補報扣稅上限 HK$8,000/年/人，尚未補報
- **投資 cron**：每週一 08:00

---

## 豆豆粵語兒歌 IP
- 小紅書：4,662 粉絲，10.3K 讚收藏
- 爆款：《有情緒唔緊要》67,739 瀏覽
- Notion pipeline：3420b1e7-32cd-814b-aefe-f5d4f4241f47
- 下一步：IP 品牌化
- Skills：`creative/doudou-darwin-content` | `creative/doudou-learnings-archive`

---

## T58 50周年展覽
- Sheet：`1vqcZrLXqk-Jh1OlRYpUCQZRg9rhE5T5sCq02UEGz8MA`
- 18 幅作品
- Drive mount：`~/Library/CloudStorage/GoogleDrive-bfhywt@bfhmc.edu.hk/我的雲端硬碟/「佛行 50 · 共融與創新」50 週年校慶展覽/`
- 分工：Rico(Beyond Vision) → Audio Description + 觸覺圖；Tim → 落地；我 → 起草 + 整合
- 詳細進度：~/Desktop/CL/docs/project-state/T58.md

---

## 合作方
- **Rico Chan**：Beyond Vision 創辦人，負責口述影像 + 觸覺圖技法框架

---

## 世界感知層（World awareness）
- **優先領域**：**本地生活（梅窩/離島）**、香港文化/教育/展覽、創意 IP（豆豆）、投資、科技/AI
- **機會畫像**：`memory/kb/world/tim-opportunity-profile.md`（match Tim 專案，唔止 macro）
- **SSOT**：`~/Desktop/CL/memory/kb/world/`（同步到 `~/.openclaw/workspace/memory/world/`）
- **安裝**：`tools/world-ingest/sync-to-workspace.sh` → `fetch_feeds.py` → `install-world-cron.sh`
- **說明**：[memory/kb/openclaw-world-awareness-setup.md](memory/kb/openclaw-world-awareness-setup.md)
- **Digest/RSS 整合**：[memory/kb/digest-rss-architecture.md](memory/kb/digest-rss-architecture.md)（Hobby + World + Hermes 一日時間軸）
- **完整專案說明（可下載）**：[docs/WORLD_MODEL_PROJECT.md](WORLD_MODEL_PROJECT.md)

---

## 系統環境
- **Hermes**：GEPA 每日 20:20 | v0.13.0（2026.5.7）行 Telegram
- **OpenClaw**：2026.5.7（CLI + gateway）
- **PLUR（OpenClaw + Hermes 共用本機記憶）**：儲存 `~/.plur/`（`PLUR_PATH` 未改就用呢度）；OpenClaw 用 `@plur-ai/claw`（memory slot：`plur-claw`）+ MCP `plur`；Hermes `plugins.enabled` 含 `plur`，CLI `@plur-ai/cli@0.9.4` + venv 內 `plur-hermes==0.9.4`；Agent skill：`~/.hermes/skills/plur-memory.SKILL.md`
- ** dirs**：~/Desktop/CL/ | ~/.openclaw/ | ~/.hermes/（動態更新）
- **Google Drive CL**：https://drive.google.com/drive/folders/10zeWVfkju7boEv-zbZEbEr_XYtI5beJc
- **Board 停用（2026-04-14）**：project state 直接寫 ~/Desktop/CL/docs/project-state/（T58.md / T56.md / LCSD.md）
- **可刪 venv**：crewai/venv(869M) + markitdown-venv(445M) 慳 1.3GB
- **Skills 目錄**：~/.hermes/skills/（含 Jina Reader、Marker PDF→Markdown）
- **Harness Engineering 原則**：~/.openclaw/workspace/AGENTS.md

---

## 工具 Skill 索引
| 工具 | Skill |
|------|-------|
| Lovart 元素拆分 | `creative/lovart-element-splitting` |
| 豆豆內容達爾文 | `creative/doudou-darwin-content` |
| 豆豆 learnings 歸檔 | `creative/doudou-learnings-archive` |
| 小紅書頻道分析 | `social-media/xhs-channel-analytics` |
| T58 行政追蹤 | `education/fat-ho-t58-admin` |
| Memory 自動清理 | `productivity/memory-auto-cleanup` |
| PLUR 持久記憶（Hermes） | `plur-memory`（檔：`~/.hermes/skills/plur-memory.SKILL.md`） |
| Jina Reader | `web/jina-reader` |
| Marker PDF→MD | `docs/marker-pdf-to-md` |

---

## 完整版文件路徑
| 內容 | 路徑 |
|------|------|
| Tim 自我探索（完整） | ~/Desktop/CL/docs/personal/tim-self-exploration.md |
| T58 project state | ~/Desktop/CL/docs/project-state/T58.md |
| T56 project state | ~/Desktop/CL/docs/project-state/T56.md |
| LCSD project state | ~/Desktop/CL/docs/project-state/LCSD.md |
| CL Learnings | ~/Desktop/CL/docs/learnings/ |
| PLUR 本機儲存（engrams / episodes） | ~/.plur/ |
| VHIS 保單 | ~/Documents/保險/ |

---

## Tim 藝術哲學（原文）
「當你願意為它暫停腳步的，那就是最純粹的藝術」
- 快樂係投入，唔係結果
- AI 即時給答案 = 移除人停低思考嘅機會
- 視藝老師 15 年
- 相信陪伴、畫畫、停低思考係最值得嘅投資

---

*最後更新：2026-05-14*
