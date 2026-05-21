# AI Agent Memory Systems — Team Knowledge

**Source:** Team Research (test-4-001)
**Date:** 2026-05-06
**# relates_to:** team-workflow.md, context-discipline.md, failure-recovery.md, hermes-level2.md

---

## LOCOMO Benchmark (2026) — 權衡取捨

| System | Accuracy | Latency | Scalability |
|--------|----------|---------|-------------|
| Full-context | 72.9% | 17s p95 | ❌ |
| Mem0 (selective) | ~67% | 1.44s p95 | ✅ |
| Mem0g (graph) | ~68% | 2.59s p95 | ✅ |

**結論：** 唔需要 72.9% 準確率，换 91% 延遲損失。Mem0g 係最佳平衡點。

---

## Agentic RAG — 主流模式

- Memory 係 **distinct component**，唔係事後補救
- Agent 自己 planning + reasoning，先決定 fetch 乜
- 涉及：recursive retrieval、query decomposition、LangGraph orchestration

---

## Self-improving Agent — 必要元素

所有主流 framework（LangGraph、OpenAI Agents SDK、Google ADK、Mastra、CrewAI、AutoGen）都收斂到：

**Baseline = persistent memory + self-healing + multi-agent orchestration**

---

## Hermes 定位

> "self-improving agent with long-term memory reference implementation"

呢個係外間對 Hermes 嘅評價。

---

## Challenges & Risks

| 風險 | 描述 | 應對 |
|------|------|------|
| **Consistency Drift** | 長期記憶累積衝突/過時資訊 | 需 conflict resolution + memory editing 機制 |
| **Privacy & Security** | user-level memory 需嚴格 scoping | 加密 + scope 控制 |
| **Evaluation 局限** | LOCOMO 只測 conversational recall | 需結合業務指標（task success rate） |
| **Cost & Latency** | selective 仍需持續優化 | hierarchical indexing + caching |

---

## 實務建議（2026）

### 起步選擇
**Mem0**（或類似成熟方案）— 快速獲得 selective + graph 能力

### 架構設計
- Hierarchical + Multi-scope 記憶
- LangGraph 實現 Agentic workflow
- Reflection / self-healing loop

### 評估框架
- LOCOMO benchmark + 業務指標同時參考

### 未來展望（2026 下半年）
- Multi-modal memory（文字+影像+動作）
- **Cross-agent shared memory 與 federation** ← 我哋要追上呢個
- 更強的 proactive memory（agent 主動回想並提醒）

---

## 結語

> 2026 年的 AI Agent，Memory 不再是 patch，而是決定成敗的關鍵架構決策。

從 full-context → selective-hierarchical-agentic 的轉變，已讓長程、個人化、自成長的 Agent 從實驗室走進生產環境。

**建議：** 盡快落地 Mem0 + LangGraph + Self-improving loop 組合。

---

## 對我哋團隊嘅啟示

1. **Mem0/Mem0g 架構** — 可考慮用喺我哋嘅 memory system
2. **Agentic RAG** — 我哋而家係咪行呢個模式？Context discipline 係基礎
3. **Self-improving** — Hermes + 每日回顧 loop 正好係呢個概念
4. **Cross-agent shared memory** — 我哋 team-workflow 已有基礎，但要加強

---

## References

1. mem0.ai/blog/state-of-ai-agent-memory-2026
2. redis.io/blog/ai-agent-architecture/
3. pub.towardsai.net/9-rag-architectures-every-ai-developer-must-master-in-2025
4. arxiv.org/html/2602.16192v1 (RoboMemory)
5. andriifurmanets.com/blogs/ai-agents-2026-practical-architecture-tools-memory-evals-guardrails

**Learnings Link:** Google Drive CL Learnings `10zeWVfkju7boEv-zbZEbEr_XYtI5beJc`
