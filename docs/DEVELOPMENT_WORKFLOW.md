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
# 必須チェック項目
npm run type-check    # TypeScript型チェック
npm run lint          # ESLintチェック
npm run test:unit     # ユニットテスト（該当時）
npm run build         # ビルド確認
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
- [x] 型チェック (`npm run type-check`) をパス
- [x] リンティング (`npm run lint`) をパス
- [x] ビルド (`npm run build`) 成功
- [x] 基本動作確認
- [ ] 追加のテスト項目

## Closes
Closes #XX

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### 4. レビューと承認
- 最低1名の承認が必要
- CI/CDチェックがすべて通過
- Conflictsが解決済み

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

### 必須チェック項目
1. **型安全性**: TypeScriptエラーゼロ
2. **コード品質**: ESLintルール準拠
3. **テストカバレッジ**: 新機能には適切なテスト
4. **ドキュメント**: 重要な変更はドキュメント更新

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

- [開発コマンド一覧](DEVELOPMENT_COMMANDS.md)
- [コーディング規則](CODING_STANDARDS.md)
- [Issue ラベル体系](ISSUE_LABELS.md)
- [環境設定](ENVIRONMENT_SETUP.md)

---

**📝 更新履歴**
- 2025-08-17: 初版作成
- 2025-08-17: PR作成ルールとコミットメッセージ規則追加