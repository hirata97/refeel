# CI/CD ドキュメント

> **対象**: 全開発者・DevOps・プロジェクトメンテナー
> **目的**: CI/CDパイプラインの運用・設定・トラブルシューティングの総合ガイド

このディレクトリには、プロジェクトのCI/CD関連ドキュメントを一元管理しています。

## 📚 ドキュメント一覧

| ドキュメント | 内容 | 対象者 |
|-------------|------|--------|
| **[CI_CD_DEVELOPER_GUIDE.md](CI_CD_DEVELOPER_GUIDE.md)** | 日常運用ガイド（開発者向け総合ガイド） | 全開発者 ⭐ |
| **[CI_CD_QUICK_REFERENCE.md](CI_CD_QUICK_REFERENCE.md)** | コマンド集・チェックリスト | 全開発者 |
| **[CI_CD_OVERVIEW.md](CI_CD_OVERVIEW.md)** | アーキテクチャ全体像・技術スタック | DevOps・上級者 |
| **[CI_CD_CONFIGURATION.md](CI_CD_CONFIGURATION.md)** | ワークフロー設定変更手順 | DevOps・メンテナー |
| **[CI_CD_OPERATIONS.md](CI_CD_OPERATIONS.md)** | 運用・メンテナンス・監視 | DevOps・メンテナー |
| **[CI_CD_TROUBLESHOOTING.md](CI_CD_TROUBLESHOOTING.md)** | 詳細トラブルシューティング | 全開発者 |
| **[TYPE_GENERATION.md](TYPE_GENERATION.md)** | 型定義自動生成システム | 全開発者 |

> **Note**: ワークフロー詳細・テスト戦略については、[../../.github/workflows/TESTING.md](../../.github/workflows/TESTING.md) を参照してください。

## 🎯 ドキュメント選択ガイド

### 初めての方・日常作業
1. **[CI_CD_DEVELOPER_GUIDE.md](CI_CD_DEVELOPER_GUIDE.md)** - まずはこれを読む ⭐
2. **[CI_CD_QUICK_REFERENCE.md](CI_CD_QUICK_REFERENCE.md)** - コマンドやチェックリストが必要な時

### エラー対応・トラブルシューティング
- **[CI_CD_TROUBLESHOOTING.md](CI_CD_TROUBLESHOOTING.md)** - エラー解決方法
- **[CI_CD_DEVELOPER_GUIDE.md](CI_CD_DEVELOPER_GUIDE.md)** の「よくあるエラーと対処法」セクション

### CI/CD設定変更・カスタマイズ
1. **[CI_CD_OVERVIEW.md](CI_CD_OVERVIEW.md)** - アーキテクチャを理解
2. **[CI_CD_CONFIGURATION.md](CI_CD_CONFIGURATION.md)** - 設定変更手順
3. **[CI_CD_OPERATIONS.md](CI_CD_OPERATIONS.md)** - 運用・メンテナンス

### 型定義システム
- **[TYPE_GENERATION.md](TYPE_GENERATION.md)** - Supabase型定義自動生成

## 📖 ドキュメント構成の変更履歴

### 2025-12-01: CI/ と INFRASTRUCTURE/ の統合

**統合前**:
- `docs/CI/` - 開発者の日常運用（4ファイル）
- `docs/INFRASTRUCTURE/` - DevOps向けアーキテクチャ・設定（4ファイル）

**統合理由**:
- 「開発者向け vs DevOps向け」の区別が曖昧
- CI/CD情報が2箇所に分散
- 使い分けガイドの存在が混乱の原因
- メンテナンス負荷の削減

**統合後** (`docs/CI/` に統合):
- 全CI/CD関連ドキュメントを1箇所に集約（8ファイル）
- 対象者による分離ではなく、用途による分類
- シンプルで検索しやすい構造

## 🔗 関連ドキュメント

- **[.github/workflows/TESTING.md](../../.github/workflows/TESTING.md)** - ワークフロー詳細・テスト戦略
- **[docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md](../DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)** - 開発フロー・PR作成
- **[docs/PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md](../PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md)** - PRテスト・検証

---

**最終更新**: 2025-12-01
**変更履歴**: CI/ と INFRASTRUCTURE/ を統合、シンプルな構造に変更
