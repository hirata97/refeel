# テストディレクトリ構造・戦略ガイド

**Refeel（Vue 3 + TypeScript + Supabase）** プロジェクトのテスト戦略と実行方法

## 📋 目次

- [テストファイル命名規則](#テストファイル命名規則)
- [ディレクトリ構造](#ディレクトリ構造)
- [Vitest設定・使用方針](#vitest設定使用方針)
- [モック戦略](#モック戦略)
- [カバレッジ目標・測定方法](#カバレッジ目標測定方法)
- [新規テスト作成ガイドライン](#新規テスト作成ガイドライン)
- [既存テスト構造解説](#既存テスト構造解説)
- [テスト実行コマンド](#テスト実行コマンド)

## 🏷️ テストファイル命名規則

### 基本形式

```
正常系または異常系_コンポーネント名_ナンバリング.spec.js
```

### 具体例

- **正常系**: `normal_LoginPage_01.spec.js`
- **異常系**: `exception_BaseForm_01.spec.js`
- **セキュリティ**: `security_AuthStore_01.spec.ts`

### 命名の意図・ルール

1. **分類の明確化**
   - `normal_`: 正常系・ハッピーパステスト
   - `exception_`: 異常系・エラーハンドリング・エッジケーステスト
   - `security_`: セキュリティ関連テスト（XSS、CSRF、認証等）

2. **コンポーネント名**
   - PascalCase形式（例：`LoginPage`, `BaseForm`, `AuthStore`）
   - ファイル名と一致させる

3. **ナンバリング**
   - `01`, `02`, `03...`（ゼロパディング2桁）
   - 同じコンポーネントの複数テストファイル用

4. **拡張子**
   - `.spec.js`: JavaScript テスト
   - `.spec.ts`: TypeScript テスト
   - `.test.ts`: セキュリティ・ユーティリティテスト

### 例外処理・特殊ケース

- **複合機能テスト**: `normal_LoginPage_error_display_01.spec.js`
- **特定機能テスト**: `normal_useDashboardData_01.spec.js`
- **セキュリティテスト**: `security-config.test.ts`, `xss-protection.test.ts`

## 📁 ディレクトリ構造

### コンポーネント別構成

```
tests/
├── setup.ts                          # グローバルテスト設定
├── [コンポーネント名]/               # コンポーネント別ディレクトリ
│   ├── normal_[コンポーネント名]_01.spec.js
│   └── exception_[コンポーネント名]_01.spec.js
├── components/                        # 複合コンポーネント
│   ├── settings/
│   └── normal_EmotionTagChips_01.spec.ts
├── unit/                             # ユニット別テスト
│   ├── components/base/              # 基底コンポーネント
│   ├── utils/                        # ユーティリティ関数
│   └── services/                     # サービスレイヤー
├── security/                         # セキュリティテスト
│   ├── input-validation.test.ts
│   ├── xss-protection.test.ts
│   └── csrf-protection.test.ts
├── stores/                           # Piniaストアテスト
├── composables/                      # Composableテスト
└── types/                           # 型定義テスト
```

### テストファイル分割戦略

1. **機能単位での分割**
   - 1つのコンポーネント/機能につき1ディレクトリ
   - 正常系・異常系を別ファイルに分離

2. **責務の明確化**
   - UI コンポーネント: `tests/[ComponentName]/`
   - ビジネスロジック: `tests/unit/services/`
   - 状態管理: `tests/stores/`
   - セキュリティ: `tests/security/`

3. **共通テストユーティリティの配置**
   - `tests/setup.ts`: Vuetifyモック、グローバル設定
   - グローバルモック設定はsetup.tsに集約

## ⚙️ Vitest設定・使用方針

### 設定ファイル（vitest.config.ts）

```typescript
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom', // DOM環境シミュレーション
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      globals: true, // describe, it, expect をグローバルに
      setupFiles: ['./tests/setup.ts'], // テストセットアップファイル
      css: false, // CSS処理を無効化（高速化）
    },
  }),
)
```

### テスト実行方法

```bash
# ユニットテスト実行
npm run test:unit

# カバレッジ付きテスト実行
npm run ci:test

# ウォッチモード
npm run test:unit -- --watch

# 特定ファイルのテスト
npm run test:unit tests/LoginPage/normal_LoginPage_01.spec.js

# 型チェック付き実行
npm run type-check && npm run test:unit
```

### テスト環境の特徴

- **jsdom環境**: ブラウザDOM APIの完全サポート
- **Vue Test Utils**: Vue.js コンポーネントテストライブラリ
- **グローバルAPI**: `describe`, `it`, `expect`, `vi` をimport不要
- **TypeScript完全サポート**: `.spec.ts` ファイル対応

## 🎭 モック戦略

### Supabaseクライアントのモック

```javascript
// 認証モック例
const mockAuth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
}

// データベースモック例
const mockFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
}))
```

### Vue Routerのモック

```javascript
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}

const mockRoute = {
  params: {},
  query: {},
  path: '/test',
  name: 'test',
}
```

### Piniaストアのモック

```javascript
// ストア状態のモック
const mockAuthStore = {
  isAuthenticated: ref(false),
  user: ref(null),
  login: vi.fn(),
  logout: vi.fn(),
  checkAuthStatus: vi.fn(),
}

// createTestingPinia使用例
import { createTestingPinia } from '@pinia/testing'

const wrapper = mount(Component, {
  global: {
    plugins: [createTestingPinia({ createSpy: vi.fn })],
  },
})
```

### 外部ライブラリモック指針

1. **Chart.js**: チャート描画処理のモック
2. **DOMPurify**: サニタイゼーション処理のモック
3. **bcryptjs**: ハッシュ化処理のモック
4. **Date/Timer**: 時間依存処理のモック（`vi.useFakeTimers()`）

### Vuetifyコンポーネントモック

`tests/setup.ts` にて以下をモック化：

- `v-btn`, `v-alert`, `v-form`: 基本UIコンポーネント
- `v-data-table`, `v-rating`: データ表示コンポーネント
- `v-text-field`, `v-select`, `v-textarea`: フォームコンポーネント
- `v-dialog`, `v-card`: レイアウトコンポーネント

## 📊 カバレッジ目標・測定方法

### 目標カバレッジ率

- **全体**: **80%以上**
- **重要コンポーネント**: **90%以上**（認証、データ処理、セキュリティ）
- **ユーティリティ関数**: **95%以上**

### 測定範囲

#### 含む範囲

- `src/components/`: Vue コンポーネント
- `src/stores/`: Pinia ストア
- `src/composables/`: Composable 関数
- `src/utils/`: ユーティリティ関数
- `src/lib/`: ライブラリ・設定ファイル

#### 除外項目

- `src/types/`: 型定義ファイル
- `src/assets/`: 静的アセット
- `src/styles/`: スタイル関連
- テストファイル自体（`*.spec.js`, `*.test.ts`）

### カバレッジレポート確認方法

```bash
# カバレッジ付きテスト実行
npm run ci:test

# カバレッジレポート生成先
# coverage/lcov-report/index.html をブラウザで開く

# コマンドライン出力確認
npm run ci:test -- --coverage.reporter=text
```

### カバレッジ評価指標

1. **Line Coverage**: 実行された行の割合
2. **Function Coverage**: 実行された関数の割合
3. **Branch Coverage**: 実行された分岐の割合
4. **Statement Coverage**: 実行された文の割合

## 📝 新規テスト作成ガイドライン

### テストケース設計方針

#### 1. Arrange-Act-Assert パターン

```javascript
describe('Component - テスト概要', () => {
  it('期待する動作の説明', () => {
    // Arrange: テストデータ・環境準備
    const props = { title: 'テスト' }
    const wrapper = mount(Component, { props })

    // Act: テスト対象の操作実行
    wrapper.find('button').trigger('click')

    // Assert: 結果の検証
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

#### 2. 正常系・異常系テストの分類基準

**正常系 (`normal_`) テスト**

- ハッピーパス・基本機能の動作確認
- 期待される入力値での動作
- UI表示・イベント発火の確認

**異常系 (`exception_`) テスト**

- エラーハンドリング・バリデーション
- 境界値・不正入力での動作
- ネットワークエラー・認証失敗の処理

### パフォーマンステスト指針

```javascript
// 大量データ処理のパフォーマンステスト例
it('大量データでもパフォーマンス問題が発生しない', () => {
  const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }))

  const start = performance.now()
  const wrapper = mount(DataTable, {
    props: { items: largeDataset },
  })
  const end = performance.now()

  expect(end - start).toBeLessThan(100) // 100ms以内
  expect(wrapper.exists()).toBe(true)
})
```

### セキュリティテスト指針

```javascript
// XSS対策テスト例
it('HTMLタグを含む入力が正しくエスケープされる', () => {
  const maliciousInput = '<script>alert("XSS")</script>'
  const wrapper = mount(InputComponent, {
    props: { value: maliciousInput },
  })

  // HTMLがエスケープされて表示される
  expect(wrapper.text()).toContain('&lt;script&gt;')
  expect(wrapper.html()).not.toContain('<script>')
})

// CSRF対策テスト例
it('CSRFトークンが正しく送信される', async () => {
  const mockPost = vi.fn()
  const wrapper = mount(FormComponent, {
    global: {
      mocks: { $http: { post: mockPost } },
    },
  })

  await wrapper.find('form').trigger('submit')
  expect(mockPost).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      _token: expect.any(String),
    }),
  )
})
```

## 📚 既存テスト構造解説

### 代表的なテストファイル

#### 1. BaseFormコンポーネント

**正常系** (`tests/BaseForm/normal_BaseForm_01.spec.js`)

- 基本レンダリング確認
- プロパティ（title, containerClass, formClass）の動作
- スロット（content, actions）の表示確認
- イベント発火（submit）の検証

**異常系** (`tests/BaseForm/exception_BaseForm_01.spec.js`)

- null/undefined値の安全な処理
- 不正な型のプロパティ処理
- 極端な入力値でのエラー回避
- HTMLインジェクション対策

#### 2. 認証関連テスト

**正常系** (`tests/auth/normal_AuthStore_01.spec.js`)

- ログイン・ログアウト処理
- 認証状態の管理
- ユーザー情報の取得・更新

**異常系** (`tests/auth/exception_AuthStore_01.spec.js`)

- 認証失敗時の処理
- ネットワークエラー対応
- セッション期限切れ処理

### ベストプラクティス事例

#### 1. 適切なモック使用

```javascript
// ✅ 良い例：必要最小限のモック
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    }),
  },
}

