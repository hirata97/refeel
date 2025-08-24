# Issue作成ガイド

## 📝 Issue作成の基本ルール

### 1. Issue作成コマンド

```bash
# 自動Issue作成（推奨）
gh issue create --title "タイトル" --body "説明" --label "priority:medium,size:small,type:feature"

# テンプレート使用
gh issue create --template feature_request
gh issue create --template bug_report
```

## 📋 Issueタイトル・説明規則

### タイトル形式
```
[type] 簡潔で具体的な説明

例:
[Feature] ユーザー登録時のメール認証機能
[Bug] ログイン画面でTypeScriptエラーが発生
[Enhancement] ダッシュボードのパフォーマンス改善
[Refactor] API呼び出し処理の共通化
```

### Type一覧
- `Feature`: 新機能
- `Bug`: バグ報告
- `Enhancement`: 既存機能の改善
- `Refactor`: リファクタリング
- `Documentation`: ドキュメント関連
- `Testing`: テスト関連
- `Chore`: 設定・依存関係・環境関連

## 🏷️ ラベル体系（必須設定）

### Priority（優先度）- 必須
- `priority:critical` - 緊急対応必要
- `priority:high` - 高優先度
- `priority:medium` - 中優先度（デフォルト）
- `priority:low` - 低優先度

### Size（作業量）- 必須
- `size:xs` - 1時間未満
- `size:small` - 1-4時間
- `size:medium` - 1-2日
- `size:large` - 3-5日
- `size:xl` - 1週間以上

### Type（種別）- 必須
- `type:feature` - 新機能
- `type:bug` - バグ修正
- `type:enhancement` - 改善
- `type:refactor` - リファクタリング
- `type:docs` - ドキュメント
- `type:test` - テスト

### Component（該当コンポーネント）- 推奨
- `component:auth` - 認証関連
- `component:ui` - UI/UXコンポーネント
- `component:api` - API関連
- `component:database` - DB関連
- `component:security` - セキュリティ

## 📝 Issue説明テンプレート

### 機能要求（Feature Request）
```markdown
## 📝 機能概要
簡潔に機能の概要を説明

## 🎯 目的・背景
なぜこの機能が必要なのか

## ✅ 受け入れ条件
- [ ] 条件1
- [ ] 条件2
- [ ] 条件3

## 🎨 UI/UX要件（該当時）
- デザインモックアップ
- ユーザビリティ要件

## 🔧 技術的要件
- 使用技術・ライブラリ
- パフォーマンス要件
- セキュリティ考慮事項

## 🧪 テスト要件
- [ ] ユニットテスト
- [ ] E2Eテスト
- [ ] セキュリティテスト

## 📚 参考資料
- 関連Issue
- 外部ドキュメント
- 技術記事等
```

### バグ報告（Bug Report）
```markdown
## 🐛 バグ概要
バグの内容を簡潔に説明

## 🔄 再現手順
1. 
2. 
3. 

## 🎯 期待される動作
正常に動作した場合の挙動

## ❌ 実際の動作
実際に発生している問題

## 🖥️ 環境情報
- ブラウザ: Chrome 120.0
- OS: Windows 11
- Node.js: v18.17.0
- npm: v9.8.1

## 📸 スクリーンショット・ログ
(エラースクリーンショット、コンソールログ等)

## 🔧 調査情報
- エラーメッセージ
- スタックトレース
- 関連するコード箇所

## 🚨 影響度
- [ ] 機能停止
- [ ] パフォーマンス低下
- [ ] UI表示問題
- [ ] データ不整合
```

## 🚀 Issue管理フロー

### 1. Issue作成
```bash
gh issue create --title "[Feature] 新機能名" \
  --body "$(cat issue_template.md)" \
  --label "priority:medium,size:small,type:feature"
```

### 2. 作業開始
```bash
# Issue番号で作業開始
npm run start-issue [issue番号]

# 詳細取得
npm run fetch-issue [issue番号]
```

### 3. 進捗更新
- In Progress: 作業開始時
- Review Ready: PR作成時
- Done: マージ完了時

## 🔍 Issue検索・フィルタリング

```bash
# 特定ラベルでフィルタ
gh issue list --label "priority:high"
gh issue list --label "type:bug"

# 担当者でフィルタ
gh issue list --assignee "@me"

# 状態でフィルタ
gh issue list --state open
gh issue list --state closed
```

## 📊 Issue分析・レポート

### 定期レビュー項目
- 未対応Issue数
- 優先度別分布
- 作業量別分布
- コンポーネント別Issue数

### メトリクス確認
```bash
# Issue統計確認
gh issue list --json number,title,labels,createdAt,closedAt
```

---

**関連ドキュメント:**
- [Issue ラベル体系](ISSUE_LABELS.md)
- [開発ワークフロー](DEVELOPMENT_WORKFLOW.md)
- [プロジェクト管理](PROJECT_MANAGEMENT.md)