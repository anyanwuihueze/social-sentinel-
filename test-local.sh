#!/bin/bash
echo "🧪 LOCAL AGENT TEST SCRIPT 🧪"
echo "=============================="

# Kill any existing server
pkill -f "node.*3001" 2>/dev/null || true

# Start server
echo "🚀 Starting local server..."
node railway-worker.js > server.log 2>&1 &
SERVER_PID=$!
sleep 5

# Check if server started
if ! ps -p $SERVER_PID > /dev/null; then
  echo "❌ Server failed to start. Check server.log"
  cat server.log
  exit 1
fi

echo "✅ Server started (PID: $SERVER_PID)"
echo ""

# Test endpoints
test_endpoint() {
  local name=$1
  local endpoint=$2
  local method=${3:-GET}
  local data=$4
  
  echo "🔍 $name:"
  if [ "$method" = "POST" ]; then
    response=$(curl -s -X POST "http://localhost:3001$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null)
  else
    response=$(curl -s "http://localhost:3001$endpoint" 2>/dev/null)
  fi
  
  if [ -z "$response" ]; then
    echo "   ❌ No response"
    return 1
  fi
  
  if echo "$response" | jq -e . >/dev/null 2>&1; then
    echo "   ✅ JSON response"
    echo "$response" | jq -c 'if .success != null then {success: .success, message: .message} else {ok: .ok} end'
  else
    echo "   ❌ Not JSON (first 100 chars):"
    echo "   $(echo "$response" | head -c 100)..."
  fi
}

# Run tests
test_endpoint "Health" "/health"
test_endpoint "Keywords GET" "/api/keywords"
test_endpoint "Keywords POST" "/api/keywords" "POST" '{"keyword":"schengen"}'
test_endpoint "Config" "/config"
test_endpoint "Stats" "/stats"
test_endpoint "Personas" "/api/personas"
test_endpoint "Test AI" "/test-ai" "POST" '{"text":"visa denied help","persona":"peer"}'
test_endpoint "Start Agent" "/start"
test_endpoint "Stop Agent" "/stop"

echo ""
echo "📋 Server logs (last 5 lines):"
tail -5 server.log

echo ""
echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null

echo ""
echo "=============================="
echo "🎯 Local test complete!"
echo ""
echo "If all tests pass ✅, then deploy with:"
echo "fly deploy --remote-only --app social-agents-1765342327 --now"
