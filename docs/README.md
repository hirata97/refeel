# GoalCategorizationDiary ドキュメント

このディレクトリには、プロジェクトの詳細ドキュメントが整理されています。

## 📁 ドキュメント一覧（18ファイル）

### 🛠️ 開発関連

| ファイル                                               | 説明                         | 主な内容                                           |
| ------------------------------------------------------ | ---------------------------- | -------------------------------------------------- |
| [DEVELOPMENT_COMMANDS.md](DEVELOPMENT_COMMANDS.md)     | 開発コマンド集               | npm scripts、自動化コマンド、Issue管理フロー       |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)     | 開発ワークフロー             | ブランチ戦略、PR作成手順、開発プロセス             |
| [ARCHITECTURE.md](ARCHITECTURE.md)                     | システムアーキテクチャ       | 技術スタック、コンポーネント構造、ディレクトリ構成 |
| [CODING_STANDARDS.md](CODING_STANDARDS.md)             | コーディング規則             | 命名規則、テスト規則、Git ワークフロー             |
| [BEST_PRACTICES.md](BEST_PRACTICES.md)                 | 開発ベストプラクティス       | 実装前チェックリスト、段階的開発プロセス           |
| [PR_TESTING_GUIDE.md](PR_TESTING_GUIDE.md)             | PRテスト・検証ガイド         | 自動テスト、手動検証、品質チェック手順             |

### ⚙️ 環境・設定

| ファイル                                               | 説明                          | 主な内容                                               |
| ------------------------------------------------------ | ----------------------------- | ------------------------------------------------------ |
| [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)           | 環境設定ガイド                | 初回セットアップ、推奨開発環境、トラブルシューティング |
| [DOCKER_SETUP.md](DOCKER_SETUP.md)                     | Docker環境セットアップ       | Docker開発環境構築、コンテナ管理、自動化スクリプト     |
| [SUPABASE_QUICK_SETUP.md](SUPABASE_QUICK_SETUP.md)     | Supabaseクイックセットアップ | 5分で完了するセットアップ手順                          |
| [SUPABASE_AUTH.md](SUPABASE_AUTH.md)                   | Supabase認証システム         | 詳細な技術仕様、セキュリティ設定                       |

### 🛡️ セキュリティ

| ファイル                                                           | 説明                               | 主な内容                                           |
| ------------------------------------------------------------------ | ---------------------------------- | -------------------------------------------------- |
| [SECURITY.md](SECURITY.md)                                         | セキュリティガイドライン           | ポリシー、多層防御構成、脅威モデル                 |
| [SECURITY_DEVELOPMENT.md](SECURITY_DEVELOPMENT.md)                 | セキュリティ開発ガイド             | 実装手順、コーディング規則、検証方法               |
| [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md)           | セキュリティ実装詳細               | 技術仕様、設定詳細、統合手順                       |
| [SECURITY_TROUBLESHOOTING.md](SECURITY_TROUBLESHOOTING.md)         | セキュリティトラブルシューティング | 問題解決手順、よくある問題、診断方法               |

### 🚀 CI/CD・品質管理

| ファイル                                   | 説明                     | 主な内容                                                   |
| ------------------------------------------ | ------------------------ | ---------------------------------------------------------- |
| [CI_CD_GUIDE.md](CI/CI_CD_GUIDE.md)           | CI/CDパイプライン運用    | GitHub Actions、5項目品質チェック、自動化ワークフロー     |
| [TYPE_GENERATION.md](CI/TYPE_GENERATION.md)   | Type Generation システム | 型定義自動生成、データベーススキーマ連携、トラブル対応    |
| [CI_CD_BEST_PRACTICES.md](CI/CI_CD_BEST_PRACTICES.md) | CI/CDベストプラクティス | 開発フロー最適化、エラー予防策、パフォーマンス改善        |

### 📋 プロジェクト管理

| ファイル                           | 説明             | 主な内容                                         |
| ---------------------------------- | ---------------- | ------------------------------------------------ |
| [ISSUE_LABELS.md](ISSUE_LABELS.md) | Issueラベル体系 | ラベル一覧、自動ラベリング機能、使用ガイドライン |

## 🎯 利用方法

### 🆕 新規参加者向け（完全ガイド）

1. **📖 全体把握**: [../CLAUDE.md](../CLAUDE.md) でプロジェクト概要を確認
2. **⚙️ 環境構築**: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) または [DOCKER_SETUP.md](DOCKER_SETUP.md) で初回セットアップ
3. **🔐 認証設定**: [SUPABASE_QUICK_SETUP.md](SUPABASE_QUICK_SETUP.md) で5分セットアップ
4. **🛠️ 開発理解**: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) でワークフローを把握
5. **📝 実装準備**: [BEST_PRACTICES.md](BEST_PRACTICES.md) で**必読**のベストプラクティスを確認

### 🚀 開発者向け（日常業務）

#### 実装作業時
- **ワークフロー**: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) - ブランチ作成〜PR作成
- **コマンド**: [DEVELOPMENT_COMMANDS.md](DEVELOPMENT_COMMANDS.md) - 自動化スクリプト活用
- **品質チェック**: [PR_TESTING_GUIDE.md](PR_TESTING_GUIDE.md) - テスト・検証手順
- **CI/CD理解**: [CI_CD_GUIDE.md](CI/CI_CD_GUIDE.md) - 5項目自動品質チェック
- **型システム**: [TYPE_GENERATION.md](CI/TYPE_GENERATION.md) - 型定義自動生成システム
- **ベストプラクティス**: [CI_CD_BEST_PRACTICES.md](CI/CI_CD_BEST_PRACTICES.md) - 効率的開発フロー

#### 設計・アーキテクチャ作業時  
- **アーキテクチャ**: [ARCHITECTURE.md](ARCHITECTURE.md) - システム全体設計
- **コーディング規則**: [CODING_STANDARDS.md](CODING_STANDARDS.md) - 命名規則・テスト規則
- **セキュリティ設計**: [SECURITY.md](SECURITY.md) - セキュリティガイドライン

### 🛡️ セキュリティ担当者向け

- **ポリシー確認**: [SECURITY.md](SECURITY.md) - 包括的セキュリティガイドライン  
- **実装ガイド**: [SECURITY_DEVELOPMENT.md](SECURITY_DEVELOPMENT.md) - 開発時のセキュリティ手順
- **技術詳細**: [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md) - 実装仕様・設定
- **問題解決**: [SECURITY_TROUBLESHOOTING.md](SECURITY_TROUBLESHOOTING.md) - トラブルシューティング

### 🔧 トラブル対応者向け

- **環境問題**: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) のトラブルシューティング
- **Docker問題**: [DOCKER_SETUP.md](DOCKER_SETUP.md) のよくある問題  
- **認証問題**: [SUPABASE_AUTH.md](SUPABASE_AUTH.md) の問題解決セクション
- **セキュリティ問題**: [SECURITY_TROUBLESHOOTING.md](SECURITY_TROUBLESHOOTING.md) の診断・解決手順
- **CI/CD問題**: [CI_CD_GUIDE.md](CI/CI_CD_GUIDE.md) のトラブルシューティング
- **Type Generation問題**: [TYPE_GENERATION.md](CI/TYPE_GENERATION.md) の詳細トラブル対応

### 📋 プロジェクト管理者向け

- **Issue管理**: [ISSUE_LABELS.md](ISSUE_LABELS.md) - ラベル体系と自動化機能

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
