# GoalCategorizationDiary ドキュメント

このディレクトリには、プロジェクトの詳細ドキュメントが整理されています。

## 📁 ドキュメント一覧

### 🛠️ 開発関連

| ファイル                                           | 説明                   | 主な内容                                           |
| -------------------------------------------------- | ---------------------- | -------------------------------------------------- |
| [DEVELOPMENT_COMMANDS.md](DEVELOPMENT_COMMANDS.md) | 開発コマンド集         | npm scripts、自動化コマンド、Issue管理フロー       |
| [ARCHITECTURE.md](ARCHITECTURE.md)                 | システムアーキテクチャ | 技術スタック、コンポーネント構造、ディレクトリ構成 |
| [CODING_STANDARDS.md](CODING_STANDARDS.md)         | コーディング規則       | 命名規則、テスト規則、Git ワークフロー             |

### ⚙️ 環境・設定

| ファイル                                           | 説明                          | 主な内容                                               |
| -------------------------------------------------- | ----------------------------- | ------------------------------------------------------ |
| [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)       | 環境設定ガイド                | 初回セットアップ、推奨開発環境、トラブルシューティング |
| [SUPABASE_QUICK_SETUP.md](SUPABASE_QUICK_SETUP.md) | Supabase クイックセットアップ | 5分で完了するセットアップ手順                          |
| [SUPABASE_AUTH.md](SUPABASE_AUTH.md)               | Supabase認証システム          | 詳細な技術仕様、セキュリティ設定                       |

### 📋 プロジェクト管理

| ファイル                           | 説明             | 主な内容                                         |
| ---------------------------------- | ---------------- | ------------------------------------------------ |
| [ISSUE_LABELS.md](ISSUE_LABELS.md) | Issue ラベル体系 | ラベル一覧、自動ラベリング機能、使用ガイドライン |

## 🎯 利用方法

### 新規参加者向け

1. **環境構築**: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) で初回セットアップ
2. **開発の流れ**: [DEVELOPMENT_COMMANDS.md](DEVELOPMENT_COMMANDS.md) でワークフロー確認
3. **コーディング**: [CODING_STANDARDS.md](CODING_STANDARDS.md) で規則確認

### Claude Code利用者向け

- **全体把握**: [../CLAUDE.md](../CLAUDE.md) でプロジェクト概要を確認
- **詳細作業**: 該当するdocsファイルで具体的な手順を確認
- **認証設定**: [SUPABASE_QUICK_SETUP.md](SUPABASE_QUICK_SETUP.md) で迅速なセットアップ

### トラブル対応者向け

- **環境問題**: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) のトラブルシューティング
- **認証問題**: [SUPABASE_AUTH.md](SUPABASE_AUTH.md) の問題解決セクション

## 📝 ドキュメント管理

### 更新ルール

- **新規ドキュメント**: 適切な分類で作成し、この README.md に追加
- **内容変更**: 対応するファイルを直接更新
- **参照更新**: [../CLAUDE.md](../CLAUDE.md) の参照リンクも必要に応じて更新

### 分類基準

- **開発関連**: コード作成・ビルド・テストに関する内容
- **環境・設定**: セットアップ・設定・ツールに関する内容
- **プロジェクト管理**: Issue・PR・ワークフローに関する内容

---

**最終更新**: 2025-08-17  
**管理**: hirata
