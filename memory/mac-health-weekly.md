# Mac 健康每週 report — 2026-05-04

📊 上次健康檢查: 2026-05-03 18:05

## 三大空間黑洞（Home 目錄）
| 資料夾 | 大小 |
|--------|------|
| .hermes | 7.5G |
| .npm | 7.4G |
| .openclaw | 7.1G |

## 記憶體
- 69% 空闲 ✅（無 Swap 使用）

## 磁碟
- 根目錄可用 **80GB**（228GB 總量，用 13%）✅

## 建議
1. **Hermes log 定期清理**：`.hermes` 食 7.5G，跑 `hermes logs --trim` 或睇 `~/.hermes/logs/` 手動刪舊檔
2. **.npm cache**：跑 `npm cache clean --force`，慳 1-2GB
3. **.openclaw**：日誌可考慮壓縮或輪轉，避免无限增長

---
*本次健康檢查無 Alert。Mac 狀態良好 ✅*