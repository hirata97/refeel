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

## 📝 ドキュメント管理ガイドライン

### ドキュメントの役割分担

| ドキュメント | 対象者 | 内容 | 文量目安 |
|------------|--------|------|----------|
| **/README.md** | 全員 | プロジェクト概要、セットアップ | 100-200行 |
| **/CLAUDE.md** | 開発者 | 開発フロー、重要原則、頻用コマンド | 150-250行 |
| **docs/README.md** | 開発者 | ドキュメント索引（本ファイル） | 100-200行 |
| **docs/カテゴリ/** | 開発者 | カテゴリ別の詳細ドキュメント | 目的に応じて |

### 重複を避ける原則

**❌ 避けるべきパターン:**
```markdown
<!-- CLAUDE.md と DEVELOPMENT_COMMANDS.md の両方に同じ内容 -->
## コマンド一覧
npm run dev
npm run build
... 50行以上のコマンド説明 ...
```

**✅ 推奨パターン:**
```markdown
<!-- CLAUDE.md: クイックリファレンス -->
## 頻用コマンド
npm run dev          # 開発サーバー起動
npm run ci:all       # 全品質チェック

詳細: [docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md](リンク)
```

### リダイレクトファイルのパターン

統合・移動したドキュメントには明確なリダイレクトを残す：

```markdown
# [ドキュメント名]

> **📌 このドキュメントは[移動/統合/再構成]されました**

## 📚 移行先ドキュメント

👉 **[新ドキュメント名](リンク)**
- 移行内容の説明

## 🔍 内容の検索ガイド

| 探している内容 | 参照ドキュメント |
|--------------|----------------|
| **項目1** | [ドキュメント1](リンク) |
```

**例**: [DEVELOPMENT/BEST_PRACTICES.md](DEVELOPMENT/BEST_PRACTICES.md), [DEVELOPMENT/CODING_STANDARDS.md](DEVELOPMENT/CODING_STANDARDS.md)

### ドキュメント更新時の注意点

1. **技術変更時**: 同じPR/コミットで関連ドキュメントを更新
2. **重要な変更**: 各ドキュメント末尾の「最終更新」「変更履歴」を更新
3. **新規ドキュメント作成時**: このファイル（docs/README.md）の該当セクションに追加

## 📁 ディレクトリ構成

| ディレクトリ                               | 説明                                               |
| ------------------------------------------ | -------------------------------------------------- |
| [ENVIRONMENT/](ENVIRONMENT/)               | 環境構築・Docker・Supabase設定                     |
| [DEVELOPMENT/](DEVELOPMENT/)               | 開発ワークフロー・アーキテクチャ・コーディング規則 |
| [DEPLOYMENT/](DEPLOYMENT/)                 | デプロイ手順・Vercel設定                           |
| [CI/](CI/)                                 | CI/CD総合ガイド（運用・設定・トラブルシューティング） |
| [SECURITY/](SECURITY/)                     | セキュリティガイドライン・実装・更新履歴           |
| [PROJECT_MANAGEMENT/](PROJECT_MANAGEMENT/) | Issue・PR・ラベル管理                              |

> **テスト関連**: [../tests/README.md](../tests/README.md) を参照してください

## 🎯 利用ガイド

### 新規参加者向け

1. **全体把握**: [../README.md](../README.md) でプロジェクト概要を確認
2. **環境構築**: [ENVIRONMENT/ENVIRONMENT_SETUP.md](ENVIRONMENT/ENVIRONMENT_SETUP.md) で初回セットアップ
3. **開発準備**: [../CLAUDE.md](../CLAUDE.md) で開発フロー・重要原則を確認
4. **コードパターン**: [DEVELOPMENT/CODE_PATTERNS.md](DEVELOPMENT/CODE_PATTERNS.md) で具体的なコード例とパターンを確認

### 日常開発

- **ワークフロー**: [DEVELOPMENT/DEVELOPMENT_WORKFLOW.md](DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)
- **コマンド集**: [DEVELOPMENT/DEVELOPMENT_COMMANDS.md](DEVELOPMENT/DEVELOPMENT_COMMANDS.md)
- **PRテスト**: [PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md](PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md)

### トラブル対応

- **環境問題**: [ENVIRONMENT/ENVIRONMENT_SETUP.md](ENVIRONMENT/ENVIRONMENT_SETUP.md)
- **Docker問題**: [../.devcontainer/README.md](../.devcontainer/README.md)
- **認証問題**: [ENVIRONMENT/SUPABASE_AUTH.md](ENVIRONMENT/SUPABASE_AUTH.md)
- **セキュリティ問題**: [SECURITY/SECURITY_TROUBLESHOOTING.md](SECURITY/SECURITY_TROUBLESHOOTING.md)
- **CI/CD問題**: [INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md](INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md)

---

## 📄 全ファイル一覧

### ENVIRONMENT/ - 環境・設定

| ファイル                                                       | 説明                           |
| -------------------------------------------------------------- | ------------------------------ |
| [ENVIRONMENT_SETUP.md](ENVIRONMENT/ENVIRONMENT_SETUP.md)       | 初回セットアップ・推奨開発環境 |
| [SUPABASE_QUICK_SETUP.md](ENVIRONMENT/SUPABASE_QUICK_SETUP.md) | Supabase 5分セットアップ       |
| [SUPABASE_AUTH.md](ENVIRONMENT/SUPABASE_AUTH.md)               | Supabase認証システム詳細       |

> **Docker開発環境**: [../.devcontainer/README.md](../.devcontainer/README.md) - Docker & VSCode Dev Container設定
> **Supabaseデータベース**: [../supabase/README.md](../supabase/README.md) - DB構造・マイグレーション・Seedデータ・感情タグ

### DEVELOPMENT/ - 開発関連

| ファイル                                                       | 説明                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) | ブランチ戦略・PR作成手順・段階的実装プロセス         |
| [DEVELOPMENT_COMMANDS.md](DEVELOPMENT/DEVELOPMENT_COMMANDS.md) | npm scripts・自動化コマンド（完全版）                |
| [ARCHITECTURE.md](DEVELOPMENT/ARCHITECTURE.md)                 | システムアーキテクチャ・技術スタック                 |
| [CODE_PATTERNS.md](DEVELOPMENT/CODE_PATTERNS.md)               | Vue 3/TypeScriptコードパターン集・実装例             |
| [BEST_PRACTICES.md](DEVELOPMENT/BEST_PRACTICES.md)             | 📌 再構成済み（CLAUDE.md、DEVELOPMENT_WORKFLOW.md、CODE_PATTERNS.mdへ移行） |
| [CODING_STANDARDS.md](DEVELOPMENT/CODING_STANDARDS.md)         | 📌 再構成済み（CLAUDE.md、DEVELOPMENT_WORKFLOW.md、CODE_PATTERNS.mdへ移行） |

### DEPLOYMENT/ - デプロイ

| ファイル                                                       | 説明                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| [VERCEL_DEPLOYMENT.md](DEPLOYMENT/VERCEL_DEPLOYMENT.md)       | Vercelデプロイ手順・環境変数設定・トラブルシューティング |

### CI/ - CI/CD日常運用

開発者が日常的に使用するCI/CD運用ドキュメント

| ファイル                                              | 説明                                       |
| ----------------------------------------------------- | ------------------------------------------ |
| [README.md](CI/README.md)                             | CI/ドキュメント使い分けガイド               |
| [CI_CD_DEVELOPER_GUIDE.md](CI/CI_CD_DEVELOPER_GUIDE.md) | CI/CD開発者向け総合ガイド（日常運用＋ベストプラクティス） |
| [CI_CD_QUICK_REFERENCE.md](CI/CI_CD_QUICK_REFERENCE.md) | コマンド集・チェックリスト              |
| [TYPE_GENERATION.md](CI/TYPE_GENERATION.md)           | 型定義自動生成システム                     |

> **Note**: ワークフロー詳細・テスト戦略については、[../.github/workflows/TESTING.md](../.github/workflows/TESTING.md) を参照してください。

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
| [PR_CREATION_GUIDE.md](PROJECT_MANAGEMENT/PR_CREATION_GUIDE.md)       | PR作成ガイド               |
| [PR_TESTING_GUIDE.md](PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md)         | PRテスト・検証ガイド       |

> **Issue作成・ラベル体系**: `/.claude/commands/create-issue.md` - Issue品質保証エージェント（完全ガイド統合版）

### INFRASTRUCTURE/ - CI/CDアーキテクチャ・詳細設定

DevOps、インフラエンジニア、プロジェクトメンテナー向けの高度なCI/CD運用ドキュメント

| ファイル                                                            | 説明                                       |
| ------------------------------------------------------------------- | ------------------------------------------ |
| [CI_CD_OVERVIEW.md](INFRASTRUCTURE/CI_CD_OVERVIEW.md)               | アーキテクチャ全体像・技術スタック・パフォーマンス指標 |
| [CI_CD_CONFIGURATION.md](INFRASTRUCTURE/CI_CD_CONFIGURATION.md)     | ワークフロー設定変更手順・環境変数管理      |
| [CI_CD_OPERATIONS.md](INFRASTRUCTURE/CI_CD_OPERATIONS.md)           | 定期メンテナンス・監視・コスト管理          |
| [CI_CD_TROUBLESHOOTING.md](INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md) | 詳細トラブルシューティング・緊急時対応      |

---

**最終更新**: 2025-12-03
**変更履歴**:
- DOCUMENTATION_GUIDE.mdを統合、ドキュメント管理ガイドラインを追加
- DOCKER_SETUP.mdを.devcontainer/README.mdに移動（技術ディレクトリに近接配置）
