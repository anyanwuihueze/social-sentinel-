#!/bin/bash
echo "🔍 DIAGNOSING WHY TELEGRAM STOPPED WORKING"
echo "=========================================="

echo "1. Checking Python installation..."
fly ssh console --app social-agents-1765342327 -C "
  echo 'Python executable:'
  which python3
  echo ''
  echo 'Virtual env Python:'
  ls -la /opt/venv/bin/python3 2>/dev/null || echo 'Not found'
  echo ''
  echo 'Telethon module:'
  /opt/venv/bin/python3 -c 'import telethon; print(\"Found in venv\")' 2>/dev/null || echo 'Not in venv'
  python3 -c 'import telethon; print(\"Found in system\")' 2>/dev/null || echo 'Not in system'
"

echo ""
echo "2. Checking recent container events..."
fly logs --app social-agents-1765342327 | grep -i "exit\|stop\|start\|deploy\|oom" | tail -10

echo ""
echo "3. Current Python processes..."
fly ssh console --app social-agents-1765342327 -C "ps aux | grep python"

echo ""
echo "4. Python path in current process..."
fly ssh console --app social-agents-1765342327 -C "
  cat /proc/\$(ps aux | grep 'node railway' | grep -v grep | awk '{print \$2}')/environ 2>/dev/null | tr '\\0' '\\n' | grep PATH || echo 'Cannot read process env'
"
