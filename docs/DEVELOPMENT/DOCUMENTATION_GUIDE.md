# ドキュメント管理ガイド

> **対象**: 開発者・ドキュメント作成者
> **目的**: プロジェクトドキュメントの作成・管理指針を提供し、一貫性と保守性を確保

## 📋 クイックリファレンス

### ドキュメント構造の基本方針

```
プロジェクトルート:
├── README.md          → プロジェクト概要・クイックスタート
├── CLAUDE.md          → 開発ガイド・重要原則
│
docs/                  → 詳細ドキュメントハブ
├── README.md          → 全体索引（完全版）
├── DEVELOPMENT/       → 開発関連
├── ENVIRONMENT/       → 環境構築
├── CI/                → CI/CD日常運用
├── SECURITY/          → セキュリティ
├── PROJECT_MANAGEMENT/→ Issue・PR管理
└── INFRASTRUCTURE/    → CI/CDアーキテクチャ
│
技術ディレクトリ:      → 各ディレクトリにREADME配置
├── src/README.md      → ソースコード構造
├── tests/README.md    → テスト戦略
├── .github/README.md  → GitHub Actions
└── ...
```

### ドキュメント検索の流れ

1. **初めての方**: `/README.md` → `/CLAUDE.md`
2. **日常開発**: `/CLAUDE.md` のクイックリファレンス
3. **詳細調査**: `/docs/README.md` から該当カテゴリへ
4. **技術詳細**: 各ディレクトリのREADME

## 🎯 ドキュメント作成指針

### 1. README配置の原則

#### ✅ READMEを配置するディレクトリ

- **技術ディレクトリ**: src/, tests/, public/, scripts/
  - 理由: 開発者がディレクトリを開いた際に即座に概要確認可能
  - 内容: ディレクトリ構造、使用方針、注意事項

- **インフラディレクトリ**: .github/, .vscode/, supabase/
  - 理由: 設定・環境に関するコンテキスト説明
  - 内容: 設定方法、トラブルシューティング

- **docsサブディレクトリ**: docs/CI/, docs/SECURITY/ 等
  - 理由: 複数ファイルの使い分けガイドが必要
  - 例: [docs/CI/README.md](../CI/README.md) - 3つのCI/CDドキュメントの使い分け

#### ❌ READMEを配置しないディレクトリ

- **小規模サブディレクトリ**: 6-10行程度の内容
  - 対応: 親ディレクトリのREADMEに統合
  - 例: tests/fixtures/, tests/helpers/ → tests/README.mdに統合済み

- **docs/配下のカテゴリディレクトリ**: DEVELOPMENT/, ENVIRONMENT/ 等
  - 理由: docs/README.mdで一元管理
  - 例外: 複数ファイルの使い分けが必要な場合のみ

### 2. ドキュメントの役割分担

