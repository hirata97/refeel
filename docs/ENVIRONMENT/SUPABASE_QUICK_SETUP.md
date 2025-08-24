# Supabase認証システム クイックセットアップガイド

新しい開発者やプロジェクトメンバーが迅速にSupabase認証システムを設定するためのガイドです。

## 🚀 5分でセットアップ

### ステップ1: Supabaseプロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. 「**New Project**」をクリック
3. 設定内容:
   ```
   Name: GoalCategorizationDiary (または任意)
   Database Password: [強いパスワードを設定]
   Region: Northeast Asia (Tokyo)
   ```
4. 「**Create new project**」をクリック（作成まで約2分）

### ステップ2: API情報取得

1. プロジェクト作成後、左メニューから「**Settings**」→「**API**」
2. 以下をコピー:
   - **Project URL**: `https://xxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`（長いJWT）

### ステップ3: 環境変数設定

プロジェクトルートに `.env` ファイルを作成:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### ステップ4: 認証設定

1. Supabase Dashboard → 「**Authentication**」→「**Providers**」
2. 「**Email**」をクリック
3. 🔄 **「Confirm Email」のチェックを外す** (開発用)
4. 「**Save**」をクリック

### ステップ5: データベーステーブル作成

1. Supabase Dashboard → 「**Database**」→「**SQL Editor**」
2. 「**New Query**」をクリック
3. 以下のSQLをコピペして「**Run**」:

```sql
-- accounts テーブル
CREATE TABLE public.accounts (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- diaries テーブル
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

-- セキュリティ設定
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own account" ON public.accounts USING (auth.uid() = id);
CREATE POLICY "Users can manage own diaries" ON public.diaries USING (auth.uid() = user_id);
```

### ステップ6: 動作確認

1. ターミナルで開発サーバー起動:
   ```bash
   npm run dev
   ```

2. ブラウザで http://localhost:5173 にアクセス

3. 新規登録をテスト:
   - `/register` ページで任意のメールアドレスで登録
   - 例: `test@test.com`, パスワード: `password123`

4. ログイン・ログアウトをテスト

## ✅ セットアップ完了チェックリスト

- [ ] Supabaseプロジェクト作成完了
- [ ] API URL・Keyを取得してメモ
- [ ] `.env` ファイル作成・設定
- [ ] 認証プロバイダー設定（メール確認無効化）
- [ ] データベーステーブル作成（SQL実行）
- [ ] 開発サーバー起動成功
- [ ] ユーザー登録・ログインテスト成功

## 🔧 よくある問題と解決方法

### 問題1: 「No API key found」エラー

**解決方法**:
```bash
# 開発サーバーを再起動
Ctrl+C (サーバー停止)
npm run dev
```

### 問題2: 「email_address_invalid」エラー

**解決方法**: ステップ4の認証設定を再確認
- Authentication → Providers → Email → **「Confirm Email」を無効化**

### 問題3: 404エラー（データベースアクセス時）

**解決方法**: ステップ5のSQL実行を再確認
- Database → SQL Editor でテーブル作成SQLを再実行

### 問題4: ログイン後に画面が表示されない

**解決方法**:
1. ブラウザのキャッシュをクリア（Ctrl+Shift+R）
2. ブラウザのコンソール（F12）でエラーを確認

## 📞 サポート

### 詳細ドキュメント
- [完全版ドキュメント](SUPABASE_AUTH.md)
- [CLAUDE.mdプロジェクト設定](../CLAUDE.md)

### デバッグ用コマンド

ブラウザのコンソール（F12）で実行:
```javascript
// 認証状態確認
console.log('認証状態:', useAuthStore().isAuthenticated)
console.log('ユーザー情報:', useAuthStore().user)

// 強制ログアウト
await useAuthStore().signOut()
location.reload()
```

### 問題報告

セットアップで問題が発生した場合:
1. エラーメッセージの全文をコピー
2. ブラウザのコンソールログを確認
3. 上記の情報と共にプロジェクトチームに報告

---

**⏱️ 想定所要時間**: 5-10分  
**✨ 完了後**: ユーザー登録・ログイン機能が利用可能  
**🔄 最終更新**: 2025-08-17