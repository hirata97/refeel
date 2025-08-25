# 🚀 実装前必須チェックリスト

## 事前調査（必須）

1. 依存関係を確認する。

```bash
npm outdated
npm audit
```

2. 実装箇所と関連するコンポーネントを調査する。

- 型定義の確認
- インターフェースの理解
- 既存実装パターンの把握

3. 影響範囲を特定する。

- どのファイルが影響を受けるか
- 既存テストへの影響
- バージョン互換性の確認

## 設計フェーズ

- **最小単位での分割**: 機能を独立した小さな単位に分解
- **単一責任原則**: 1ファイル200行以下を目標とした機能分割
- **モジュール化戦略**: 依存関係を明確にした階層構造設計
- **テスト戦略**: 新機能の品質担保方法を事前に計画
- **型設計**: インターフェース・型定義を先に設計

### 🏗️ モジュール分割ベストプラクティス

#### 大きなファイルの分割指針
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

#### 依存関係注入パターン
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

## 段階的実装プロセス

### フェーズ1: 基盤準備

1. **型定義・インターフェース作成**
2. **基本構造の実装**

### フェーズ2: 機能実装

1. **コア機能実装**
2. **ユニットテスト同時作成** ⭐ 必須

### フェーズ3: 統合・最適化

1. **他コンポーネントとの統合**
2. **E2Eテストの追加**
3. **パフォーマンス・アクセシビリティ確認**

### フェーズ4: 最終検証

1. **リファクタリング・コード品質向上**
2. **ドキュメント更新**

## 🧪 テスト駆動開発（TDD）推奨

### 新規ストア・コンポーネント作成時

```bash
# 1. テストファイル作成（実装前）
touch tests/[ComponentName]/normal_[ComponentName]_01.spec.js
touch tests/[ComponentName]/exception_[ComponentName]_01.spec.js

# 2. テストケース設計
# - 正常系テスト
# - 異常系テスト
# - エッジケース

# 3. 実装
# - テストが通る最小限の実装

# 4. リファクタリング
# - テストが通ることを確認しながら改善
```

### テスト命名規則（プロジェクト標準）

- **正常系**: `normal_[ComponentName]_[番号].spec.js`
- **異常系**: `exception_[ComponentName]_[番号].spec.js`
- **テストディレクトリ**: `tests/[ComponentName]/`

## ⚡ CI/CD統合ワークフロー

### 推奨開発フロー

```bash
# 段階的品質チェック（実装中に実行）
npm run ci:lint && npm run ci:type-check

# 機能完成時チェック
npm run ci:test  # テスト + カバレッジ

# PR作成前最終チェック
npm run ci:lint      # 厳格リンティング
npm run ci:type-check # TypeScript検証
npm run ci:test      # テスト + カバレッジ
npm run ci:build     # プロダクションビルド
npm run ci:security  # セキュリティチェック
```

### エラー対応原則

- **即座対応**: 型エラー、リンティングエラーは後回しにしない
- **段階的修正**: 大量エラーは小分けして段階的に修正
- **根本原因**: エラーの根本原因を特定してから修正

## 🔧 依存関係管理

### バージョン互換性チェック

```bash
# 開発開始前必須
npm outdated
npm audit --audit-level=moderate

# 新規パッケージ追加時
npm install [package]@[compatible-version] --save-dev
```

### 依存関係競合の回避

- **メジャーバージョン**: 慎重に更新、影響範囲を十分調査
- **マイナーバージョン**: 機能追加時は互換性を確認
- **パッチバージョン**: セキュリティ修正は積極的に適用

## 📝 コード品質向上

### TypeScript活用（Issue #112反省点対応）

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

### Vue 3パターン（最新記法対応）

```vue
<template>
  <!-- ❌ 古い記法（ESLintエラーの原因） -->
  <template #item.device="{ item }">
    <!-- ✅ 推奨記法（Vue 3.2+） -->
    <template v-slot:[`item.device`]="{ item }"> </template>

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
    </script></template
  >
</template>
```

## 🛡️ セキュリティベストプラクティス

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

## 📚 ドキュメント更新

### 実装完了時必須更新

- **ARCHITECTURE.md**: 新機能追加時
- **CLAUDE.md**: 重要な変更時
- **README**: ユーザー影響がある場合
- **型定義コメント**: 複雑なインターフェース

### コミットメッセージ規則

```bash
# 形式: type: 簡潔な説明
#
# 詳細説明（必要に応じて）
#
# 🤖 Generated with Claude Code
#
# Co-Authored-By: Claude <noreply@anthropic.com>

# 例:
feat: ページネーションストアのURL同期機能追加

- URLパラメータとの完全同期
- ブラウザ履歴管理対応
- ローカルストレージ永続化

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 🎯 パフォーマンス最適化

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
// 動的インポートの活用
const HeavyComponent = defineAsyncComponent(() => import('@/components/HeavyComponent.vue'))

// Tree shakingを意識したインポート
import { specificFunction } from '@/utils/helpers'
// import * as helpers from '@/utils/helpers' // ❌ 避ける
```

## 🚨 よくある落とし穴

### 型エラー対応

- **null/undefinedチェック不足**: 厳密なnullチェックを実装
- **anyタイプ濫用**: 適切な型定義で置き換え（`Partial<T>`、`Record<K,V>`活用）
- **オプショナルプロパティ**: `?.`演算子の適切な使用
- **型キャスト**: `as any`ではなく適切な型アサーション使用

### Vue.js テンプレート記法

- **古いslot記法**: `#item.xxx`は`v-slot:[item.xxx]`に更新
- **動的スロット名**: バッククォートでエスケープ必須
- **Vuetify互換性**: 最新記法への対応が必要

### テスト品質

- **モックの適切な使用**: 外部依存関係は必ずモック
- **非同期処理テスト**: `async/await`の正しい使用
- **DOM操作テスト**: Vue Test Utilsの適切な活用
- **型安全なモック**: `any`型ではなく`Partial<T>`使用

### ESLint/TypeScript設定

- **厳格モード**: `@typescript-eslint/no-explicit-any`準拠
- **型注釈**: 推論可能でも明示的な型定義推奨
- **unused変数**: 不要な変数・インポートの削除

### パフォーマンス

- **不要な再レンダリング**: 適切なmemo化
- **メモリリーク**: イベントリスナーの適切なクリーンアップ
- **バンドルサイズ**: 未使用インポートの削除

---

## 📈 継続改善

このドキュメントは開発プロジェクトの反省点を基に継続的に更新されます。
新たな課題や改善点が見つかった場合は、積極的にこのドキュメントに反映してください。
