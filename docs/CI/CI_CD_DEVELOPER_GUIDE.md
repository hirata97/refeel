# CI/CD開発者ガイド

> **ドキュメント体系**:
> - 📘 **このドキュメント**: CI/CD開発者向け総合ガイド（日常運用＋ベストプラクティス）
> - 🏗️ **アーキテクチャ詳細**: [CI/CD Overview](CI_CD_OVERVIEW.md)
> - 🔧 **設定変更手順**: [CI/CD Configuration](CI_CD_CONFIGURATION.md)
> - 🚨 **詳細トラブルシューティング**: [CI/CD Troubleshooting](CI_CD_TROUBLESHOOTING.md)
> - ⚡ **クイックリファレンス**: [CI/CD Quick Reference](./CI_CD_QUICK_REFERENCE.md)
> - 🔧 **型定義生成**: [Type Generation](./TYPE_GENERATION.md)

このドキュメントでは、GoalCategorizationDiaryプロジェクトのCI/CD（継続的インテグレーション/継続的デリバリー）システムの **日常的な運用** と **ベストプラクティス** について説明します。

## 📋 目次

- [概要](#概要)
- [基本原則](#基本原則)
- [CI/CDシステム詳細](#cicdシステム詳細)
- [開発フローベストプラクティス](#開発フローベストプラクティス)
- [ローカルでの事前確認](#ローカルでの事前確認)
- [エラー予防策](#エラー予防策)
- [品質指標とKPI](#品質指標とkpi)
- [トラブルシューティング](#トラブルシューティング)
- [パフォーマンス最適化](#パフォーマンス最適化)
- [セキュリティベストプラクティス](#セキュリティベストプラクティス)
- [CI結果の確認方法](#ci結果の確認方法)
- [コスト管理](#コスト管理)
- [カスタマイズと設定](#カスタマイズと設定)
- [継続的改善](#継続的改善)
- [関連ドキュメント](#関連ドキュメント)

---

## 概要

### 実装されたCI/CDシステム

- **プラットフォーム**: GitHub Actions
- **トリガー**: PR作成・更新、main/developブランチプッシュ
- **実行時間**: 約5-10分（全チェック）
- **コスト**: 完全無料（GitHub Actions無料枠内）

### 自動実行される品質チェック

1. **lint-and-format**: コード品質・フォーマット
2. **type-check**: TypeScript型安全性
3. **unit-tests**: ユニットテスト・カバレッジ
4. **build-check**: プロダクションビルド
5. **security-audit**: 脆弱性スキャン

---

## 基本原則

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

**開発前・開発中・PR前** の3段階で品質を確保

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

---

## CI/CDシステム詳細

### 1. lint-and-format

```yaml
実行内容: ESLint + Prettier
実行時間: ~2分
成功条件: 警告・エラー0件
失敗時対応: コードフォーマット修正が必要
```

### 2. type-check

```yaml
実行内容: TypeScript型チェック（フィルタリング済み）
実行時間: ~1分
成功条件: 重要な型エラー0件
注意事項: Vuetify既知問題は自動除外
```

### 3. unit-tests

```yaml
実行内容: Vitestによるユニットテスト実行
実行時間: ~3分
成功条件: 主要テストケース成功
出力: カバレッジレポート（アーティファクト保存）
```

### 4. build-check

```yaml
実行内容: 本番用ビルド実行
実行時間: ~2分
成功条件: ビルド完了・成果物生成
確認項目: dist/フォルダ内容
```

### 5. security-audit

```yaml
実行内容: npm audit（moderate以上の脆弱性）
実行時間: ~30秒
成功条件: 重要な脆弱性なし
対応: 定期的な依存関係更新
```

### 実行トリガーと条件

#### 自動実行されるタイミング

```yaml
# PRトリガー
pull_request:
  branches: [main, develop]
  paths-ignore: ['docs/**', '*.md']

# プッシュトリガー
push:
  branches: [main, develop]
  paths-ignore: ['docs/**', '*.md']
```

#### 実行されない条件

- ドキュメントのみの変更（`docs/**`, `*.md`）
- `.gitignore`のみの変更
- Draft PR状態（軽量チェックのみ）

---

## 開発フローベストプラクティス

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

---

## ローカルでの事前確認

### 全CIチェックをローカルで実行

```bash
# 全品質チェック（PR前に必ず実行）
npm run ci:all

# 個別チェック
npm run ci:lint          # ESLint（警告でエラー）
npm run ci:type-check    # TypeScript型チェック
npm run ci:test          # ユニットテスト（カバレッジ付き）
npm run ci:build         # 本番ビルド
npm run ci:security      # セキュリティ監査
```

### 開発時の品質チェック

```bash
# 基本的な開発フロー
npm run dev          # 開発サーバー起動
npm run lint         # リアルタイム品質チェック（自動修正あり）
npm run type-check   # 型チェック
npm run test:unit    # テスト実行
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

---

## エラー予防策

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

**Type Generation の詳細**: Type Generation に関する詳細な運用方法・トラブルシューティングは [TYPE_GENERATION.md](./TYPE_GENERATION.md) を参照してください。環境変数の取り扱いや CI ワークフロー、フォールバック戦略をまとめています。

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

### 4. CIエラー時の基本対応

```bash
# lint失敗時
npm run lint         # 自動修正実行
npm run format       # コードフォーマット

# type-check失敗時
npm run type-check   # 詳細エラー確認
# → TypeScriptエラー修正

# test失敗時
npm run test:unit    # テスト詳細実行
# → テストケース修正

# build失敗時
npm run ci:build     # ローカルビルド確認
# → ビルドエラー修正
```

---

## 品質指標とKPI

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

---

## トラブルシューティング

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

### よくある失敗パターンのクイックガイド

| エラー種別 | 初期対応 | 詳細ガイド |
|-----------|---------|-----------|
| **Type Generation関連** | 環境変数確認 → ローカル型生成 | [TYPE_GENERATION.md](./TYPE_GENERATION.md) |
| **npm install失敗** | `npm ci --prefer-offline` 実行 | [Troubleshooting Guide](CI_CD_TROUBLESHOOTING.md#依存関係エラー) |
| **TypeScriptエラー** | `npm run type-check` で詳細確認 | [Troubleshooting Guide](CI_CD_TROUBLESHOOTING.md#typescript型エラー) |
| **ESLint失敗** | `npm run lint` で自動修正 | [Troubleshooting Guide](CI_CD_TROUBLESHOOTING.md#eslintエラー修正) |
| **テスト失敗** | 個別テスト実行で原因特定 | [Troubleshooting Guide](CI_CD_TROUBLESHOOTING.md#ユニットテスト失敗) |
| **ビルド失敗** | `npm run ci:build` でローカル再現 | [Troubleshooting Guide](CI_CD_TROUBLESHOOTING.md#build失敗) |
| **セキュリティ監査失敗** | `npm audit fix` で自動修正 | [Troubleshooting Guide](CI_CD_TROUBLESHOOTING.md#脆弱性検出) |

**詳細なトラブルシューティング**: より詳細なエラー分析と対応手順は [CI/CD Troubleshooting Guide](CI_CD_TROUBLESHOOTING.md) を参照してください。

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

---

## パフォーマンス最適化

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

### 開発体験改善のための最適化

**開発時の高速フィードバック**:
- Hot reload対応（`npm run dev`）
- テスト監視モード（`npm run test:unit -- --watch`）
- 自動修正実行（`npm run lint --fix`）

**ビルド時間短縮**:
- 最適化済みビルド（`npm run ci:build`）

---

## セキュリティベストプラクティス

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

---

## CI結果の確認方法

### 1. GitHub PR画面

- **Checks**タブで全CI結果確認
- ❌失敗項目のクリックで詳細ログ表示
- ✅成功時は緑色チェックマーク

### 2. 自動コメント機能

```markdown
## 🤖 CI Pipeline Results

✅ **Lint & Format**: success
✅ **TypeScript Check**: success
✅ **Unit Tests**: success
✅ **Build Check**: success
✅ **Security Audit**: success

🎉 All checks passed! Ready to merge.
```

### 3. Actions実行履歴

- `Actions`タブで過去の実行履歴確認
- 失敗パターンの分析・改善

---

## コスト管理

### GitHub Actions無料枠

```yaml
月間制限: 2,000分（パブリックリポジトリは無制限）
現在使用量: 約1,440分/月（24時間）
余裕度: 28%（560分の余裕）
コスト: 0円
```

### 使用量内訳

| 実行タイプ | 実行時間 | 月間回数 | 総時間     |
| ---------- | -------- | -------- | ---------- |
| PR作成時   | 8分      | 50回     | 6.7時間    |
| Push時     | 5分      | 100回    | 8.3時間    |
| E2Eテスト  | 15分     | 10回     | 2.5時間    |
| その他     | 各種     | -        | 6.5時間    |
| **合計**   | -        | -        | **24時間** |

---

## カスタマイズと設定

### CI設定ファイル場所

```
.github/workflows/ci.yml     # メインCI設定
scripts/ci-type-check.sh     # TypeScript型チェックスクリプト
package.json                 # CI専用npmスクリプト
```

### 設定のカスタマイズ

```yaml
# タイムアウト調整
timeout-minutes: 10

# 実行条件カスタマイズ
if: github.event.pull_request.draft != true

# 並行実行数調整
strategy:
  matrix:
    node-version: [20]
```

### 新しいチェック追加方法

1. `package.json`にCI専用スクリプト追加
2. `.github/workflows/ci.yml`にジョブ追加
3. 必要に応じて個別スクリプトファイル作成

---

## 継続的改善

### 定期レビュー項目

```bash
# 月次確認事項
- [ ] CI/CD実行時間トレンド分析
- [ ] 失敗パターン分析と改善策検討
- [ ] 依存関係アップデート計画
- [ ] セキュリティ脆弱性スキャン
- [ ] 使用量確認とコスト監視

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

### 今後の拡張予定

- E2Eテストの本格導入
- デプロイ自動化（CD拡張）
- パフォーマンス監視統合
- 通知システム強化

---

## 学習リソース

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

## 関連ドキュメント

### CI/CD関連
- **アーキテクチャ**: [CI/CD Overview](CI_CD_OVERVIEW.md) - システム全体像・技術スタック
- **設定変更**: [CI/CD Configuration](CI_CD_CONFIGURATION.md) - ワークフロー設定変更手順
- **詳細トラブルシューティング**: [CI/CD Troubleshooting](CI_CD_TROUBLESHOOTING.md) - エラー対応詳細
- **クイックリファレンス**: [CI/CD Quick Reference](./CI_CD_QUICK_REFERENCE.md) - コマンド集・チェックリスト
- **型定義生成**: [Type Generation](./TYPE_GENERATION.md) - 型定義自動生成システム詳細

### 開発関連
- **開発ワークフロー**: [Development Workflow](../DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) - CI統合後の開発手順
- **開発コマンド一覧**: [Development Commands](../DEVELOPMENT/DEVELOPMENT_COMMANDS.md) - npm scriptコマンド詳細
- **ベストプラクティス**: [Best Practices](../DEVELOPMENT/BEST_PRACTICES.md) - コード品質基準

### テスト関連
- **テスト戦略**: [tests/README.md](../../tests/README.md) - ユニットテスト・E2Eテスト
- **CI/CDテスト**: [CI/CD Testing](../../.github/workflows/TESTING.md) - CI/CDでのテスト実行詳細

---

## 📝 更新履歴

- 2025-11-29: CI_CD_GUIDE.md と CI_CD_BEST_PRACTICES.md を統合（ドキュメント整理）
- 2025-08-25: CI/CDベストプラクティス作成（Issue #155対応）
- 2025-08-25: Type Generation Workflow追加（詳しくは `TYPE_GENERATION.md`）
- 2025-08-25: CI/CD安定性向上・rate limiting対策（Issue #155対応）
- 2025-08-19: TypeScript型エラーフィルタリング機能追加
- 2025-08-19: CI/CDシステム初版作成（Issue #55対応）
