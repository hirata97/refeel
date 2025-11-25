# CI/ ドキュメント - 日常運用ガイド

このディレクトリには、開発者が日常的にCI/CDを利用する際に必要な **運用ドキュメント** をまとめています。

## 📚 ドキュメント一覧

| ドキュメント | 内容 | 対象者 |
|-------------|------|--------|
| **[CI_CD_GUIDE.md](./CI_CD_GUIDE.md)** | CI/CD日常運用ガイド（ジョブ一覧、トリガー、基本的なトラブルシューティング） | 全開発者 |
| **[CI_CD_BEST_PRACTICES.md](./CI_CD_BEST_PRACTICES.md)** | 開発フローのベストプラクティス、エラー予防策 | 全開発者 |
| **[CI_CD_TESTING.md](./CI_CD_TESTING.md)** | ワークフロー詳細、テスト種類、品質基準 | 全開発者 |
| **[CI_CD_QUICK_REFERENCE.md](./CI_CD_QUICK_REFERENCE.md)** | よく使うコマンド集、チェックリスト | 全開発者 |
| **[TYPE_GENERATION.md](./TYPE_GENERATION.md)** | 型定義自動生成システムの詳細 | 全開発者 |

## 🗂️ ディレクトリ構成と役割

### CI/ Directory（このディレクトリ）
**目的**: 開発者が日常的に使用するCI/CD運用ドキュメント
**対象**: PR作成、CI/CD実行、エラー対応を行う全開発者

### [../INFRASTRUCTURE/](../INFRASTRUCTURE/) Directory
**目的**: アーキテクチャ、詳細設定、高度な運用ドキュメント
**対象**: DevOps、インフラエンジニア、プロジェクトメンテナー

- [CI_CD_OVERVIEW.md](../INFRASTRUCTURE/CI_CD_OVERVIEW.md) - アーキテクチャ全体像
- [CI_CD_CONFIGURATION.md](../INFRASTRUCTURE/CI_CD_CONFIGURATION.md) - 設定変更手順
- [CI_CD_OPERATIONS.md](../INFRASTRUCTURE/CI_CD_OPERATIONS.md) - 運用・保守・監視
- [CI_CD_TROUBLESHOOTING.md](../INFRASTRUCTURE/CI_CD_TROUBLESHOOTING.md) - 詳細トラブルシューティング

## 📖 使い分けガイド

### 開発者の日常作業
→ **CI/** ディレクトリのドキュメントを参照
- PR作成時の確認事項: [CI_CD_QUICK_REFERENCE.md](./CI_CD_QUICK_REFERENCE.md)
- CI/CDエラー対応: [CI_CD_GUIDE.md](./CI_CD_GUIDE.md) → トラブルシューティング
- 開発フロー改善: [CI_CD_BEST_PRACTICES.md](./CI_CD_BEST_PRACTICES.md)

### CI/CD設定変更・高度な運用
→ **INFRASTRUCTURE/** ディレクトリのドキュメントを参照
- ワークフロー設定変更: [CI_CD_CONFIGURATION.md](../INFRASTRUCTURE/CI_CD_CONFIGURATION.md)
- パフォーマンス最適化: [CI_CD_OVERVIEW.md](../INFRASTRUCTURE/CI_CD_OVERVIEW.md)
- 定期メンテナンス: [CI_CD_OPERATIONS.md](../INFRASTRUCTURE/CI_CD_OPERATIONS.md)

## ⚠️ ドキュメント更新ポリシー

- **重複回避**: 同じ内容は1箇所のみに記載し、他ドキュメントからは相互参照リンクを使用
- **役割分担**: 日常運用は CI/、アーキテクチャ/設定は INFRASTRUCTURE/ に記載
- **更新時の確認**: ドキュメント更新時は相互参照リンクが正しいことを確認