// ❌ 悪い例：過度なモック
vi.mock('entire-library') // ライブラリ全体をモック
```

#### 2. テストデータの管理

```javascript
// ✅ 良い例：テストデータの分離
const testData = {
  validUser: { email: 'test@example.com', password: 'password123' },
  invalidUser: { email: 'invalid', password: '' },
}

// ❌ 悪い例：ハードコーディング
expect(wrapper.find('input').element.value).toBe('test@example.com')
```

#### 3. 非同期処理のテスト

```javascript
// ✅ 良い例：適切な非同期テスト
it('非同期データ取得が完了する', async () => {
  const wrapper = mount(AsyncComponent)
  await wrapper.vm.$nextTick()
  await flushPromises() // Promise解決を待機

  expect(wrapper.text()).toContain('データ表示')
})
```

### 避けるべきアンチパターン

#### 1. テストの独立性違反

```javascript
// ❌ 悪い例：テスト間での状態共有
let sharedState = {}

it('test1', () => {
  sharedState.value = 'modified'
})

it('test2', () => {
  expect(sharedState.value).toBe('modified') // 前のテストに依存
})
```

#### 2. 過度な実装詳細のテスト

```javascript
// ❌ 悪い例：実装詳細への依存
expect(wrapper.vm.internalMethod).toHaveBeenCalled()

