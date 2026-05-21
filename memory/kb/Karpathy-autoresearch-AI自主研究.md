# Karpathy：autoresearch — AI 自主跑研究實驗

**來源**：[karpathy/autoresearch](https://github.com/karpathy/autoresearch)（GitHub，2026-03）  
**一句**：俾一個 AI agent 一套**單 GPU、固定 5 分鐘**嘅 nanochat 訓練環境，讓佢**自己改 code、跑實驗、睇 val_bpb 有冇變好**，重複過夜；你瞓醒睇 log 同（希望）更好嘅 model。人唔改 Python，只改 **`program.md`** 來「program」呢個自主研究組織。

---

## 做咩

- **Agent 改嘅**：只准改 **`train.py`** — 入面有 GPT model、optimizer（Muon + AdamW）、training loop；架構、超參、batch size 等 agent 都可以郁。  
- **人改嘅**：**`program.md`** — 給 agent 嘅 baseline 指令，等同一個超輕量「skill」；你迭代嘅係「研究組織嘅程式」（research org code），唔係訓練 code 本身。  
- **唔改嘅**：**`prepare.py`** — 常數、一次性 data prep（下載數據、train BPE tokenizer）、runtime 工具（dataloader、evaluation）。

---

## 點運作

1. 用 Claude/Codex 等 **開喺呢個 repo**（可關掉權限），prompt 例如：「睇下 program.md，我哋 kick off 一個新實驗，先做 setup。」  
2. Agent 睇 `program.md`，改 `train.py`，跑 **固定 5 分鐘**訓練（wall clock，唔計 startup/compile）。  
3. 指標係 **val_bpb**（validation bits per byte）— 愈低愈好，同 vocab size 無關，方便唔同架構比較。  
4. Agent 睇結果有冇變好 → keep 或 discard → 再改、再跑，循環。  
5. 約 **12 個實驗/小時**，瞓一晚約 **100 個實驗**。

---

## 設計選擇（摘）

| 選擇 | 原因 |
|------|------|
| **只改一個 file** | 只准改 `train.py`，scope 可控、diff 易 review。 |
| **固定 5 分鐘** | 實驗可直接比較；唔同 platform 會搵到「喺自己機上 5 分鐘內最優」嘅設定，但同其他人嘅 run 唔可直接比。 |
| **Self-contained** | 除 PyTorch 同少量包外無外掛，無 distributed、無複雜 config；一 GPU、一 file、一 metric。 |

---

## 技術要求與 quick start

- **要求**：單張 NVIDIA GPU（README 寫 tested on H100）、Python 3.10+、[uv](https://github.com/astral-sh/uv)。  
- **步驟**：`uv` 安裝 → `uv sync` → `uv run prepare.py`（一次性，約 2 分鐘）→ `uv run train.py`（手動跑一次約 5 分鐘）→ 確認無問題後開 agent，叫佢睇 `program.md` 開始自主實驗。

---

## 非 H100 / 細機（Mac、Windows 等）

- 官方目前只保證 **單 NVIDIA GPU**；README 建議細機用 **forks**：  
  - [miolini/autoresearch-macos](https://github.com/miolini/autoresearch-macos)（MacOS）  
  - [trevin-creator/autoresearch-mlx](https://github.com/trevin-creator/autoresearch-mlx)（MacOS）  
  - [jsegov/autoresearch-win-rtx](https://github.com/jsegov/autoresearch-win-rtx)（Windows）  
- 若自己 fork 做細 model：可考慮 **TinyStories** 等低 entropy 數據、減 `vocab_size`、`MAX_SEQ_LEN`、`EVAL_TOKENS`、`DEPTH`、`TOTAL_BATCH_SIZE`，attention 用 `WINDOW_PATTERN` 只 "L" 等；README 有簡短指引，可 copy 俾 coding agent 幫手改。

---

## 同你嘅關係（CL / OpenClaw / 搞錢）

- **概念對齊**：**人寫「程式」係寫 `program.md`**，agent 執行同改 `train.py` — 同你「single source = workspace、MEMORY/HEARTBEAT 俾 agent 讀」類似：**人改高層指令/環境，agent 改執行層**。  
- **cron/自主**：autoresearch 係「agent 自己 loop 實驗」；你已有 daily-self-improvement、daily-thought-capture 等 **定時觸發** agent；若將來想做「agent 自主跑一序列實驗並寫記錄」，可參考呢種「固定時間預算 + 單一指標 + 單一可改 file」嘅設計。  
- **技能**：屬於「Agentic Workflow」— AI 自主多步任務；同 7 skills 裡 research system、coding 有交集，但呢個 repo 專注 **ML 研究自動化**，唔係通用搞錢流程。

---

## 金句（README 開頭 teaser）

> One day, frontier AI research used to be done by meat computers... That era is long gone. Research is now entirely the domain of autonomous swarms of AI agents... This repo is the story of how it all began. — @karpathy, March 2026

---

## 參考

- Repo: https://github.com/karpathy/autoresearch  
- 更多 NN 背景：README 提到 "Dummy's Guide"（repo 內或外鏈）  
- 完整 nanochat、多 platform：可參考 parent nanochat repo（README 有提）
