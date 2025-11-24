# E2Eテストガイド - Playwright

このディレクトリには、Playwrightを使用したEnd-to-End（E2E）テストが含まれています。

## 📋 目次

- [概要](#概要)
- [環境構築](#環境構築)
- [テスト実行](#テスト実行)
- [テストシナリオ設計方針](#テストシナリオ設計方針)
- [ディレクトリ構成](#ディレクトリ構成)
- [新規E2Eテスト作成指針](#新規e2eテスト作成指針)
- [テストデータ管理](#テストデータ管理)
- [CI/CD連携](#cicd連携)
- [ブラウザ別テスト戦略](#ブラウザ別テスト戦略)
- [デバッグ・トラブルシューティング](#デバッグトラブルシューティング)
- [パフォーマンステスト](#パフォーマンステスト)

## 概要

### Playwright設定

- **設定ファイル**: `playwright.config.ts`（プロジェクトルート）
- **テストディレクトリ**: `e2e/`
- **タイムアウト**: 30秒（テスト単位）、5秒（expect単位）
- **リトライ**: CI環境で2回、ローカル環境で0回
- **並列実行**: CI環境では1 worker、ローカル環境は自動

### 対応ブラウザ

**ローカル環境（包括的テスト）:**
- デスクトップ: Chromium, Firefox, WebKit, Microsoft Edge, Google Chrome
- モバイル: Mobile Chrome（Pixel 5）, Mobile Safari（iPhone 12）
- タブレット: Tablet Chrome（Galaxy Tab S4）, iPad（iPad Pro）
- カスタム: High DPI、Low Resolution

**CI環境（軽量テスト）:**
- Chromium
- Mobile Chrome（Pixel 5）

## 環境構築

### 初回セットアップ

```bash
# 1. 依存関係インストール
npm install

# 2. Playwrightブラウザインストール（初回のみ）
npx playwright install

# 3. システム依存関係インストール（Linux/CI環境）
npx playwright install-deps
```

### 特定ブラウザのみインストール

```bash
# Chromiumのみ
npx playwright install chromium

# 複数ブラウザ
npx playwright install chromium firefox webkit
```

## テスト実行

### 基本コマンド

```bash
# 全テスト実行（全ブラウザ）
npm run test:e2e

# ヘッドレスモードで実行（CI環境と同じ）
CI=true npm run test:e2e

# ヘッドフルモードで実行（ブラウザ画面表示）
npx playwright test --headed

# 特定ブラウザで実行
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### 詳細実行オプション

```bash
# 特定テストファイルのみ実行
npx playwright test e2e/auth.spec.ts

# 特定テストケースのみ実行
npx playwright test -g "ログインフロー"

# デバッグモード実行
npx playwright test --debug

# UIモードで実行（インタラクティブ）
npx playwright test --ui

# レポート生成・表示
npx playwright show-report
```

### ウォッチモード

```bash
# ファイル変更を監視して自動実行
npx playwright test --watch
```

## テストシナリオ設計方針

### ユーザージャーニーベースのテスト設計

E2Eテストは、実際のユーザーが辿る操作フローを再現します：

1. **認証フロー**（`auth.spec.ts`）
   - ログイン（正常系・異常系）
   - アカウント登録（正常系・異常系）
   - ログアウト
   - セッション管理・タイムアウト

2. **日記操作フロー**（`diary-operations.spec.ts`）
   - 日記作成・編集・削除
   - カテゴリー設定
   - 感情タグ設定
   - データ永続化確認

3. **レポート機能**（`report-functionality.spec.ts`）
   - レポート表示
   - チャート描画
   - フィルタリング・ソート
   - データ集計確認

### 重要な機能フローの優先順位

**P0（最優先）:**
- ログイン・ログアウト
- 日記作成・表示

**P1（高優先度）:**
- アカウント登録
- 日記編集・削除
- レポート表示

**P2（中優先度）:**
- 感情タグ管理
- カテゴリー管理
- フィルタリング機能

### テストケース分割戦略

- **正常系（Happy Path）**: 理想的なユーザーフロー
- **異常系（Error Handling）**: バリデーションエラー、APIエラー
- **境界値テスト**: 文字数制限、日付範囲など
- **セキュリティテスト**: 認証・認可、XSS対策

## ディレクトリ構成

```
e2e/
├── README.md                    # このファイル
├── tsconfig.json                # TypeScript設定（E2E専用）
│
├── auth.spec.ts                 # 認証フローテスト
├── diary-operations.spec.ts     # 日記操作テスト
├── report-functionality.spec.ts # レポート機能テスト
├── vue.spec.ts                  # 基本動作確認テスト
│
└── helpers/                     # テストヘルパー関数
    ├── auth.ts                  # 認証関連ヘルパー
    ├── diary.ts                 # 日記関連ヘルパー
    └── report.ts                # レポート関連ヘルパー
```

### ヘルパー関数の役割

**Page Object Modelパターン**を採用し、テストロジックとUI操作を分離：

- **`AuthTestHelper`**: ログイン・登録・ログアウト操作
- **`DiaryTestHelper`**: 日記CRUD操作
- **`ReportTestHelper`**: レポート表示・フィルタリング操作

## 新規E2Eテスト作成指針

### テストファイル命名規則

```bash
# パターン: [機能名]-[テスト内容].spec.ts
auth.spec.ts                    # 認証関連
diary-operations.spec.ts        # 日記操作
settings-management.spec.ts     # 設定管理（新規例）
```

### Page Object Modelパターン

**推奨実装パターン:**

```typescript
// helpers/feature.ts
import { Page, expect } from '@playwright/test'

export class FeatureTestHelper {
  constructor(private page: Page) {}

  // ナビゲーション
  async navigateToFeature(): Promise<void> {
    await this.page.goto('/feature')
    await this.page.waitForLoadState('networkidle')
  }

  // 要素取得（プライベートメソッド推奨）
  private getFormElements() {
    return {
      inputField: this.page.locator('[data-testid="feature-input"]'),
      submitButton: this.page.locator('[data-testid="feature-submit"]'),
      errorMessage: this.page.locator('[role="alert"]')
    }
  }

  // 操作実行
  async performAction(data: FeatureData): Promise<void> {
    const elements = this.getFormElements()
    await elements.inputField.fill(data.value)
    await elements.submitButton.click()
  }

  // 検証
  async expectSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/\/success/)
  }
}

// feature.spec.ts
import { test, expect } from '@playwright/test'
import { FeatureTestHelper } from './helpers/feature'

test.describe('機能テスト', () => {
  let helper: FeatureTestHelper

  test.beforeEach(async ({ page }) => {
    helper = new FeatureTestHelper(page)
  })

  test('正常系: 機能が動作する', async () => {
    await helper.navigateToFeature()
    await helper.performAction({ value: 'test' })
    await helper.expectSuccess()
  })
})
```

### セレクタ戦略

**優先順位（上から推奨）:**

1. **`data-testid`属性**（最推奨）
   ```typescript
   await page.locator('[data-testid="login-button"]').click()
   ```

2. **ARIA属性**（アクセシビリティ重視）
   ```typescript
   await page.locator('[aria-label="Email input"]').fill('test@example.com')
   await page.getByRole('button', { name: 'Login' }).click()
   ```

3. **テキストコンテンツ**（明確なテキストがある場合）
   ```typescript
   await page.locator('button:has-text("ログイン")').click()
   ```

4. **CSSクラス**（最終手段、脆弱性注意）
   ```typescript
   await page.locator('.v-btn--primary').click()
   ```

### テスト実行順序・依存関係管理

**基本原則:**
- 各テストは独立して実行可能であること
- テスト間で状態を共有しないこと
- `beforeEach`/`afterEach`でクリーンアップ実施

**依存関係がある場合:**

```typescript
test.describe.serial('順次実行が必要なテスト', () => {
  test('ステップ1: データ作成', async () => { /* ... */ })
  test('ステップ2: データ検証', async () => { /* ... */ })
  test('ステップ3: データ削除', async () => { /* ... */ })
})
```

## テストデータ管理

### テスト用ユーザーアカウント管理

**自動生成パターン（推奨）:**

```typescript
import { generateTestUser } from './helpers/auth'

const testUser = generateTestUser('feature_test')
// => {
//   email: 'feature_test_1699999999999_abc123@example.com',
//   password: 'TestPassword123!',
//   username: 'feature_test_user_1699999999999'
// }
```

**固定テストユーザー（環境変数）:**

```bash
# .env.test（Git管理外）
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

### Supabaseテスト環境連携

**環境分離:**
- **開発環境**: ローカル開発用Supabaseプロジェクト
- **テスト環境**: E2E専用Supabaseプロジェクト（推奨）
- **本番環境**: 絶対にE2Eテスト実行禁止

**設定例:**

```typescript
// playwright.config.ts
use: {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
}

// .env.test
VITE_SUPABASE_URL=https://test-project.supabase.co
VITE_SUPABASE_KEY=test-anon-key
```

### テストデータのクリーンアップ戦略

**クリーンアップタイミング:**
1. **テスト前**（`beforeEach`）: 一貫した初期状態確保
2. **テスト後**（`afterEach`）: 副作用排除

**実装例:**

```typescript
test.afterEach(async ({ page }) => {
  // ローカルストレージクリア
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // テストデータ削除（必要に応じて）
  await helper.cleanup()
})
```

## CI/CD連携

### GitHub Actionsでの自動実行

**ワークフローファイル**: `.github/workflows/e2e-tests.yml`

**トリガー条件:**
- PR作成・更新時（`main`, `develop`ブランチ向け）
- 影響範囲: `src/`, `e2e/`, `package.json`, `vite.config.ts`, `playwright.config.ts`
- 手動実行（`workflow_dispatch`）

**実行戦略:**
- **ブラウザマトリクス**: Chromium, Firefox, WebKit
- **並列実行**: 各ブラウザで独立実行（`fail-fast: false`）
- **タイムアウト**: 30分

### テスト結果レポート生成

**自動生成レポート:**
- HTML形式（`playwright-report/`）
- GitHub Actions Summary
- PR自動コメント（テスト結果サマリー）

**アクセス方法:**

```bash
# ローカルでレポート表示
npx playwright show-report

# CI環境ではArtifactsからダウンロード
```

### 失敗時のスクリーンショット・動画保存

**自動保存設定（`playwright.config.ts`）:**

```typescript
use: {
  trace: 'on-first-retry',        // リトライ時にトレース保存
  screenshot: 'only-on-failure',  // 失敗時にスクリーンショット
  video: 'retain-on-failure',     // 失敗時に動画保存
}
```

**保存先:**
- ローカル: `test-results/`
- CI: GitHub Actions Artifacts（7日間保持）

### 並列実行・最適化設定

**CI環境での最適化:**

```typescript
workers: process.env.CI ? 1 : undefined,  // CI: 順次実行、ローカル: 並列
retries: process.env.CI ? 2 : 0,          // CI: 2回リトライ
```

**理由:**
- CI環境のリソース制限対応
- 並列実行時の競合状態回避
- テストの安定性向上

## ブラウザ別テスト戦略

### Chromium・Firefox・WebKit対応

**レンダリングエンジン別特性:**

| ブラウザ | エンジン | 特徴 | テスト重点項目 |
|---------|---------|-----|--------------|
| Chromium | Blink | デファクトスタンダード | 基本機能全般 |
| Firefox | Gecko | CSS Grid/Flexbox実装差異 | レイアウト検証 |
| WebKit | WebKit | iOSデフォルト、strictモード | iOS互換性 |

**クロスブラウザ互換性確認:**

```bash
# 全ブラウザで一括実行
npm run test:e2e

# 特定ブラウザのみ
npx playwright test --project=firefox
```

### モバイルビューポートテスト

**設定済みデバイス:**
- **Mobile Chrome**: Pixel 5（393x851）
- **Mobile Safari**: iPhone 12（390x844）
- **Tablet Chrome**: Galaxy Tab S4（712x1138）
- **iPad**: iPad Pro（1024x1366）

**モバイル固有テスト項目:**
- タッチ操作シミュレーション
- ビューポート適応性
- モバイルメニュー動作
- スクロール挙動

### 異なるブラウザでの動作確認

**注意点:**
- **日付ピッカー**: ブラウザネイティブUIの差異
- **ファイルアップロード**: 実装差異対応
- **CSS Grid/Flexbox**: レンダリング差異確認
- **フォント描画**: アンチエイリアス差異

### 互換性問題の対処法

**条件付きテスト:**

```typescript
test('Chromium固有機能テスト', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromiumのみ実行')
  // Chromium固有のテスト
})
```

**ブラウザ検出・分岐:**

```typescript
const isFirefox = browserName === 'firefox'
if (isFirefox) {
  // Firefox固有の対処
}
```

## デバッグ・トラブルシューティング

### テスト失敗時の調査方法

**手順:**

1. **エラーメッセージ確認**
   ```bash
   npx playwright test --reporter=list
   ```

2. **スクリーンショット確認**
   - `test-results/[テスト名]/screenshot.png`

3. **トレースビューア使用**
   ```bash
   npx playwright show-trace test-results/[テスト名]/trace.zip
   ```

4. **ヘッドフルモードで再実行**
   ```bash
   npx playwright test --headed --debug
   ```

### Playwright Inspectorの使用方法

**起動:**

```bash
# デバッグモードで実行（自動的にInspector起動）
npx playwright test --debug

# 特定テストのみデバッグ
npx playwright test e2e/auth.spec.ts --debug
```

**機能:**
- **ステップ実行**: 1操作ずつ実行・確認
- **セレクタ検証**: 要素選択のテスト
- **コンソールログ**: ブラウザコンソール確認
- **スクリーンショット**: 任意タイミングでキャプチャ

### スクリーンショット・動画を用いたデバッグ

**手動スクリーンショット:**

```typescript
test('デバッグ用テスト', async ({ page }) => {
  await page.goto('/dashboard')
  await page.screenshot({ path: 'debug-screenshot.png' })
})
```

**動画記録:**

```typescript
// playwright.config.ts
use: {
  video: 'on',  // 常に動画記録（デバッグ時のみ推奨）
}
```

### よくある問題と解決策

#### 1. タイムアウトエラー

**原因**: 要素が見つからない、ページ遷移が遅い

**解決策:**

```typescript
// タイムアウト延長
await expect(page.locator('#slow-element')).toBeVisible({ timeout: 10000 })

// ネットワーク待機
await page.waitForLoadState('networkidle')
```

#### 2. 要素が見つからない

**原因**: セレクタ誤り、動的レンダリング未完了

**解決策:**

```typescript
// セレクタ検証
npx playwright codegen http://localhost:5173

// 動的要素待機
await page.waitForSelector('[data-testid="dynamic-content"]')
```

#### 3. 不安定なテスト（Flaky Tests）

**原因**: 非同期処理のタイミング、アニメーション

**解決策:**

```typescript
// アニメーション無効化
await page.emulateMedia({ reducedMotion: 'reduce' })

// 明示的待機
await page.waitForTimeout(500)  // 最終手段（推奨しない）
```

#### 4. CI環境でのみ失敗

**原因**: 環境差異、リソース制限

**解決策:**

```bash
# CI環境シミュレーション
CI=true npm run test:e2e

# ヘッドレスモード確認
npx playwright test --headed=false
```

## パフォーマンステスト

### ページロード時間測定

**実装例:**

```typescript
test('ページロードパフォーマンス', async ({ page }) => {
  const startTime = Date.now()
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  const loadTime = Date.now() - startTime

  expect(loadTime).toBeLessThan(3000)  // 3秒以内
})
```

### レスポンス性能の検証

**操作レスポンス測定:**

```typescript
test('ボタンクリック反応速度', async ({ page }) => {
  await page.goto('/diary/new')

  const startTime = Date.now()
  await page.click('[data-testid="save-button"]')
  await page.waitForSelector('[data-testid="success-message"]')
  const responseTime = Date.now() - startTime

  expect(responseTime).toBeLessThan(1000)  // 1秒以内
})
```

### Lighthouse連携

**設定ファイル**: `.lighthouserc.json`

**実行:**

```bash
# Lighthouse CI実行（GitHub Actions）
npm run lighthouse:ci

# ローカル実行
npx lighthouse http://localhost:5173 --view
```

**評価項目:**
- **Performance**: ページロード速度
- **Accessibility**: アクセシビリティ
- **Best Practices**: セキュリティ・ベストプラクティス
- **SEO**: 検索エンジン最適化

### パフォーマンス改善指針

**目標値（Lighthouse）:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

**改善施策:**
- 画像最適化（WebP、遅延読み込み）
- コード分割（dynamic import）
- キャッシュ戦略最適化
- 不要なJavaScript削減

## 参考資料

### 公式ドキュメント
- [Playwright公式ドキュメント](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [GitHub Actions連携](https://playwright.dev/docs/ci)

### プロジェクト内関連ファイル
- `playwright.config.ts` - Playwright設定
- `.github/workflows/e2e-tests.yml` - CI/CDワークフロー
- `CLAUDE.md` - 開発指針・開発フロー
- `docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md` - 開発ワークフロー詳細

### 関連コマンド

```bash
# E2Eテスト実行
npm run test:e2e              # 全ブラウザで実行
npx playwright test           # デフォルト実行
npx playwright test --ui      # UIモード実行

# デバッグ・開発
npx playwright codegen        # コード生成ツール
npx playwright show-report    # レポート表示
npx playwright show-trace     # トレースビューア

# ブラウザ管理
npx playwright install        # 全ブラウザインストール
npx playwright install chromium  # 特定ブラウザのみ
```

---

**最終更新**: 2025-11-14
**メンテナー**: GoalCategorizationDiary開発チーム
