# src/ディレクトリ構造・設計方針ガイド

**Refeel（Vue 3 + TypeScript + Supabase）** プロジェクトのソースコード構造と開発方針

## 📋 目次

- [ディレクトリ構造](#ディレクトリ構造)
- [Vue 3 Composition API使用方針](#vue-3-composition-api使用方針)
- [コンポーネント設計パターン](#コンポーネント設計パターン)
- [Piniaストア使用方針](#piniaストア使用方針)
- [TypeScript型定義ルール](#typescript型定義ルール)
- [新規コンポーネント作成指針](#新規コンポーネント作成指針)
- [アーキテクチャ原則](#アーキテクチャ原則)

## 📁 ディレクトリ構造

```
src/
├── components/                    # Vue コンポーネント
│   ├── base/                     # ベースコンポーネント（再利用可能）
│   │   ├── BaseButton.vue        # ボタンコンポーネント
│   │   ├── BaseCard.vue          # カードコンポーネント
│   │   ├── BaseForm.vue          # フォームコンポーネント
│   │   ├── BaseAlert.vue         # アラートコンポーネント
│   │   └── index.ts              # エクスポート設定
│   ├── dashboard/                # ダッシュボード関連コンポーネント
│   │   ├── ComparisonCard.vue    # 比較カード
│   │   ├── StatCard.vue          # 統計カード
│   │   ├── MoodChartCard.vue     # ムードチャート
│   │   └── EmotionTagAnalysisCard.vue
│   ├── security/                 # セキュリティ関連コンポーネント
│   ├── settings/                 # 設定関連コンポーネント
│   ├── pagination/               # ページネーション関連
│   ├── privacy/                  # プライバシー関連
│   └── report/                   # レポート関連
├── composables/                  # Composition API関数
│   ├── useAuthGuard.ts           # 認証ガード
│   ├── useDashboardData.ts       # ダッシュボードデータ管理
│   ├── useDataFetch.ts           # データ取得
│   ├── useErrorHandler.ts        # エラーハンドリング
│   └── useWeeklyAnalysis.ts      # 週間分析
├── stores/                       # Pinia状態管理
│   ├── auth/                     # 認証関連ストア（分割）
│   │   ├── index.ts              # メインエクスポート
│   │   ├── authentication.ts    # 認証処理
│   │   ├── session.ts            # セッション管理
│   │   ├── security.ts           # セキュリティ機能
│   │   └── lockout.ts            # アカウントロックアウト
│   ├── data.ts                   # メインデータストア
│   ├── notification.ts           # 通知管理
│   ├── theme.ts                  # テーマ設定
│   └── emotionTags.ts            # 感情タグ管理
├── views/                        # ページビューコンポーネント
│   ├── LoginPage.vue             # ログインページ
│   ├── DashBoardPage.vue         # ダッシュボード
│   ├── DiaryRegisterPage.vue     # 日記登録
│   ├── DiaryViewPage.vue         # 日記表示
│   └── SettingPage.vue           # 設定ページ
├── types/                        # TypeScript型定義
│   ├── database.ts               # 自動生成DB型定義
│   ├── supabase.ts               # 自動生成Supabase型
│   ├── custom.ts                 # カスタム型定義（手動管理）
│   ├── dashboard.ts              # ダッシュボード型定義
│   └── emotion-tags.ts           # 感情タグ型定義
├── utils/                        # ユーティリティ関数
│   ├── security.ts               # セキュリティ関数
│   ├── auth.ts                   # 認証ヘルパー
│   ├── sanitization.ts           # サニタイゼーション
│   └── dateRange.ts              # 日付範囲処理
├── services/                     # サービスレイヤー
│   ├── reportAnalytics.ts        # レポート分析
│   ├── syncService.ts            # 同期サービス
│   └── offlineStorage.ts         # オフラインストレージ
├── security/                     # セキュリティ機能
│   ├── core/                     # コアセキュリティ
│   ├── monitoring/               # 監視機能
│   └── reporting/                # レポート機能
├── lib/                          # 外部ライブラリ設定
│   └── supabase.ts               # Supabaseクライアント設定
├── router/                       # Vue Router設定
│   └── index.ts                  # ルート定義
├── styles/                       # スタイル関連
│   ├── global.css                # グローバルスタイル
│   └── design-tokens.ts          # デザイントークン
├── config/                       # 設定ファイル
├── plugins/                      # Vue プラグイン
│   └── vuetify.ts                # Vuetify設定
└── main.ts                       # アプリケーションエントリーポイント
```

### ディレクトリ分割戦略

1. **機能別分割**: components/は機能別サブディレクトリで整理
2. **責務の分離**: ビジネスロジック（composables/stores）とUI（components/views）を分離
3. **スケーラビリティ**: 大規模機能は専用ディレクトリ（auth/、security/）に分割
4. **再利用性**: 共通コンポーネントはbase/ディレクトリに集約

## ⚙️ Vue 3 Composition API使用方針

### `<script setup>`記法の使用ルール

#### ✅ 推奨パターン

```vue
<script setup lang="ts">
// 1. import文
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@features/auth/stores/auth'

// 2. 型定義
interface Props {
  title: string
  loading?: boolean
}

// 3. Props定義（withDefaults使用）
const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// 4. Emits定義
const emit = defineEmits<{
  submit: [data: FormData]
  cancel: []
}>()

// 5. ストア・コンポーザブル使用
const authStore = useAuthStore()

// 6. リアクティブ状態
const isSubmitting = ref(false)
const formData = ref({})

// 7. 算出プロパティ
const isValid = computed(() => {
  return formData.value.title && !isSubmitting.value
})

// 8. メソッド定義
const handleSubmit = async () => {
  if (!isValid.value) return

  isSubmitting.value = true
  try {
    emit('submit', formData.value)
  } finally {
    isSubmitting.value = false
  }
}

// 9. ライフサイクル
onMounted(() => {
  // 初期化処理
})
</script>
```

### Composition APIベストプラクティス

#### 1. リアクティビティの適切な活用

```typescript
// ✅ 良い例：適切なリアクティビティ
const user = ref<User | null>(null)
const isAuthenticated = computed(() => !!user.value)

// ❌ 悪い例：不要なリアクティビティ
const staticConfig = ref({ apiUrl: 'https://api.example.com' }) // 定数はrefしない
```

#### 2. Composable関数の活用

```typescript
// composables/useFormValidation.ts
export function useFormValidation<T>(rules: ValidationRules<T>) {
  const errors = ref<Record<string, string>>({})
  const isValid = computed(() => Object.keys(errors.value).length === 0)

  const validate = (data: T) => {
    // バリデーションロジック
  }

  return { errors, isValid, validate }
}

// コンポーネントでの使用
const { errors, isValid, validate } = useFormValidation(validationRules)
```

#### 3. 副作用の管理

```typescript
// ✅ 良い例：watchEffect使用
watchEffect(() => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})

// ✅ 良い例：watch使用
watch(
  () => props.userId,
  async (newUserId) => {
    if (newUserId) {
      await fetchUserData(newUserId)
    }
  },
  { immediate: true },
)
```

## 🧩 コンポーネント設計パターン

### ベースコンポーネント（components/base/）活用

#### 1. ベースコンポーネントの特徴

- **再利用可能**: プロジェクト全体で使用可能
- **最小限のロジック**: 表示とイベント発火のみ
- **型安全**: 厳密な型定義
- **デザインシステム準拠**: デザイントークン使用

#### 2. ベースコンポーネントの使用例

```vue
<!-- BaseButton.vue の使用例 -->
<template>
  <BaseButton :loading="isSubmitting" color="primary" variant="elevated" @click="handleSubmit">
    送信
  </BaseButton>
</template>
```

### プレゼンテーション/コンテナコンポーネント分離

#### 1. プレゼンテーションコンポーネント

```vue
<!-- features/dashboard/components/StatCard.vue -->
<template>
  <BaseCard>
    <template #title>{{ title }}</template>
    <div class="stat-value">{{ value }}</div>
    <div class="stat-change" :class="changeClass">
      {{ changeText }}
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: number | string
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
}

const props = defineProps<Props>()

const changeClass = computed(() => ({
  'stat-change--positive': props.changeType === 'increase',
  'stat-change--negative': props.changeType === 'decrease',
  'stat-change--neutral': props.changeType === 'neutral',
}))
</script>
```

#### 2. コンテナコンポーネント

```vue
<!-- views/dashboard/DashBoardPage.vue -->
<template>
  <div class="dashboard">
    <StatCard
      v-for="stat in dashboardStats"
      :key="stat.key"
      :title="stat.title"
      :value="stat.value"
      :change="stat.change"
      :change-type="stat.changeType"
    />
  </div>
</template>

<script setup lang="ts">
import { useDashboardData } from '@features/dashboard/composables/useDashboardData'
import StatCard from '@features/dashboard/components/StatCard.vue'

const { dashboardStats, loading } = useDashboardData()
</script>
```

### Props/Emitsの型定義方針

#### 1. Props型定義

```typescript
// ✅ 推奨：インターフェース使用
interface Props {
  title: string
  items: Array<{ id: string; name: string }>
  config?: {
    showIcons: boolean
    sortable: boolean
  }
}

// ✅ withDefaults使用
const props = withDefaults(defineProps<Props>(), {
  config: () => ({ showIcons: true, sortable: false }),
})
```

#### 2. Emits型定義

```typescript
// ✅ 推奨：厳密な型定義
const emit = defineEmits<{
  // イベント名: [引数の型]
  'update:modelValue': [value: string]
  'item:select': [item: Item, index: number]
  'item:delete': [itemId: string]
  error: [error: Error]
}>()
```

### スロット・プロバイド/インジェクト使用指針

#### 1. スロット活用

```vue
<!-- BaseCard.vue -->
<template>
  <v-card class="base-card">
    <v-card-title v-if="$slots.title">
      <slot name="title" />
    </v-card-title>
    <v-card-text>
      <slot />
    </v-card-text>
    <v-card-actions v-if="$slots.actions">
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>
```

#### 2. プロバイド/インジェクト

```typescript
// providers/themeProvider.ts
export const ThemeSymbol = Symbol('theme')

export function provideTheme() {
  const theme = useThemeStore()
  provide(ThemeSymbol, theme)
  return theme
}

export function useTheme() {
  const theme = inject(ThemeSymbol)
  if (!theme) {
    throw new Error('useTheme must be used within a theme provider')
  }
  return theme
}
```

## 🗂️ Piniaストア使用方針

### ストア分割戦略

#### 1. 機能別分割

```
stores/
├── auth/              # 認証関連（複雑機能のため分割）
├── data.ts            # メインデータストア
├── notification.ts    # 通知管理
├── theme.ts           # UI設定
└── emotionTags.ts     # 感情タグ管理
```

#### 2. 認証ストアの分割例

```typescript
// stores/auth/index.ts - メインエクスポート
export { useAuthStore } from './authentication'
export { useSessionStore } from './session'
export { useSecurityStore } from './security'
export { useLockoutStore } from './lockout'

// 統合インターフェース
export function useAuth() {
  return {
    auth: useAuthStore(),
    session: useSessionStore(),
    security: useSecurityStore(),
    lockout: useLockoutStore(),
  }
}
```

### アクション・ゲッター命名規則

#### 1. アクション命名

```typescript
// ✅ 動詞 + 名詞の形式
export const useAuthStore = defineStore('auth', () => {
  // CRUD操作
  const fetchUser = async () => {} // 取得
  const createUser = async () => {} // 作成
  const updateUser = async () => {} // 更新
  const deleteUser = async () => {} // 削除

  // 状態変更
  const setLoading = (loading: boolean) => {}
  const resetState = () => {}
  const clearErrors = () => {}

  // ビジネスロジック
  const validateSession = async () => {}
  const refreshToken = async () => {}
})
```

#### 2. ゲッター命名

```typescript
// ✅ 形容詞・is/has接頭辞
const isAuthenticated = computed(() => !!user.value)
const hasPermission = computed(() => user.value?.role === 'admin')
const isLoading = computed(() => loading.value)
const currentUser = computed(() => user.value)
```

### 状態管理ベストプラクティス

#### 1. ストア構造

```typescript
export const useDataStore = defineStore('data', () => {
  // 1. 状態定義
  const diaries = ref<DiaryEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 2. ゲッター
  const filteredDiaries = computed(() => {
    return diaries.value.filter((diary) => diary.mood > 5)
  })

  // 3. アクション
  const fetchDiaries = async () => {
    loading.value = true
    try {
      const { data } = await supabase.from('diaries').select('*')
      diaries.value = data || []
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // 4. リセット機能
  const $reset = () => {
    diaries.value = []
    loading.value = false
    error.value = null
  }

  return {
    // 状態
    diaries: readonly(diaries),
    loading: readonly(loading),
    error: readonly(error),
    // ゲッター
    filteredDiaries,
    // アクション
    fetchDiaries,
    $reset,
  }
})
```

## 🎯 TypeScript型定義ルール

### 自動生成型の活用

#### 1. 自動生成ファイル

```typescript
// types/database.ts - Supabaseスキーマから自動生成
export interface Database {
  public: {
    Tables: {
      diaries: {
        Row: DiaryRow
        Insert: DiaryInsert
        Update: DiaryUpdate
      }
    }
  }
}

// types/supabase.ts - Supabaseクライアント型
export type SupabaseClient = Client<Database>
```

#### 2. 自動生成型の使用例

```typescript
// ✅ 自動生成型を活用
import type { Database } from '@/types/database'

type DiaryRow = Database['public']['Tables']['diaries']['Row']
type DiaryInsert = Database['public']['Tables']['diaries']['Insert']
```

### カスタム型定義（custom.ts）管理方針

#### 1. カスタム型の用途

```typescript
// types/custom.ts - 手動管理
export interface DiaryEntry {
  // 実際のアプリケーションで使用する型
  id: string
  user_id: string
  title: string
  content: string
  mood: number
  // ... UI用の追加プロパティ
}

// UI拡張型
export interface DiaryEntryWithEmotionTags extends DiaryEntry {
  emotion_tags?: EmotionTag[]
}
```

#### 2. 型の使い分け

```typescript
// ✅ 適切な型の使い分け
import type { DiaryRow } from '@/types/database' // DB操作用
import type { DiaryEntry } from '@/types/custom' // アプリケーション用
import type { DiaryInsert } from '@/types/database' // 挿入操作用

const fetchDiary = async (id: string): Promise<DiaryEntry> => {
  const { data } = await supabase.from('diaries').select('*').eq('id', id).single()

  return data as DiaryEntry // 必要に応じて変換
}
```

### インターフェース設計指針

#### 1. 命名規則

```typescript
// ✅ 推奨命名パターン
interface UserProfile {} // エンティティ型
interface CreateUserRequest {} // リクエスト型
interface UserResponse {} // レスポンス型
interface UserFormData {} // フォーム用型
interface UserDisplayProps {} // コンポーネントProps型
```

#### 2. ジェネリック活用

```typescript
// ✅ 再利用可能なジェネリック型
interface ApiResponse<T> {
  data: T
  error: string | null
  loading: boolean
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
  }
}
```

## 🚀 新規コンポーネント作成指針

### ファイル命名規則

#### 1. 命名ルール

- **PascalCase**: すべてのVueコンポーネント
- **camelCase**: TypeScript ファイル
- **kebab-case**: CSS クラス名

```
✅ 良い例：
components/DiaryRegisterForm.vue
composables/useDataFetch.ts
stores/emotionTags.ts

❌ 悪い例：
components/diary-register-form.vue
composables/UseDataFetch.ts
stores/emotion_tags.ts
```

### テンプレート・スクリプト・スタイル構成

#### 1. 新規コンポーネントテンプレート

```vue
<template>
  <div class="component-name">
    <!-- テンプレート内容 -->
  </div>
</template>

<script setup lang="ts">
/**
 * ComponentName - 機能説明
 * Issue #xxx: 関連Issue番号
 */

// 1. import文
import { ref, computed } from 'vue'

// 2. 型定義
interface Props {
  // Props定義
}

// 3. Props・Emits
const props = defineProps<Props>()
const emit = defineEmits<{
  // イベント定義
}>()

// 4. ロジック実装
</script>

<style scoped>
/* コンポーネント固有スタイル */
.component-name {
  /* デザイントークン使用 */
  padding: var(--spacing-md);
  border-radius: var(--border-radius-card);
}
</style>
```

### 必須要素チェックリスト

#### ✅ 新規コンポーネント作成時の必須要素

- [ ] **TypeScript型定義**: Props/Emitsの厳密な型定義
- [ ] **アクセシビリティ**: aria-label, role等の適切な設定
- [ ] **エラーハンドリング**: try-catch文とエラー状態管理
- [ ] **ローディング状態**: 非同期処理のローディング表示
- [ ] **テスト**: 正常系・異常系のユニットテスト作成
- [ ] **ドキュメント**: JSDocコメントとコンポーネント説明
- [ ] **デザイントークン**: CSS変数の使用
- [ ] **国際化対応**: 必要に応じてi18n対応

#### 2. テスト同時作成

```javascript
// tests/[ComponentName]/normal_[ComponentName]_01.spec.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ComponentName from '@/components/ComponentName.vue'

describe('ComponentName - 正常系', () => {
  it('基本的なレンダリングが正常に行われる', () => {
    const wrapper = mount(ComponentName, {
      props: {
        // 必要なprops
      },
    })

    expect(wrapper.exists()).toBe(true)
  })
})
```

## 🏗️ アーキテクチャ原則

### 設計原則

#### 1. 単一責任の原則

```typescript
// ✅ 良い例：単一責任
const useUserValidation = () => {
  // ユーザーバリデーションのみに責任を持つ
}

const useUserApi = () => {
  // ユーザーAPI操作のみに責任を持つ
}

// ❌ 悪い例：複数責任
const useUser = () => {
  // バリデーション + API操作 + UI状態管理（責任が多すぎる）
}
```

#### 2. 依存関係の逆転

```typescript
// ✅ 良い例：抽象に依存
interface DataRepository {
  fetchData(): Promise<Data[]>
}

const useDataService = (repository: DataRepository) => {
  // 具象ではなく抽象に依存
}

// 実装
const supabaseRepository: DataRepository = {
  fetchData: () => supabase.from('data').select('*'),
}
```

### パフォーマンス考慮事項

#### 1. 遅延読み込み

```typescript
// ✅ コンポーネントの遅延読み込み
const DiaryEditPage = defineAsyncComponent(() => import('@/views/DiaryEditPage.vue'))

// ✅ ストアの遅延初期化
const initializeStoreIfNeeded = () => {
  if (!store.initialized) {
    store.initialize()
  }
}
```

#### 2. メモ化の活用

```typescript
// ✅ 計算結果のメモ化
const expensiveComputation = computed(() => {
  return heavyCalculation(props.data)
})

// ✅ watchの最適化
watch(
  () => props.searchQuery,
  debounce(async (newQuery) => {
    await searchData(newQuery)
  }, 300),
)
```

### セキュリティ考慮事項

#### 1. 入力値検証

```typescript
// ✅ 入力値サニタイゼーション
import DOMPurify from 'dompurify'

const sanitizeUserInput = (input: string): string => {
  return DOMPurify.sanitize(input)
}
```

#### 2. 認証・認可

```typescript
// ✅ ルートガード
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})
```

---

**📋 関連ドキュメント**

- [CLAUDE.md](../CLAUDE.md) - プロジェクト開発指針
- [tests/README.md](../tests/README.md) - テスト戦略・構造ガイド
- [docs/DEVELOPMENT/ARCHITECTURE.md](../docs/DEVELOPMENT/ARCHITECTURE.md) - 詳細アーキテクチャ
- [Vue 3公式ドキュメント](https://vuejs.org/) - Vue 3 Composition API
- [Pinia公式ドキュメント](https://pinia.vuejs.org/) - 状態管理ガイド
