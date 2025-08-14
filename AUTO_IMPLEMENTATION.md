# 自動Issue実装システム

このプロジェクトでは、GitHubのIssueを自動的に実装してPRを作成するシステムを構築しています。

## 🚀 使用可能なコマンド

### 基本的な自動化コマンド

```bash
# 単一Issue自動実装（最も推奨）
npm run auto-issue [issue番号]
# 引数なしの場合は最新のオープンIssueを自動選択

# 例: Issue #16を自動実装
npm run auto-issue 16

# 最新のオープンIssueを自動実装
npm run auto-issue
```

### 高度な自動化コマンド

```bash
# Claude Code APIを使用した完全自動実装
npm run auto-implement [issue番号]

# 全オープンIssueを連続自動実装
npm run auto-cycle
```

### 従来の半自動コマンド

```bash
# Issue詳細取得のみ
npm run fetch-issue [issue番号]

# Issue作業開始（ブランチ作成+アサイン）
npm run start-issue [issue番号]

# PR作成のみ
npm run create-pr "タイトル" "説明"
```

## 🔄 自動実装フロー

### `npm run auto-issue` の実行フロー

1. **Issue選択**
   - 引数でIssue番号を指定 または 最新のオープンIssueを自動選択

2. **Issue詳細取得**
   - GitHub CLIでIssue詳細を取得
   - `tasks/issue-[番号]-tasks.md` ファイルを自動生成

3. **実装準備**
   - Claude Code用プロンプトを抽出
   - 実装対象の内容を表示

4. **自動実装実行**
   - Claude Codeを呼び出して実装
   - コード生成とファイル変更

5. **品質チェック**
   - `npm run lint` - リンティング実行
   - `npm run build` - ビルドテスト実行

6. **PR自動作成**
   - コミット & プッシュ
   - GitHub PRを自動作成
   - Issue番号でのクローズ設定

## 📋 実行例

```bash
$ npm run auto-issue

🚀 自動Issue実装を開始します...
📋 最新のオープンIssueを取得中...
✅ Issue #16 を自動選択しました
📥 Issue #16 の詳細を取得中...
🔨 Issue #16 の自動実装を開始...
📝 実装対象: 認証チェックのミドルウェア化
🤖 Claude Codeでの自動実装を実行中...
✅ 実装が完了しました
🔍 コード品質チェック中...
📤 プルリクエストを作成中...
🎉 Issue #16 の自動実装が完了しました！

📊 実行結果:
   - Issue: #16 (認証チェックのミドルウェア化)
   - タスクファイル: tasks/issue-16-tasks.md
   - PR作成: 完了
```

## 🔧 システム要件

### 必須ツール
- **Node.js** (v18+)
- **GitHub CLI** (`gh` コマンド)
- **Claude Code CLI** (`claude` コマンド)

### セットアップ確認
```bash
# 必要ツールの確認
gh --version          # GitHub CLI
claude --version      # Claude Code CLI
node --version        # Node.js
```

## ⚙️ 設定

### GitHub CLI認証
```bash
gh auth login
```

### Claude Code設定
```bash
claude auth login
```

## 🎯 使用シーン

### シーン1: 日常的な開発フロー
```bash
# 毎朝の作業開始時
npm run auto-issue
```

### シーン2: 複数Issueの一括処理
```bash
# 週末やメンテナンス時
npm run auto-cycle
```

### シーン3: 特定Issueの緊急対応
```bash
# 優先度の高いIssue #25を即座に実装
npm run auto-issue 25
```

## 📊 出力ファイル

### 生成されるファイル
- `tasks/issue-[番号]-tasks.md` - Issue分析とタスク管理
- `auto-cycle-errors.log` - 連続実装時のエラーログ

### PR情報
- **タイトル**: `feat: Issue #[番号] [タイトル]`
- **本文**: 自動実装の詳細と実行内容
- **リンク**: 自動的にIssueをクローズ

## 🚨 注意事項

1. **Claude Code CLI**が正しくセットアップされている必要があります
2. 実装結果は必ず**コードレビュー**を実施してください
3. **テスト実行**を忘れずに行ってください
4. 大量のIssue処理時はGitHub API制限にご注意ください

## 🔮 今後の拡張予定

- [ ] GitHub Actionsとの統合
- [ ] 自動テスト実行
- [ ] 実装品質の自動評価
- [ ] Slack/Discord通知機能
- [ ] 実装履歴の統計機能

---

🤖 **Powered by Claude Code** - 効率的な開発フローの実現