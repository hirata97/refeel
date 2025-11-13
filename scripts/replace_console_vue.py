#!/usr/bin/env python3
"""
Console to Logger Replacement Script for Vue Files
Replaces console.* with logger.* in Vue <script setup> sections
"""

import os
import re
from pathlib import Path

def get_logger_name(filename):
    """Generate logger name from filename"""
    name = Path(filename).stem
    # Convert to PascalCase to logger name
    name = re.sub(r'[^a-zA-Z0-9]', '-', name)
    return name.upper()

def process_vue_file(filepath):
    """Process a single Vue file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file has console usage
        if not re.search(r'\bconsole\.(log|info|warn|error)\(', content):
            return False

        # Check if logger is already imported
        has_logger = "from '@/utils/logger'" in content

        # Find the <script setup> section
        script_match = re.search(r'<script setup.*?>(.*?)</script>', content, re.DOTALL)
        if not script_match:
            # Try <script> tag
            script_match = re.search(r'<script.*?>(.*?)</script>', content, re.DOTALL)

        if script_match:
            script_content = script_match.group(1)

            if not has_logger:
                # Find last import statement
                imports = list(re.finditer(r"^import .* from ['\"]@/.*['\"]", script_content, re.MULTILINE))

                if imports:
                    last_import = imports[-1]
                    logger_name = get_logger_name(filepath)

                    # Insert logger import after last import
                    insert_pos = last_import.end()
                    logger_import = f"\nimport {{ createLogger }} from '@/utils/logger'\n\nconst logger = createLogger('{logger_name}')"

                    script_content = script_content[:insert_pos] + logger_import + script_content[insert_pos:]

            # Replace console calls
            script_content = re.sub(r'\bconsole\.log\(', 'logger.debug(', script_content)
            script_content = re.sub(r'\bconsole\.info\(', 'logger.info(', script_content)
            script_content = re.sub(r'\bconsole\.warn\(', 'logger.warn(', script_content)
            script_content = re.sub(r'\bconsole\.error\(', 'logger.error(', script_content)

            # Replace the script section
            new_content = content[:script_match.start(1)] + script_content + content[script_match.end(1):]

            # Write back
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

            return True

        return False

    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Main function"""
    src_dir = Path('src')

    # Find all Vue files
    vue_files = list(src_dir.rglob('*.vue'))

    processed = 0
    for filepath in vue_files:
        if process_vue_file(filepath):
            print(f"Processed: {filepath}")
            processed += 1

    print(f"\nTotal Vue files processed: {processed}")

if __name__ == '__main__':
    main()
