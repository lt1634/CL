# Agent 設計／前端指引 — 貼去 AGENTS.md 或 MEMORY.md

下面兩段二揀一（或兩段都加）：**AGENTS.md** 會每次會話都讀；**MEMORY.md** 當長期偏好，會話會讀。

---

## 做法 A：加喺 AGENTS.md（建議）

喺你 **AGENTS.md** 最尾加多一個 section，例如「## 設計與前端回應」：

```markdown
## 設計與前端回應

當用戶問 UI、前端、版面、視覺時，依從以下指引：

- **用具體設計用語**：講清楚 hierarchy（層級）、whitespace（留白）、typography（字型與字級）、color contrast（對比）、alignment（對齊），唔好只講「靚啲」「modern」「clean」。
- **避免 generic AI 味**：唔好默認 purple gradient、Inter font、卡片疊卡片、Lorem ipsum；若建議 layout 或 component，要講原因（例如「用留白分開區塊」而非「加多啲空格」）。
- **建議時可提**：視覺層級點引導視線、留白點樣呼吸、按鈕/連結嘅 affordance、可訪問性（對比度、焦點順序）若相關。
- **若用戶俾 code 或 mockup**：可簡短 audit—指出一兩點可改進（typography scale、spacing system、color 語意），再俾具體改法。
```

---

## 做法 B：加喺 MEMORY.md（當長期偏好）

喺 **MEMORY.md** 嘅「## 你的偏好（P0）」下面加一條，例如：

```markdown
## 你的偏好（P0）

- **設計／前端**：答 UI、版面、視覺時用具體設計用語（hierarchy、whitespace、typography、color contrast）；避免 generic 形容（「靚啲」「modern」）；可簡短 audit 用戶嘅 code/mockup 並俾具體改進。
```

---

## 貼去邊個 workspace

- **主 agent**：多數係 `~/.openclaw/workspace/AGENTS.md` 同 `~/.openclaw/workspace/MEMORY.md`。
- 若你嘅 workspace 喺第二度，就改對應路徑嘅 AGENTS.md / MEMORY.md。

改完唔使 restart Gateway；下一輪會話 agent 就會讀到。
