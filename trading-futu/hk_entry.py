from futu import *
import pandas as pd
import datetime
import json
import os

# --- 配置區 ---
WATCHLIST = ['HK.00700', 'HK.09988', 'HK.03690', 'HK.01810', 'HK.02800']
HSI_CODE = 'HK.800000'  # 恒指代碼
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trade_state.json')
MAX_CAPITAL = 30000

# 初始化 API (請確保 OpenD 已開啟)
quote_ctx = OpenQuoteContext(host='127.0.0.1', port=11111)


def get_snapshot(code_list):
    ret, data = quote_ctx.get_market_snapshot(code_list)
    if ret == RET_OK:
        return data.set_index('code')
    return None


def get_kline(code):
    ret, data = quote_ctx.get_cur_kline(code, 1)
    if ret == RET_OK:
        return data.iloc[-1]
    return None


def enhanced_entry_signal(code, hsi_change_pct):
    """你的優化版信號邏輯"""
    kline = get_kline(code)
    snapshot_df = get_snapshot([code])

    if kline is None or snapshot_df is None:
        return False

    snap = snapshot_df.loc[code]
    current_price = snap['last_price']
    real_prev_close = snap['prev_close_price']

    # 1. 尾盤拉升幅度 > 0.5% (且是陽燭)
    price_change_pct = (current_price - real_prev_close) / real_prev_close * 100
    is_tail_up = price_change_pct > 0.5

    # 2. 收盤價位於日高點的 90% 範圍內
    day_high = snap['high_price']
    close_to_high = current_price > (day_high * 0.9)

    # 3. 相對強度 (RS): 跑贏大盤 0.3%
    out_perform = price_change_pct > (hsi_change_pct + 0.3)

    # 4. 成交量過濾 (額外加的，確保流動性)
    is_active = snap['turnover'] > 50000000

    print(f"📊 {code}: 升幅{price_change_pct:.2f}% vs 恒指{hsi_change_pct:.2f}% | 強勢收尾: {close_to_high}")

    return is_tail_up and close_to_high and out_perform and is_active


def run_entry_task():
    print(f"\n--- 啟動掃描: {datetime.datetime.now()} ---")

    # 1. 獲取大盤狀況
    hsi_snap = get_snapshot([HSI_CODE])
    if hsi_snap is None:
        print("❌ 無法獲取恒指數據")
        return

    hsi_last = hsi_snap.loc[HSI_CODE]['last_price']
    hsi_prev = hsi_snap.loc[HSI_CODE]['prev_close_price']
    hsi_change_pct = (hsi_last - hsi_prev) / hsi_prev * 100
    print(f"📈 恒指今日表現: {hsi_change_pct:.2f}%")

    # 2. 掃描 Watchlist
    target_stock = None
    target_price = 0

    for code in WATCHLIST:
        if enhanced_entry_signal(code, hsi_change_pct):
            target_stock = code
            snap = get_snapshot([code])
            target_price = snap.loc[code]['last_price']
            break  # 只選第一隻

    # 3. 執行模擬交易並存檔
    trade_data = {}
    if target_stock:
        qty = int(15000 / target_price / 100) * 100  # 假設每手100，用一半資金($15k)做緩衝
        print(f"🚀 [模擬買入] {target_stock} | 價格: {target_price} | 數量: {qty}")

        trade_data = {
            'date': str(datetime.date.today()),
            'code': target_stock,
            'entry_price': float(target_price),
            'qty': qty,
            'status': 'OPEN'
        }
    else:
        print("😴 今日無信號")

    # 4. 持久化數據 (Save to JSON)
    with open(STATE_FILE, 'w') as f:
        json.dump(trade_data, f)
    print(f"💾 狀態已保存至 {STATE_FILE}")

    quote_ctx.close()


if __name__ == "__main__":
    run_entry_task()
