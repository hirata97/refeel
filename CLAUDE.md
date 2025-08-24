# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がこのリポジトリでコードを作業する際のガイダンスを提供します。
**GoalCategorizationDiary** - 目標設定と進捗追跡のためのVue.js Webアプリケーション

## 📋 CLAUDE.md運用ルール

### 基本方針

- **CLAUDE.mdは要約・参照のみ**: 詳細内容は `docs/` ディレクトリに分割して配置
- **参照形式**: 各セクションで対応するdocsファイルへのリンクを提供
- **保持内容**: プロジェクト概要、クイックリファレンス、重要な注意事項のみ
- **更新頻度**: docsファイル追加・変更時に参照リンクを更新
- **内容重複の回避**: 同じ情報を複数ファイルに記載しない
- **新規ドキュメント**: `docs/` 配下に作成し、CLAUDE.mdから参照

## 🚨 作業開始前の必須チェック**必ず最初に確認**

- **🏗️ アーキテクチャ参照**: [docs/DEVELOPMENT/ARCHITECTURE.md](docs/DEVELOPMENT/ARCHITECTURE.md)
- **📖 ベストプラクティス参照**: [docs/DEVELOPMENT/BEST_PRACTICES.md](docs/DEVELOPMENT/BEST_PRACTICES.md)

---

## 📚 ドキュメント構成

### 開発関連

- **🛠️ 開発コマンド**: [docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md](docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md)
- **🔄 開発ワークフロー**: [docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)
- **🏗️ アーキテクチャ**: [docs/DEVELOPMENT/ARCHITECTURE.md](docs/DEVELOPMENT/ARCHITECTURE.md)
- **📝 コーディング規則**: [docs/DEVELOPMENT/CODING_STANDARDS.md](docs/DEVELOPMENT/CODING_STANDARDS.md)
- **🔧 ベストプラクティス**: [docs/DEVELOPMENT/BEST_PRACTICES.md](docs/DEVELOPMENT/BEST_PRACTICES.md)

### 環境・設定

- **⚙️ 環境設定**: [docs/ENVIRONMENT/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT/ENVIRONMENT_SETUP.md)
- **🐳 Docker環境**: [docs/ENVIRONMENT/DOCKER_SETUP.md](docs/ENVIRONMENT/DOCKER_SETUP.md)
- **🔐 Supabase認証設定**: [docs/ENVIRONMENT/SUPABASE_QUICK_SETUP.md](docs/ENVIRONMENT/SUPABASE_QUICK_SETUP.md)
- **📖 認証システム詳細**: [docs/ENVIRONMENT/SUPABASE_AUTH.md](docs/ENVIRONMENT/SUPABASE_AUTH.md)

### セキュリティ

- **🛡️ セキュリティガイドライン**: [docs/SECURITY/SECURITY.md](docs/SECURITY/SECURITY_GUIDE.md)
- **🔧 セキュリティ開発ガイド**: [docs/SECURITY/SECURITY_DEVELOPMENT.md](docs/SECURITY/SECURITY_DEVELOPMENT.md)
- **📖 セキュリティ実装詳細**: [docs/SECURITY/SECURITY_IMPLEMENTATION.md](docs/SECURITY/SECURITY_IMPLEMENTATION.md)
- **🔍 セキュリティトラブルシューティング**: [docs/security/SECURITY_TROUBLESHOOTING.md](docs/SECURITY/SECURITY_TROUBLESHOOTING.md)

### CI/CD・品質管理

- **🚀 CI/CDパイプライン**: [docs/CI/CI_CD_GUIDE.md](docs/CI/CI_CD_GUIDE.md) - GitHub Actions自動化システム

### プロジェクト管理

- **🏷️ Issue ラベル体系**: [docs/PROJECT_MANAGEMENT/ISSUE_LABELS.md](docs/PROJECT_MANAGEMENT/ISSUE_LABELS.md)
- **📝 Issue作成ガイド**: [docs/PROJECT_MANAGEMENT/ISSUE_CREATION_GUIDE.md](docs/PROJECT_MANAGEMENT/ISSUE_CREATION_GUIDE.md)
- **🔄 PR作成ガイド**: [docs/PROJECT_MANAGEMENT/PR_CREATION_GUIDE.md](docs/PROJECT_MANAGEMENT/PR_CREATION_GUIDE.md)
- **🧪 PRテスト・検証ガイド**: [docs/PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md](docs/PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md)

### Issue作業フロー

**詳細なワークフロー**: [開発ワークフロー](docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) | [ベストプラクティス](docs/DEVELOPMENT/BEST_PRACTICES.md)

## ⚠️ 重要な注意点（反省点対応版）

### 🚨 実装前必須チェック（絶対厳守）

- **📖 ベストプラクティス確認**: [docs/DEVELOPMENT/BEST_PRACTICES.md](docs/DEVELOPMENT/BEST_PRACTICES.md) の **必読**
  - 過去の反省点・失敗パターンを事前に把握
  - TypeScript型安全性のガイドライン確認
  - Vue.js最新記法の確認
- **関連コンポーネント調査**: 型定義、インターフェース、依存関係を事前確認
- **依存関係互換性**: `npm outdated`実行、バージョン競合回避
- **既存実装理解**: 影響範囲とアーキテクチャの詳細把握

### 🔄 開発中の品質管理

- **段階的実装**: 最小単位での実装→テスト→CI/CDチェックを繰り返し
- **早期テスト**: 新規ストア・コンポーネントは必ずユニットテスト同時作成
- **即座対応**: 既存テスト失敗、型エラーは後回しにせず即座に修正

### 🛡️ 品質ゲート

- **5項目CI/CD**: lint・型・テスト・ビルド・セキュリティの全通過必須
- **段階的チェック**: 実装中も頻繁に`npm run ci:lint && npm run ci:type-check`実行
- **認証・セキュリティ**: Supabase環境変数確認、入力値検証・サニタイゼーション必須

### 📋 プロジェクト管理

- **Issue管理**: priority、size、type ラベル必須
- **テストカバレッジ**: 新機能は必ず適切なテスト作成
- **Claude Code設定**: `bypass_permission_prompts: true` 推奨

---

### Claude Code推奨設定

```bash
# ~/.config/claude-code/config.json に追加
{
  "bypass_permission_prompts": true,
  "auto_save": true,
  "default_branch_prefix": "feature/"
}
```