| ドキュメント | 対象者 | 内容 | 文量目安 |
|------------|--------|------|----------|
| **/README.md** | 全員 | プロジェクト概要、セットアップ | 100-200行 |
| **/CLAUDE.md** | 開発者 | 開発フロー、重要原則、頻用コマンド | 150-250行 |
| **docs/README.md** | 開発者 | ドキュメント索引（完全版） | 100-150行 |
| **docs/DEVELOPMENT/** | 開発者 | 開発ワークフロー、アーキテクチャ | カテゴリ別 |
| **技術README** | 開発者 | 各ディレクトリの詳細仕様 | 200-800行 |

### 3. 重複を避ける相互参照パターン

#### ❌ 避けるべきパターン

```markdown
<!-- CLAUDE.md と DEVELOPMENT_COMMANDS.md の両方に同じ内容 -->
## コマンド一覧
npm run dev
npm run build
npm run test
... 50行以上のコマンド説明 ...
```

#### ✅ 推奨パターン

```markdown
<!-- CLAUDE.md: クイックリファレンス -->
## 頻用コマンド
npm run dev          # 開発サーバー起動
npm run ci:all       # 全品質チェック
npm run auto-issue   # Issue自動実装

詳細コマンド: [docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md](docs/DEVELOPMENT/DEVELOPMENT_COMMANDS.md)

<!-- DEVELOPMENT_COMMANDS.md: 完全版 -->
# 開発コマンド（完全版）
> **クイックリファレンス**: [CLAUDE.md](../../CLAUDE.md) の頻用コマンドを参照
...
```

### 4. リダイレクトファイルのパターン

統合・移動したドキュメントには明確なリダイレクトファイルを残す：

```markdown
# [ドキュメント名]

> **📌 このドキュメントは[移動/統合/再構成]されました**
>
> [理由の簡潔な説明]

## 📚 移行先ドキュメント

👉 **[新ドキュメント名](リンク)**
- 移行内容1
- 移行内容2

## 🔍 内容の検索ガイド

| 探している内容 | 参照ドキュメント |
|--------------|----------------|
| **項目1** | [ドキュメント1](リンク) |
| **項目2** | [ドキュメント2](リンク) |
```

**例**:
- [BEST_PRACTICES.md](BEST_PRACTICES.md) - CLAUDE.md、DEVELOPMENT_WORKFLOW.md、CODE_PATTERNS.mdに再配分
- [CODING_STANDARDS.md](CODING_STANDARDS.md) - BEST_PRACTICES.mdに統合

## 📁 現在のドキュメント構成

### docs/DEVELOPMENT/ 配下 (7ファイル)

| ファイル | 行数 | 役割 | 状態 |
|---------|------|------|------|
| ARCHITECTURE.md | 259 | システムアーキテクチャ・技術スタック | ✅ 維持 |
| DEVELOPMENT_WORKFLOW.md | 326 | 開発フロー・ブランチ戦略・PR作成 | ✅ 維持 |
| DEVELOPMENT_COMMANDS.md | 124 | コマンド一覧（完全版） | ✅ 維持 |
| CODE_PATTERNS.md | 465 | Vue 3/TypeScriptコードパターン集 | ✅ 新規 |
| BEST_PRACTICES.md | 80 | リダイレクトファイル | ✅ 再構成済み |
| CODING_STANDARDS.md | 29 | リダイレクトファイル | ✅ 維持 |
| COVERAGE_ENHANCEMENT_PLAN.md | - | アーカイブ済み | 📦 移動 |

### プロジェクト全体のREADME (14個 → 11個)

**維持するREADME (11個)**:
- ルート: README.md, CLAUDE.md
- docs: docs/README.md, docs/CI/README.md
- 技術: src/, tests/, tests/e2e/, public/
- インフラ: scripts/, supabase/, .github/, .vscode/

**統合済み**:
- tests/fixtures/README.md → tests/README.md
- tests/helpers/README.md → tests/README.md
- BEST_PRACTICES.md → リダイレクト化

## 🔄 ドキュメント更新フロー

### 新規ドキュメント作成

```bash
# 1. 必要性を確認
# - 既存ドキュメントに追記で済まないか？
# - 独立したドキュメントが必要か？

# 2. Issue作成
gh issue create --title "[docs] [対象]ドキュメント作成" \
  --label "priority:P1,size:S,type-quality:docs,component:documentation"

# 3. 作業開始
npm run start-issue [issue番号]

# 4. ドキュメント作成
# - テンプレート使用（下記参照）
# - 相互参照リンク設定

# 5. docs/README.mdに追加
# - 該当カテゴリに行追加

# 6. PR作成
npm run create-pr
```

### 既存ドキュメント更新

- **技術変更時**: 同じPRで関連ドキュメントを更新
- **重要な変更**: 変更履歴セクションに記録
- **定期レビュー**: 四半期ごとに整合性確認

### ドキュメント統合・整理

```bash
# Phase 1: 分析
# - 重複内容の特定
# - 役割の明確化
# - 統合方針の決定

# Phase 2: 実施
# - コンテンツの移行
# - リダイレクトファイル作成
# - 相互参照更新

# Phase 3: 検証
# - リンク切れチェック
# - 新規参加者による検証
# - メンテナンス負荷の評価
```

## 📝 ドキュメントテンプレート

### 技術READMEテンプレート

```markdown
# [ディレクトリ名] - [役割]

> **対象**: [対象者]
> **目的**: [目的の簡潔な説明]

## 📋 概要

[ディレクトリの目的・役割]

## 📁 ディレクトリ構造

\```
[ディレクトリツリー]
\```

## 🚀 使用方法

### [セクション1]
[具体的な使用手順]

### [セクション2]
[設定方法等]

## 💡 ベストプラクティス

- [推奨事項1]
- [推奨事項2]

## 🚨 注意事項

- [注意点1]
- [注意点2]

## 🔧 トラブルシューティング

### [問題1]
**症状**: [説明]
**解決策**: [手順]

## 🔗 関連ドキュメント

- [関連ドキュメント1](リンク)
- [関連ドキュメント2](リンク)
```

### docs/配下ドキュメントテンプレート

```markdown
# [ドキュメントタイトル]

> **対象**: [対象者]
> **関連**: [関連ドキュメント]

## 📋 目次

- [セクション1](#セクション1)
- [セクション2](#セクション2)

## [セクション1]

### [サブセクション]

[内容]

## 📚 関連ドキュメント

- **[ドキュメント1](リンク)** - 説明
- **[ドキュメント2](リンク)** - 説明

---

**最終更新**: YYYY-MM-DD
**変更履歴**: [主要な変更内容]
```

## 🎯 ドキュメント品質基準

### 必須項目

- ✅ **明確な対象者**: 誰が読むべきかを明示
- ✅ **実装との一致**: 実際のコード・設定と整合性
- ✅ **相互参照**: 関連ドキュメントへのリンク
- ✅ **更新日付**: 最終更新日を記載

### 推奨項目

- 🎯 **具体例**: コードスニペット、コマンド例
- 🎯 **トラブルシューティング**: よくある問題と解決策
- 🎯 **ベストプラクティス**: 推奨パターン
- 🎯 **注意事項**: 落とし穴、制約事項

### 避けるべきこと

- ❌ **情報の重複**: 複数箇所で同じ内容を記載
- ❌ **抽象的な内容**: 具体例のない抽象論
- ❌ **古い情報**: 実装と乖離した内容
- ❌ **過度な詳細**: 必要以上の情報量

## 📊 ドキュメント整理の実績

### 2025-11-25: SECURITY/ 統合

- 5つのファイルを統合・再構成
- 重複削減、役割明確化

### 2025-11-29: CI/CD 統合

- CI_CD_GUIDE.md、CI_CD_BEST_PRACTICES.md、CI_CD_TESTING.mdを統合
- CI_CD_DEVELOPER_GUIDE.md（単一ドキュメント）に統合
- ワークフロー詳細は .github/workflows/TESTING.md に分離

### 2025-12-01: DEVELOPMENT/ 整理

- BEST_PRACTICES.mdを再構成（CLAUDE.md、DEVELOPMENT_WORKFLOW.md、CODE_PATTERNS.mdに再配分）
- COVERAGE_ENHANCEMENT_PLAN.mdをアーカイブ化（Phase 1完了）
- 重複削減、検索性向上

## 🔗 関連ドキュメント

- **[docs/README.md](../README.md)** - ドキュメント全体索引
- **[DOCUMENTATION_CONSOLIDATION_PLAN.md](../DOCUMENTATION_CONSOLIDATION_PLAN.md)** - 統合計画（提案中）
- **[Issue作成ガイド](../PROJECT_MANAGEMENT/ISSUE_CREATION_GUIDE.md)** - ドキュメント関連Issue作成
- **[開発ワークフロー](DEVELOPMENT_WORKFLOW.md)** - ドキュメント更新を含む開発フロー

---

**最終更新**: 2025-12-01
**変更履歴**: 実践的な内容に全面更新、DOCUMENTATION_CONSOLIDATION_PLAN.mdの内容統合
