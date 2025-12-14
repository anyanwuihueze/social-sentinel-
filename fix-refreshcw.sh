#!/bin/bash
# Fix the RefreshCw component in telegram-visa page
FILE="src/app/telegram-visa/page.tsx"

# Create backup
cp "$FILE" "$FILE.backup"

# Replace the problematic line with proper button wrapper
sed -i '/<RefreshCw /,/\/>/ {
    /title="Refresh keywords"/d
    s/<RefreshCw \(.*\)\/>/<button \
        onClick={handleRefreshKeywords} \
        className="p-1 hover:bg-muted rounded-md transition-colors group" \
        title="Refresh keywords" \
      > \
        <RefreshCw \1 \/> \
        <span className="sr-only">Refresh keywords<\/span> \
      <\/button>/
}' "$FILE"

echo "✅ Fixed RefreshCw component"
