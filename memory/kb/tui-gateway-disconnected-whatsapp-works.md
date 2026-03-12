# TUI 顯示「gateway disconnected」但 WhatsApp 正常

## 點解會咁

- **TUI** 係用一條 **WebSocket 連線** 連去 Gateway（同一個 process）。
- **WhatsApp** 係經另一個通道（channel）同 Gateway 通訊，唔經 TUI 呢條連線。
- 當 TUI 嘅 WebSocket **斷咗**（例如 idle 太耐、sleep、網絡閃斷），TUI 就會顯示 **「gateway disconnected: closed | idle」**。
- 但 **Gateway 本身仲跑緊**，所以 WhatsApp 照樣收發到。

結論：**斷嘅係 TUI ↔ Gateway 呢條連線，唔係成個 Gateway 死咗。**

---

## 點搞

1. **重新連線**：喺 terminal 入面 **閂咗 TUI 再開過**（Ctrl+C 之後再 run `pnpm tui` 或你平時嘅 command），就會重新連上 Gateway，disconnected 會消失。
2. 若經常 idle 一陣就斷：可能係 Gateway 對 WebSocket 有 idle timeout，TUI 暫時冇自動重連。之後 OpenClaw 若加「自動重連」或調大 timeout，就會好啲；而家最穩陣係斷咗就手動重開 TUI。
3. 想確認 Gateway 有冇跑：可以喺另一 terminal run `openclaw gateway status`（或你嘅 Gateway 檢查 command），有正常 response 就代表 Gateway 在線，只係 TUI 條連線斷咗。

---

## 一句總結

**「disconnected」= TUI 同 Gateway 嘅連線斷咗；WhatsApp 照 work 因為係另一條通道。重開 TUI 就會連返。**
