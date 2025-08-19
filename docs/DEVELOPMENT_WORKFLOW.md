# 開発ワークフロー

このドキュメントは、GoalCategorizationDiaryプロジェクトでの開発作業ルールとワークフローを定義します。

## 📋 基本方針

### ブランチ戦略
- **mainブランチ**: プロダクション準備完了のコード
- **featureブランチ**: Issue単位での機能開発
- **1 Issue = 1 Branch = 1 PR** の原則

### PR（プルリクエスト）ルール
- **ターゲットブランチ**: 必ずmainブランチ
- **マージ方式**: Squash and merge推奨
- **レビュー**: 必須（最低1名の承認）

## 🚀 作業開始手順

### 1. 最新状態への同期
```bash
# mainブランチに切り替え
git checkout main

# 最新の変更を取得
git pull origin main
```

### 2. Issue確認と作業開始
```bash
# Issue情報を取得（自動化スクリプト使用）
npm run fetch-issue [Issue番号]

# 作業開始（ブランチ作成とラベル更新）
npm run start-issue [Issue番号]
```

### 3. 手動でのブランチ作成（必要時）
```bash
# featureブランチ作成（命名規則に従う）
git checkout -b feature/issue-[番号]-[簡潔な説明]

# 例：
git checkout -b feature/issue-76-data-caching-optimization
git checkout -b feature/issue-85-user-dashboard-ui
git checkout -b fix/issue-92-login-error-handling
```

## 🛠️ 開発作業フロー

### 1. コード実装
```bash
# 開発環境起動
npm run dev

# 型チェック（随時実行）
npm run type-check

# リンティング（随時実行）
npm run lint
```

### 2. コミット前チェックリスト
```bash
# ローカルでのCI品質チェック（推奨）
npm run ci:lint       # 厳格リンティング（警告ゼロ）
npm run ci:type-check # TypeScript型チェック（フィルタリング済み）
npm run ci:test       # カバレッジ付きテスト
npm run ci:build      # プロダクションビルド
npm run ci:security   # セキュリティ監査

# または基本チェック
npm run type-check    # TypeScript型チェック
npm run lint          # ESLintチェック（自動修正）
npm run test:unit     # ユニットテスト（該当時）
```

### 3. コミット作成
```bash
# 変更をステージング
git add [ファイル名]

# コミット（メッセージ規則に従う）
git commit -m "feat: Issue #76 データキャッシング機能実装

- 新しいPiniaストアでデータ管理統合
- 5分TTLのクライアントサイドキャッシュ
- パフォーマンス監視ツール追加

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 📝 コミットメッセージ規則

### 基本フォーマット
```
<type>: Issue #<番号> <簡潔な説明>

<詳細説明（改行区切り）>
- 変更点1
- 変更点2
- 変更点3

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Type一覧
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードフォーマット
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: 設定ファイル変更など

### 例
```bash
# 新機能
git commit -m "feat: Issue #85 ダッシュボードUI実装"

# バグ修正
git commit -m "fix: Issue #92 ログインエラーハンドリング修正"

# ドキュメント
git commit -m "docs: Issue #88 API仕様書更新"
```

## 🤖 自動CI/CDチェック

### PR作成時の自動実行
PR作成・更新時に以下のCI/CDパイプラインが自動実行されます：

```yaml
1. lint-and-format  # コード品質・フォーマット
2. type-check       # TypeScript型安全性
3. unit-tests       # ユニットテスト・カバレッジ
4. build-check      # プロダクションビルド
5. security-audit   # 脆弱性スキャン
```

### CI結果の確認方法
- **PRページの「Checks」タブ**: 全CI結果の詳細確認
- **自動コメント**: PR内に結果サマリーが自動投稿
- **Actions履歴**: リポジトリの「Actions」タブで実行履歴確認

### CI失敗時の対応
```bash
# ローカルで同じチェックを実行
npm run ci:lint      # lint失敗時
npm run ci:type-check # type-check失敗時
npm run ci:test      # テスト失敗時
npm run ci:build     # ビルド失敗時
npm run ci:security  # セキュリティ失敗時

# 修正後にプッシュすると自動で再実行
git push origin [ブランチ名]
```

