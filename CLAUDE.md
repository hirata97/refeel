# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がこのリポジトリでコードを作業する際のガイダンスを提供します。

## 📋 CLAUDE.md運用ルール

### 基本方針
- **CLAUDE.mdは要約・参照のみ**: 詳細内容は `docs/` ディレクトリに分割して配置
- **参照形式**: 各セクションで対応するdocsファイルへのリンクを提供
- **保持内容**: プロジェクト概要、クイックリファレンス、重要な注意事項のみ
- **更新頻度**: docsファイル追加・変更時に参照リンクを更新

### ドキュメント管理
- **新規ドキュメント**: `docs/` 配下に作成し、CLAUDE.mdから参照
- **内容重複の回避**: 同じ情報を複数ファイルに記載しない
- **一元管理**: 各種設定・手順は専用ドキュメントで一元管理

### Claude Code推奨設定
```bash
# ~/.config/claude-code/config.json に追加
{
  "bypass_permission_prompts": true,
  "auto_save": true,
  "default_branch_prefix": "feature/"
}
```

### 🚨 作業開始前の必須チェック（厳守）
- **📖 ベストプラクティス参照**: [docs/BEST_PRACTICES.md](docs/BEST_PRACTICES.md) を **必ず最初に確認**
- **事前調査**: 実装前に関連コンポーネントの型定義・依存関係を確認必須
- **段階的実装**: 機能を最小単位に分割し、各段階でCI/CDチェック実行
- **早期テスト**: 新規ストア・コンポーネント作成時は必ずユニットテスト同時作成
- **依存関係チェック**: `npm outdated`および互換性確認を開発開始前に実行

---

## プロジェクト概要

**GoalCategorizationDiary** - 目標設定と進捗追跡のためのVue.js Webアプリケーション

### 🏗️ システムアーキテクチャ（2025年更新版）
- **フロントエンド**: Vue 3.5 + TypeScript 5.6 + Vite 5.4
- **UI フレームワーク**: Vuetify 3.7（Material Design）
- **状態管理**: Pinia 2.2（統合ページネーションストア含む）
- **データ可視化**: Chart.js 4.4 + vue-chartjs 5.3
- **認証・DB**: Supabase 2.49（JWT認証、RLS、リアルタイム更新）
- **フォーム検証**: VeeValidate 4.15 + カスタムルール
- **セキュリティ**: DOMPurify 3.2（XSS対策）+ CSP準備中
- **テスト**: Vitest 2.1 + Playwright 1.48 + @vitest/coverage-v8
- **リンティング**: ESLint 9.14 + Prettier 3.3
- **デプロイ**: Vercel自動デプロイ + CI/CD統合

## 📚 ドキュメント構成

### 開発関連
- **🛠️ 開発コマンド**: [docs/DEVELOPMENT_COMMANDS.md](docs/DEVELOPMENT_COMMANDS.md)
- **🔄 開発ワークフロー**: [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) ⭐ 更新済
- **🤖 CI/CD運用ガイド**: [docs/CI_CD_GUIDE.md](docs/CI_CD_GUIDE.md) - 5項目自動品質チェック
- **🧪 PRテスト・検証ガイド**: [docs/PR_TESTING_GUIDE.md](docs/PR_TESTING_GUIDE.md) - 段階的検証手順
- **🏗️ アーキテクチャ**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ⭐ 更新必要
- **📝 コーディング規則**: [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)
- **🔧 ベストプラクティス**: [docs/BEST_PRACTICES.md](docs/BEST_PRACTICES.md) - 反省点対応版

### 環境・設定
- **⚙️ 環境設定**: [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)
- **🔐 Supabase認証設定**: [docs/SUPABASE_QUICK_SETUP.md](docs/SUPABASE_QUICK_SETUP.md)
- **📖 認証システム詳細**: [docs/SUPABASE_AUTH.md](docs/SUPABASE_AUTH.md)

### セキュリティ
- **🛡️ セキュリティガイドライン**: [docs/SECURITY.md](docs/SECURITY.md) - ポリシーと概要
- **🔧 セキュリティ開発ガイド**: [docs/SECURITY_DEVELOPMENT.md](docs/SECURITY_DEVELOPMENT.md) - 実践的な開発手順
- **📖 セキュリティ実装詳細**: [docs/SECURITY_IMPLEMENTATION.md](docs/SECURITY_IMPLEMENTATION.md) - 技術的詳細
- **🔍 セキュリティトラブルシューティング**: [docs/SECURITY_TROUBLESHOOTING.md](docs/SECURITY_TROUBLESHOOTING.md) - 問題解決ガイド

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

## 🔗 関連リンク

- **プロジェクトURL**: https://github.com/RsPYP/GoalCategorizationDiary
- **デプロイ**: Vercel自動デプロイ
- **課題管理**: GitHub Issues + 自動化スクリプト

---

**📝 更新履歴**
- 2025-08-17: ドキュメント構造化・分割実施
- 2025-08-17: Issue #2 認証ロジック実装完了
- 2025-08-17: Issue #76 データ取得とキャッシング戦略実装完了
- 2025-08-17: Issue #71 XSS対策とセキュリティヘッダー実装完了
- 2025-08-17: Issue #72 入力値検証とサニタイゼーション実装完了
- 2025-08-17: セキュリティドキュメント構造化・実践ガイド追加
- 2025-08-17: 開発ワークフロードキュメント追加
- 2025-08-19: Issue #55 CI/CD自動化システム実装・ドキュメント整備完了
- 2025-08-19: Issue #75 フロントエンド表示最適化・PaginationStore追加完了
- 2025-08-19: CLAUDE.md反省点対応版更新・システムアーキテクチャ最新化
- 2025-08-19: Claude Code設定最適化（bypass_permission_prompts）・段階的実装フロー追加
- 2025-08-21: Issue #112反省点対応・ベストプラクティス参照の必須化強調
