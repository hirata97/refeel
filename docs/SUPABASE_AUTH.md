# Supabase認証システムドキュメント

このドキュメントは、GoalCategorizationDiaryプロジェクトで使用されているSupabase認証システムの詳細な説明と設定手順を提供します。

## 📋 目次

- [システム概要](#システム概要)
- [アーキテクチャ](#アーキテクチャ)
- [セットアップ手順](#セットアップ手順)
- [認証ストア](#認証ストア)
- [ルーターガード](#ルーターガード)
- [データベーススキーマ](#データベーススキーマ)
- [使用方法](#使用方法)
- [トラブルシューティング](#トラブルシューティング)

## システム概要

### 技術スタック
- **認証プロバイダー**: Supabase Auth
- **状態管理**: Pinia (Vue 3)
- **フロントエンド**: Vue 3 + TypeScript
- **ルーティング**: Vue Router with guards

### 主要機能
- ✅ メールアドレス + パスワード認証
- ✅ セッション管理と自動更新
- ✅ 認証状態のリアクティブ管理
- ✅ ルート保護とリダイレクト
- ✅ ページリロード時の状態復元
- ✅ ログアウト機能

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vue 3)                        │
├─────────────────────────────────────────────────────────────┤
│  Components (Login, Register, Dashboard, etc.)             │
│                           │                                 │
│  ┌─────────────────────┐  │  ┌─────────────────────────────┐│
│  │   useAuthStore()    │◄─┼─►│      Vue Router Guards       ││
│  │    (Pinia)          │  │  │   (Authentication Check)    ││
│  └─────────────────────┘  │  └─────────────────────────────┘│
│             │              │                                 │
├─────────────┼──────────────┼─────────────────────────────────┤
│  Supabase Client           │                                 │
│             │              │                                 │
│  ┌─────────────────────┐  │  ┌─────────────────────────────┐│
│  │   Authentication    │◄─┼─►│     Database Tables         ││
│  │      Events         │  │  │  (accounts, diaries, etc.)  ││
│  └─────────────────────┘  │  └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Cloud                          │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Auth Service  │    │   PostgreSQL    │                │
│  │                 │    │    Database     │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. 「New Project」をクリック
3. プロジェクト設定:
   - **Name**: `GoalCategorizationDiary`
   - **Database Password**: 強いパスワードを設定
   - **Region**: `Northeast Asia (Tokyo)`

### 2. 認証設定

1. **Authentication → Providers → Email** を選択
2. **「Confirm Email」を無効化** (開発環境用)
3. **Site URL**: `http://localhost:5173` (開発用)
4. **Redirect URLs**: `http://localhost:5173/**`

### 3. データベーステーブル作成

**Database → SQL Editor** で以下のSQLを実行:

```sql
-- accounts テーブルの作成
CREATE TABLE public.accounts (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- diaries テーブルの作成  
CREATE TABLE public.diaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5) DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

-- セキュリティポリシーの設定
CREATE POLICY "Users can manage own account" ON public.accounts
  USING (auth.uid() = id);

CREATE POLICY "Users can manage own diaries" ON public.diaries
  USING (auth.uid() = user_id);
```

### 4. 環境変数設定

`.env` ファイルを作成・更新:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

## 認証ストア

### ファイル構成

```
src/stores/auth.ts     # メイン認証ストア
src/lib/supabase.ts    # Supabaseクライアント設定
src/utils/auth.ts      # 認証ユーティリティ関数
```

### 主要な状態管理

```typescript
// 認証ストアの状態
interface AuthState {
  user: User | null           // 現在のユーザー情報
  session: Session | null     // 現在のセッション
  loading: boolean            // ローディング状態
  error: string | null        // エラーメッセージ
}

// 計算プロパティ
const isAuthenticated = computed(() => !!user.value && !!session.value)
```

### 主要メソッド

| メソッド | 説明 | 戻り値 |
|----------|------|---------|
| `initialize()` | 認証状態の初期化 | `Promise<void>` |
| `signIn(email, password)` | ログイン | `Promise<{success: boolean, user?: User, error?: string}>` |
| `signUp(email, password)` | ユーザー登録 | `Promise<{success: boolean, user?: User, error?: string}>` |
| `signOut()` | ログアウト | `Promise<{success: boolean, error?: string}>` |
| `refreshSession()` | セッション更新 | `Promise<boolean>` |
| `setupAuthListener()` | 認証イベントリスナー設定 | `Subscription` |

## ルーターガード

### 実装場所
`src/router/index.ts`

### 保護対象ルート
```typescript
const protectedRoutes = [
  '/dashboard',
  '/diaryregister', 
  '/diaryview',
  '/diaryreport',
  '/setting',
  '/help'
]
```

### ガード処理
```typescript
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      next({ path: '/login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  } else {
    next()
  }
})
```

## データベーススキーマ

### accounts テーブル

| カラム | 型 | 制約 | 説明 |
|--------|----|----- |------|
| id | UUID | PK, FK → auth.users(id) | ユーザーID |
| username | TEXT | NOT NULL | ユーザー名 |
| email | TEXT | NOT NULL | メールアドレス |
| created_at | TIMESTAMPTZ | DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMPTZ | DEFAULT now() | 更新日時 |

### diaries テーブル

| カラム | 型 | 制約 | 説明 |
|--------|----|----- |------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 日記ID |
| user_id | UUID | FK → auth.users(id), NOT NULL | ユーザーID |
| date | DATE | NOT NULL | 日記の日付 |
| title | TEXT | NOT NULL | タイトル |
| content | TEXT | NOT NULL | 内容 |
| mood | INTEGER | CHECK (1-5), DEFAULT 3 | 気分スコア |
| created_at | TIMESTAMPTZ | DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMPTZ | DEFAULT now() | 更新日時 |

## 使用方法

### コンポーネントでの認証状態確認

```vue
<template>
  <div v-if="authStore.isAuthenticated">
    <p>ようこそ、{{ authStore.user?.email }}さん</p>
    <button @click="handleLogout">ログアウト</button>
  </div>
  <div v-else>
    <p>ログインが必要です</p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  const result = await authStore.signOut()
  if (result.success) {
    await router.push('/login')
  }
}
</script>
```

### ログイン処理

```typescript
const handleLogin = async () => {
  const result = await authStore.signIn(email.value, password.value)
  
  if (result.success) {
    await router.push('/dashboard')
  } else {
    console.error('Login failed:', result.error)
  }
}
```

### ユーザー登録処理

```typescript
const handleRegister = async () => {
  const result = await authStore.signUp(email.value, password.value)
  
  if (result.success && result.user) {
    // アカウント情報をデータベースに保存
    const { error } = await supabase.from('accounts').insert([
      {
        id: result.user.id,
        username: username.value,
        email: email.value
      }
    ])
    
    if (!error) {
      await router.push('/dashboard')
    }
  }
}
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. 「No API key found in request」エラー

**原因**: 環境変数が正しく読み込まれていない

**解決方法**:
1. `.env` ファイルの内容を確認
2. 開発サーバーを再起動: `npm run dev`
3. ブラウザキャッシュをクリア

#### 2. 「email_address_invalid」エラー

**原因**: Supabaseでメール確認が有効になっている

**解決方法**:
1. Supabase Dashboard → Authentication → Providers → Email
2. 「Confirm Email」を無効化

#### 3. 404エラー (データベースアクセス時)

**原因**: 必要なテーブルが作成されていない

**解決方法**:
1. Database → SQL Editor でテーブル作成SQLを実行
2. RLS (Row Level Security) ポリシーを確認

#### 4. ログイン後にページが表示されない

**原因**: ルーターガードまたは認証状態の問題

**解決方法**:
1. 開発者ツールのConsoleでエラーを確認
2. `authStore.isAuthenticated` の値を確認
3. ブラウザのLocalStorageを確認

### デバッグ用コード

開発中に認証状態を確認するためのコード:

```javascript
// ブラウザのコンソールで実行
console.log('Auth Store:', useAuthStore())
console.log('Current User:', useAuthStore().user)
console.log('Is Authenticated:', useAuthStore().isAuthenticated)
console.log('Session:', useAuthStore().session)
```

## セキュリティ考慮事項

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されており、ユーザーは自分のデータのみアクセス可能:

```sql
-- 例: diaries テーブルのポリシー
CREATE POLICY "Users can view own diaries" ON public.diaries
  FOR SELECT USING (auth.uid() = user_id);
```

### API キーの管理

- **anon/public key**: フロントエンドで使用（公開可能）
- **service_role key**: サーバーサイド専用（非公開）

### 本番環境での設定

1. **メール確認を有効化**
2. **適切なSite URLとRedirect URLsを設定**
3. **SMTP設定を構成**
4. **セキュリティポリシーの再確認**

---

**更新日**: 2025-08-17  
**バージョン**: 1.0.0  
**関連Issue**: #2 認証ロジックの実装