// ✅ 良い例：動作・結果のテスト
expect(wrapper.emitted('change')).toBeTruthy()
```

#### 3. 不適切なタイミング

```javascript
// ❌ 悪い例：非同期処理の待機不足
it('データ更新確認', () => {
  wrapper.vm.updateData()
  expect(wrapper.text()).toContain('更新済み') // 非同期処理未完了
})

// ✅ 良い例：適切な待機
it('データ更新確認', async () => {
  await wrapper.vm.updateData()
  expect(wrapper.text()).toContain('更新済み')
})
```

## 🚀 テスト実行コマンド

### 基本コマンド

```bash
# 全ユニットテスト実行
npm run test:unit

# ウォッチモード（開発中推奨）
npm run test:unit -- --watch

# カバレッジ付き実行
npm run ci:test

# E2Eテスト実行
npm run test:e2e
```

### 詳細オプション

```bash
# 特定パターンのテスト実行
npm run test:unit tests/LoginPage

# 型チェック付きテスト
npm run type-check && npm run test:unit

# 並列実行無効化（デバッグ用）
npm run test:unit -- --no-threads

# 特定のテストファイル
npm run test:unit tests/BaseForm/normal_BaseForm_01.spec.js

# リポーター変更
npm run test:unit -- --reporter=verbose

