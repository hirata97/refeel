# CI/CD ベストプラクティス

CI/CDパイプラインの効率的な運用とトラブル回避のためのベストプラクティス集

## 🎯 基本原則

### 1. 段階的実装（Incremental Implementation）

```bash
# ✅ 推奨: 小さな変更を頻繁にコミット
git add specific-file.js
git commit -m "feat: implement user validation logic"

# ❌ 非推奨: 大きな変更を一度にコミット
git add .
git commit -m "implement entire authentication system"
```

### 2. CI/CD First アプローチ

```bash
# 実装前の必須チェック
npm run ci:lint      # コード品質
npm run ci:type-check # 型安全性
npm run ci:test      # テスト実行
npm run ci:build     # ビルド確認

# 🚀 実装中の継続チェック
npm run dev &        # 開発サーバー
npm run test:unit -- --watch  # テスト監視
```

### 3. エラーの事前予防

```bash
# PRを作成する前に必ず実行
npm run ci:all       # 全品質チェック
npm run generate-types  # 型定義最新化

# 型安全性の確保
npm run dev:with-types  # 型生成後の開発開始
```

## 🔧 開発フロー最適化

### 推奨開発フロー

```bash
# 1. 最新状態で作業開始
git pull origin main
git checkout -b feature/issue-xxx-description

# 2. 型定義・環境の準備
npm run generate-types  # 型定義最新化
npm run dev:with-types  # 開発環境起動

# 3. 実装中の品質確認
npm run lint           # リアルタイム品質チェック
npm run type-check     # 型エラー確認
npm run test:unit      # テスト実行

# 4. PR作成前の最終確認
npm run ci:all         # 全品質チェック
git add .
git commit -m "feat: implement feature with proper testing"

# 5. PR作成
git push -u origin feature/issue-xxx-description
gh pr create --title "..." --body "..."
```

### CI/CDパイプライン最適化

```yaml
# 並行実行を活用した高速化
strategy:
  matrix:
    include:
      - name: 'Lint & Format'
        script: 'npm run ci:lint'
      - name: 'Type Check'
        script: 'npm run ci:type-check'
      - name: 'Unit Tests'
        script: 'npm run ci:test'
```

## 🚨 エラー予防策

### 1. Type Generation エラー予防

```bash
# 環境変数の事前確認
echo $VITE_SUPABASE_URL  # URL形式確認

# ローカル型定義での開発開始
npm run generate-types   # フォールバック使用

# 型定義変更時の影響範囲確認
npm run type-check
npm run ci:build
```

### Type Generation の詳細

Type Generation に関する詳細な運用方法・トラブルシューティングは `TYPE_GENERATION.md` を参照してください。環境変数の取り扱いや CI ワークフロー、フォールバック戦略をまとめています。

### 2. npm install エラー予防

```bash
# 定期的なキャッシュクリーンアップ
npm cache clean --force

# 高速化オプション使用
npm ci --prefer-offline --no-audit --no-fund

# package-lock.json の整合性確認
npm ci --frozen-lockfile
```

### 3. テスト失敗予防

```bash
# テスト実行前の環境確認
npm run generate-types  # 型定義最新化
npm run ci:type-check   # 型エラー解消

# 並列テスト実行の回避（必要時）
npm run test:unit -- --run --reporter=verbose
```

## 📊 品質指標とKPI

### CI/CDパイプライン品質指標

```yaml
目標値:
  - ビルド成功率: 95%以上
  - 平均実行時間: 5分以内
  - Type Generation成功率: 98%以上
  - テストカバレッジ: 80%以上（主要コンポーネント）

監視項目:
  - 失敗頻度パターン分析
  - ボトルネック特定
  - リソース使用量最適化
```

### 品質ゲート基準

```bash
# 必須通過条件
✅ ESLint: エラー0件、警告0件
✅ TypeScript: 重要な型エラー0件
✅ Unit Tests: 主要テストケース100%通過
✅ Build: 成功 + 成果物生成確認
✅ Security: 高・重大脆弱性0件
```

## 🔒 セキュリティベストプラクティス

### 環境変数管理

```bash
# ✅ 推奨: 環境変数の安全な管理
# Repository Settings > Secrets and variables > Actions
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ACCESS_TOKEN=xxx

# ❌ 禁止: 環境変数のハードコーディング
const url = "https://hardcoded.supabase.co"  # 絶対禁止
```

### 依存関係セキュリティ

```bash
# 定期的な脆弱性スキャン
npm audit --audit-level=moderate

# 自動修正適用（慎重に実行）
npm audit fix

# 依存関係の定期更新
npm update
npm outdated  # アップデート対象確認
```

## 🚀 パフォーマンス最適化

### CI/CD実行時間短縮

```yaml
# 1. 効率的なキャッシュ活用
- uses: actions/setup-node@v4
  with:
    cache: 'npm'

# 2. 条件付き実行
if: github.event.pull_request.draft != true

# 3. 並行実行最大化
needs: []  # 不要な依存関係削除
```

### 開発体験改善

```bash
# 開発時の高速フィードバック
npm run dev          # Hot reload対応
npm run test:unit -- --watch  # テスト監視モード
npm run lint --fix   # 自動修正実行

# ビルド時間短縮
npm run ci:build     # 最適化済みビルド
```

## 🔧 トラブル対応プロセス

### エラー発生時の対応フロー

```bash
# 1. エラー内容の確認
gh run view [run-id] --log-failed

# 2. ローカル再現
npm run ci:lint      # 該当チェック実行
npm run ci:type-check
npm run ci:test
npm run ci:build

# 3. 修正実装
# エラー内容に基づく修正

# 4. 再検証
npm run ci:all       # 全チェック再実行

# 5. コミット・プッシュ
git add .
git commit -m "fix: resolve CI/CD pipeline errors"
git push origin feature-branch
```

### よくある問題の予防

```bash
# Type Generation関連
export VITE_SUPABASE_URL="https://your-project.supabase.co"
npm run generate-types  # 事前実行

# Rate Limiting関連
npm ci --prefer-offline --no-audit  # 高速化オプション

# Test関連
npm run test:unit -- --run  # 並列実行回避
```

## 📈 継続的改善

### 定期レビュー項目

```bash
# 月次確認事項
- [ ] CI/CD実行時間トレンド分析
- [ ] 失敗パターン分析と改善策検討
- [ ] 依存関係アップデート計画
- [ ] セキュリティ脆弱性スキャン

# 四半期改善事項
- [ ] ワークフロー設定最適化
- [ ] 新しい品質チェック項目検討
- [ ] パフォーマンス改善実装
- [ ] 開発体験向上施策
```

### 改善提案プロセス

```bash
# 1. 問題特定・分析
gh run list --limit 20 | grep "failure"

# 2. 改善案設計
# Issue作成 > 検討 > 実装計画

# 3. 実装・検証
# feature branch > PR > テスト > マージ

# 4. 効果測定
# 実行時間・成功率・開発者満足度測定
```

## 📚 学習リソース

### 推奨学習項目

- GitHub Actions Advanced Workflows
- TypeScript型システム深掘り
- npm/Node.js最適化技術
- セキュリティベストプラクティス

### 実践的な学習方法

```bash
# 1. 実際のCI/CD実行ログ分析
gh run list
gh run view [run-id]

# 2. 設定ファイル理解
cat .github/workflows/ci.yml
cat .github/workflows/type-generation.yml

# 3. スクリプト解析
node scripts/generate-types.js --help
```

---

**📝 更新履歴**

- 2025-08-25: CI/CDベストプラクティス初版作成（Issue #155対応）
