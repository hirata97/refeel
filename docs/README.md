# Refeel ドキュメント

プロジェクトの詳細ドキュメントが整理されています。

## 📚 ドキュメント構造の概要

プロジェクトには3つの主要なドキュメントがあります：

| ファイル | 対象者 | 内容 |
|----------|--------|------|
| [/README.md](../README.md) | 全員（新規参加者優先） | プロジェクト概要、技術スタック、クイックスタート |
| [/CLAUDE.md](../CLAUDE.md) | 開発者・Claude Code | 開発フロー、ブランチ戦略、重要原則、コマンド集 |
| [/docs/README.md](README.md) | 開発者（詳細参照時） | 詳細ドキュメント索引（本ファイル） |

**使い分けの目安:**
- **初めての方**: `/README.md` → `/CLAUDE.md` の順で確認
- **日常開発**: `/CLAUDE.md` のクイックスタート・コマンド集を活用
- **詳細調査**: `/docs/README.md` から該当カテゴリのドキュメントへ

### README配置方針

サブディレクトリのREADME配置は以下の方針に従います：

- **原則**: 各サブディレクトリにはREADMEを配置しない（このファイルで一元管理）
- **例外**: 複数ファイルがあり、使い分けや概要説明が必要な場合のみ配置
  - 例: [CI/README.md](CI/README.md) - 3つのCI/CDドキュメントの使い分けガイド

この方針により、ドキュメント構造をシンプルに保ち、メンテナンス負荷を最小化します。

## 📁 ディレクトリ構成

| ディレクトリ                               | 説明                                               |
| ------------------------------------------ | -------------------------------------------------- |
| [ENVIRONMENT/](ENVIRONMENT/)               | 環境構築・Docker・Supabase設定                     |
| [DEVELOPMENT/](DEVELOPMENT/)               | 開発ワークフロー・アーキテクチャ・コーディング規則 |
| [CI/](CI/)                                 | CI/CD日常運用・型生成・ベストプラクティス          |
| [SECURITY/](SECURITY/)                     | セキュリティガイドライン・実装・更新履歴           |
| [PROJECT_MANAGEMENT/](PROJECT_MANAGEMENT/) | Issue・PR・ラベル管理                              |
| [INFRASTRUCTURE/](INFRASTRUCTURE/)         | CI/CDアーキテクチャ・詳細設定・高度な運用          |

> **テスト関連**: [../tests/README.md](../tests/README.md) を参照してください

## 🎯 利用ガイド

### 新規参加者向け

1. **全体把握**: [../README.md](../README.md) でプロジェクト概要を確認
2. **環境構築**: [ENVIRONMENT/ENVIRONMENT_SETUP.md](ENVIRONMENT/ENVIRONMENT_SETUP.md) で初回セットアップ
3. **開発準備**: [../CLAUDE.md](../CLAUDE.md) で開発フロー・重要原則を確認
4. **コーディング規則**: [DEVELOPMENT/BEST_PRACTICES.md](DEVELOPMENT/BEST_PRACTICES.md) でコーディング規則とベストプラクティスを確認

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

| ファイル                                                       | 説明                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) | ブランチ戦略・PR作成手順                             |
| [DEVELOPMENT_COMMANDS.md](DEVELOPMENT/DEVELOPMENT_COMMANDS.md) | npm scripts・自動化コマンド                          |
| [ARCHITECTURE.md](DEVELOPMENT/ARCHITECTURE.md)                 | システムアーキテクチャ                               |
| [BEST_PRACTICES.md](DEVELOPMENT/BEST_PRACTICES.md)             | 開発ベストプラクティス・コーディング規則（統合版）   |
| [CODING_STANDARDS.md](DEVELOPMENT/CODING_STANDARDS.md)         | 📌 BEST_PRACTICES.md へリダイレクト                  |
| [COVERAGE_ENHANCEMENT_PLAN.md](DEVELOPMENT/COVERAGE_ENHANCEMENT_PLAN.md) | カバレッジ閾値強化計画（Phase 1完了）                |
| [DOCUMENTATION_GUIDE.md](DEVELOPMENT/DOCUMENTATION_GUIDE.md)   | ドキュメント管理ガイド                               |
### CI/ - CI/CD日常運用

開発者が日常的に使用するCI/CD運用ドキュメント

| ファイル                                              | 説明                                       |
| ----------------------------------------------------- | ------------------------------------------ |
| [README.md](CI/README.md)                             | CI/ドキュメント使い分けガイド               |
| [CI_CD_GUIDE.md](CI/CI_CD_GUIDE.md)                   | CI/CD日常運用ガイド・ジョブ概要            |
| [CI_CD_TESTING.md](CI/CI_CD_TESTING.md)               | ワークフロー詳細・テスト種類・品質基準      |
| [CI_CD_QUICK_REFERENCE.md](CI/CI_CD_QUICK_REFERENCE.md) | コマンド集・チェックリスト              |
| [TYPE_GENERATION.md](CI/TYPE_GENERATION.md)           | 型定義自動生成システム                     |
| [CI_CD_BEST_PRACTICES.md](CI/CI_CD_BEST_PRACTICES.md) | 開発フローベストプラクティス・エラー予防    |

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

### INFRASTRUCTURE/ - CI/CDアーキテクチャ・詳細設定

DevOps、インフラエンジニア、プロジェクトメンテナー向けの高度なCI/CD運用ドキュメント

| ファイル                                                            | 説明                                       |
| ------------------------------------------------------------------- | ------------------------------------------ |
| [CI_CD_OVERVIEW.md](INFRASTRUCTURE/CI_CD_OVERVIEW.md)               | アーキテクチャ全体像・技術スタック・パフォーマンス指標 |
| [CI_CD_CONFIGURATION.md](INFRASTRUCTURE/CI_CD_CONFIGURATION.md)     | ワークフロー設定変更手順・環境変数管理      |
| [CI_CD_OPERATIONS.md](INFRASTRUCTURE/CI_CD_OPERATIONS.md)           | 定期メンテナンス・監視・コスト管理          |
| [CI_CD_TROUBLESHOOTING.md](INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md) | 詳細トラブルシューティング・緊急時対応      |
