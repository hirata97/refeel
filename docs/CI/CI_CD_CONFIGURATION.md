# CI/CD設定変更手順ガイド

## 📋 目次

- [概要](#概要)
- [GitHub Actions設定変更](#github-actions設定変更)
- [品質ゲート条件変更](#品質ゲート条件変更)
- [環境変数・シークレット管理](#環境変数シークレット管理)
- [npm scripts設定](#npm-scripts設定)
- [安全な変更手順](#安全な変更手順)

## 概要

CI/CD設定を変更する際の標準手順とベストプラクティスをまとめたガイドです。設定変更は慎重に行い、必ずテスト・検証してから本番環境に適用してください。

### 変更前チェックリスト

- [ ] 変更の目的・理由を明確化
- [ ] 影響範囲の特定（どのワークフローが影響を受けるか）
- [ ] バックアップ作成（現在の設定ファイルをコピー）
- [ ] ローカルでのテスト計画策定
- [ ] ロールバック手順の確認

## GitHub Actions設定変更

### ワークフローファイル構成

```
.github/workflows/
├── pr-quality-gate.yml      # PR品質チェック（厳格）
├── ci.yml                   # 継続的品質監視（緩やか）
├── e2e-tests.yml            # E2Eテスト
├── deploy.yml               # Vercelデプロイ
├── type-generation.yml      # 型定義自動生成
├── AutoLabel.yml            # PR自動ラベル
├── auto-close-issues.yml    # Issue自動クローズ
└── issue-audit.yml          # Issue監査
```

### 新規ワークフロー追加手順

#### 1. ワークフローファイル作成

```bash
# テンプレートから作成
cd .github/workflows
touch new-workflow.yml
```

#### 2. 基本構造の記述

```yaml
name: New Workflow Name

# トリガー条件
on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

# 権限設定（最小権限の原則）
permissions:
  contents: read
  pull-requests: write

# 並行実行制御
concurrency:
  group: new-workflow-${{ github.ref }}
  cancel-in-progress: true

jobs:
  job-name:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: |
        for i in {1..3}; do
          npm ci --prefer-offline --silent --no-audit --no-fund && break
          sleep 30
        done

    - name: Run job
      run: npm run your-command
```

#### 3. ローカルテスト（act使用）

```bash
# actインストール（初回のみ）
brew install act

# ワークフローテスト実行
act pull_request -W .github/workflows/new-workflow.yml
```

#### 4. フィーチャーブランチでテスト

```bash
# フィーチャーブランチ作成
git checkout -b feature/add-new-workflow

# コミット・プッシュ
git add .github/workflows/new-workflow.yml
git commit -m "feat: add new workflow for [purpose]"
git push -u origin feature/add-new-workflow

# PR作成してCI/CD実行確認
gh pr create --title "Add new CI/CD workflow" \
  --body "Test new workflow configuration"
```

#### 5. 動作確認・本番適用

```bash
# PR上でワークフロー実行確認
gh pr checks

# 問題なければマージ
gh pr merge --squash
```

### 既存ワークフロー変更手順

#### タイムアウト変更

```yaml
# 変更前
jobs:
  test:
    timeout-minutes: 10

# 変更後（実行時間を考慮して調整）
jobs:
  test:
    timeout-minutes: 15  # 実測値 + バッファ20%
```

#### トリガー条件変更

```yaml
# 特定パスのみでトリガー
on:
  pull_request:
    paths:
      - 'src/**'
      - 'tests/**'
      - 'package.json'

# 特定パスを除外
on:
  pull_request:
    paths-ignore:
      - 'docs/**'
      - '*.md'
```

#### ジョブ依存関係追加

```yaml
jobs:
  # 基本チェック
  lint:
    runs-on: ubuntu-latest
    steps: [...]

  # lintが成功したら実行
  test:
    runs-on: ubuntu-latest
    needs: lint  # 依存関係追加
    steps: [...]

  # lint, test両方成功したら実行
  build:
    runs-on: ubuntu-latest
    needs: [lint, test]  # 複数依存
    steps: [...]
```

## 品質ゲート条件変更

### ESLint設定変更

#### ルール追加・変更

```javascript
// eslint.config.js

export default [
  // ... 既存設定

  {
    name: 'app/custom-rules',
    files: ['src/**/*.{ts,vue}'],
    rules: {
      // 新規ルール追加
      'no-unused-vars': 'error',

      // 既存ルール変更（error → warn）
      '@typescript-eslint/no-explicit-any': 'warn',

      // ルール無効化
      'vue/multi-word-component-names': 'off'
    }
  }
]
```

#### 変更後の確認手順

```bash
# ローカルでESLint実行
npm run ci:lint

# エラー自動修正
npm run lint

# 特定ファイルのみチェック
npx eslint src/views/LoginPage.vue
```

### TypeScript設定変更

#### tsconfig.json変更

```json
{
  "compilerOptions": {
    // 厳格度変更
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,

    // パス設定
    "paths": {
      "@/*": ["./src/*"]
    },

    // ライブラリ追加
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
```

#### 型チェック実行

```bash
# 全体型チェック
npm run type-check

# CI用型チェック（詳細ログ）
npm run ci:type-check

# 特定ファイルのみ
npx vue-tsc --noEmit src/views/LoginPage.vue
```

### テストカバレッジ閾値変更

#### vitest.config.ts変更

```typescript
// vitest.config.ts

export default defineConfig({
  test: {
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],

      // 閾値設定（現在は設定なし）
      thresholds: {
        lines: 70,      // 行カバレッジ70%
        functions: 70,  // 関数カバレッジ70%
        branches: 60,   // 分岐カバレッジ60%
        statements: 70  // 文カバレッジ70%
      },

      // 除外パターン
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.spec.ts',
        '**/*.config.ts'
      ]
    }
  }
})
```

#### カバレッジ閾値テスト

```bash
# カバレッジ付きテスト実行
npm run ci:test

# HTMLレポート確認
open coverage/index.html
```

### Prettier設定変更

#### .prettierrc変更

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "es5",
  "tabWidth": 2,
  "useTabs": false
}
```

#### フォーマットチェック

```bash
# フォーマットチェック
npm run format -- --check

# 自動フォーマット適用
npm run format
```

## 環境変数・シークレット管理

### GitHub Secrets設定

#### コマンドライン設定

```bash
# 新規Secret追加
gh secret set SECRET_NAME --body "secret-value"

# ファイルから設定
gh secret set SECRET_NAME < secret-file.txt

# 環境別設定
gh secret set SECRET_NAME --env production --body "prod-value"
gh secret set SECRET_NAME --env staging --body "staging-value"

# Secret一覧確認
gh secret list
```

#### ワークフロー内での使用

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Use secret
      env:
        API_KEY: ${{ secrets.API_KEY }}
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
      run: |
        echo "API Key configured"
        # Secretは直接echoしない（ログに残る）
```

#### Secret管理ベストプラクティス

- ✅ Secret名は大文字スネークケース（`API_KEY`）
- ✅ 定期的なローテーション（3-6ヶ月）
- ✅ 最小権限の原則（必要なワークフローのみに付与）
- ❌ Secretをログに出力しない
- ❌ PRから直接Secretにアクセスしない（fork PRからは利用不可）

### 環境変数設定

#### .env.example更新

```bash
# .env.example（テンプレート）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
VITE_APP_ENV=development

# .env（実際の値、.gitignore済み）
# このファイルをコピーして.envを作成
```

#### ワークフロー内での環境変数

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: test
      VITE_APP_ENV: ci
    steps:
    - name: Run tests
      run: npm run ci:test
```

## npm scripts設定

### package.json scripts変更

#### CI用コマンド追加

```json
{
  "scripts": {
    // 既存CI コマンド
    "ci:lint": "eslint . --max-warnings=0",
    "ci:type-check": "./scripts/ci-type-check.sh",
    "ci:test": "vitest run --coverage",
    "ci:build": "vite build",
    "ci:security": "npm audit --audit-level=high",

    // 新規コマンド追加例
    "ci:format-check": "prettier --check src/",
    "ci:e2e": "playwright test --reporter=html",
    "ci:lighthouse": "lighthouse-ci autorun",

    // 統合コマンド
    "ci:all": "npm run generate-types && npm run ci:lint && npm run ci:type-check && npm run ci:test && npm run ci:build && npm run ci:security"
  }
}
```

#### コマンド実行順序制御

```json
{
  "scripts": {
    // 並列実行（npm-run-all使用）
    "ci:parallel": "run-p ci:lint ci:type-check ci:test",

    // 順次実行
    "ci:sequential": "run-s ci:lint ci:type-check ci:test ci:build"
  }
}
```

## 安全な変更手順

### 段階的ロールアウト戦略

#### Phase 1: ローカル検証

```bash
# 1. フィーチャーブランチ作成
git checkout -b feature/ci-config-update

# 2. 設定変更
vim .github/workflows/pr-quality-gate.yml

# 3. ローカルテスト
npm run ci:all

# 4. コミット
git add .
git commit -m "chore: update CI configuration - [変更内容]"
```

#### Phase 2: テストPRでの検証

```bash
# 1. プッシュ
git push -u origin feature/ci-config-update

# 2. Draft PR作成
gh pr create --draft \
  --title "[WIP] CI設定更新 - [変更内容]" \
  --body "## 変更内容
- [ ] 変更内容1
- [ ] 変更内容2

## テスト結果
- [ ] ローカルテスト成功
- [ ] CI/CD実行成功

## 影響範囲
- 対象ワークフロー: [ワークフロー名]
- 変更理由: [理由]"

# 3. CI/CD実行確認
gh pr checks

# 4. 問題なければReady for review
gh pr ready
```

#### Phase 3: レビュー・承認

```bash
# 1. レビュー依頼
gh pr review --approve

# 2. マージ
gh pr merge --squash

# 3. マージ後の動作確認
gh run list --limit 5
gh run view [run-id]
```

### ロールバック手順

#### 設定ファイルのロールバック

```bash
# 1. 問題のあるコミット特定
git log --oneline .github/workflows/

# 2. 特定ファイルを前バージョンに戻す
git checkout [commit-hash] -- .github/workflows/pr-quality-gate.yml

# 3. コミット・プッシュ
git commit -m "revert: rollback CI configuration to [commit-hash]"
git push origin main
```

#### 緊急時のワークフロー無効化

```yaml
# ワークフロー冒頭に追加
on:
  workflow_dispatch:  # 手動実行のみに変更

# または
jobs:
  check:
    runs-on: ubuntu-latest
    if: false  # 一時的に無効化
    steps: [...]
```

### 変更テストチェックリスト

- [ ] ローカルで該当コマンド実行成功
- [ ] フィーチャーブランチでPR作成
- [ ] CI/CD全ジョブ成功確認
- [ ] 実行時間が想定範囲内（タイムアウト未発生）
- [ ] 品質ゲート判定が正常動作
- [ ] PRコメント通知が正常表示
- [ ] 他のワークフローに影響なし
- [ ] ドキュメント更新（必要時）

## トラブルシューティング

### よくある設定ミス

#### 1. YAML構文エラー

```bash
# GitHub CLIでバリデーション
gh workflow view pr-quality-gate.yml

# YAMLリンター使用
yamllint .github/workflows/pr-quality-gate.yml
```

#### 2. 権限不足エラー

```yaml
# 修正前
permissions:
  contents: read

# 修正後（PR コメント必要な場合）
permissions:
  contents: read
  pull-requests: write
```

#### 3. 依存関係循環

```yaml
# ❌ 循環依存
jobs:
  job-a:
    needs: job-b
  job-b:
    needs: job-a

# ✅ 正しい依存関係
jobs:
  job-a:
    runs-on: ubuntu-latest
  job-b:
    needs: job-a
```

## 関連ドキュメント

- [CI/CDアーキテクチャ](./CI_CD_OVERVIEW.md)
- [トラブルシューティングガイド](./CI_CD_TROUBLESHOOTING.md)
- [運用・保守ガイド](./CI_CD_OPERATIONS.md)
- [クイックリファレンス](./CI_CD_QUICK_REFERENCE.md)

## バージョン履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0.0 | 2025-01-14 | 初版作成 |
