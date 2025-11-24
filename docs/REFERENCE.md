# REFERENCE.md - 詳細リファレンス

CLAUDE.mdの補足情報として、詳細ドキュメントへの参照を提供します。

## 📚 ドキュメント参照

各トピックの詳細情報は以下のドキュメントを参照してください。

| トピック | ドキュメント |
|----------|--------------|
| **技術スタック・アーキテクチャ** | [DEVELOPMENT/ARCHITECTURE.md](DEVELOPMENT/ARCHITECTURE.md) |
| **開発コマンド** | [DEVELOPMENT/DEVELOPMENT_COMMANDS.md](DEVELOPMENT/DEVELOPMENT_COMMANDS.md) |
| **開発ワークフロー** | [DEVELOPMENT/DEVELOPMENT_WORKFLOW.md](DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) |
| **コーディング規則** | [DEVELOPMENT/CODING_STANDARDS.md](DEVELOPMENT/CODING_STANDARDS.md) |
| **テスト戦略** | [../tests/README.md](../tests/README.md) |
| **セキュリティ** | [SECURITY/SECURITY_GUIDE.md](SECURITY/SECURITY_GUIDE.md) |
| **環境設定** | [ENVIRONMENT/ENVIRONMENT_SETUP.md](ENVIRONMENT/ENVIRONMENT_SETUP.md) |
| **CI/CD** | [CI/CI_CD_GUIDE.md](CI/CI_CD_GUIDE.md) |
| **Issue・PR管理** | [PROJECT_MANAGEMENT/](PROJECT_MANAGEMENT/) |

## ⚡ クイックコマンド

```bash
# 基本
npm run dev           # 開発サーバー
npm run build         # ビルド
npm run ci:all        # 全品質チェック

# テスト
npm run test:unit     # ユニットテスト
npm run test:e2e      # E2Eテスト

# Issue自動化
npm run auto-issue [番号]  # 完全自動実装
npm run fetch-issue [番号] # Issue詳細取得
npm run create-pr          # PR作成
```

詳細: [DEVELOPMENT/DEVELOPMENT_COMMANDS.md](DEVELOPMENT/DEVELOPMENT_COMMANDS.md)

## 🗂️ ディレクトリ構造

```
src/
├── views/       # ページコンポーネント
├── components/  # 再利用可能コンポーネント
├── stores/      # Piniaストア
├── lib/         # ユーティリティ
├── router/      # ルーティング
└── types/       # TypeScript型定義

tests/           # テストファイル
docs/            # ドキュメント
scripts/         # 自動化スクリプト
```

詳細: [DEVELOPMENT/ARCHITECTURE.md](DEVELOPMENT/ARCHITECTURE.md)

## 🔧 トラブルシューティング

| 問題 | 参照先 |
|------|--------|
| 環境・セットアップ | [ENVIRONMENT/ENVIRONMENT_SETUP.md](ENVIRONMENT/ENVIRONMENT_SETUP.md) |
| Docker | [ENVIRONMENT/DOCKER_SETUP.md](ENVIRONMENT/DOCKER_SETUP.md) |
| Supabase認証 | [ENVIRONMENT/SUPABASE_AUTH.md](ENVIRONMENT/SUPABASE_AUTH.md) |
| CI/CD | [INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md](INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md) |
| セキュリティ | [SECURITY/SECURITY_TROUBLESHOOTING.md](SECURITY/SECURITY_TROUBLESHOOTING.md) |

## 🔗 外部リソース

- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/docs)
- [Vuetify](https://vuetifyjs.com/)
- [Pinia](https://pinia.vuejs.org/)