# タイムアウト設定
npm run test:unit -- --testTimeout=10000
```

### CI/CD統合コマンド

```bash
# 全品質チェック（推奨）
npm run ci:all

# 品質ゲート（リリース前）
npm run ci:quality-gate

# セキュリティチェック
npm run ci:security
```

### デバッグ・トラブルシューティング

```bash
# デバッグモード
npm run test:unit -- --inspect-brk

# ログ出力増量
DEBUG=vitest npm run test:unit

# キャッシュクリア
npm run test:unit -- --no-cache

# 型生成後テスト
npm run generate-types && npm run test:unit
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

1. **Vuetifyコンポーネントのエラー**
   - 解決策: `tests/setup.ts` のモック定義を確認

2. **Supabaseモックの問題**
   - 解決策: 必要なメソッドがモック化されているか確認

3. **非同期テストの不安定性**
   - 解決策: `await`と`$nextTick()`の適切な使用

4. **カバレッジ測定の除外設定**
   - 解決策: `vitest.config.ts`のexclude設定を調整

---

**📋 関連ドキュメント**

## 🔁 リファクタリング（ディレクトリ再編）に関するメモ

このリポジトリでは `tests/` のトップレベルを以下の 6 つに整理しました:

- `tests/unit/` — ロジック・ユーティリティ・ストア等のユニットテスト
- `tests/components/` — UI コンポーネント・ページのテスト
- `tests/integration/` — 外部依存や統合テスト
- `tests/e2e/` — Playwright ベースの E2E テスト
- `tests/fixtures/` — 共有フィクスチャ・スタブ
- `tests/security/` — セキュリティ関連テスト

補助的なディレクトリ:

- `tests/helpers/` — 共通セットアップ (`setup.ts` など) やヘルパー

### 開発者向け移行メモ（短く）

1. テストファイルを移動したため、移動前パスを参照する import が残っている場合があります。

- まずは `scripts/find-test-imports.js`（リポジトリ直下の `scripts/`）で参照箇所を検出してください（追加済み）。

2. `vitest.config.ts` の `setupFiles` を `./tests/helpers/setup.ts` に更新済みです。
3. 型解決のため `tsconfig.vitest.json` に `"tests/**/*"` を含めました。
4. CI 実行（`npm run ci:test`）は依存インストールが必要です。時間がかかるためローカル実行は任意です。

### 変更の確認手順（推奨）

1. まず `scripts/find-test-imports.js` を実行して、古いパスを参照しているファイルを洗い出す。
2. 検出結果を元に import を更新（手動または一括 sed を使う）。
3. `npm run test:unit`（ウォッチ）で問題のあるファイルのみ確認。
4. 最後に CI で `npm run ci:test` を実行して全体を検証。

---

（この節は移行作業に合わせて随時更新してください）

- [CLAUDE.md](../CLAUDE.md) - プロジェクト開発指針
- [docs/DEVELOPMENT/BEST_PRACTICES.md](../docs/DEVELOPMENT/BEST_PRACTICES.md) - 開発ベストプラクティス
- [Vitest公式ドキュメント](https://vitest.dev/)
- [Vue Testing Library](https://testing-library.com/docs/vue-testing-library/intro/)
