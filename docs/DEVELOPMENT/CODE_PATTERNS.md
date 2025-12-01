# Vue 3 / TypeScript コードパターン集

> **対象**: 実装時の具体的なコードパターンとアンチパターン
> **関連**: [BEST_PRACTICES.md](BEST_PRACTICES.md) - 開発原則、[ARCHITECTURE.md](ARCHITECTURE.md) - システム設計

## 📋 目次

- [モジュール分割](#モジュール分割)
- [TypeScript型パターン](#typescript型パターン)
- [Vue 3 Composition API](#vue-3-composition-api)
- [セキュリティパターン](#セキュリティパターン)
- [パフォーマンス最適化](#パフォーマンス最適化)
- [よくある落とし穴](#よくある落とし穴)

---

## 🏗️ モジュール分割

### 大きなファイルの分割指針

```typescript
// ❌ 避けるべきパターン（737行の巨大ストア）
export const useAuthStore = defineStore('auth', () => {
  // セッション管理 + 認証処理 + セキュリティ + ロックアウト
  // すべてが1つのファイルに混在
})

// ✅ 推奨パターン（機能別分割）
// stores/auth/index.ts - 統合インターフェース（185行）
export const useAuthStore = defineStore('auth', () => {
  const sessionStore = createSessionStore()
  const authenticationStore = createAuthenticationStore(/*...*/)
  const securityStore = createSecurityStore()
  const lockoutStore = createLockoutStore()

  return {
    // 統一されたAPIを提供（後方互換性保持）
    ...sessionStore,
    ...authenticationStore,
    ...securityStore,
    ...lockoutStore
  }
})
```

### 依存関係注入パターン

```typescript
// stores/auth/authentication.ts
export const createAuthenticationStore = (
  setSessionFn: (session: Session | null) => void,
  setLoadingFn: (loading: boolean) => void,
  // 必要な依存関係を注入
) => {
  // 認証処理の実装（404行）
  return { signIn, signUp, signOut, changePassword }
}
```

### モジュール分割の基準

- **1ファイル200行以下を目標**
- **単一責任原則**: 1ファイル1機能
- **明確な依存関係**: 依存関係注入で疎結合に

---

## 🔤 TypeScript型パターン

### 型安全性の強化

```typescript
// ❌ 避けるべきパターン
let mockData: any // any型の濫用
Object.values(data).filter((item: any) => {}) // 不適切な型キャスト

// ✅ 推奨パターン
let mockData: Partial<AuditLogger> // 適切な型定義
Object.values(data as Record<string, LoginAttempt[]>).filter((item: LoginAttempt) => {})

// 型安全性の強化例
interface StrictComponentProps {
  data: NonNullable<ComponentData>
  handlers: Required<EventHandlers>
  options?: Partial<ComponentOptions>
}

// ジェネリクス活用
function createTypedStore<T extends Record<string, unknown>>(initialState: T): Store<T> {
  // 実装
}
```

### null/undefined チェック

```typescript
// ❌ 避けるべき
function processData(data: Data | null) {
  return data.value // 型エラー
}

// ✅ 推奨パターン
function processData(data: Data | null) {
  if (!data) return null
  return data.value
}

// ✅ オプショナルチェイニング
function processData(data: Data | null) {
  return data?.value ?? 'default'
}
```

### 型アサーション

```typescript
// ❌ 避けるべき
const value = data as any // 型安全性の喪失

// ✅ 推奨パターン
const value = data as ComponentData // 適切な型アサーション

// ✅ 型ガード使用
function isComponentData(data: unknown): data is ComponentData {
  return typeof data === 'object' && data !== null && 'id' in data
}

if (isComponentData(data)) {
  // data は ComponentData として扱える
  console.log(data.id)
}
```

---

## 🎨 Vue 3 Composition API

### 基本パターン

```vue
<template>
  <!-- ❌ 古い記法（ESLintエラーの原因） -->
  <template #item.device="{ item }">
    {{ item.device }}
  </template>

  <!-- ✅ 推奨記法（Vue 3.2+） -->
  <template v-slot:[`item.device`]="{ item }">
    {{ item.device }}
  </template>
</template>

<script setup lang="ts">
// Composition APIベストプラクティス
import { ref, computed, watch, onMounted } from 'vue'
import { useDisplay } from 'vuetify' // Vuetifyコンポーザブル活用

// 明確な型定義
interface Props {
  data: ComponentData[]
  loading?: boolean
}

// デフォルト値の適切な設定
const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Emitsの型定義
const emit = defineEmits<{
  update: [value: string]
  delete: [id: number]
}>()
</script>
```

### リアクティビティパターン

```typescript
import { ref, reactive, computed, shallowRef } from 'vue'

// ✅ プリミティブ値にはref
const count = ref(0)
const message = ref('Hello')

// ✅ オブジェクト全体にはreactive
const state = reactive({
  user: null,
  loading: false,
})

// ✅ 大量データにはshallowRef
const largeDataSet = shallowRef<ComponentData[]>([])

// ✅ 計算プロパティ
const filteredData = computed(() => {
  return largeDataSet.value.filter(item => item.active)
})
```

### ライフサイクル

```typescript
import { onMounted, onUnmounted, watch } from 'vue'

// コンポーネントマウント時
onMounted(() => {
  // 初期化処理
  fetchData()
})

// クリーンアップ
onUnmounted(() => {
  // イベントリスナー削除、タイマークリア等
  clearInterval(timer)
})

// 監視
watch(
  () => props.userId,
  (newId, oldId) => {
    // userId変更時の処理
    fetchUserData(newId)
  },
  { immediate: true } // 初回実行
)
```

---

## 🛡️ セキュリティパターン

### 入力値検証・サニタイゼーション

```typescript
// 統合セキュリティモジュール活用
import { SecurityMonitor, SecurityIncidentReporter } from '@/security'
import { performSecurityCheck, sanitizeInputData } from '@/utils/sanitization'

// 必須チェックパターン
const createSecureData = async (inputData: unknown) => {
  // 1. セキュリティチェック
  const securityResult = performSecurityCheck(inputData)
  if (!securityResult.isSecure) {
    // セキュリティ監視システムに記録
    SecurityMonitor.getInstance().recordEvent({
      type: 'security_violation',
      severity: 'high',
      action: 'Input validation failed',
      details: { threats: securityResult.threats }
    })
    throw new Error(`セキュリティエラー: ${securityResult.threats.join(', ')}`)
  }

  // 2. サニタイゼーション
  const sanitized = sanitizeInputData(inputData)

  // 3. データベース操作
  return await supabase.from('table').insert(sanitized)
}
```

### XSS対策

```typescript
import DOMPurify from 'dompurify'

// ユーザー入力のサニタイゼーション
const sanitizeUserInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  })
}
```

### RLS（Row Level Security）

```sql
-- Supabaseポリシー例
CREATE POLICY "Users can only access their own data"
ON diaries
FOR ALL
USING (auth.uid() = user_id);
```

---

## ⚡ パフォーマンス最適化

### Vue 3最適化パターン

```vue
<script setup lang="ts">
import { computed, shallowRef } from 'vue'

// 大量データ用の最適化
const largeDataSet = shallowRef<ComponentData[]>([])

// 計算量を抑えたcomputed
const optimizedComputed = computed(() => {
  // メモ化や効率的なアルゴリズムを使用
  return expensiveOperation(largeDataSet.value)
})
</script>
```

### バンドルサイズ最適化

```typescript
// ✅ 動的インポートの活用
const HeavyComponent = defineAsyncComponent(() => import('@/components/HeavyComponent.vue'))

// ✅ Tree shakingを意識したインポート
import { specificFunction } from '@/utils/helpers'

// ❌ 避けるべき
// import * as helpers from '@/utils/helpers' // すべてがバンドルされる
```

### 不要な再レンダリング防止

```vue
<script setup lang="ts">
import { computed, watchEffect } from 'vue'

// ✅ computed使用で不要な再計算を防ぐ
const expensiveValue = computed(() => {
  return heavyCalculation(props.data)
})

// ❌ 避けるべき
// watchEffect(() => {
//   // 毎回再計算されてしまう
//   const value = heavyCalculation(props.data)
// })
</script>
```

---

## 🚨 よくある落とし穴

### 型エラー対応

**問題**: null/undefinedチェック不足
```typescript
// ❌ エラーになる
function getName(user: User | null) {
  return user.name // Object is possibly 'null'
}

// ✅ 修正
function getName(user: User | null) {
  return user?.name ?? 'Unknown'
}
```

**問題**: anyタイプ濫用
```typescript
// ❌ 避けるべき
const data: any = fetchData()

// ✅ 推奨
const data: ComponentData = fetchData()
// または
const data = fetchData() as ComponentData
```

### Vue.js テンプレート記法

**問題**: 古いslot記法
```vue
<!-- ❌ ESLintエラー -->
<template #item.device="{ item }">
  {{ item.device }}
</template>

<!-- ✅ 修正 -->
<template v-slot:[`item.device`]="{ item }">
  {{ item.device }}
</template>
```

**問題**: 動的スロット名
```vue
<!-- ❌ エスケープ不足 -->
<template v-slot:item.device="{ item }">

<!-- ✅ バッククォートでエスケープ -->
<template v-slot:[`item.device`]="{ item }">
```

### テスト品質

**問題**: モックの型安全性
```typescript
// ❌ any型使用
const mockStore: any = {
  state: {},
}

// ✅ Partial<T>使用
const mockStore: Partial<AuthStore> = {
  isAuthenticated: true,
  user: testUser,
}
```

**問題**: 非同期処理テスト
```typescript
// ❌ awaitなし
it('should fetch data', () => {
  fetchData() // Promise未処理
  expect(data).toBeDefined()
})

// ✅ async/await使用
it('should fetch data', async () => {
  await fetchData()
  expect(data).toBeDefined()
})
```

### パフォーマンス

**問題**: メモリリーク
```typescript
// ❌ イベントリスナー未削除
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// ✅ クリーンアップ実装
onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
```

**問題**: バンドルサイズ肥大化
```typescript
// ❌ 未使用インポート
import { func1, func2, func3, func4 } from 'large-library'
// func1のみ使用

// ✅ 必要なもののみインポート
import { func1 } from 'large-library'
```

---

## 📚 関連ドキュメント

- [BEST_PRACTICES.md](BEST_PRACTICES.md) - 開発ベストプラクティス
- [ARCHITECTURE.md](ARCHITECTURE.md) - システムアーキテクチャ
- [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) - 開発ワークフロー
- [../SECURITY/SECURITY_DEVELOPMENT.md](../SECURITY/SECURITY_DEVELOPMENT.md) - セキュリティ開発ガイド

---

**最終更新**: 2025-12-01
**作成元**: BEST_PRACTICES.mdから抽出・再構成
