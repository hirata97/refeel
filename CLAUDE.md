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

### Claude Code利用時の注意
- 詳細な作業手順が必要な場合は該当docsファイルを参照
- CLAUDE.mdは全体概要の把握とクイックリファレンスとして活用
- 新しい情報追加時は適切なdocsファイルに分類して記載

---

## プロジェクト概要

**GoalCategorizationDiary** - 目標設定と進捗追跡のためのVue.js Webアプリケーション
- Vue 3 + TypeScript + Supabase + Vite構成
- Vuetify（Material Design）
- Chart.js（データ可視化）
- Pinia（状態管理）
- Vercel自動デプロイ

## 📚 ドキュメント構成

### 開発関連
- **🛠️ 開発コマンド**: [docs/DEVELOPMENT_COMMANDS.md](docs/DEVELOPMENT_COMMANDS.md)
- **🔄 開発ワークフロー**: [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)
- **🏗️ アーキテクチャ**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **📝 コーディング規則**: [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)

### 環境・設定
- **⚙️ 環境設定**: [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)
- **🔐 Supabase認証設定**: [docs/SUPABASE_QUICK_SETUP.md](docs/SUPABASE_QUICK_SETUP.md)
- **📖 認証システム詳細**: [docs/SUPABASE_AUTH.md](docs/SUPABASE_AUTH.md)

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

### Issue作業フロー
```bash
# Issue確認・作業開始
npm run fetch-issue [番号]
npm run start-issue [番号]

# 実装後のPR作成
npm run create-pr "タイトル" "説明"
```
**詳細**: [開発コマンド一覧](docs/DEVELOPMENT_COMMANDS.md)

## ⚠️ 重要な注意点

- **TypeScript**: 型エラーは必ず解決してからコミット
- **テスト**: `npm run lint`, `npm run type-check` を実行してからPR作成
- **認証**: Supabase環境変数の設定確認が必要
- **Issue管理**: 適切なラベル（priority、size、type）を付与

## 🔗 関連リンク

- **プロジェクトURL**: https://github.com/RsPYP/GoalCategorizationDiary
- **デプロイ**: Vercel自動デプロイ
- **課題管理**: GitHub Issues + 自動化スクリプト

---

**📝 更新履歴**
- 2025-08-17: ドキュメント構造化・分割実施
- 2025-08-17: Issue #2 認証ロジック実装完了
- 2025-08-17: Issue #76 データ取得とキャッシング戦略実装完了
- 2025-08-17: 開発ワークフロードキュメント追加