## 🔄 PR作成とマージ

### 1. ブランチをプッシュ
```bash
# リモートにプッシュ
git push -u origin feature/issue-[番号]-[説明]
```

### 2. PR作成
```bash
# 自動化スクリプト使用（推奨）
npm run create-pr "タイトル" "説明"

# または手動でGitHub UIから作成
```

### 3. PRテンプレート（必須項目）
```markdown
## Summary
- Issue #XX の実装内容説明
- 主要な変更点の概要

## Changes
### 🔄 機能追加
- 具体的な変更点1
- 具体的な変更点2

### 🛠️ 技術的変更
- ファイル構造の変更
- 新しい依存関係

## Test plan
### ✅ CI/CD自動チェック
- [x] lint-and-format: コード品質・フォーマット
- [x] type-check: TypeScript型安全性
- [x] unit-tests: ユニットテスト・カバレッジ
- [x] build-check: プロダクションビルド
- [x] security-audit: 脆弱性スキャン

### 🧪 手動テスト
- [x] 基本動作確認
- [x] UI/UX確認
- [ ] エッジケーステスト
- [ ] レスポンシブ確認

## Closes
Closes #XX

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### 4. レビューと承認
- **必須条件**：
  - 最低1名の承認が必要
  - **CI/CDパイプライン全5項目が通過**
  - Conflictsが解決済み
- **推奨事項**：
  - コードレビューでの指摘事項対応
  - ドキュメント更新確認
  - セキュリティ観点でのチェック

### 5. マージ実行
- **Squash and merge**を使用
- マージ後、featureブランチは自動削除

## 🔧 トラブルシューティング

### Conflicts発生時
```bash
# mainブランチの最新を取得
git fetch origin main

# 現在のブランチにマージ
git merge origin/main

# Conflictsを手動解決後
git add [解決したファイル]
git commit -m "resolve merge conflicts with main"

# プッシュ
git push origin [ブランチ名]
```

### ブランチ切り替え時の注意
```bash
# 未コミットの変更がある場合
git stash  # 一時保存

# ブランチ切り替え
git checkout main

# 変更を復元（必要時）
git stash pop
```

## 📊 品質管理

### CI/CD自動化品質チェック
1. **コード品質**: ESLint厳格モード（警告ゼロ）
2. **型安全性**: TypeScript型チェック（Vuetify既知問題除外）
3. **テストカバレッジ**: ユニットテスト実行・カバレッジ測定
4. **ビルド検証**: プロダクションビルド成功確認
5. **セキュリティ**: npm audit（moderate以上の脆弱性チェック）

### 手動チェック項目
1. **機能動作**: 実装した機能の正常動作確認
2. **UX/UI**: ユーザー体験・インターフェース確認
3. **ドキュメント**: 重要な変更はドキュメント更新
4. **セキュリティ**: 認証・認可・入力値検証

### 推奨項目
1. **パフォーマンス**: 重い処理には最適化検討
2. **アクセシビリティ**: UIコンポーネントのa11y対応
3. **セキュリティ**: 認証・認可の適切な実装
4. **UX**: ユーザー体験の向上

## 🔄 継続的改善

### 定期レビュー項目
- ワークフローの効率性
- 自動化スクリプトの改善
- ドキュメントの更新
- チーム内での知識共有

### フィードバック収集
- 開発体験の改善点
- 新しいツール・手法の導入検討
- プロセスの最適化提案

---

## 📚 関連ドキュメント

- [CI/CDパイプライン運用ガイド](CI_CD_GUIDE.md) - 自動品質チェック詳細
- [開発コマンド一覧](DEVELOPMENT_COMMANDS.md)
- [コーディング規則](CODING_STANDARDS.md)
- [Issue ラベル体系](ISSUE_LABELS.md)
- [環境設定](ENVIRONMENT_SETUP.md)

---

**📝 更新履歴**
- 2025-08-17: 初版作成
- 2025-08-17: PR作成ルールとコミットメッセージ規則追加
- 2025-08-19: CI/CD統合後のワークフロー更新（Issue #55対応）