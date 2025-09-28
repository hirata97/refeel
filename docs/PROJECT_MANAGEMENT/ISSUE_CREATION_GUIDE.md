# Issue作成ガイド

## 📝 Issue作成の基本ルール

### 1. Issue作成コマンド

```bash
# 自動Issue作成（推奨）
gh issue create --title "タイトル" --body "説明" --label "priority:P2,size:S,type-basic:feature"

# テンプレート使用
gh issue create --template feature_request
gh issue create --template bug_report
```

## 📋 Issueタイトル・説明規則

### タイトル形式

```
1. 通常のチケット: 簡潔で具体的な説明

何が課題か一目でわかるようにする
例:
✅ ユーザー登録時のメール認証機能
✅ ログイン画面でパスワード保存が機能しない
❌ バグあり

2. 親チケットの場合: [親チケット] 簡潔で具体的な説明

例:
✅ [親チケット] README.mdドキュメント整備・拡充
✅ [親チケット] ユーザー認証システム刷新
```

## 🏷️ ラベル体系（必須設定）

### Priority（優先度）- 必須

- `priority:P0` 🔴 - 最高優先度（緊急・重要）
- `priority:P1` 🟡 - 高優先度（重要）
- `priority:P2` 🔵 - 中優先度（通常・デフォルト）

### Size（作業量）- 必須

- `size:S` 🔴 - 小規模（1-2日）
- `size:M` 🟡 - 中規模（3-5日）
- `size:L` 🔵 - 大規模（1週間以上）

### Type（種別）- 必須

**基本的な作業（type-basic:）**

- `type-basic:bugfix` - バグ修正
- `type-basic:enhancement` - 既存機能改善
- `type-basic:feature` - 新機能追加
- `type-basic:refactor` - リファクタリング

**インフラ・技術（type-infra:）**

- `type-infra:automation` - 自動化・スクリプト
- `type-infra:ci-cd` - CI/CD・パイプライン
- `type-infra:performance` - パフォーマンス改善
- `type-infra:security` - セキュリティ

**品質・ドキュメント（type-quality:）**

- `type-quality:docs` - ドキュメント
- `type-quality:test` - テスト関連

### Component（該当コンポーネント）- 推奨

- `component:auth` - 認証関連
- `component:ui` - UI/UXコンポーネント
- `component:api` - API関連
- `component:database` - DB関連
- `component:security` - セキュリティ
- `component:documentation` - ドキュメント関連
- `component:testing` - テスト関連

## 👨‍👩‍👧‍👦 親チケット・子チケット管理

### 親チケットの作成方針

- **大きな機能・改善の全体管理**: 複数の作業に分割される場合
- **子チケット統合・調整**: 各子チケットの進捗を統合
- **実装順序の管理**: 子チケット間の依存関係・推奨順序を明記

### 子チケットの作成方針

- **具体的な実装タスク**: 1-2日で完了可能な作業単位
- **親チケット関連付け**: 本文に`親チケット: #XXX`を必ず記載
- **独立した価値提供**: 単体で意味のある成果物を作成

### 作業優先度

1. **子チケットを優先的に実装** - 具体的な成果を早期に提供
2. **親チケットは統合・調整で使用** - 全体の進捗管理・品質保証

### 命名規則例

```
親チケット: [親チケット] README.mdドキュメント整備・拡充
子チケット: src/ディレクトリREADME.md作成
子チケット: tests/ディレクトリREADME.md作成

親チケット: [親チケット] ユーザー認証システム強化
子チケット: パスワード強度チェック機能追加
子チケット: 二段階認証システム実装
```

### ラベル設定指針

- **親チケット**: `size:L` または `size:M`（全体の作業量）
- **子チケット**: `size:S` または `size:M`（個別の作業量）
- **優先度**: 子チケットで重要度に応じて`P0`-`P2`を設定

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
# 通常のIssue
gh issue create --title "新機能名" \
  --body "$(cat issue_template.md)" \
  --label "priority:P2,size:S,type-basic:feature"

# 親チケット
gh issue create --title "[親チケット] 大規模機能の全体管理" \
  --body "$(cat parent_issue_template.md)" \
  --label "priority:P2,size:L,type-basic:feature"
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
gh issue list --label "priority:P1"
gh issue list --label "type-basic:bugfix"

# 担当者でフィルタ
gh issue list --assignee "@me"

# 状態でフィルタ
gh issue list --state open
gh issue list --state closed
```

## 📊 Issue分析・レポート

### 定期レビュー項目

- 未対応Issue数
- 優先度別分布（P0/P1/P2）
- 作業量別分布（S/M/L）
- タイプ別分布（basic/infra/quality）
- コンポーネント別Issue数

### メトリクス確認

```bash
# Issue統計確認
gh issue list --json number,title,labels,createdAt,closedAt

# 優先度別フィルタ
gh issue list --label "priority:P0"  # 最高優先度
gh issue list --label "priority:P1"  # 高優先度

# タイプ別フィルタ
gh issue list --label "type-basic:feature"    # 新機能
gh issue list --label "type-quality:docs"     # ドキュメント
gh issue list --label "type-infra:security"   # セキュリティ
```

---

## 📚 関連ドキュメント

- **[開発ワークフロー](../DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)** - ブランチ戦略・PR作成手順
- **[開発コマンド](../DEVELOPMENT/DEVELOPMENT_COMMANDS.md)** - npm scripts・自動化コマンド
- **[プロジェクト管理指針](../../CLAUDE.md)** - Claude Code開発・親子チケット管理

## 🔄 更新履歴

| 日付       | 更新内容                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| 2025-09-28 | ラベル体系を実際の運用に合わせて更新・親子チケット管理セクション追加・ドキュメント管理ガイドをDOCUMENTATION_GUIDE.mdに分離 |
| 2024-XX-XX | 初版作成                                                                                                                   |
