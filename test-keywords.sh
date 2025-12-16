#!/bin/bash
KEYWORDS=("visa" "interview" "appointment" "embassy" "denied" "rejected" "travel" "funds" "passport")
TEST_MESSAGES=(
  "My visa appointment is tomorrow"
  "Embassy denied my application"
  "Need help with travel documents"
  "Feeling happy about my trip"
  "Frustrated with the visa process"
)

for msg in "${TEST_MESSAGES[@]}"; do
  lower_msg=$(echo "$msg" | tr '[:upper:]' '[:lower:]')
  triggered=false
  matched_keywords=()
  
  for kw in "${KEYWORDS[@]}"; do
    if [[ $lower_msg == *"$kw"* ]]; then
      triggered=true
      matched_keywords+=("$kw")
    fi
  done
  
  echo -n "🔍 \"$msg\": "
  if [ "$triggered" = true ]; then
    echo "✅ TRIGGERED (keywords: ${matched_keywords[*]})"
  else
    echo "❌ NOT TRIGGERED"
  fi
done
