#!/usr/bin/env bash
# 只讀 Mac 健康快照 → ~/Desktop/CL/memory/mac-health-last.md
# 不含 sudo；適合手動或每週 cron / LaunchAgent 呼叫。

# 不用 pipefail：du 遇權限問題仍會輸出有效列，但 exit code 可能非 0。
set -u

CL_ROOT="${HOME}/Desktop/CL"
LOGFILE="${CL_ROOT}/memory/mac-health-last.md"
DATE=$(date "+%Y-%m-%d %H:%M:%S %z")

mkdir -p "$(dirname "$LOGFILE")"

# 勿對 ~/* 通配做 du：`~/Library` 整棵可達數千萬檔，易超過 agent exec ~60s 而被 SIGKILL。
SECONDS=0
{
  echo "# Mac 健康檢查"
  echo ""
  echo "**時間**: ${DATE}"
  echo ""
  echo "## 1. 磁碟使用（根目錄）"
  echo ""
  echo '```'
  df -h / 2>/dev/null || echo "df 失敗"
  echo '```'
  echo ""
  echo "## 2. 家目錄（精簡 du：常見資料夾；略過整棵 Library）"
  echo ""
  echo '```'
  {
    for name in Desktop Documents Downloads Movies Music Pictures Public Applications; do
      p="${HOME}/${name}"
      [[ -e "$p" ]] && du -sh "$p" 2>/dev/null
    done
    # 其餘第一層（不含 Library、不含已列舉）各別 du，避免單一巨型目錄拖死
    while IFS= read -r -d '' p; do
      base=$(basename "$p")
      case "$base" in
        Desktop|Documents|Downloads|Movies|Music|Pictures|Public|Applications|Library) ;;
        *) [[ -e "$p" ]] && du -sh "$p" 2>/dev/null ;;
      esac
    done < <(find "$HOME" -mindepth 1 -maxdepth 1 -print0 2>/dev/null)
  } | sort -hr | head -n 20
  echo ""
  echo "（整棵 ~/Library 請用「系統設定 → 一般 → 儲存空間」；此處不 deep scan 以免逾時。）"
  echo '```'
  echo ""
  echo "## 3. 工作區 Desktop/CL（由大到小，最多 15 項）"
  echo ""
  echo '```'
  if [[ -d "${CL_ROOT}" ]]; then
    du -sh "${CL_ROOT}"/* 2>/dev/null | sort -hr | head -n 15
  else
    echo "目錄不存在: ${CL_ROOT}"
  fi
  echo '```'
  echo ""
  echo "## 4. 記憶體壓力（memory_pressure）"
  echo ""
  echo '```'
  memory_pressure 2>/dev/null || echo "memory_pressure 不可用"
  echo '```'
  echo ""
  echo "## 5. vm_stat（前 12 行）"
  echo ""
  echo '```'
  vm_stat 2>/dev/null | head -n 12 || echo "vm_stat 不可用"
  echo '```'
  echo ""
  echo "## 6. 熱相關（免 sudo：pmset）"
  echo ""
  echo '```'
  pmset -g therm 2>/dev/null || echo "pmset therm 不可用"
  echo '```'
  echo ""
  echo "## 7. CPU 快照（top 前 22 行）"
  echo ""
  echo '```'
  top -l 1 -s 0 2>/dev/null | head -n 22 || top -l 1 2>/dev/null | head -n 22 || echo "top 不可用"
  echo '```'
  echo ""
  echo "---"
  echo ""
  echo "*只讀快照；未使用 sudo。可選：手動跑 \`sudo powermetrics --samplers thermal -n 1 -i 1000\` 取得更細熱資料（勿放進無人值守 cron）。*"
  _elapsed="${SECONDS}"
  echo "*本次報告耗時約 ${_elapsed} 秒。*"
} > "${LOGFILE}"

echo "已寫入: ${LOGFILE} （約 ${SECONDS} 秒）"
