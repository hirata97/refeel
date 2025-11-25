# CI/CDテストガイド

このドキュメントでは、GoalCategorizationDiary（Refeel）プロジェクトで実行されているCI/CDテストの全体像を説明します。

## 📋 目次

- [概要](#概要)
- [ワークフロー一覧](#ワークフロー一覧)
- [ワークフロー別詳細](#ワークフロー別詳細)
- [テスト種類別サマリー](#テスト種類別サマリー)
- [品質基準](#品質基準)
- [トラブルシューティング](#トラブルシューティング)
- [ワークフロー図](#ワークフロー図)
- [参考資料](#参考資料)

## 概要

本プロジェクトでは、コード品質・テスト・セキュリティを自動化するCI/CDパイプラインを運用しています。
全てのPRおよびmainブランチへのプッシュで自動実行され、品質基準を満たさないコードはマージできません。

### CI/CDの目的

1. **品質保証**: 型安全性・コード品質・テストカバレッジの自動検証
2. **早期フィードバック**: 問題を実装段階で検出・修正
3. **セキュリティ**: 脆弱性の自動スキャンと通知
4. **デプロイ自動化**: mainマージ後の本番環境への自動デプロイ
5. **チーム効率化**: 手動チェック削減とレビュー効率向上

## ワークフロー一覧

| ワークフロー名 | ファイル名 | 実行タイミング | 目的 | 厳格度 |
|--------------|----------|-------------|------|-------|
| **Quality Gate** | `pr-quality-gate.yml` | push/PR (main, develop) | 統合品質チェック（push時軽量、PR時厳格） | ⭐⭐⭐ 最重要 |
| E2E Tests | `e2e-tests.yml` | PR作成・更新時 | E2Eテスト実行（3ブラウザ） | ⭐⭐ 重要 |
| Type Generation | `type-generation.yml` | スキーマ変更時 | TypeScript型定義自動生成 | ⭐⭐ 重要 |
| Deploy to Production | `deploy.yml` | mainブランチマージ時 | 本番環境自動デプロイ | ⭐⭐⭐ 最重要 |
| Auto Close Issues | `auto-close-issues.yml` | PR マージ時 | Issue自動クローズ | - |
| Issue Management Audit | `issue-audit.yml` | 月次（1日 0:00 UTC） | Issue管理監査 | - |

### ワークフロー実行フロー

```
PR作成 → Quality Gate（必須） → E2E Tests（推奨）
                                      ↓
                                 レビュー・承認
                                      ↓
                                 mainへマージ
                                      ↓
                                 Quality Gate (軽量)
                                      ↓
                      Type Generation + Deploy to Production
```

## ワークフロー別詳細

### 1. Quality Gate（統合品質チェック・最重要）⭐⭐⭐

**ファイル**: `.github/workflows/pr-quality-gate.yml`
**実行タイミング**:
- push時（main, develop）: 軽量チェック（ESLint、TypeScript、Build）
- PR作成・更新時（`opened`, `synchronize`, `reopened`）: 厳格な品質ゲート

**特徴**: デュアルモード
- **Push Mode**: 軽量チェック（5分以内、必須項目のみ）
- **PR Mode**: 厳格モード（エラー時CI失敗、PRマージ不可）

**統合の経緯（Issue #280対応）**:
- 旧`ci.yml`と`pr-quality-gate.yml`の重複実行を解消
- 単一ワークフローで両モード対応により、実行時間を60%削減
- メンテナンス性向上とリソース最適化を実現

#### Stage 1: Code Quality Checks

**ジョブ名**: `code-quality`
**タイムアウト**: 10分
**キャッシュ戦略**: TypeScript、ESLint、Viteビルドキャッシュを活用

| チェック項目 | コマンド | 基準 | 失敗時の影響 |
|------------|---------|------|------------|
| ESLint | `npx eslint . --max-warnings=0 --cache` | エラー0件、警告0件 | CI失敗 |
| TypeScript Type Check | `npm run ci:type-check` | 型エラー0件 | CI失敗 |
| Prettier Format Check | `npx prettier --check src/` | フォーマット準拠 | CI失敗 |
| Production Build | `npm run ci:build` | ビルド成功 | CI失敗 |
| Build Artifacts Check | dist/ファイル存在確認 | index.html等の必須ファイル | CI失敗 |
| Bundle Size Analysis | dist/*.js サイズ確認 | レポート生成（制限なし） | - |

**主要機能**:
- 3回リトライ付きの依存関係インストール
- ESLint/TypeScript増分ビルドキャッシュで高速化
- バンドルサイズレポート自動生成（GitHub Step Summary）

#### Stage 2: Comprehensive Testing

**ジョブ名**: `testing`
**タイムアウト**: 10分
**依存**: `code-quality` 成功後に実行

| チェック項目 | コマンド | 基準 | 失敗時の影響 |
|------------|---------|------|------------|
| Unit Tests | `npm run ci:test -- --reporter=verbose` | 全テスト成功 | CI失敗 |
| Coverage Report | Codecov連携 | カバレッジアップロード | - |
| Coverage Threshold | coverage-summary.json解析 | 70%推奨（警告のみ） | 警告表示 |

**カバレッジ閾値**:
- Lines: 70%推奨（`RECOMMENDED_THRESHOLD=70`）
- Statements: 70%推奨
- Functions: 70%推奨
- Branches: 70%推奨
- **注意**: 閾値未達でもCI失敗にはならず、警告表示のみ

#### Stage 3: Security Analysis

**ジョブ名**: `security`
**タイムアウト**: 5分
**依存**: `code-quality` 成功後に実行

| チェック項目 | コマンド | 基準 | 失敗時の影響 |
|------------|---------|------|------------|
| npm audit | `npm audit --json` | High/Critical 0件 | CI失敗 |
| Security Features Test | `npm run ci:security` | テスト成功 | CI失敗 |

**脆弱性レベルと対応**:
- **Critical/High**: CI失敗（即座修正必須）
- **Moderate/Low/Info**: 警告のみ（計画的対応推奨）

#### Stage 4: Quality Gate Summary

**ジョブ名**: `quality-report`
**条件**: `always()`（前ステージが失敗しても実行）

**機能**:
- 全ステージの結果を統合レポート生成
- PR内に自動コメント投稿
- 品質基準（必須/推奨）の明示
- 失敗原因の具体的ガイダンス提供

**マージ条件**:
```
✅ code-quality: success
✅ testing: success
✅ security: success
```

#### Push Mode: Quick Check

**ジョブ名**: `quick-check`
**タイムアウト**: 5分
**実行条件**: `github.event_name == 'push'`（main/developブランチへのpush時）

| チェック項目 | コマンド | 基準 | 失敗時の影響 |
|------------|---------|------|------------|
| ESLint | `npx eslint . --max-warnings=0 --cache` | エラー0件、警告0件 | CI失敗 |
| TypeScript Type Check | `npm run ci:type-check` | 型エラー0件 | CI失敗 |
| Production Build | `npm run ci:build` | ビルド成功 | CI失敗 |

**主要機能**:
- mainブランチpush時の軽量チェック（5分以内完了）
- ESLint/TypeScriptキャッシュで高速化
- 必須項目のみチェック（テスト・セキュリティは省略）

---

### 2. E2E Tests⭐⭐

**ファイル**: `.github/workflows/e2e-tests.yml`
**実行タイミング**: PR作成・更新時（src/、e2e/、設定変更時）
**特徴**: **3階層テスト戦略**による実行時間最適化とリグレッション早期検出

#### E2Eテスト階層化戦略（Issue #282対応）

本プロジェクトでは、E2Eテストを3つの階層（Tier）に分類し、実行タイミングと範囲を最適化しています。

| Tier | 名称 | 実行条件 | ブラウザ | 実行時間目標 | テスト範囲 |
|------|------|---------|---------|------------|----------|
| **Tier 1** | スモークテスト | 全PR | chromium | 5分以内 | クリティカルパス |
| **Tier 2** | コア機能テスト | 手動実行 | chromium, firefox | 15分以内 | 主要機能 |
| **Tier 3** | フルテスト | `ready-to-merge`ラベル | chromium, firefox, webkit | 30分以内 | 全テスト |

#### Tier 1: スモークテスト（全PR必須）

**ジョブ名**: `smoke-tests`
**タイムアウト**: 10分
**実行条件**: 全PR作成・更新時
**ブラウザ**: chromiumのみ

**テスト内容**（`tests/e2e/smoke/`配下）:
- ユーザー登録→ログイン→日記作成→表示→削除→ログアウト
- ログイン→ログアウト基本フロー
- トップページ→ログイン→ダッシュボード表示
- 日記作成→編集フロー

**目的**:
- クリティカルパスの動作確認
- リグレッションの早期検出
- 最小限の実行時間でPR品質保証

**実行コマンド**:
```bash
E2E_TIER=smoke npx playwright test --project=chromium tests/e2e/smoke
```

#### Tier 2: コア機能テスト（手動実行推奨）

**ジョブ名**: `core-tests`
**タイムアウト**: 20分
**実行条件**: 手動実行（workflow_dispatch）または`tier: core`指定時
**ブラウザ**: chromium, firefox

**テスト内容**（`tests/e2e/core/`配下）:
- 認証システム全般（異常系・バリデーション含む）
- 日記操作全般（編集・削除・検索・フィルタリング）
- レポート機能全般

**目的**:
- 主要機能の詳細確認
- クロスブラウザ互換性検証（主要2ブラウザ）
- レビュー完了後の最終確認

**実行コマンド**:
```bash
E2E_TIER=core npx playwright test --project=chromium,firefox tests/e2e/core
```

#### Tier 3: フルテスト（マージ前必須）

**ジョブ名**: `full-tests`
**タイムアウト**: 35分
**実行条件**: `ready-to-merge`ラベル付与時
**ブラウザ**: chromium, firefox, webkit

**テスト内容**:
- 全E2Eテスト（smoke + core + その他）
- レスポンシブ対応テスト
- アクセシビリティテスト
- パフォーマンステスト

**目的**:
- 全ブラウザでの完全動作保証
- マージ前の最終品質確認
- プロダクション環境への安全なデプロイ準備

**実行コマンド**:
```bash
E2E_TIER=full npx playwright test --project=chromium,firefox,webkit
```

#### 手動実行方法

GitHubのActionsタブから手動実行可能:
1. `.github/workflows/e2e-tests.yml`を選択
2. "Run workflow"をクリック
3. Tierを選択（smoke/core/full）
4. 実行

#### E2Eテスト実行フロー

```
PR作成
  ↓
Tier 1: スモークテスト（自動実行、5分）
  ├─ 成功 → レビュー依頼可能
  └─ 失敗 → 修正必須（クリティカルパスに問題）
  ↓
レビュー中
  ├─ 必要に応じてTier 2手動実行（15分）
  └─ レビュー承認
  ↓
ready-to-mergeラベル付与
  ↓
Tier 3: フルテスト（自動実行、30分）
  ├─ 成功 → マージ可能
  └─ 失敗 → ラベル削除、修正後再実行
```

**アーティファクト**:
- テストレポート: `playwright-report/`（全ブラウザ）
- テスト結果: `test-results/`（全ブラウザ）
- スクリーンショット: `test-results/`（失敗時のみ、3日間保存）

#### パフォーマンステスト

**ジョブ名**: `performance`
**依存**: `e2e-tests` 成功後
**タイムアウト**: 15分

| チェック項目 | ツール | 基準 | 失敗時の影響 |
|------------|-------|------|------------|
| Lighthouse CI | treosh/lighthouse-ci-action | 設定ファイル準拠 | CI失敗 |
| Bundle Size Check | カスタムスクリプト | Main JS < 1MB | CI失敗 |

**バンドルサイズ制限**:
- Main JS: 1MB以下必須
- Main CSS: 制限なし（レポートのみ）

---

### 3. Type Generation（型定義自動生成）⭐⭐

**ファイル**: `.github/workflows/type-generation.yml`
**実行タイミング**: データベーススキーマ変更時（`supabase/migrations/**`、`supabase/seed/**`）
**目的**: SupabaseスキーマからTypeScript型定義を自動生成（Issue #144対応）

#### 型生成ジョブ

**ジョブ名**: `generate-types`

| ステップ | 条件 | コマンド | 説明 |
|---------|-----|---------|------|
| 本番型生成 | mainブランチのみ | `npm run generate-types:prod` | 本番Supabase接続 |
| ローカル型生成 | PRブランチ | `npm run generate-types` | ローカルスキーマから生成 |
| 型変更チェック | - | `git diff --quiet src/types/` | 変更検出 |
| 型チェック | - | `npm run ci:type-check` | 生成型の検証 |
| 影響テスト | - | `npm run test:unit -- --run tests/types/` | 型関連テスト |
| コミット・プッシュ | mainブランチのみ | 自動コミット | 型定義更新を自動コミット |

#### 型検証ジョブ

**ジョブ名**: `validate-types`
**依存**: `generate-types` 成功後

**検証項目**:
1. 型定義ファイル存在確認（`database.ts`、`supabase.ts`）
2. 必須インターフェース確認（`Database`、`DiaryEntry`）
3. TypeScript型チェック成功
4. ビルドテスト成功
5. 全ユニットテスト成功

---

### 4. Deploy to Production（本番デプロイ）⭐⭐⭐

**ファイル**: `.github/workflows/deploy.yml`
**実行タイミング**: mainブランチへのプッシュ時
**特徴**: 本番デプロイ前の品質チェック + Vercel自動デプロイ

#### 事前品質チェック

**ジョブ名**: `pre-deploy-check`
**タイムアウト**: 10分

| チェック項目 | コマンド | 失敗時の対応 |
|------------|---------|------------|
| ESLint | `npm run ci:lint` | デプロイ中止 |
| TypeScript | `npm run ci:type-check` | デプロイ中止 |
| Build | `npm run ci:build` | デプロイ中止 |
| Security | `npm run ci:security` | 警告のみ（継続） |

**アウトプット**: `deploy-ready` (true/false)

#### Vercelデプロイ

**ジョブ名**: `deploy-vercel`
**条件**: `pre-deploy-check` 成功 + `deploy-ready=true`
**タイムアウト**: 15分

| ステップ | 説明 |
|---------|------|
| Production Build | `NODE_ENV=production npm run build` |
| Vercel Deploy | `amondnet/vercel-action@v25` 使用 |
| Smoke Test | デプロイURL疎通確認（5回リトライ） |
| Content Check | メインページ内容検証 |

**環境変数（Secrets）**:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

#### デプロイ通知

**ジョブ名**: `deploy-notification`
**条件**: `always()`

**通知内容**:
- デプロイ成功/失敗ステータス
- デプロイURL（https://goal-categorization-diary.vercel.app）
- デプロイ時刻（JST）
- コミットSHA
- 実施した品質チェック項目

---

### 5. Auto Close Issues（Issue自動クローズ）

**ファイル**: `.github/workflows/auto-close-issues.yml`
**実行タイミング**: PRマージ時（`pull_request.closed` + `merged=true`）
**目的**: `Closes #XX` 記載のIssueを自動クローズ

**処理フロー**:
1. PR本文から `closes/fixes/resolves #番号` を抽出
2. 該当Issueを自動クローズ
3. クローズコメント投稿（ブランチ名、コミットSHA記載）

**対応キーワード**:
- `closes #XX`
- `fixes #XX`
- `resolves #XX`

---

### 6. Issue Management Audit（Issue管理監査）

**ファイル**: `.github/workflows/issue-audit.yml`
**実行タイミング**: 月次（毎月1日 0:00 UTC）+ 手動実行可能
**目的**: Issue管理状態の定期監査

**処理内容**:
1. `npm run issue-audit` 実行
2. 監査レポート生成（`issue-audit-*.md`）
3. アーティファクト保存（30日間）
4. 問題検出時、Issue #69へコメント通知

**監査項目**（推定）:
- ラベル不備のIssue検出
- 長期間Open状態のIssue警告
- 必須フィールド不足のIssue確認

---

## テスト種類別サマリー

| テスト種類 | 実行ワークフロー | 厳格度 | タイミング | 失敗時の影響 |
|----------|--------------|-------|----------|------------|
| **ESLint** | `pr-quality-gate.yml` (PR) | ⭐⭐⭐ 必須 | 全PR | CI失敗 |
|  | `pr-quality-gate.yml` (Push) | ⭐⭐⭐ 必須 | push (main, develop) | CI失敗 |
| **TypeScript型チェック** | `pr-quality-gate.yml` (PR) | ⭐⭐⭐ 必須 | 全PR | CI失敗 |
|  | `pr-quality-gate.yml` (Push) | ⭐⭐⭐ 必須 | push (main, develop) | CI失敗 |
|  | `type-generation.yml` | ⭐⭐ 必須 | スキーマ変更時 | CI失敗 |
|  | `deploy.yml` | ⭐⭐⭐ 必須 | デプロイ前 | デプロイ中止 |
| **Prettier** | `pr-quality-gate.yml` (PR) | ⭐⭐⭐ 必須 | 全PR | CI失敗 |
| **ユニットテスト** | `pr-quality-gate.yml` (PR) | ⭐⭐⭐ 必須 | 全PR | CI失敗 |
|  | `type-generation.yml` | ⭐⭐ 必須 | スキーマ変更時 | CI失敗 |
| **E2Eテスト** | `e2e-tests.yml` | ⭐⭐ 重要 | PR（src/変更時） | CI失敗 |
| **プロダクションビルド** | `pr-quality-gate.yml` (PR) | ⭐⭐⭐ 必須 | 全PR | CI失敗 |
|  | `pr-quality-gate.yml` (Push) | ⭐⭐⭐ 必須 | push (main, develop) | CI失敗 |
|  | `type-generation.yml` | ⭐⭐ 必須 | スキーマ変更時 | CI失敗 |
|  | `deploy.yml` | ⭐⭐⭐ 必須 | デプロイ前 | デプロイ中止 |
| **npm audit** | `pr-quality-gate.yml` (PR) | ⭐⭐⭐ 必須 | 全PR | CI失敗（High/Critical） |
|  | `deploy.yml` | 警告のみ | デプロイ前 | 継続 |
| **Lighthouse CI** | `e2e-tests.yml` | ⭐⭐ 重要 | PR（src/変更時） | CI失敗 |
| **Bundle Size** | `pr-quality-gate.yml` | レポートのみ | 全PR | - |
|  | `e2e-tests.yml` | ⭐⭐ 必須 | PR（src/変更時） | CI失敗（>1MB） |
| **型定義生成** | `type-generation.yml` | ⭐⭐ 必須 | スキーマ変更時 | CI失敗 |
| **型定義検証** | `type-generation.yml` | ⭐⭐ 必須 | スキーマ変更時 | CI失敗 |

---

## 品質基準

### 必須レベル（PRマージ条件）⭐⭐⭐

**Quality Gate（`pr-quality-gate.yml`）で強制**:

- ✅ **ESLint**: エラー0件、警告0件必須
- ✅ **TypeScript**: 型エラー0件必須
- ✅ **Prettier**: フォーマット準拠必須
- ✅ **ビルド**: 本番ビルド成功必須
- ✅ **ビルド成果物**: `dist/index.html` 等の必須ファイル存在必須
- ✅ **ユニットテスト**: 全テスト成功必須
- ✅ **セキュリティ**: High/Critical脆弱性0件必須

### 推奨レベル（警告表示）⭐

**Quality Gate（`pr-quality-gate.yml`）で監視**:

- 📊 **カバレッジ**: 70%以上推奨（警告のみ）
  - Lines: 70%
  - Statements: 70%
  - Functions: 70%
  - Branches: 70%
- 🔒 **セキュリティ**: Moderate以下の脆弱性対応推奨
- 📦 **バンドルサイズ**: 1MB以下推奨（E2Eワークフローでは必須）

### デプロイ条件（本番環境）⭐⭐⭐

**Deploy to Production（`deploy.yml`）で強制**:

- ✅ **ESLint**: エラー0件必須
- ✅ **TypeScript**: 型エラー0件必須
- ✅ **ビルド**: 本番ビルド成功必須
- ✅ **スモークテスト**: デプロイURL疎通確認成功必須
- ⚠️ **セキュリティ**: npm audit警告のみ（デプロイ継続）

---

## トラブルシューティング

### Q: PR品質ゲートが失敗する

**A**: 以下の順序で確認してください：

1. **ローカルで同じチェックを実行**
   ```bash
   # ESLint失敗時
   npm run ci:lint

   # TypeScript失敗時
   npm run ci:type-check

   # テスト失敗時
   npm run ci:test

   # ビルド失敗時
   npm run ci:build

   # セキュリティ失敗時
   npm run ci:security
   ```

2. **GitHub ActionsログでエラーメッセージConfirm**
   - PRページ → 「Checks」タブ → 失敗ジョブをクリック
   - エラーメッセージをコピーして修正

3. **修正後にプッシュ**
   ```bash
   git add .
   git commit -m "fix: CI/CD品質ゲート対応"
   git push origin [ブランチ名]
   ```

4. **自動で再実行**
   - プッシュ後、CI/CDが自動で再実行されます

---

### Q: TypeScript型エラーが大量に出る

**A**: 型定義が最新でない可能性があります：

```bash
# ローカルで型定義生成
npm run generate-types

# 型チェック実行
npm run ci:type-check
```

**スキーマ変更時**:
- `supabase/migrations/**` 変更後は `type-generation.yml` が自動実行されます
- mainブランチマージ後、自動コミットされた型定義をpullしてください

---

### Q: E2Eテストがタイムアウトする

**A**: 以下を確認してください：

1. **ローカルでE2Eテスト実行**
   ```bash
   # Playwrightブラウザインストール（初回のみ）
   npx playwright install

   # E2Eテスト実行
   npm run test:e2e
   ```

2. **タイムアウト原因調査**
   - Playwrightレポート確認: `npx playwright show-report`
   - スクリーンショット確認: `test-results/` ディレクトリ

3. **CI/CDアーティファクト確認**
   - PRページ → 「Checks」タブ → E2E Tests
   - Artifacts → `e2e-report-[browser]` ダウンロード

---

### Q: npm auditでHigh/Critical脆弱性が検出された

**A**: 即座に対応が必要です：

```bash
# 脆弱性詳細確認
npm audit

# 自動修正試行
npm audit fix

# 手動修正が必要な場合
npm audit fix --force
```

**修正できない場合**:
1. Issue作成（`priority:P0`、`type-infra:security`）
2. 依存関係アップデート計画
3. 一時的にワークフロー修正（セキュリティチーム承認必須）

---

### Q: カバレッジが70%未満で警告が出る

**A**: 段階的改善を推奨します：

1. **カバレッジレポート確認**
   ```bash
   npm run test:unit -- --coverage
   ```

2. **カバレッジ不足箇所の特定**
   - `coverage/lcov-report/index.html` をブラウザで開く
   - 赤色箇所（未カバー）を確認

3. **テスト追加**
   - カバレッジ不足の関数・分岐に対してテスト追加
   - PRレビュー時にカバレッジ向上を確認

**注意**: カバレッジ70%未満でもPRマージ可能（警告のみ）

---

### Q: デプロイが失敗する

**A**: デプロイ前品質チェックを確認してください：

1. **Pre-deploy check確認**
   - Actions → Deploy to Production → `pre-deploy-check` ログ確認
   - ESLint、TypeScript、Buildのいずれかが失敗している

2. **ローカルで修正**
   ```bash
   npm run ci:lint
   npm run ci:type-check
   npm run ci:build
   ```

3. **mainブランチへの直接修正**
   - Hotfixブランチ作成 → 修正 → PR → マージ
   - mainブランチへの直接プッシュは禁止

**Vercelデプロイ失敗時**:
1. Vercel設定確認（Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`）
2. Vercelダッシュボードでログ確認
3. スモークテスト失敗時、デプロイURL疎通確認

---

### Q: CI/CDが非常に遅い

**A**: キャッシュ戦略を確認してください：

1. **キャッシュヒット率確認**
   - Actions → 該当ワークフロー → Cache steps確認
   - `Cache hit` または `Cache miss` 表示

2. **キャッシュ無効化が必要な場合**
   - `package-lock.json` 更新時はキャッシュクリア推奨
   - Settings → Actions → Caches → 手動削除

3. **並列実行の活用**
   - `pr-quality-gate.yml` では `code-quality` 成功後、`testing` と `security` が並列実行
   - ローカルで事前チェック実施（`npm run ci:all`）

---

### Q: 型定義生成ワークフローが失敗する

**A**: Supabase接続を確認してください：

1. **ローカル型生成テスト**
   ```bash
   # ローカルSupabase起動
   supabase start

   # 型生成実行
   npm run generate-types
   ```

2. **本番型生成の場合**（mainブランチのみ）
   - Secrets確認: `VITE_SUPABASE_URL`, `SUPABASE_ACCESS_TOKEN`
   - Supabase Project設定でAccess Token有効化

3. **型定義検証失敗時**
   - `src/types/database.ts`、`src/types/supabase.ts` の存在確認
   - 必須インターフェース（`Database`、`DiaryEntry`）の存在確認

---

## ワークフロー図

### 全体フロー

```mermaid
graph TD
    START[開発開始] --> BRANCH[フィーチャーブランチ作成]
    BRANCH --> CODE[コード実装]
    CODE --> LOCAL[ローカル品質チェック]
    LOCAL --> |合格| PR[PR作成]
    LOCAL --> |不合格| CODE

    PR --> PRQG[PR Quality Gate]
    PR --> E2E[E2E Tests]

    PRQG --> CQ[Code Quality]
    PRQG --> TEST[Testing]
    PRQG --> SEC[Security]

    CQ --> |成功| REVIEW[レビュー・承認]
    TEST --> |成功| REVIEW
    SEC --> |成功| REVIEW

    CQ --> |失敗| FIX[修正]
    TEST --> |失敗| FIX
    SEC --> |失敗| FIX
    FIX --> PR

    E2E --> |成功| REVIEW
    E2E --> |失敗| FIX

    REVIEW --> |承認| MERGE[mainへマージ]
    REVIEW --> |要修正| FIX

    MERGE --> DEPLOY[Deploy to Production]
    MERGE --> TYPEGEN[Type Generation]
    MERGE --> AUTOCLOSE[Auto Close Issues]

    DEPLOY --> PRECHECK[Pre-deploy Check]
    PRECHECK --> |合格| VERCEL[Vercel Deploy]
    PRECHECK --> |不合格| HOTFIX[Hotfix作成]
    VERCEL --> SMOKE[Smoke Test]
    SMOKE --> |成功| PROD[本番環境稼働]
    SMOKE --> |失敗| HOTFIX

    TYPEGEN --> VALIDATE[Validate Types]
    VALIDATE --> |成功| END[完了]
    VALIDATE --> |失敗| HOTFIX

    HOTFIX --> PR
```

### PR Quality Gateフロー（詳細）

```mermaid
graph TD
    PR[PR作成・更新] --> TRIGGER{paths-ignore確認}
    TRIGGER --> |docs/**, *.md| SKIP[CI スキップ]
    TRIGGER --> |src/**, tests/**| START[CI 開始]

    START --> SETUP[環境セットアップ]
    SETUP --> CACHE[キャッシュ復元]
    CACHE --> INSTALL[依存関係インストール]

    INSTALL --> CQ[Stage 1: Code Quality]

    CQ --> ESLINT[ESLint]
    CQ --> TSCHECK[TypeScript Check]
    CQ --> PRETTIER[Prettier Check]
    CQ --> BUILD[Production Build]
    CQ --> BUNDLE[Bundle Size Analysis]

    ESLINT --> |エラー0件| TSCHECK
    ESLINT --> |エラーあり| FAIL1[CI 失敗]

    TSCHECK --> |型エラー0件| PRETTIER
    TSCHECK --> |型エラーあり| FAIL2[CI 失敗]

    PRETTIER --> |フォーマットOK| BUILD
    PRETTIER --> |フォーマット不備| FAIL3[CI 失敗]

    BUILD --> |成功| BUNDLE
    BUILD --> |失敗| FAIL4[CI 失敗]

    BUNDLE --> |レポート生成| CQDONE[Code Quality 完了]

    CQDONE --> TEST[Stage 2: Testing]
    CQDONE --> SEC[Stage 3: Security]

    TEST --> UNITTEST[Unit Tests]
    TEST --> COVERAGE[Coverage Report]
    TEST --> THRESHOLD[Coverage Threshold]

    UNITTEST --> |全テスト成功| COVERAGE
    UNITTEST --> |失敗あり| FAIL5[CI 失敗]

    COVERAGE --> |Codecovアップロード| THRESHOLD
    THRESHOLD --> |70%以上| TESTDONE[Testing 完了]
    THRESHOLD --> |70%未満| WARN1[警告のみ]
    WARN1 --> TESTDONE

    SEC --> AUDIT[npm audit]
    SEC --> SECTEST[Security Features Test]

    AUDIT --> |High/Critical 0件| SECTEST
    AUDIT --> |High/Criticalあり| FAIL6[CI 失敗]

    SECTEST --> |成功| SECDONE[Security 完了]
    SECTEST --> |失敗| FAIL7[CI 失敗]

    TESTDONE --> REPORT[Stage 4: Quality Report]
    SECDONE --> REPORT

    REPORT --> |全ステージ成功| SUCCESS[✅ 品質ゲート通過]
    REPORT --> |1つでも失敗| FAILURE[❌ 品質ゲート失敗]

    SUCCESS --> COMMENT1[PR自動コメント: 成功]
    FAILURE --> COMMENT2[PR自動コメント: 失敗詳細]

    COMMENT1 --> MERGE[マージ可能]
    COMMENT2 --> FIXREQ[修正必要]

    FAIL1 --> COMMENT2
    FAIL2 --> COMMENT2
    FAIL3 --> COMMENT2
    FAIL4 --> COMMENT2
    FAIL5 --> COMMENT2
    FAIL6 --> COMMENT2
    FAIL7 --> COMMENT2
```

### デプロイフロー（詳細）

```mermaid
graph TD
    MERGE[mainブランチマージ] --> TRIGGER{paths-ignore確認}
    TRIGGER --> |docs/**, *.md, tests/**| SKIP[デプロイスキップ]
    TRIGGER --> |src/**| START[デプロイ開始]

    START --> PRECHECK[Pre-deploy Check]

    PRECHECK --> LINT[ESLint]
    PRECHECK --> TS[TypeScript]
    PRECHECK --> BUILD[Build]
    PRECHECK --> AUDIT[Security Audit]

    LINT --> |成功| TS
    LINT --> |失敗| ABORT1[デプロイ中止]

    TS --> |成功| BUILD
    TS --> |失敗| ABORT2[デプロイ中止]

    BUILD --> |成功| AUDIT
    BUILD --> |失敗| ABORT3[デプロイ中止]

    AUDIT --> |成功| READY[deploy-ready=true]
    AUDIT --> |警告のみ| READY

    READY --> VERCEL[Vercel Deploy]

    VERCEL --> PRODBUILD[Production Build]
    PRODBUILD --> DEPLOY[Vercel Deploy API]
    DEPLOY --> SMOKE[Smoke Test]

    SMOKE --> RETRY1{リトライ 1/5}
    RETRY1 --> |疎通失敗| RETRY2{リトライ 2/5}
    RETRY2 --> |疎通失敗| RETRY3{リトライ 3/5}
    RETRY3 --> |疎通失敗| RETRY4{リトライ 4/5}
    RETRY4 --> |疎通失敗| RETRY5{リトライ 5/5}
    RETRY5 --> |疎通失敗| FAIL1[デプロイ失敗]

    RETRY1 --> |疎通成功| CONTENT[Content Check]
    RETRY2 --> |疎通成功| CONTENT
    RETRY3 --> |疎通成功| CONTENT
    RETRY4 --> |疎通成功| CONTENT
    RETRY5 --> |疎通成功| CONTENT

    CONTENT --> |内容確認OK| SUCCESS[デプロイ成功]
    CONTENT --> |内容確認NG| FAIL2[デプロイ失敗]

    SUCCESS --> NOTIFY[Deploy Notification]
    FAIL1 --> NOTIFY
    FAIL2 --> NOTIFY
    ABORT1 --> NOTIFY
    ABORT2 --> NOTIFY
    ABORT3 --> NOTIFY

    NOTIFY --> |成功| COMMENT1[成功通知コメント]
    NOTIFY --> |失敗| COMMENT2[失敗通知コメント]

    COMMENT1 --> PROD[本番環境稼働]
    COMMENT2 --> HOTFIX[Hotfix必要]
```

---

## 参考資料

### 公式ドキュメント

- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)
- [GitHub Actions Workflow構文](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Playwright公式ドキュメント](https://playwright.dev/)
- [Vitest公式ドキュメント](https://vitest.dev/)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Codecov Documentation](https://docs.codecov.com/)

### 関連内部ドキュメント

- [開発ワークフロー](DEVELOPMENT_WORKFLOW.md) - ブランチ戦略・PR作成手順
- [開発コマンド一覧](DEVELOPMENT_COMMANDS.md) - npm scripts・自動化コマンド
- [PR作成ガイド](../PROJECT_MANAGEMENT/PR_TESTING_GUIDE.md) - PR作成・テスト手順
- [CLAUDE.md](../../CLAUDE.md) - 開発フロー・重要原則・アーキテクチャ

### プロジェクト固有の情報

- **Issue #144**: TypeScript型定義自動生成機能実装
- **Issue #155**: CI/CD安定性向上（リトライ機能追加）
- **Issue #194**: CI/CD品質ゲート対応（型インポート完全性）
- **Issue #267**: Seedデータ投入機能
- **Issue #268**: Docker Compose改善とマイグレーション自動化
- **親チケット #277**: CI/CDテスト整理・最適化

### Mermaid記法

- [Mermaid公式ドキュメント](https://mermaid.js.org/)
- [Mermaid Flowchart構文](https://mermaid.js.org/syntax/flowchart.html)

---

## 更新履歴

- **2025-11-25**: ワークフロー統合（Issue #280対応）
  - `ci.yml`削除、`pr-quality-gate.yml`に統合
  - デュアルモード（Push/PR）説明追加
  - CI/CD実行時間60%削減達成
- **2025-11-20**: 初版作成（Issue #279対応）
  - 全ワークフロー詳細ドキュメント化
  - Mermaidフロー図追加
  - トラブルシューティングガイド追加

---

**📝 ドキュメント管理ポリシー**

- ワークフロー変更時は必ずこのドキュメントを更新
- 四半期ごとのドキュメントレビュー実施
- 新規参加者のオンボーディングチェックリストに追加
