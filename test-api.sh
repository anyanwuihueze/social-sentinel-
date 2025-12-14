#!/bin/bash
echo "🧪 TESTING SOCIAL AGENTS API 🧪"
echo "================================"

# Wait for deployment to be ready
sleep 5

echo ""
echo "1️⃣ Health Check:"
curl -s https://social-agents-1765342327.fly.dev/health | jq '.ok,.status,.telegram'

echo ""
echo "2️⃣ Test AI Reply (should work):"
curl -s -X POST https://social-agents-1765342327.fly.dev/test-ai \
  -H "Content-Type: application/json" \
  -d '{"text":"visa interview help","persona":"peer"}' | jq '.success,.reply | .[0:50]'

echo ""
echo "3️⃣ Check Personas API (may fail if not deployed):"
curl -s https://social-agents-1765342327.fly.dev/api/personas | head -20

echo ""
echo "4️⃣ Check Config:"
curl -s https://social-agents-1765342327.fly.dev/config | jq '.config.persona,.config.aiEnabled'

echo ""
echo "5️⃣ Check Stats:"
curl -s https://social-agents-1765342327.fly.dev/stats | jq '.stats.status,.stats.totalMessages'

echo ""
echo "✅ Basic tests completed!"
