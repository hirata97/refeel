# PR作成ガイド

## 📝 PR作成の基本ルール

### 1. 事前チェック（必須）

```bash
# CI/CDチェック実行（全て通過必須）
npm run ci:lint      # ESLint厳格チェック
npm run ci:type-check # TypeScript型検証
npm run ci:test      # テスト実行 + カバレッジ
npm run ci:build     # プロダクションビルド確認

# 依存関係確認
npm outdated         # パッケージ更新確認
```

### 2. PR作成コマンド

```bash
# 自動PR作成（推奨）
npm run create-pr "タイトル" "説明"

# 手動作成の場合
gh pr create --title "タイトル" --body "説明"
```

## 📋 PRタイトル・説明規則

### タイトル形式
```
[type] #issue番号: 簡潔な説明

例:
feat #123: ユーザー登録機能の実装
fix #456: ログイン時の型エラー修正
refactor #789: API呼び出し処理の共通化
```

### Type一覧
- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `docs`: ドキュメント更新
- `test`: テスト追加・修正
- `chore`: 設定・依存関係更新

### 説明テンプレート
```markdown
## 📝 変更概要
- 

## 🔗 関連Issue
Closes #[issue番号]

## ✅ 変更内容
- [ ] 機能実装
- [ ] テスト追加
- [ ] ドキュメント更新

## 🧪 テスト方法
1. 
2. 
3. 

## 📸 スクリーンショット（UI変更時）
(必要に応じて)

## ⚠️ 注意点
(破壊的変更、設定変更等があれば記載)
```

## 🔍 レビュー準備チェックリスト

### コード品質
- [ ] CI/CD全項目通過（lint/type/test/build）
- [ ] 新機能にテスト追加済み
- [ ] 型安全性確保（any型未使用）
- [ ] エラーハンドリング実装済み

### セキュリティ
- [ ] 入力値検証・サニタイゼーション実装
- [ ] 認証・認可処理適切
- [ ] 機密情報のハードコーディング無し

### ドキュメント
- [ ] 必要に応じてREADME・docs更新
- [ ] コードコメント適切
- [ ] APIドキュメント更新（該当時）

## 🚀 マージ後の自動処理

- GitHub Actionsによる自動デプロイ
- 依存関係脆弱性チェック
- コードカバレッジレポート更新

## 🛠️ トラブルシューティング

### CI/CDエラー時
```bash
# ローカルで同じチェック実行
npm run ci:lint      # リンティングエラー確認
npm run ci:type-check # 型エラー詳細確認
npm run ci:test      # 失敗テスト確認
```

### マージ競合時
```bash
git checkout main
git pull origin main
git checkout feature/your-branch
git rebase main
# 競合解決後
git rebase --continue
```

---

**関連ドキュメント:**
- [開発ワークフロー](DEVELOPMENT_WORKFLOW.md)
- [PRテスト・検証ガイド](PR_TESTING_GUIDE.md)
- [CI/CDガイド](CI_CD_GUIDE.md)