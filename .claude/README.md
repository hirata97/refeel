# Claude Code カスタムコマンド

このディレクトリには、プロジェクト固有のClaude Codeカスタムコマンド（スラッシュコマンド）が含まれています。

## 📂 ディレクトリ構成

```
.claude/
├── commands/              # カスタムスラッシュコマンド
│   ├── create-issue.md   # Issue品質保証エージェント
│   └── start-work.md     # Issue自動実装エージェント
├── settings.json         # Claude Code設定
├── settings.local.json   # ローカル設定
└── README.md            # このファイル
```

## 🚀 利用可能なコマンド

### `/create-issue` - Issue品質保証エージェント

**説明**: Issue品質チェック・作成ワークフロー（完全ガイド統合版）

**機能**:
- 対話的なIssue作成サポート
- タイトル・ラベル・説明文の品質チェック
- 必須項目の自動バリデーション
- 親子チケット構造の提案
- テンプレート自動選択

**使用方法**:
```
/create-issue
```

**統合ガイド**:
- ISSUE_CREATION_GUIDE.md（Issue作成ルール）
- ISSUE_LABELS.md（ラベル体系）

**詳細**: [commands/create-issue.md](commands/create-issue.md)

---

### `/start-work` - Issue自動実装エージェント

**説明**: オープンなIssueから子チケット優先で自動選択し、PR作成まで一貫実行

**機能**:
- オープンなIssueから自動選択（子チケット優先）
- 技術調査・実装計画の自動作成
- ブランチ準備・実装実行
- 品質チェック・テスト実行
- PR自動作成

**使用方法**:
```
/start-work
```

**実行フロー**:
1. Issue自動選択・確認
2. 技術調査・実装計画
3. ブランチ準備・実装実行
4. PR作成・完了

**詳細**: [commands/start-work.md](commands/start-work.md)

---

## 🛠️ カスタムコマンドの作成方法

新しいスラッシュコマンドを追加するには：

1. `.claude/commands/` に新しい `.md` ファイルを作成
2. Front Matter で `description` を定義
3. コマンドの詳細を記述

### テンプレート

```markdown
---
description: コマンドの簡潔な説明
---

# Command Name

## 基本方針
- 実行する内容

## 使用方法
/command-name

## 実行フロー
1. ステップ1
2. ステップ2
```

### ファイル名とコマンド名

- ファイル名: `command-name.md`
- コマンド: `/command-name`

## 📚 関連ドキュメント

- [CLAUDE.md](../CLAUDE.md) - プロジェクト開発ガイド
- [開発ワークフロー](../docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)
- [PR作成ガイド](../docs/PROJECT_MANAGEMENT/PR_CREATION_GUIDE.md)

## ⚙️ 設定ファイル

### settings.json

プロジェクト共通の設定（バージョン管理対象）

```json
{
  "permissions": {
    "allow": ["Bash", "Read", "Write", "Edit", ...],
    "defaultMode": "bypassPermissions"
  }
}
```

### settings.local.json

個人用設定（バージョン管理対象外、`.gitignore`に記載）

個人の好みに応じてカスタマイズ可能。

---

**最終更新**: 2025-12-03
