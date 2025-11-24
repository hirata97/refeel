# Refeel ドキュメント

プロジェクトの詳細ドキュメントが整理されています。

## 📁 ディレクトリ構成

| ディレクトリ                               | 説明                                               |
| ------------------------------------------ | -------------------------------------------------- |
| [ENVIRONMENT/](ENVIRONMENT/)               | 環境構築・Docker・Supabase設定                     |
| [DEVELOPMENT/](DEVELOPMENT/)               | 開発ワークフロー・アーキテクチャ・コーディング規則 |
| [CI/](CI/)                                 | CI/CD・型生成・ベストプラクティス                  |
| [SECURITY/](SECURITY/)                     | セキュリティガイドライン・実装・更新履歴           |
| [PROJECT_MANAGEMENT/](PROJECT_MANAGEMENT/) | Issue・PR・ラベル管理                              |
| [TESTING/](TESTING/)                       | テスト関連ドキュメント                             |
| [INFRASTRUCTURE/](INFRASTRUCTURE/)         | CI/CDインフラ運用                                  |

## 🎯 利用ガイド

### 新規参加者向け

1. **全体把握**: [../README.md](../README.md) でプロジェクト概要を確認
2. **環境構築**: [ENVIRONMENT/ENVIRONMENT_SETUP.md](ENVIRONMENT/ENVIRONMENT_SETUP.md) で初回セットアップ
3. **開発準備**: [../CLAUDE.md](../CLAUDE.md) で開発フロー・重要原則を確認
4. **ベストプラクティス**: [DEVELOPMENT/BEST_PRACTICES.md](DEVELOPMENT/BEST_PRACTICES.md) を確認

### 日常開発

- **ワークフロー**: [DEVELOPMENT/DEVELOPMENT_WORKFLOW.md](DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)
- **コマンド集**: [DEVELOPMENT/DEVELOPMENT_COMMANDS.md](DEVELOPMENT/DEVELOPMENT_COMMANDS.md)
- **PRテスト**: [PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md](PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md)

### トラブル対応

- **環境問題**: [ENVIRONMENT/ENVIRONMENT_SETUP.md](ENVIRONMENT/ENVIRONMENT_SETUP.md)
- **Docker問題**: [ENVIRONMENT/DOCKER_SETUP.md](ENVIRONMENT/DOCKER_SETUP.md)
- **認証問題**: [ENVIRONMENT/SUPABASE_AUTH.md](ENVIRONMENT/SUPABASE_AUTH.md)
- **セキュリティ問題**: [SECURITY/SECURITY_TROUBLESHOOTING.md](SECURITY/SECURITY_TROUBLESHOOTING.md)
- **CI/CD問題**: [INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md](INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md)

---

## 📄 全ファイル一覧

### ENVIRONMENT/ - 環境・設定

| ファイル                                                       | 説明                           |
| -------------------------------------------------------------- | ------------------------------ |
| [ENVIRONMENT_SETUP.md](ENVIRONMENT/ENVIRONMENT_SETUP.md)       | 初回セットアップ・推奨開発環境 |
| [DOCKER_SETUP.md](ENVIRONMENT/DOCKER_SETUP.md)                 | Docker開発環境構築             |
| [SUPABASE_QUICK_SETUP.md](ENVIRONMENT/SUPABASE_QUICK_SETUP.md) | Supabase 5分セットアップ       |
| [SUPABASE_AUTH.md](ENVIRONMENT/SUPABASE_AUTH.md)               | Supabase認証システム詳細       |
| [SETUP_EMOTION_TAGS.md](ENVIRONMENT/SETUP_EMOTION_TAGS.md)     | 感情タグ機能セットアップ       |

### DEVELOPMENT/ - 開発関連

