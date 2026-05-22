# OpenClaw 分層記憶（熱 / 冷 / 原始日誌）

| 層 | 路徑 | 載入 | qmd 索引 |
|----|------|------|----------|
| **熱** | `workspace/MEMORY.md`（≤200 行，P0/P1/P2） | 每會話 bootstrap | `memory/qmd-root/MEMORY.md` symlink |
| **冷** | `memory/archive/` | 按需 / memory_search | 可選（建議關閉減噪音） |
| **原始** | `memory/YYYY-MM-DD.md` | 只讀今日+昨日 | **不索引** |

## 腳本

```bash
# 行數守門（週一 cron / 手動）
./memory-janitor.sh

# 搬走 >14 日的每日日誌到 archive/dailies/
./archive-daily-logs.sh
DRY_RUN=1 ./archive-daily-logs.sh   # 預覽
```

## 一鍵設定（CL repo）

```bash
~/Desktop/CL/ops/openclaw/setup-memory-tiered.sh
```
