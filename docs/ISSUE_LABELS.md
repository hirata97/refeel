# ラベル体系

## 🏷️ 新しいラベル管理システム

### 優先度ラベル（priority:）

- `priority:P0` - 最高優先度（緊急・重要）🔴
- `priority:P1` - 高優先度（重要）🟡  
- `priority:P2` - 中優先度（通常）🔵

### サイズラベル（size:）

- `size:S` - 小規模（1-2日）🔴
- `size:M` - 中規模（3-5日）🟡
- `size:L` - 大規模（1週間以上）🔵

### 実装内容ラベル（type-分類:）

#### 基本的な作業タイプ（type-basic:）

- `type-basic:bugfix` - バグ修正🔴
- `type-basic:enhancement` - 既存機能改善🟠
- `type-basic:feature` - 新機能追加🟢
- `type-basic:refactor` - リファクタリング🟣

#### インフラ・技術タイプ（type-infra:）

- `type-infra:automation` - 自動化・スクリプト🟠
- `type-infra:ci-cd` - CI/CD・パイプライン🔵
- `type-infra:performance` - パフォーマンス改善🔵
- `type-infra:security` - セキュリティ🔴

#### 品質・ドキュメントタイプ（type-quality:）

- `type-quality:docs` - ドキュメント🔵
- `type-quality:test` - テスト関連🟡

### 特殊ラベル（z-）

- `z-good-first-issue` - 初心者向け
- `z-help-wanted` - コミュニティ協力歓迎

## 🤖 自動ラベリング機能

GitHub Actionsによる自動ラベル付与機能が設定済みです：

- Issue作成時に作成者を自動アサイン
- タイトル・本文から適切なtypeラベルを自動判定
- 緊急キーワード検出時に`priority:P0`を自動付与
- 日本語・英語両方のキーワードに対応

## ラベル使用ガイドライン

### Issue作成時

1. **必須ラベル**: priority、size、type のいずれか1つずつ
2. **自動付与**: typeラベルは自動判定される
3. **手動調整**: 自動判定が不正確な場合は手動で修正

### 例：適切なラベル付与

```
タイトル: ログイン機能のバグ修正
ラベル: priority:P1, size:S, type-basic:bugfix
```

```
タイトル: 新しいダッシュボード機能の追加
ラベル: priority:P2, size:L, type-basic:feature
```

## ラベル管理

### 新しいラベルの追加

新しいラベルが必要な場合：

1. GitHub Issues でラベル一覧を確認
2. 既存の命名規則に従って作成
3. 自動化スクリプトへの追加も検討