| ファイル                                                       | 説明                        |
| -------------------------------------------------------------- | --------------------------- |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) | ブランチ戦略・PR作成手順    |
| [DEVELOPMENT_COMMANDS.md](DEVELOPMENT/DEVELOPMENT_COMMANDS.md) | npm scripts・自動化コマンド |
| [ARCHITECTURE.md](DEVELOPMENT/ARCHITECTURE.md)                 | システムアーキテクチャ      |
| [CODING_STANDARDS.md](DEVELOPMENT/CODING_STANDARDS.md)         | コーディング規則            |
| [BEST_PRACTICES.md](DEVELOPMENT/BEST_PRACTICES.md)             | 開発ベストプラクティス      |
| [DOCUMENTATION_GUIDE.md](DEVELOPMENT/DOCUMENTATION_GUIDE.md)   | ドキュメント管理ガイド      |
| [CI_CD_TESTING.md](DEVELOPMENT/CI_CD_TESTING.md)               | CI/CDテストガイド           |

### CI/ - CI/CD・品質管理

| ファイル                                              | 説明                         |
| ----------------------------------------------------- | ---------------------------- |
| [CI_CD_GUIDE.md](CI/CI_CD_GUIDE.md)                   | GitHub Actions・品質チェック |
| [TYPE_GENERATION.md](CI/TYPE_GENERATION.md)           | 型定義自動生成システム       |
| [CI_CD_BEST_PRACTICES.md](CI/CI_CD_BEST_PRACTICES.md) | CI/CDベストプラクティス      |

### SECURITY/ - セキュリティ

| ファイル                                                            | 説明                     |
| ------------------------------------------------------------------- | ------------------------ |
| [SECURITY_GUIDE.md](SECURITY/SECURITY_GUIDE.md)                     | セキュリティガイドライン |
| [SECURITY_DEVELOPMENT.md](SECURITY/SECURITY_DEVELOPMENT.md)         | セキュリティ開発ガイド   |
| [SECURITY_IMPLEMENTATION.md](SECURITY/SECURITY_IMPLEMENTATION.md)   | セキュリティ実装詳細     |
| [SECURITY_TROUBLESHOOTING.md](SECURITY/SECURITY_TROUBLESHOOTING.md) | トラブルシューティング   |
| [SECURITY_UPDATES.md](SECURITY/SECURITY_UPDATES.md)                 | セキュリティ更新履歴     |

### PROJECT_MANAGEMENT/ - プロジェクト管理

| ファイル                                                              | 説明                       |
| --------------------------------------------------------------------- | -------------------------- |
| [ISSUE_CREATION_GUIDE.md](PROJECT_MANAGEMENT/ISSUE_CREATION_GUIDE.md) | Issue作成ガイド            |
| [ISSUE_LABELS.md](PROJECT_MANAGEMENT/ISSUE_LABELS.md)                 | ラベル体系・自動ラベリング |
| [PR_CREATION_GUIDE.md](PROJECT_MANAGEMENT/PR_CREATION_GUIDE.md)       | PR作成ガイド               |
| [PR_TESTING_GUIDE.md](PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md)         | PRテスト・検証ガイド       |

### INFRASTRUCTURE/ - インフラ運用

| ファイル                                                            | 説明                        |
| ------------------------------------------------------------------- | --------------------------- |
| [CI_CD_OVERVIEW.md](INFRASTRUCTURE/CI_CD_OVERVIEW.md)               | CI/CD概要                   |
| [CI_CD_CONFIGURATION.md](INFRASTRUCTURE/CI_CD_CONFIGURATION.md)     | CI/CD設定詳細               |
| [CI_CD_OPERATIONS.md](INFRASTRUCTURE/CI_CD_OPERATIONS.md)           | CI/CD運用ガイド             |
| [CI_CD_TROUBLESHOOTING.md](INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md) | CI/CDトラブルシューティング |
| [CI_CD_QUICK_REFERENCE.md](INFRASTRUCTURE/CI_CD_QUICK_REFERENCE.md) | CI/CDクイックリファレンス   |

### その他

| ファイル                     | 説明             |
| ---------------------------- | ---------------- |
| [REFERENCE.md](REFERENCE.md) | 詳細リファレンス |
