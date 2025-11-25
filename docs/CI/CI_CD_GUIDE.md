# CI/CDパイプライン運用ガイド

> **ドキュメント体系**:
> - 📘 **このドキュメント**: CI/CD日常運用ガイド（開発者向け）
> - 🏗️ **アーキテクチャ詳細**: [CI/CD Overview](../INFRASTRUCTURE/CI_CD_OVERVIEW.md)
> - 🔧 **設定変更手順**: [CI/CD Configuration](../INFRASTRUCTURE/CI_CD_CONFIGURATION.md)
> - 🚨 **詳細トラブルシューティング**: [CI/CD Troubleshooting](../INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md)
> - ⚡ **クイックリファレンス**: [CI/CD Quick Reference](./CI_CD_QUICK_REFERENCE.md)

このドキュメントでは、GoalCategorizationDiaryプロジェクトのCI/CD（継続的インテグレーション/継続的デリバリー）システムの **日常的な運用** について説明します。

## 📋 概要

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

## 🚀 CI/CD機能詳細

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

## 📊 実行トリガーと条件

### 自動実行されるタイミング

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

### 実行されない条件

- ドキュメントのみの変更（`docs/**`, `*.md`）
- `.gitignore`のみの変更
- Draft PR状態（軽量チェックのみ）

## 🔧 開発者向けCI操作

### ローカルでの事前確認

```bash
# 全CIチェックをローカルで実行
npm run ci:lint      # ESLint（警告ゼロモード）
npm run ci:type-check # TypeScript（フィルタリング済み）
npm run ci:build     # 本番ビルド
npm run ci:security  # セキュリティ監査
npm run ci:test      # カバレッジ付きテスト
```

### 開発時の品質チェック

```bash
# 基本的な開発フロー
npm run dev          # 開発サーバー起動
npm run lint         # リアルタイム品質チェック
npm run type-check   # 型チェック
npm run test:unit    # テスト実行
```

### CIエラー時の対応

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

## 📈 CI結果の確認方法

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

## 💰 コスト管理

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

## 🛠️ カスタマイズと設定

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

## 🔍 トラブルシューティング

### 基本的なエラー対応

CI/CDで問題が発生した場合は、以下の手順で対応してください：

1. **エラー内容の確認**: GitHub ActionsのログでエラーメッセージConfirm
2. **ローカル再現**: 該当するコマンドをローカルで実行
3. **修正実装**: エラー内容に基づいて修正
4. **再検証**: `npm run ci:all` で全チェック再実行

### よくある失敗パターンのクイックガイド

| エラー種別 | 初期対応 | 詳細ガイド |
|-----------|---------|-----------|
| **Type Generation関連** | 環境変数確認 → ローカル型生成 | [TYPE_GENERATION.md](./TYPE_GENERATION.md) |
| **npm install失敗** | `npm ci --prefer-offline` 実行 | [Troubleshooting Guide](../INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md#依存関係エラー) |
| **TypeScriptエラー** | `npm run type-check` で詳細確認 | [Troubleshooting Guide](../INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md#typescript型エラー) |
| **ESLint失敗** | `npm run lint` で自動修正 | [Troubleshooting Guide](../INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md#eslintエラー修正) |
| **テスト失敗** | 個別テスト実行で原因特定 | [Troubleshooting Guide](../INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md#ユニットテスト失敗) |
| **ビルド失敗** | `npm run ci:build` でローカル再現 | [Troubleshooting Guide](../INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md#build失敗) |
| **セキュリティ監査失敗** | `npm audit fix` で自動修正 | [Troubleshooting Guide](../INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md#脆弱性検出) |

**詳細なトラブルシューティング**: より詳細なエラー分析と対応手順は [CI/CD Troubleshooting Guide](../INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md) を参照してください。

## 📚 関連ドキュメント

- [開発ワークフロー](../DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) - CI統合後の開発手順
- [開発コマンド一覧](../DEVELOPMENT/DEVELOPMENT_COMMANDS.md) - npm scriptコマンド詳細
- [コーディング規則](../DEVELOPMENT/CODING_STANDARDS.md) - コード品質基準

## 🔄 継続的改善

### 定期メンテナンス項目

- [ ] 月次：使用量確認とコスト監視
- [ ] 四半期：依存関係脆弱性スキャン
- [ ] 半期：CI設定最適化レビュー
- [ ] 年次：新しいCI/CDツール評価

### 今後の拡張予定

- E2Eテストの本格導入
- デプロイ自動化（CD拡張）
- パフォーマンス監視統合
- 通知システム強化

---

## ⚡ 新機能・改善

Type Generation に関する新機能や改善点は `TYPE_GENERATION.md` を参照してください。CI 側の安定性向上や retry ロジック、インストール高速化オプションなどの技術的詳細は該当ドキュメントに移動しています。

**📝 更新履歴（抜粋）**

- 2025-08-19: CI/CDシステム初版作成（Issue #55対応）
- 2025-08-19: TypeScript型エラーフィルタリング機能追加
- 2025-08-25: Type Generation Workflow追加（詳しくは `TYPE_GENERATION.md`）
- 2025-08-25: CI/CD安定性向上・rate limiting対策（Issue #155対応）
