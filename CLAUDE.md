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

### Claude Code推奨設定

```bash
# ~/.config/claude-code/config.json に追加
{
  "bypass_permission_prompts": true,
  "auto_save": true,
  "default_branch_prefix": "feature/"
}
```

## 🚨 作業開始前の必須チェック（厳守）

- **📖 ベストプラクティス参照**: [docs/BEST_PRACTICES.md](docs/BEST_PRACTICES.md) を **必ず最初に確認**
- **早期テスト**: 新規ストア・コンポーネント作成時は必ずユニットテスト同時作成

---

## 📚 ドキュメント構成

### 開発関連

- **🛠️ 開発コマンド**: [docs/DEVELOPMENT_COMMANDS.md](docs/DEVELOPMENT_COMMANDS.md)
- **🔄 開発ワークフロー**: [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)
- **🧪 PRテスト・検証ガイド**: [docs/PR_TESTING_GUIDE.md](docs/PR_TESTING_GUIDE.md)
- **🏗️ アーキテクチャ**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **📝 コーディング規則**: [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)
- **🔧 ベストプラクティス**: [docs/BEST_PRACTICES.md](docs/BEST_PRACTICES.md)

### 環境・設定

- **⚙️ 環境設定**: [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)
- **🐳 Docker環境**: [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md)
- **🔐 Supabase認証設定**: [docs/SUPABASE_QUICK_SETUP.md](docs/SUPABASE_QUICK_SETUP.md)
- **📖 認証システム詳細**: [docs/SUPABASE_AUTH.md](docs/SUPABASE_AUTH.md)

### セキュリティ

- **🛡️ セキュリティガイドライン**: [docs/SECURITY.md](docs/SECURITY.md)
- **🔧 セキュリティ開発ガイド**: [docs/SECURITY_DEVELOPMENT.md](docs/SECURITY_DEVELOPMENT.md)
- **📖 セキュリティ実装詳細**: [docs/SECURITY_IMPLEMENTATION.md](docs/SECURITY_IMPLEMENTATION.md)
- **🔍 セキュリティトラブルシューティング**: [docs/SECURITY_TROUBLESHOOTING.md](docs/SECURITY_TROUBLESHOOTING.md)

### CI/CD・品質管理

- **🚀 CI/CDパイプライン**: [docs/CI_CD_GUIDE.md](docs/CI_CD_GUIDE.md) - GitHub Actions自動化システム

### プロジェクト管理

- **🏷️ Issue ラベル体系**: [docs/ISSUE_LABELS.md](docs/ISSUE_LABELS.md)

## 🚀 クイックスタート

### 初回セットアップ

```bash
# リポジトリクローン
git clone https://github.com/RsPYP/GoalCategorizationDiary.git
cd GoalCategorizationDiary

# 環境設定
npm install
cp .env.example .env  # Supabase設定を編集

# 開発開始
npm run dev
```

**詳細**: [環境設定ガイド](docs/ENVIRONMENT_SETUP.md)

### Issue作業フロー（改善版・段階的実装推奨）

```bash
# 0. 🚨 必須事前確認
# → docs/BEST_PRACTICES.md を必ず最初に参照！
# → 過去の反省点・よくある落とし穴を確認

# 1. 事前準備（必須）
npm outdated                    # 依存関係確認
npm run fetch-issue [番号]      # Issue詳細取得
# → 関連コンポーネント・型定義を事前調査

# 2. 作業開始
npm run start-issue [番号]      # ブランチ作成・切り替え

# 3. 段階的実装（推奨）
# - 最小単位での実装
# - 各段階でCI/CDチェック実行
npm run ci:lint && npm run ci:type-check  # 段階的品質チェック

# 4. テスト同時作成（必須）
# - 新規ストア・コンポーネント作成時
# - 既存テスト失敗時は即座に対応

# 5. 最終品質チェック（PR作成前必須）
npm run ci:lint      # 厳格リンティング
npm run ci:type-check # TypeScript検証
npm run ci:test      # テスト + カバレッジ
npm run ci:build     # プロダクションビルド

# 6. PR作成（全チェック通過後）
npm run create-pr "タイトル" "説明"
```

**詳細**: [開発ワークフロー](docs/DEVELOPMENT_WORKFLOW.md) | [ベストプラクティス](docs/BEST_PRACTICES.md)

## ⚠️ 重要な注意点（反省点対応版）

### 🚨 実装前必須チェック（絶対厳守）

- **📖 ベストプラクティス確認**: [docs/BEST_PRACTICES.md](docs/BEST_PRACTICES.md) の **必読**
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
