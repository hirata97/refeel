#!/bin/bash
#
# Console to Logger Replacement Script
# This script replaces console.* usage with logger.* systematically
#

# Find all TypeScript and Vue files with console usage
find src -type f \( -name "*.ts" -o -name "*.vue" \) | while read -r file; do
  # Skip if file already imports logger
  if grep -q "from '@/utils/logger'" "$file"; then
    echo "Skipping $file (already has logger import)"
    continue
  fi

  # Check if file has console usage
  if grep -q "console\." "$file"; then
    echo "Processing: $file"

    # Add logger import after the last import statement for .ts files
    if [[ "$file" == *.ts ]]; then
      # Find last import line
      last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      if [ -n "$last_import" ]; then
        sed -i "${last_import}a import { createLogger } from '@/utils/logger'\nconst logger = createLogger('$(basename "$file" .ts | tr '[:lower:]' '[:upper:]')')" "$file"
      fi
    fi

    # Replace console usage
    sed -i 's/console\.log(/logger.debug(/g' "$file"
    sed -i 's/console\.info(/logger.info(/g' "$file"
    sed -i 's/console\.warn(/logger.warn(/g' "$file"
    sed -i 's/console\.error(/logger.error(/g' "$file"
  fi
done

echo "Console replacement complete!"
