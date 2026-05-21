# ROLL_FORWARD_RULES（模板）

> 2526 真實日期來自 `calendar_struct_2627.csv`（下學年改名）；本檔描述 **event_kind → 錨定規則** 與 **D-n**。

## 1. 固定校曆名（calendar_named_event）

| event_kind | 錨定方式 |
|------------|----------|
| INFO_DAY | 校曆欄「資訊日」對應日期 |
| SPORTS_DAY | 校曆「陸運會／運動會」日期 |
| EXAM_WEEK | 校曆考試週首日至末日（可拆多段） |
| PD_DAY | 教師發展日 |

`lead_days` 預設見 `event_kind_vocab.yaml`。

## 2. 浮動假期（dynamic_holiday_anchor）

農曆活動、復活節長假前後清場、颱風補課等：

1. **人手**輸入該學年關鍵日（或由已 OCR 校曆讀出）。
2. 再按本表 D-n 生成提醒（例如清場 D-3）。

## 3. 相對學期（relative_to_term）

（按你校實際定義補充，例如「開學後第 4 個上學週五」— 需與 `calendar_struct_*` 的 `term` 欄對齊。）

## 4. 與 Hermes 產物合併

- `events.jsonl` 每行一個 JSON，欄位見 `schemas/event_line.schema.json`。
- Join：`anchor.type == calendar_named_event` 且 `anchor.name` 對應校曆活動名（可做 fuzzy match）。
