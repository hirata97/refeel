# 実装ベストプラクティス

> **📌 このドキュメントは再構成されました**
>
> 開発ベストプラクティスの内容は、より見つけやすく保守しやすいように以下のドキュメントに再配分されました。

## 📚 移行先ドキュメント

### 基本原則・クイックリファレンス
👉 **[/CLAUDE.md](../../CLAUDE.md)**
- TypeScript厳格モード
- Supabase認証セキュリティ
- Vue 3 Composition API
- モジュール設計の基本
- 段階的実装の原則
- CI/CD品質ゲート対応

### 開発ワークフロー・プロセス
👉 **[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)**
- ブランチ戦略
- 段階的実装プロセス（4フェーズ）
- コミット前チェックリスト
- PR作成とマージ手順
- CI/CD統合ワークフロー

### 具体的なコードパターン
👉 **[CODE_PATTERNS.md](CODE_PATTERNS.md)** ⭐ 新規作成
- モジュール分割の詳細パターン
- TypeScript型パターン
- Vue 3 Composition API実例
- セキュリティパターン
- パフォーマンス最適化
- よくある落とし穴と解決策

## 🔍 内容の検索ガイド

| 探している内容 | 参照ドキュメント |
|--------------|----------------|
| **基本的な開発ルール** | [/CLAUDE.md](../../CLAUDE.md) |
| **コミット・PRの手順** | [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) |
| **コードの書き方・パターン** | [CODE_PATTERNS.md](CODE_PATTERNS.md) |
| **型定義の方法** | [CODE_PATTERNS.md](CODE_PATTERNS.md) - TypeScript型パターン |
| **Vue 3の実装パターン** | [CODE_PATTERNS.md](CODE_PATTERNS.md) - Vue 3 Composition API |
| **モジュール分割** | [CODE_PATTERNS.md](CODE_PATTERNS.md) - モジュール分割 |
| **セキュリティ実装** | [CODE_PATTERNS.md](CODE_PATTERNS.md) + [../SECURITY/SECURITY_DEVELOPMENT.md](../SECURITY/SECURITY_DEVELOPMENT.md) |
| **CI/CDチェック** | [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) + [../CI/CI_CD_DEVELOPER_GUIDE.md](../CI/CI_CD_DEVELOPER_GUIDE.md) |

## 🎯 再構成の理由

### 問題点
- BEST_PRACTICES.md (390行) が肥大化
- CLAUDE.mdとの重複が約40%
- DEVELOPMENT_WORKFLOW.mdとの重複が約30%
- 開発者がどこを参照すべきか不明確

### 改善策
1. **基本原則** → CLAUDE.mdに統合（クイックリファレンスとして）
2. **プロセス** → DEVELOPMENT_WORKFLOW.mdに統合
3. **コードパターン** → CODE_PATTERNS.mdに独立（具体例中心）

### メリット
- ✅ ドキュメントの役割が明確化
- ✅ 重複の削減（メンテナンス負荷軽減）
- ✅ 情報の検索性向上
- ✅ より実践的な構成

---

## 📖 関連ドキュメント

- [/CLAUDE.md](../../CLAUDE.md) - 開発ガイド（開発者向けクイックスタート）
- [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) - 開発ワークフロー
- [CODE_PATTERNS.md](CODE_PATTERNS.md) - コードパターン集
- [ARCHITECTURE.md](ARCHITECTURE.md) - システムアーキテクチャ
- [../CI/CI_CD_DEVELOPER_GUIDE.md](../CI/CI_CD_DEVELOPER_GUIDE.md) - CI/CD開発者ガイド

---

**最終更新**: 2025-12-03
**変更履歴**: ドキュメント統合・再構成（Issue #300対応）
