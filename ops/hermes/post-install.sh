#!/bin/bash
# Hermes 與 OpenClaw 分離：secret 只放 ~/.hermes/.env（唔好寫入本 repo 任何檔案）
# 必填：OPENROUTER_API_KEY、TELEGRAM_BOT_TOKEN（見 hermes config env-path）
set -euo pipefail
export PATH="${HOME}/.local/bin:${PATH}"
hermes gateway restart
sleep 2
hermes gateway status
echo "--- ~/.hermes/logs/agent.log (尾 20 行) ---"
tail -20 "${HOME}/.hermes/logs/agent.log" 2>/dev/null || true
hermes doctor 2>&1 | tail -25
