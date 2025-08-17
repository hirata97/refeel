---
layout: home

hero:
  name: "Goal Categorization Diary"
  text: "開発ドキュメント"
  tagline: "目標設定と進捗追跡のためのWebアプリケーション"
  image:
    src: /logo.svg
    alt: Goal Categorization Diary
  actions:
    - theme: brand
      text: 開発を始める
      link: /docs/ENVIRONMENT_SETUP
    - theme: alt
      text: アーキテクチャ
      link: /docs/ARCHITECTURE

features:
  - icon: 🚀
    title: モダンな技術スタック
    details: Vue 3 + TypeScript + Supabase + Vite構成で高速な開発体験を提供
  - icon: 🔐
    title: セキュリティ重視
    details: XSS対策、CSRF対策、セキュリティヘッダーによる包括的なセキュリティ実装
  - icon: 📊
    title: データ可視化
    details: Chart.jsによる目標進捗の美しいビジュアライゼーション
  - icon: 🛠️
    title: 自動化ワークフロー
    details: Issue管理からPR作成まで、効率的な開発フローを自動化
  - icon: 📱
    title: レスポンシブデザイン
    details: Vuetify (Material Design) による美しく使いやすいUI
  - icon: ⚡
    title: リアルタイム更新
    details: Supabaseによるリアルタイムデータ同期機能
---

## クイックスタート

### 🔧 環境セットアップ

```bash
# リポジトリクローン
git clone https://github.com/RsPYP/GoalCategorizationDiary.git
cd GoalCategorizationDiary

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env  # Supabase設定を編集

# 開発サーバー起動
npm run dev
```

### 📋 Issue作業フロー

```bash
# Issue確認・作業開始
npm run fetch-issue [番号]
npm run start-issue [番号]

# 実装後のPR作成
npm run create-pr "タイトル" "説明"
```

### 🧪 テスト実行

```bash
# 型チェック
npm run type-check

# リンティング
npm run lint

# ユニットテスト
npm run test:unit

# E2Eテスト
npm run test:e2e
```

## 主要ドキュメント

- **[環境設定](/docs/ENVIRONMENT_SETUP)** - 初回セットアップガイド
- **[開発コマンド](/docs/DEVELOPMENT_COMMANDS)** - 利用可能なコマンド一覧
- **[セキュリティガイド](/docs/SECURITY)** - セキュリティ実装詳細
- **[アーキテクチャ](/docs/ARCHITECTURE)** - システム構成と設計思想

## 貢献方法

1. **Issue確認**: 適切なラベル（priority、size、type）付きIssueを選択
2. **ブランチ作成**: `npm run start-issue [番号]` で作業ブランチ作成
3. **実装**: コーディング規約に従って実装
4. **テスト**: 型チェック・リンティング・テストの実行
5. **PR作成**: `npm run create-pr` でプルリクエスト作成

詳細は [開発ワークフロー](/docs/DEVELOPMENT_WORKFLOW) をご覧ください。