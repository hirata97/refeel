# Scripts Documentation

このディレクトリには、開発ワークフローを自動化するスクリプトが含まれています。

## 利用可能なスクリプト

### 1. fetch-issue.sh
GitHub Issueの詳細を取得してタスクファイルを生成します。

```bash
# Issue一覧表示
npm run fetch-issue

# 特定のIssue詳細取得
npm run fetch-issue [issue番号]
```

**機能:**
- GitHub CLI (gh)を使用してIssue情報を取得
- Issue詳細の表示（タイトル、ラベル、本文）
- タスク管理ファイル (`tasks/issue-[番号]-tasks.md`) の生成
- Claude Code用プロンプトの自動生成

### 2. generate-types.js
Supabaseの型定義を自動生成します。

```bash
# ローカル環境用
npm run generate-types

# 本番環境用
npm run generate-types:prod
```

**機能:**
- データベーススキーマから型定義を生成
- `src/types/database.ts`と`src/types/supabase.ts`を更新
- 型チェックによる互換性検証

### 3. ci-type-check.sh
CI環境用のTypeScriptチェックを実行します。

```bash
npm run ci:type-check
```

**機能:**
- Vuetifyの既知の型問題を除外してチェック
- 他のTypeScriptエラーは厳格にチェック

### 4. close-linked-issues.sh
PR作成時にリンクされたIssueを自動クローズします。

**注意:** このスクリプトは内部的に使用されます。

## 前提条件

### 必要なツール
- **GitHub CLI (gh)**: Issueの取得とPR作成に使用
- **Git**: ブランチ操作とコミット処理
- **Node.js**: 型定義生成に使用

### 認証設定
```bash
# GitHub CLIの認証確認
gh auth status

# 未認証の場合
gh auth login
```

## 推奨ワークフロー

CLAUDE.mdで推奨されている開発フロー：

```bash
# 1. 最新状態取得
git pull origin main

# 2. フィーチャーブランチ作成
git checkout -b feature/issue-123-description

# 3. Issue内容確認
npm run fetch-issue 123

# 4. 実装作業...

# 5. PR作成（Claude Codeまたはgh CLI使用）
gh pr create --title "feat: Issue #123 機能追加" --body "Closes #123"
```
