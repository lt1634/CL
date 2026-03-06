from futu import *
import json
import os
import datetime

STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trade_state.json')
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trading_journal.csv')

quote_ctx = OpenQuoteContext(host='127.0.0.1', port=11111)


def log_trade(trade_record):
    """寫入 CSV 供週檢使用"""
    file_exists = os.path.isfile(LOG_FILE)
    with open(LOG_FILE, 'a') as f:
        if not file_exists:
            f.write("Date,Code,Entry,Exit,PnL_Pct,Reason\n")
        f.write(f"{trade_record['date']},{trade_record['code']},{trade_record['entry_price']},{trade_record['exit_price']},{trade_record['pnl_pct']},{trade_record['reason']}\n")


def run_exit_task():
    print(f"\n--- 啟動平倉監控: {datetime.datetime.now()} ---")

    # 1. 讀取持倉
    if not os.path.exists(STATE_FILE):
        print("📭 無持倉記錄")
        return

    with open(STATE_FILE, 'r') as f:
        position = json.load(f)

    if not position or position.get('status') != 'OPEN':
        print("📭 目前無活躍持倉")
        return

    code = position['code']
    entry_price = float(position['entry_price'])

    # 2. 監控循環 (09:30 - 10:00)
    # 這裡簡單起見，運行一次 Check。實際可寫個 while loop 直到 10:00
    ret, data = quote_ctx.get_market_snapshot([code])
    if ret != RET_OK:
        print("❌ 無法獲取行情")
        return

    curr_price = float(data.iloc[0]['last_price'])
    pnl_pct = (curr_price - entry_price) / entry_price

    print(f"👀 監控中: {code} | 現價: {curr_price} | 盈虧: {pnl_pct*100:.2f}%")

    exit_reason = None

    # 你的規則
    if pnl_pct <= -0.02:
        exit_reason = "STOP_LOSS"
        print("🔴 觸發止損! (-2%)")
    elif pnl_pct >= 0.03:
        exit_reason = "TAKE_PROFIT"
        print("🟢 觸發止盈! (+3%)")
    elif datetime.datetime.now().hour >= 10:
        exit_reason = "TIME_EXIT"
        print("⏰ 時間到，強制平倉")

    # 如果觸發平倉條件
    if exit_reason:
        print(f"🚀 [模擬賣出] {code} @ {curr_price}")

        # 記錄日誌
        log_entry = {
            'date': str(datetime.date.today()),
            'code': code,
            'entry_price': entry_price,
            'exit_price': curr_price,
            'pnl_pct': round(pnl_pct * 100, 2),
            'reason': exit_reason
        }
        log_trade(log_entry)

        # 清空狀態
        with open(STATE_FILE, 'w') as f:
            json.dump({}, f)
        print("✅ 交易結束，狀態已清除")

    quote_ctx.close()


if __name__ == "__main__":
    run_exit_task()
