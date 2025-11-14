# .github/ - CI/CD・Issue管理・GitHub設定

このディレクトリには、GitHub固有の設定ファイル、CI/CDワークフロー、Issue/PRテンプレートが含まれています。

## 📋 目次

- [概要](#概要)
- [ディレクトリ構成](#ディレクトリ構成)
- [GitHub Actions ワークフロー](#github-actions-ワークフロー)
- [Issue・PRテンプレート](#issueprテンプレート)
- [Dependabot設定](#dependabot設定)
- [ラベル管理](#ラベル管理)
- [ワークフロー保守](#ワークフロー保守)
- [トラブルシューティング](#トラブルシューティング)

## 概要

`.github/` ディレクトリは、GitHubプラットフォーム固有の自動化・テンプレート・設定を管理します。

### 主な機能

- **CI/CD自動化**: GitHub Actionsによる品質チェック・テスト・デプロイ
- **Issue管理**: テンプレートによる構造化されたIssue作成
- **PR品質ゲート**: 自動品質チェック・レビュー支援
- **依存関係更新**: Dependabotによる自動アップデート
- **ラベル自動化**: Issue/PR自動ラベリング

## ディレクトリ構成

```
.github/
├── README.md                          # このファイル
├── COMMIT_GUIDELINES.md               # コミットメッセージガイドライン
├── ISSUE_VERIFICATION_CHECKLIST.md    # Issue検証チェックリスト
├── dependabot.yml                     # Dependabot自動更新設定
│
├── workflows/                         # GitHub Actions ワークフロー
│   ├── ci.yml                         # 統合CI（lint, type-check, test, build）
│   ├── pr-quality-gate.yml            # PR品質ゲート
│   ├── e2e-tests.yml                  # E2Eテスト
│   ├── deploy.yml                     # Vercelデプロイ
│   ├── type-generation.yml            # Supabase型定義自動生成
│   ├── AutoLabel.yml                  # 自動ラベリング
│   ├── issue-audit.yml                # Issue監査
│   └── auto-close-issues.yml          # 古いIssue自動クローズ
│
└── ISSUE_TEMPLATE/                    # Issueテンプレート
    ├── bug_report.yml                 # バグ報告
    ├── feature_request.yml            # 機能要望
    ├── enhancement.yml                # 機能改善
    └── config.yml                     # Issue作成画面設定
```

## GitHub Actions ワークフロー

### CI/CD ワークフロー一覧

| ワークフロー | トリガー | 目的 | 実行時間 |
|------------|---------|------|---------|
| **ci.yml** | PR, push to main | 品質チェック統合 | 2-3分 |
| **pr-quality-gate.yml** | PR作成・更新 | PR品質ゲート | 3-4分 |
| **e2e-tests.yml** | PR, 手動実行 | E2Eテスト | 5-10分 |
| **deploy.yml** | push to main | Vercel本番デプロイ | 1-2分 |
| **type-generation.yml** | 手動実行 | Supabase型定義生成 | 30秒 |
| **AutoLabel.yml** | Issue/PR作成 | 自動ラベル付与 | 10秒 |
| **issue-audit.yml** | 毎週月曜 | Issue状態監査 | 30秒 |
| **auto-close-issues.yml** | 毎日 | 古いIssue自動クローズ | 30秒 |

### ci.yml - 統合CI

**目的**: PR・mainブランチのコード品質を保証

**実行内容**:
```yaml
jobs:
  lint-and-format:    # ESLint + Prettier
  type-check:         # TypeScript型チェック
  unit-tests:         # Vitestユニットテスト
  security-audit:     # npm audit（脆弱性チェック）
  build-check:        # Viteビルド確認
```

**品質ゲート条件**:
- ✅ ESLint警告0件
- ✅ TypeScript型エラー0件
- ✅ ユニットテスト全成功
- ✅ カバレッジ閾値達成
- ✅ ビルド成功

### pr-quality-gate.yml - PR品質ゲート

**目的**: PRマージ前の包括的品質検証

**追加チェック**:
- コミットメッセージ規約準拠
- PR説明文必須項目確認
- ラベル設定確認
- レビュアー指定確認

### e2e-tests.yml - E2Eテスト

**目的**: 実際のブラウザ環境での動作確認

**対応ブラウザ**:
- Chromium（必須）
- Firefox
- WebKit（Safari相当）

**実行戦略**:
```yaml
matrix:
  browser: [chromium, firefox, webkit]
```

**成果物保存**:
- テストレポート（7日間保持）
- スクリーンショット（失敗時、3日間保持）
- トレースファイル（デバッグ用）

### deploy.yml - Vercelデプロイ

**トリガー**: `main`ブランチへのpush

**デプロイフロー**:
1. ビルド実行（`npm run build`）
2. Vercel自動デプロイ（Vercel統合経由）
3. デプロイ結果通知

### type-generation.yml - 型定義自動生成

**目的**: Supabaseスキーマ変更時の型定義更新

**実行方法**:
```bash
gh workflow run type-generation.yml
```

**処理内容**:
1. Supabase接続（本番DB）
2. スキーマ取得
3. TypeScript型定義生成（`src/types/database.ts`, `src/types/supabase.ts`）
4. 自動コミット・PR作成

**注意**: 本番DB接続のため、実行には適切な権限が必要

### AutoLabel.yml - 自動ラベリング

**目的**: Issue/PR作成時の自動ラベル付与

**ラベリングルール**:
- ファイルパス基準: `src/stores/**` → `type-basic:feature`
- キーワード基準: "bug", "fix" → `type-basic:bug`
- PR基準: draft → `status:draft`

### issue-audit.yml - Issue監査

**実行**: 毎週月曜9:00（JST）

**監査項目**:
- 長期未対応Issue（30日以上）
- ラベル未設定Issue
- アサイン未設定Issue（P0/P1）

**アクション**: Slackコメント投稿（将来実装）

### auto-close-issues.yml - 古いIssue自動クローズ

**実行**: 毎日0:00（JST）

**クローズ条件**:
- 90日間活動なし
- `status:stale` ラベル付与後7日経過

## Issue・PRテンプレート

### Issueテンプレート

**利用可能なテンプレート**:

1. **bug_report.yml** - バグ報告
   - 再現手順
   - 期待動作 vs 実際動作
   - 環境情報（ブラウザ、OS）

2. **feature_request.yml** - 新機能要望
   - 背景・目的
   - 提案内容
   - 受け入れ条件

3. **enhancement.yml** - 既存機能改善
   - 改善対象機能
   - 改善提案
   - 期待効果

### テンプレート使用方法

**Issue作成時**:
1. `New Issue` クリック
2. テンプレート選択
3. フォーム入力
4. `Submit new issue`

**カスタマイズ**:
- `.github/ISSUE_TEMPLATE/` 内のYAMLファイル編集
- `config.yml` でテンプレート表示設定

### PRテンプレート

現在はテンプレート未設定。PR作成時は以下を含めること：

```markdown
## Summary
[実装内容の概要]

## Root Cause Analysis
[問題の根本原因分析]

## Test plan
- [ ] ユニットテスト追加
- [ ] E2Eテスト確認
- [ ] 手動テスト実施

Closes #[Issue番号]
```

**詳細**: `docs/PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md` 参照

## Dependabot設定

### 概要

`dependabot.yml` は依存関係の自動更新を管理します。

### 更新対象

**npm パッケージ**:
- スケジュール: 毎週月曜9:00（JST）
- グループ化: Vue、TypeScript、テスト、Lintingツール
- セキュリティパッチ: 優先的に自動更新

**GitHub Actions**:
- スケジュール: 毎週月曜10:00（JST）
- アクションバージョン自動更新

### グループ化戦略

```yaml
groups:
  vue-ecosystem:   # Vue.js関連
  testing:         # テスト関連
  linting:         # ESLint, Prettier
  typescript:      # TypeScript, @types/*
```

### PR設定

- **上限**: 5件まで同時オープン
- **ラベル**: `type-infra:dependencies`, `priority:P2`, `auto-dependency-update`
- **レビュアー**: 自動アサイン

### セキュリティアップデート

**優先度**: P0（最優先）

**対象**:
- 直接依存関係のセキュリティパッチ
- 間接依存関係の重大な脆弱性

**自動マージ**: 検討中（現在は手動マージ）

## ラベル管理

### ラベル体系

**優先度**:
- `priority:P0`: 緊急（即時対応）
- `priority:P1`: 高優先度（重要）
- `priority:P2`: 中優先度（通常）
- `priority:P3`: 低優先度（余裕時）

**サイズ**:
- `size:S`: 小規模（1-2日）
- `size:M`: 中規模（3-5日）
- `size:L`: 大規模（1週間以上）

**タイプ**:
- `type-basic:bug`: バグ修正
- `type-basic:feature`: 新機能
- `type-basic:refactor`: リファクタリング
- `type-infra:ci-cd`: CI/CD関連
- `type-quality:docs`: ドキュメント

**詳細**: `docs/PROJECT_MANAGEMENT/ISSUE_CREATION_GUIDE.md` 参照

### ラベル自動付与

`AutoLabel.yml` ワークフローが自動的にラベル付与:

- ファイルパスベース
- コミットメッセージキーワード
- PR説明文キーワード

## ワークフロー保守

### ワークフロー変更手順

**手順**:
1. **ローカルテスト**: [act](https://github.com/nektos/act) で検証（推奨）
   ```bash
   act -j lint-and-format
   ```

2. **ブランチ作成**: `feature/workflow-[変更内容]`
   ```bash
   git checkout -b feature/workflow-update-ci
   ```

3. **ワークフローファイル編集**: `.github/workflows/[ワークフロー名].yml`

4. **コミット・プッシュ**:
   ```bash
   git add .github/workflows/
   git commit -m "ci: update CI workflow for [変更内容]"
   git push -u origin feature/workflow-update-ci
   ```

5. **PR作成・確認**: ワークフロー実行結果を確認

6. **マージ**: レビュー後にmainブランチへマージ

### ワークフロー無効化

**一時的に無効化**:
```yaml
# ワークフローファイルの先頭に追加
on:
  workflow_dispatch:  # 手動実行のみ
```

**完全無効化**: ファイル削除またはリネーム（`.yml.disabled`）

### シークレット管理

**設定場所**: GitHub Settings → Secrets and variables → Actions

**必要なシークレット**:
- `VITE_SUPABASE_URL`: Supabase URL
- `VITE_SUPABASE_KEY`: Supabase Anon Key
- `VERCEL_TOKEN`: Vercelデプロイトークン（deploy.yml用）
- `SUPABASE_ACCESS_TOKEN`: 型生成用トークン

**追加方法**:
```bash
gh secret set SECRET_NAME --body "value"
```

## トラブルシューティング

### ワークフロー失敗時の調査

**手順**:
1. **GitHub Actions タブ**: 失敗したワークフロー確認
2. **ログ確認**: 各ジョブのログ詳細確認
3. **ローカル再現**: `act` または `npm run ci:all` で再現
4. **修正・再実行**:
   ```bash
   gh run rerun [run-id]
   ```

### よくある問題

#### 1. タイムアウトエラー

**原因**: ジョブ実行時間が制限超過（デフォルト60分）

**解決策**:
```yaml
jobs:
  job-name:
    timeout-minutes: 30  # タイムアウト調整
```

#### 2. npm依存関係エラー

**原因**: `package-lock.json` 不整合

**解決策**:
```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: update package-lock.json"
```

#### 3. キャッシュ問題

**原因**: 古いキャッシュが原因の失敗

**解決策**:
```bash
# GitHub Settings → Actions → Caches → 該当キャッシュ削除
gh cache delete [cache-id]
```

または、ワークフローでキャッシュキー変更：
```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    key: ${{ runner.os }}-node-v2-${{ hashFiles('**/package-lock.json') }}
    # ↑ v2にインクリメント
```

#### 4. 権限エラー

**原因**: GitHub Token権限不足

**解決策**:
```yaml
permissions:
  contents: write  # 必要な権限を追加
  pull-requests: write
```

### ワークフロー再実行

**全体再実行**:
```bash
gh run rerun [run-id]
```

**失敗したジョブのみ再実行**:
```bash
gh run rerun [run-id] --failed
```

## 参考資料

### 公式ドキュメント
- [GitHub Actions](https://docs.github.com/en/actions)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests)

### ツール
- [act](https://github.com/nektos/act) - ローカルでGitHub Actions実行
- [GitHub CLI](https://cli.github.com/) - コマンドラインGitHub操作

### プロジェクト内関連ドキュメント
- `CLAUDE.md` - 開発フロー・重要原則
- `docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md` - 開発ワークフロー
- `docs/PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md` - PR作成ガイド
- `docs/INFRASTRUCTURE/CI_CD_OVERVIEW.md` - CI/CD概要（作成予定）

---

**最終更新**: 2025-11-14
**メンテナー**: GoalCategorizationDiary開発チーム
