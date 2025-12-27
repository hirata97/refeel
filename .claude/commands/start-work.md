---
description: オープンなIssueから子チケット優先で自動選択し、PR作成まで一貫実行
---

# Start Work Command

このコマンドはオープンなIssueから子チケット優先で自動選択し、PR作成まで一貫した作業フローを実行します。

**重要**: 全ての作業ルール・フローは [開発ワークフロー](../docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)、[CLAUDE.md](../CLAUDE.md)、[PR作成ガイド](../docs/PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md) に従うこと。

## 基本方針

- **子チケット優先**: 具体的な実装タスクを優先的に選択
- **自動Issue選択**: オープンなIssueから作業可能なものを自動判定
- **完全フロー**: Issue理解→実装→テスト→PR作成まで一貫実行
- **品質保証**: CI/CD対応とテスト契約遵守

## 使用方法

```
/start-work
```

**引数なし**: オープンなIssueから子チケット優先で自動選択

## 自動実行フロー

### 1. Issue自動選択・確認
- オープンなIssue一覧取得
- **子チケット優先選択**: 親チケット（`[親チケット]`）以外を優先
- 優先度・サイズによる作業可能性判定（P0/P1優先、size:S/M優先）
- 選択したIssue詳細の取得・表示
- 受け入れ条件・技術要件の確認

### 2. 技術調査・実装計画
- 影響範囲の分析（ファイル・コンポーネント特定）
- アーキテクチャ理解（既存実装パターン確認）
- 実装方針の決定（段階的アプローチ）
- テスト戦略の計画

### 3. ブランチ準備・実装実行
- 最新状態取得: `git pull origin main`（必須）
- フィーチャーブランチ作成: `feature/issue-[番号]-[description]`
- 段階的実装（最小単位での確認サイクル）
- ユニットテスト作成・実行
- 品質チェック: `npm run ci:all`

### 4. PR作成・完了
- **PR作成ルール**: [PR作成ガイド](../docs/PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md) に従う
- 必須記載項目の自動生成
- `Closes #[Issue番号]` の自動記載
- テスト実行・品質チェック結果の確認

## 使用例

```
# オープンなIssueから自動選択して作業開始
/start-work
```

## Issue選択ルール

### 優先順位
1. **子チケット優先**: タイトルに `[親チケット]` がないもの
2. **優先度順**: `priority:P0` > `priority:P1` > `priority:P2`
3. **作業規模順**: `size:S` > `size:M` > `size:L`
4. **作成日時順**: 新しいものを優先

## 作業ルール（CLAUDE.md準拠）

**詳細は [CLAUDE.md](../CLAUDE.md) を必ず確認すること**

### 🚨 ブランチ戦略（絶対厳守）
- mainブランチ直接作業禁止
- フィーチャーブランチでの作業必須
- `git pull origin main` → ブランチ作成 → 実装 → PR作成

### TypeScript厳格モード
- 型定義必須、`any`禁止
- 実装前の型チェック必須
- インターフェース設計先行

### 段階的実装原則
- 最小単位での確認サイクル
- 新規コンポーネント・ストアのユニットテスト同時作成
- 既存テスト破綻の即座修正

### CI/CD品質ゲート対応
- 型インポート完全性の確保
- テスト契約と実装の同期
- 段階的品質チェック
- デバッグログ制御

## PR作成ルール（引用）

**詳細は [PR作成ガイド](../docs/PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md) を必ず確認すること**

### 必須記載項目
- **Summary**: 実装内容の概要を簡潔に記述
- **Root Cause Analysis**: 問題の根本原因分析と予防策
- **Test plan**: テスト方法や確認項目のチェックリスト
- **Issue関連付け**: `Closes #[Issue番号]` を必ず記載

## 参照情報

**詳細は以下を必ず確認してください：**
- [開発ワークフロー](../docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md) - ブランチ戦略・PR作成手順
- [CLAUDE.md](../CLAUDE.md) - 開発フロー・重要原則・アーキテクチャ
- [PR作成ガイド](../docs/PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md) - PR作成・テスト手順
- [Issue品質保証エージェント](create-issue.md) - Issue作成・ラベル体系・親子チケット管理
- [開発コマンド](../docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md) - npm scripts・自動化コマンド

### 関連コマンド
```bash
gh issue list --state open     # オープンなIssue一覧
npm run ci:all                 # 全品質チェック
npm run generate-types         # 型定義生成
npm run create-pr             # PR自動作成
```