#!/usr/bin/env node
// scripts/find-test-imports.js
// 概要: リポジトリ内のソースファイルを走査し、テスト関連の古いパス参照を検出して出力します。

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const exts = ['.js', '.ts', '.vue']

function walk(dir, cb) {
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const it of items) {
    const full = path.join(dir, it.name)
    if (it.isDirectory()) {
      if (['node_modules', '.git', 'dist'].includes(it.name)) continue
      walk(full, cb)
    } else {
      cb(full)
    }
  }
}

const importRegex = /(from\s+['"])(\.\.?\/[^'"\n]*tests\/[^'"\n]*|tests\/[^'"\n]*)(['"])/g

const results = []
walk(root, (file) => {
  if (!exts.includes(path.extname(file))) return
  const content = fs.readFileSync(file, 'utf8')
  let m
  while ((m = importRegex.exec(content)) !== null) {
    results.push({ file: path.relative(root, file), match: m[2] })
  }
})

if (results.length === 0) {
  console.log('No test-related imports detected.')
  process.exit(0)
}

console.log('Detected test-related imports (file -> referenced path):')
for (const r of results) {
  console.log(`${r.file}  ->  ${r.match}`)
}

console.log('\nTip: review each file and update imports to the new `tests/*` locations, or run sed replacements carefully.')
