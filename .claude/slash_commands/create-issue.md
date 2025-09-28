# Create Issue Command

このコマンドはGitHub Issueを効率的に作成します。

**重要**: 全てのルール・規則は [Issue作成ガイド](../docs/PROJECT_MANAGEMENT/ISSUE_CREATION_GUIDE.md) に従うこと。

## 基本方針

- **タイトル形式**: ISSUE_CREATION_GUIDE.mdの「📋 Issueタイトル・説明規則」に従うこと
- **ラベル体系**: ISSUE_CREATION_GUIDE.mdの「🏷️ ラベル体系（必須設定）」に従うこと
- **親子チケット管理**: ISSUE_CREATION_GUIDE.mdの「👨‍👩‍👧‍👦 親チケット・子チケット管理」に従うこと
- **テンプレート**: ISSUE_CREATION_GUIDE.mdの「📝 Issue説明テンプレート」に従うこと

## 使用方法

```
/create-issue [タイトル] --type=[type] [オプション]
```

### パラメータ
- **title**: Issue タイトル（ISSUE_CREATION_GUIDE.mdのタイトル形式に従う）
- **type**: 作業種別（上記Type選択肢から）
- **--priority=[P0/P1/P2]** - 優先度（デフォルト: P2）
- **--size=[S/M/L]** - 作業規模（デフォルト: S）
- **--component=[component]** - 関連コンポーネント
- **--parent=[番号]** - 親チケット番号（子チケット作成時）
- **--parent-ticket** - 親チケットとして作成
- **--template=[template]** - テンプレート選択（bug/feature/enhancement/docs）

## 使用例

### 基本的なIssue作成
```
/create-issue "ログイン画面のパスワード保存機能" --type=basic:feature --priority=P1 --size=S --component=auth
```

### バグ報告（ISSUE_CREATION_GUIDE.mdのバグ報告テンプレート使用）
```
/create-issue "ログイン時のエラーハンドリング不具合" --type=type-basic:bugfix --template=bug --priority=P0 --component=auth
```

### 親チケット作成（ISSUE_CREATION_GUIDE.mdの命名規則に従う）
```
/create-issue "[親チケット] ユーザー認証システム強化" --type=type-basic:feature --priority=P1 --size=L
```

### 子チケット作成（親チケット関連付け）
```
/create-issue "パスワード強度チェック機能追加" --type=type-infra:security --parent=123 --size=S --component=security
```

### ドキュメント作成（README.md系）
```
/create-issue "src/ディレクトリREADME.md作成" --type=type-quality:docs --template=docs --size=S --component=documentation
```

## 自動生成される内容
詳細は [Issue作成ガイド](../docs/PROJECT_MANAGEMENT/ISSUE_CREATION_GUIDE.md) を参照

### 親子チケット関連付け・Issue管理フロー
詳細は [Issue作成ガイド](../docs/PROJECT_MANAGEMENT/ISSUE_CREATION_GUIDE.md) を参照

## 参照情報

**詳細は必ずISSUE_CREATION_GUIDE.mdを確認してください：**
- [Issue作成ガイド](../docs/PROJECT_MANAGEMENT/ISSUE_CREATION_GUIDE.md)
- Issue検索・フィルタリング方法
- Issue分析・レポート方法
- 関連ドキュメント一覧

### GitHub CLI要件
1. **GitHub CLI必須**: `gh` コマンドが利用可能な環境が必要
2. **認証確認**: `gh auth status` で認証状態を確認
3. **リポジトリ**: 適切なGitリポジトリ内で実行
4. **ラベル存在確認**: ISSUE_CREATION_GUIDE.mdに記載されたラベルが存在することを確認

### 確認コマンド
詳細は [Issue作成ガイド](../docs/PROJECT_MANAGEMENT/ISSUE_CREATION_GUIDE.md) を参照