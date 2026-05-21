#!/bin/zsh
# 在「終端機」執行：zsh /Users/timnewmac/Desktop/CL/tools/uninstall-tailscale-macos.sh
# 參數：--cleanup-only  略過 systemextensionsctl uninstall，只做刪殘與掃庫
#
# 說明：在啟用 SIP 時，Apple 可能不允許執行
#   sudo systemextensionsctl uninstall
#  此時請先用「系統設定」從圖形介面移除延伸（不必關 SIP），再執行本腳本或 --cleanup-only。

TEAM="W5364U7YZB"
BID="io.tailscale.ipn.macsys.network-extension"
CLEANUP_ONLY=false
for a in "$@"; do
  [[ "$a" == "--cleanup-only" ]] && CLEANUP_ONLY=true
done

echo "== Tailscale 清理腳本 =="
echo "延伸：$TEAM / $BID"
echo ""

if ! $CLEANUP_ONLY; then
  if out=$(sudo systemextensionsctl uninstall "$TEAM" "$BID" 2>&1); then
    echo "已用 systemextensionsctl 解除註冊（成功）。"
  else
    echo "$out" >&2
    if echo "$out" | /usr/bin/grep -q "System Integrity Protection"; then
      echo "" >&2
      echo "【SIP 開啟時，Apple 的 uninstall 子指令在這台機上會被擋，這是預期行為。】" >&2
      echo "建議用圖形介面移除，不必關閉 SIP：" >&2
      echo "  系統設定 → 一般 → 登入項目與延伸功能 → 網路延伸功能" >&2
      echo "  找到「Tailscale Network Extension」關閉/移除，然後重新啟動。" >&2
      echo "重開後若延伸已不見，可再執行：" >&2
      echo "  $0 --cleanup-only" >&2
      echo "" >&2
    fi
  fi
  sudo systemextensionsctl gc 2>/dev/null || true
else
  echo "（--cleanup-only：不執行 systemextensionsctl uninstall）"
  sudo systemextensionsctl gc 2>/dev/null || true
fi

# /Library 與 CLI
sudo rm -rf /Library/Tailscale 2>/dev/null || true
sudo rm -f /usr/local/bin/tailscale 2>/dev/null || true

# 嘗刪 /Library/SystemExtensions/.../io.tailscale... 與以 find 尋得的路徑
TSE_CAND=("/Library/SystemExtensions/AE8B3272-F539-43D8-890F-A9B62B254E0E/io.tailscale.ipn.macsys.network-extension.systemextension")
while IFS= read -r p; do
  [[ -n "$p" && -e "$p" ]] && TSE_CAND+="$p"
done < <(/usr/bin/find /Library/SystemExtensions -maxdepth 4 -name '*ailscale*' 2>/dev/null)

typeset -U paths
paths=()
for p in $TSE_CAND; do
  [[ -e "$p" ]] && paths+="$p"
done

for p in $paths; do
  echo "嘗試刪除系統延伸目錄：$p"
  if ! sudo /bin/rm -rf "$p" 2>/dev/null; then
    echo "  （刪除被拒絕。若剛在設定裡移除了延伸，請重開機後執行 --cleanup-only。）" >&2
  fi
done

rm -rf "$HOME/Library/Application Support/Tailscale" \
  "$HOME/Library/Caches/com.tailscale.ipn.macsys" 2>/dev/null || true
rm -f "$HOME/Library/Preferences/io.tailscale.ipn.macsys"*.plist 2>/dev/null || true

echo ""
echo "== systemextensionsctl list 含 tail 的行 =="
/usr/bin/systemextensionsctl list 2>&1 | /usr/bin/grep -i tail || echo "（無，代表延伸已不註冊。）"

echo ""
echo "完成。需要時可執行：sudo reboot"
exit 0
