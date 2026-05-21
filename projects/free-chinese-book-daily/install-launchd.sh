#!/bin/bash
# 將腳本裝到 ~/Library（避開 Desktop TCC），並載入 LaunchAgent。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
INSTALL="${HOME}/Library/Application Support/com.timnewmac.xteink"
mkdir -p "${INSTALL}/data"
cp "${ROOT}/daily_research.py" "${INSTALL}/daily_research.py"
cp "${ROOT}/launchd/com.timnewmac.xteink-daily.plist" "${HOME}/Library/LaunchAgents/"
chmod 644 "${HOME}/Library/LaunchAgents/com.timnewmac.xteink-daily.plist"
UID_NUM="$(id -u)"
launchctl bootout "gui/${UID_NUM}/com.timnewmac.xteink-daily" 2>/dev/null || true
launchctl bootstrap "gui/${UID_NUM}" "${HOME}/Library/LaunchAgents/com.timnewmac.xteink-daily.plist"
echo "OK: 資料目錄 XTEINK_DATA_DIR=${INSTALL}/data"
echo "手動測試: launchctl kickstart -k gui/${UID_NUM}/com.timnewmac.xteink-daily"
