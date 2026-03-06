from futu import *

# 行情測試
quote_ctx = OpenQuoteContext(host='127.0.0.1', port=11111)
ret, data = quote_ctx.get_market_snapshot(['HK.00700'])
if ret == RET_OK:
    print("📊 快照數據:")
    print(data)
else:
    print(f"❌ 獲取快照失敗: {data}")
quote_ctx.close()

# 模擬下單測試
trd_ctx = OpenSecTradeContext(host='127.0.0.1', port=11111)
ret, data = trd_ctx.place_order(
    price=500.0, qty=100, code="HK.00700",
    trd_side=TrdSide.BUY, trd_env=TrdEnv.SIMULATE
)
if ret == RET_OK:
    print(f"\n✅ 下單成功: {data}")
else:
    print(f"\n❌ 下單失敗: {data}")
trd_ctx.close()
