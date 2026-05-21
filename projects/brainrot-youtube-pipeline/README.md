# Brainrot → Suno → YouTube pipeline (MVP)

半自動流水線骨架：**brief → GMIV 打包 →（人手）Suno → SRT → FFmpeg 9:16**。  
合規與商業條款請對照 [Suno Terms](https://suno.com/terms-of-service) 與 YouTube 官方說明；**Pro/Premier** 才考慮商用上載。

## 快速開始

```bash
cd projects/brainrot-youtube-pipeline

# 1) 由 brief 生成 PACK.md + lyrics 副本
node scripts/build-suno-pack.mjs examples/brief.example.json

# 2) 人手：用 output/runs/<id>/PACK.md 入 Suno（Style + Lyrics），匯出 track.mp3 到同一目錄

# 3) 歌詞 → 粗字幕（每行固定秒數，之後可用 CapCut/Freebeat 精修）
node scripts/lyrics-to-srt.mjs output/runs/brainrot-001-skibidi-rizz/lyrics.txt 2.8 output/runs/brainrot-001-skibidi-rizz/subtitles.srt

# 4) 合成 9:16（需本機 ffmpeg）
chmod +x scripts/render-short.sh
./scripts/render-short.sh output/runs/brainrot-001-skibidi-rizz/track.mp3 output/runs/brainrot-001-skibidi-rizz/subtitles.srt "" output/runs/brainrot-001-skibidi-rizz/out.mp4
# 第三參可傳背景圖 path；留空則用純色底
```

### 字幕燒入失敗？

Homebrew 預設 `ffmpeg` 可能**無 `subtitles` filter**（缺 libass）。`render-short.sh` 會自動改為**純色底 + 音訊**，並提示你把 `subtitles.srt` **單獨上載到 YouTube**。若要燒字幕，請安裝帶 libass 嘅 build（例如 `brew install ffmpeg` 時確認 `ffmpeg -filters` 有 `subtitles`）。

## 目錄

| 路徑 | 說明 |
|------|------|
| `examples/brief.example.json` | 一條 brainrot 主題嘅 brief 範本 |
| `examples/lyrics.example.txt` | 示例歌詞 |
| `templates/gmiv-template.md` | GMIV 文字模板（亦會由 build 腳本填入 PACK） |
| `scripts/build-suno-pack.mjs` | brief → `output/runs/<id>/PACK.md` |
| `scripts/lyrics-to-srt.mjs` | 粗 SRT |
| `scripts/render-short.sh` | FFmpeg 直出 Shorts 比例 |
| `scripts/youtube-upload-placeholder.mjs` | API 上載檢查清單（未接 googleapis） |

## 與計劃嘅對應

- **Freebeat / CapCut**：可取代或精修步驟 3–4。  
- **GitHub 全自動 repo**（如 Bentlybro）：可 fork 後把 `PACK.md` 當輸入規格。  
- **Shazam**：上載前人手抽查（唔寫入腳本）。

## 授權

MIT（範本與腳本）；你生成嘅音樂與影片權利以 Suno／YouTube 帳戶條款為準。
