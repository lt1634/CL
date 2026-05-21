# 避免 Cursor「Edit failed」（改 `~/.openclaw/...` 等專案外檔案）

> **現象**：`Edit: in ~/.openclaw/workspace/.../file.py (xxxx chars) failed`  
> **意思**：自動套用修改（patch）**冇成功**，多數唔係檔案壞，係 **工作區／上下文** 問題。

---

## 建議做法（由易到難）

### 1. 用 Cursor 開「包含嗰個檔案嘅資料夾」

- **File → Open Folder…** → 選  
  `~/.openclaw/workspace/slideshow-drops/某批次資料夾`  
  或整個 `~/.openclaw/workspace`（視乎你想改幾多嘢）。
- 再叫 AI 改檔 → **路徑喺已開嘅 workspace 內**，套用較穩定。

### 2. 用符號連結放喺 CL repo 底下改（可選）

若你習慣永遠開 `~/Desktop/CL`：

```bash
mkdir -p ~/Desktop/CL/.local-links
ln -sf ~/.openclaw/workspace/slideshow-drops ~/Desktop/CL/.local-links/slideshow-drops
```

之後喺 Cursor 開 `~/Desktop/CL`，改  
`CL/.local-links/slideshow-drops/.../add-overlay.py`  
（實際寫入仍係 `~/.openclaw/...` 嗰份。）

**注意**：`.local-links/` 應加入 **`.gitignore`**，避免誤 commit。

### 3. 大改動：分段或手動貼

- 一次改 **千幾字** patch 較易失敗 → 請 AI **分幾步**改，或要 **完整檔案片段** 自己貼上。
- 改前先 **儲存／關閉** 其他分頁對同一檔嘅修改，避免版本唔同。

### 4. 權限（較少見）

若真係寫唔入：

```bash
chmod u+w /路徑/檔案
ls -la /路徑/
```

---

## 唔會「完全杜绝」嘅位

AI 編輯係 **best effort**；最穩仍係 **自己用編輯器開檔 → 貼上 → 儲存**。  
以上係 **大幅減少** `Edit failed` 嘅習慣同佈局。

---

## 修訂

- 2026-03-21：初版（slideshow-drops / openclaw workspace）。
