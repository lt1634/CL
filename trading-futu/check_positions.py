"""
查持倉、查成交
需要 OpenD 已開啟並登入。模擬盤用 TrdEnv.SIMULATE，實盤用 TrdEnv.REAL
"""
from futu import *

trd_ctx = OpenSecTradeContext(host='127.0.0.1', port=11111)

# 模擬盤，實盤請改為 TrdEnv.REAL
trd_env = TrdEnv.SIMULATE

print("=" * 50)
print("📋 持倉列表")
print("=" * 50)
ret, data = trd_ctx.position_list_query(trd_env=trd_env)
if ret == RET_OK:
    if data is not None and len(data) > 0:
        print(data.to_string())
    else:
        print("(無持倉)")
else:
    print(f"❌ 獲取持倉失敗: {data}")

print()
print("=" * 50)
print("📊 當日成交")
print("=" * 50)
ret, data = trd_ctx.deal_list_query(trd_env=trd_env)
if ret == RET_OK:
    if data is not None and len(data) > 0:
        print(data.to_string())
    else:
        print("(當日無成交)")
else:
    print(f"❌ 獲取成交失敗: {data}")

trd_ctx.close()
