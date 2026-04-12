# SBA 學生清單

供 SBA 助手每堂前讀取：班別、學生名、主題、進度、特性。

**Agent 寫入**：更新某位學生進度時，改 **`memory/kb/sba-students-work/<名>/student-profile.md`**；本檔 `sba-students.md` 只維持速覽表（必要時改「主題一句」或連結）。若 `edit` 失敗，改用 `read` → 改 → `write` 寫回。詳見 `memory/kb/sba-students-howto.md`（若有）。

**⚠️ 鐵律：俾建議前必先 check Dropbox！** 唔好淨係靠 sba-students.md 嘅舊資料，要以 Dropbox 學生 folder 嘅實際進度為準。

---

## 結構（分拆後）

- **每位詳情**：`memory/kb/sba-students-work/<英文名>/student-profile.md`
- **分拆前完整快照**（備查）：`memory/archive/sba-students-2026-04-03-monolithic.md`
- **堂上相片／檔案**：仍放 `sba-students-work/<名>/`（見 [sba-students-work/README.md](sba-students-work/README.md)）

---

## 中五速覽

| 學生 | 主題／狀態一句 | 詳細檔 |
|------|----------------|--------|
| **Cassy** | 人類情感；SBA2 認同／嫉妒、手／鏡 | [Cassy/student-profile.md](sba-students-work/Cassy/student-profile.md) |
| **Crystal** | 嫉妒／偵查案構思 | [Crystal/student-profile.md](sba-students-work/Crystal/student-profile.md) |
| **Megumi** | 生命／死亡／花卉＋骨骼 | [Megumi/student-profile.md](sba-students-work/Megumi/student-profile.md) |
| **Daisy** | 五感／高級餐廳自畫像方向 | [Daisy/student-profile.md](sba-students-work/Daisy/student-profile.md) |
| **Jayden** | 節奏與生命力；抽象＋立體 | [Jayden/student-profile.md](sba-students-work/Jayden/student-profile.md) |
| **Ichigo** | Fursona／Kun／Fursuit | [Ichigo/student-profile.md](sba-students-work/Ichigo/student-profile.md) |

---

## 點樣更新

1. 改 **`sba-students-work/<名>/student-profile.md`**（唔好再喺本索引堆長文）。
2. 大改前可將該檔複製到 **`memory/archive/sba-students-YYYYMMDD-<名>-before.md`**。

---

*新增學生：喺上表加一行，並新增 `sba-students-work/<名>/student-profile.md`。*
