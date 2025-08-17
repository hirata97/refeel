# Scripts Documentation

このディレクトリには、GitHub IssueからPR作成までを自動化するスクリプトが含まれています。

## 利用可能なスクリプト

### 1. fetch-issue.sh
GitHub Issueの詳細を取得してタスクファイルを生成します。

**使用方法:**
```bash
# Issue一覧表示
./scripts/fetch-issue.sh

# 特定のIssue詳細取得
./scripts/fetch-issue.sh [issue番号]

# npm経由での実行
npm run fetch-issue [issue番号]
```

**機能:**
- GitHub CLI (gh)を使用してIssue情報を取得
- Issue詳細の表示（タイトル、ラベル、本文）
- タスク管理ファイル (`tasks/issue-[番号]-tasks.md`) の生成
- Claude Code用プロンプトの自動生成
- 推奨ブランチ名の提案

**生成されるファイル:**
- `tasks/issue-[番号]-tasks.md` - Issue詳細とタスクチェックリスト

### 2. start-issue.sh
Issueの作業開始に必要な環境を自動で準備します。

**使用方法:**
```bash
./scripts/start-issue.sh [issue番号]

# npm経由での実行
npm run start-issue [issue番号]
```

**機能:**
- developブランチから専用フィーチャーブランチを作成
- ブランチ名の自動生成 (`issue/[番号]-[タイトル]`)
- タスクファイルの生成 (fetch-issue.shを内部で実行)
- 自分をIssueにアサイン
- Claude Code用プロンプトをクリップボードにコピー (WSL環境)

**自動処理される内容:**
1. developブランチに切り替え・最新取得
2. 新しいフィーチャーブランチ作成
3. Issue詳細とタスクファイル生成
4. GitHub上でのアサイン設定

### 3. create-pr.sh
作業完了後のPR作成を自動化します。

**使用方法:**
```bash
./scripts/create-pr.sh "PRタイトル" ["PR説明"]

# npm経由での実行
npm run create-pr "PRタイトル" ["PR説明"]
```

**機能:**
- 変更の自動ステージング・コミット
- Claude Code署名付きコミットメッセージ
- リモートへのプッシュ
- developブランチに向けたPR自動作成
- PR本文の自動生成（変更履歴、テストチェックリスト含む）

**PR本文に含まれる内容:**
- 概要（指定された説明）
- 変更内容（コミット履歴から抽出）
- テスト実行チェックリスト
- Claude Code署名

## 前提条件

### 必要なツール
- **GitHub CLI (gh)**: Issueの取得とPR作成に使用
- **Git**: ブランチ操作とコミット処理
- **WSL環境** (オプション): クリップボードへのコピー機能

### 認証設定
```bash
# GitHub CLIの認証確認
gh auth status

# 未認証の場合
gh auth login
```

### 権限要件
- リポジトリへの書き込み権限
- Issue編集権限（アサイン機能用）
- PR作成権限

## ワークフロー例

### 完全な作業フロー
```bash
# 1. Issue一覧確認
npm run fetch-issue

# 2. Issue #18の作業開始
npm run start-issue 18

# 3. 実装作業 (Claude Code使用)
# クリップボードのプロンプトをClaude Codeに貼り付け

# 4. PR作成
npm run create-pr "feat: テーマ機能の活用" "Vuetifyテーマ設定の実装"
```

### Issue情報の事前確認
```bash
# Issue詳細のみ確認したい場合
npm run fetch-issue 18
cat tasks/issue-18-tasks.md
```

## エラーハンドリング

### 一般的なエラーと対処法

**Issue番号が見つからない:**
```
エラー: Issue #XX が見つかりません
```
- Issue番号の確認
- リポジトリの権限確認

**GitHub CLI認証エラー:**
```
gh: To use GitHub CLI, please authenticate...
```
- `gh auth login`で認証実行

**ブランチ作成エラー:**
```
fatal: A branch named 'issue/XX-title' already exists
```
- 既存ブランチの削除または別名使用

## 設定のカスタマイズ

### ブランチ名の変更
`start-issue.sh`の以下の行を編集:
```bash
BRANCH_NAME="issue/${ISSUE_NUMBER}-$(echo "$TITLE" | sed 's/[^a-zA-Z0-9]/-/g'...)"
```

### PR本文テンプレートの変更
`create-pr.sh`の`PR_BODY`変数を編集して、PR本文をカスタマイズできます。

### コミットメッセージ形式の変更
`create-pr.sh`のコミットメッセージ部分を編集:
```bash
git commit -m "$PR_TITLE

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## トラブルシューティング

### スクリプトが実行できない場合
```bash
chmod +x scripts/*.sh
```

### GitHub CLIコマンドが失敗する場合
```bash
# 認証状況確認
gh auth status

# 再認証
gh auth login --web
```

### WSLでクリップボード機能が動作しない場合
```bash
# clip.exeの確認
which clip.exe

# パスが通っていない場合は手動でプロンプトをコピー
```