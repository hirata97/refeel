#!/usr/bin/env python3
"""
Console to Logger Replacement Script
Systematically replaces console.* with logger.* and adds appropriate imports
"""

import os
import re
from pathlib import Path

def get_logger_name(filename):
    """Generate logger name from filename"""
    name = Path(filename).stem
    # Convert to uppercase and remove special characters
    name = re.sub(r'[^a-zA-Z0-9]', '-', name)
    return name.upper()

def add_logger_import(content, filename):
    """Add logger import after the last import statement"""
    lines = content.split('\n')

    # Check if logger import already exists
    if "from '@/utils/logger'" in content:
        return content

    # Find the last import line
    last_import_idx = -1
    for idx, line in enumerate(lines):
        if line.strip().startswith('import ') and "from '@/" in line:
            last_import_idx = idx

    if last_import_idx >= 0:
        # Insert logger import after last import
        logger_name = get_logger_name(filename)
        import_lines = [
            "import { createLogger } from '@/utils/logger'",
            "",
            f"const logger = createLogger('{logger_name}')"
        ]

        # Insert after last import
        lines = lines[:last_import_idx + 1] + import_lines + lines[last_import_idx + 1:]

    return '\n'.join(lines)

def replace_console_calls(content):
    """Replace console.* calls with logger.*"""
    # Replace console.log with logger.debug
    content = re.sub(r'\bconsole\.log\(', 'logger.debug(', content)

    # Replace console.info with logger.info
    content = re.sub(r'\bconsole\.info\(', 'logger.info(', content)

    # Replace console.warn with logger.warn
    content = re.sub(r'\bconsole\.warn\(', 'logger.warn(', content)

    # Replace console.error with logger.error
    content = re.sub(r'\bconsole\.error\(', 'logger.error(', content)

    return content

def has_console_usage(content):
    """Check if file has console usage"""
    return bool(re.search(r'\bconsole\.(log|info|warn|error)\(', content))

def process_file(filepath):
    """Process a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Skip if no console usage
        if not has_console_usage(content):
            return False

        # Skip if already has logger
        if "from '@/utils/logger'" in content:
            # Still replace console calls
            new_content = replace_console_calls(content)
        else:
            # Add import and replace
            new_content = add_logger_import(content, filepath)
            new_content = replace_console_calls(new_content)

        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return True
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Main function"""
    src_dir = Path('src')

    # Find all TypeScript files
    ts_files = list(src_dir.rglob('*.ts'))

    processed = 0
    for filepath in ts_files:
        # Skip test files and type definition files
        if '/__tests__/' in str(filepath) or filepath.name.endswith('.d.ts'):
            continue

        # Skip the logger file itself
        if 'logger.ts' in str(filepath):
            continue

        if process_file(filepath):
            print(f"Processed: {filepath}")
            processed += 1

    print(f"\nTotal files processed: {processed}")

if __name__ == '__main__':
    main()
