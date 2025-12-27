# 本番Supabase環境セットアップガイド

> **対象**: 開発者・デプロイ担当者
> **最終更新**: 2025-12-27
> **関連Issue**: #315

## 📝 概要

このドキュメントでは、Refeel（Vue 3 + Vite + Supabase）の本番環境用Supabaseプロジェクトのセットアップ手順を説明します。

## 🎯 前提条件

### 必須

- Supabaseアカウント（[https://app.supabase.com/](https://app.supabase.com/)で無料登録可能）
- Supabase CLI（ローカル開発環境にインストール済み）
- ローカルSupabase環境が正常に動作していること

### 確認事項

```bash
# Supabase CLIバージョン確認
supabase --version

# ローカルSupabase起動確認
supabase status

# マイグレーションファイル確認
ls -la supabase/migrations/
```

## 🚀 本番Supabaseプロジェクト作成

### 1. Supabase Dashboardにアクセス

1. [Supabase Dashboard](https://app.supabase.com/)にアクセス
2. GitHubアカウントまたはメールアドレスで認証
3. "New Project"をクリック

### 2. プロジェクト設定

**基本設定**:
- **Organization**: 既存のOrganizationを選択、または新規作成
- **Project Name**: `refeel-production`（任意）
- **Database Password**: 強力なパスワードを生成・保管
  - **重要**: このパスワードは後から確認できないため、必ず安全に保管してください
  - 推奨: パスワード管理ツール（1Password、Bitwarden等）を使用
- **Region**: **Northeast Asia (Tokyo)** `ap-northeast-1`（推奨）
  - 日本国内からのアクセスでレイテンシを最小化
  - 代替: **Southeast Asia (Singapore)** `ap-southeast-1`

**Pricing Tier**:
- **Free Tier**: 開発・検証用（月間データベース容量500MB、帯域幅5GB）
- **Pro Tier**: 本番運用推奨（月額$25、データベース容量8GB、帯域幅50GB）

### 3. プロジェクト作成完了

プロジェクト作成後、以下の情報を取得・保管します：

| 項目 | 説明 | 取得方法 |
|------|------|---------|
| **Project URL** | `https://[project-id].supabase.co` | Dashboard → Settings → API → Project URL |
| **Anon Key** | 公開可能なAPIキー（クライアント用） | Dashboard → Settings → API → Project API keys → anon public |
| **Service Role Key** | 機密情報（サーバーサイド専用） | Dashboard → Settings → API → Project API keys → service_role |
| **Database Password** | プロジェクト作成時に設定 | プロジェクト作成時のみ表示 |

**重要な注意事項**:
- ✅ **Anon Key**のみをフロントエンドアプリケーションで使用
- ❌ **Service Role Key**は絶対にクライアントサイドで使用しない（RLS回避の危険性）
- ✅ 環境変数として安全に管理（`.env`ファイル、Vercel環境変数等）

## 📊 データベーススキーマ移行

### 方法1: Supabase CLIでマイグレーション実行（推奨）

**手順**:

1. **Supabaseプロジェクトにリンク**:
   ```bash
   # プロジェクトIDを確認（Dashboard → Settings → General → Reference ID）
   supabase link --project-ref [project-id]

   # 例: supabase link --project-ref abcdefghijklmnop
   ```

2. **データベースパスワードを入力**:
   - プロジェクト作成時に設定したパスワードを入力

3. **マイグレーション実行**:
   ```bash
   # ローカルマイグレーションファイルを本番環境に適用
   supabase db push

   # 確認プロンプトが表示された場合は "y" を入力
   ```

4. **マイグレーション確認**:
   ```bash
   # リモートマイグレーション履歴を確認
   supabase migration list --linked

   # 期待される出力:
   # local      remote    Time (UTC)
   # 00000000000000_initial_schema  00000000000000_initial_schema  2024-11-20 00:00:00
   ```

**成功時の出力例**:
```
Applying migration 00000000000000_initial_schema.sql...
Migration applied successfully.
```

### 方法2: Supabase DashboardでSQL直接実行

**手順**:

1. Supabase Dashboard → SQL Editor
2. "New Query"をクリック
3. `supabase/migrations/00000000000000_initial_schema.sql`の内容をコピー&ペースト
4. "Run"をクリックして実行

**注意事項**:
- 一度に実行するSQL文が大きい場合、タイムアウトする可能性があります
- 推奨: 方法1（Supabase CLI）を使用

### 方法3: ローカルスキーマダンプからリストア

**手順**:

1. **ローカル環境でスキーマダンプ**:
   ```bash
   # ローカルSupabase起動
   supabase start

   # スキーマダンプ（テーブル構造のみ）
   supabase db dump --local --schema public > schema.sql
   ```

2. **本番環境にリストア**:
   ```bash
   # リンク済みプロジェクトにリストア
   psql -h db.[project-id].supabase.co -U postgres -d postgres -f schema.sql

   # データベースパスワードを入力
   ```

**注意事項**:
- この方法は高度なユーザー向けです
- 推奨: 方法1（Supabase CLI）を使用

## 🔒 RLS（Row Level Security）設定確認

### RLS有効化確認

**Supabase Dashboard**:
1. Dashboard → Database → Tables
2. 各テーブルを選択
3. "Row Level Security"タブを確認
4. "Enable RLS"がONになっていることを確認

**SQL Editor**で確認:
```sql
-- RLS有効化状態を確認
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 期待される結果: すべてのテーブルで rowsecurity = true
```

### RLSポリシー確認

**SQL Editor**で確認:
```sql
-- RLSポリシー一覧を確認
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**期待されるポリシー**:

| テーブル | ポリシー名 | 種類 | 説明 |
|----------|-----------|------|------|
| `diaries` | `diaries_all_own` | FOR ALL | ユーザー自身の日記のみアクセス可能 |
| `profiles` | `profiles_all_own` | FOR ALL | ユーザー自身のプロフィールのみアクセス可能 |
| `settings` | `settings_all_own` | FOR ALL | ユーザー自身の設定のみアクセス可能 |
| `emotion_tags` | `emotion_tags_select_all` | FOR SELECT | 全ユーザーが読み取り可能（マスターデータ） |
| `diary_emotion_tags` | `diary_emotion_tags_select_own` | FOR SELECT | ユーザー自身の日記関連のみアクセス可能 |
| `diary_emotion_tags` | `diary_emotion_tags_insert_own` | FOR INSERT | ユーザー自身の日記関連のみ挿入可能 |
| `diary_emotion_tags` | `diary_emotion_tags_delete_own` | FOR DELETE | ユーザー自身の日記関連のみ削除可能 |

### RLSテスト

**テスト手順**:

1. **テストユーザー作成**:
   - Dashboard → Authentication → Users → "Add user"
   - Email: `test1@example.com`, Password: `testpassword123`
   - Email: `test2@example.com`, Password: `testpassword123`

2. **テストデータ作成**（SQL Editor）:
   ```sql
   -- test1ユーザーの日記を作成
   INSERT INTO public.diaries (user_id, date, title, content, mood, goal_category, progress_level)
   VALUES (
     '[test1-user-id]',  -- Dashboard → Authentication → Users → test1のUIDをコピー
     '2025-12-27',
     'Test Diary 1',
     'This is a test diary for user 1',
     8,
     'work',
     7
   );

   -- test2ユーザーの日記を作成
   INSERT INTO public.diaries (user_id, date, title, content, mood, goal_category, progress_level)
   VALUES (
     '[test2-user-id]',  -- Dashboard → Authentication → Users → test2のUIDをコピー
     '2025-12-27',
     'Test Diary 2',
     'This is a test diary for user 2',
     6,
     'personal',
     5
   );
   ```

3. **RLS動作確認**（アプリケーションから）:
   - ローカルアプリで本番Supabaseに接続（`.env`を一時変更）
   - test1でログイン → test1の日記のみ表示されることを確認
   - test2でログイン → test2の日記のみ表示されることを確認

4. **クリーンアップ**:
   ```sql
   -- テストデータ削除
   DELETE FROM public.diaries WHERE title LIKE 'Test Diary%';

   -- テストユーザー削除（Dashboard → Authentication → Users）
   ```

## 🔧 環境変数設定

### ローカル開発環境用（検証用）

本番Supabaseに接続するための`.env.production`ファイルを作成：

```bash
# .env.production（本番Supabase検証用）
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_KEY=[anon-public-key]
NODE_ENV=production
VITE_APP_ENV=production
```

**使用方法**:
```bash
# .envを一時的に.env.production に置き換えて検証
cp .env .env.backup
cp .env.production .env

# 開発サーバー起動
npm run dev

# 検証完了後、元に戻す
cp .env.backup .env
rm .env.backup
```

### Vercelデプロイ用

**Vercel Dashboard**:
1. Project Settings → Environment Variables
2. 以下の環境変数を追加:

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | `https://[project-id].supabase.co` | Production, Preview |
| `VITE_SUPABASE_KEY` | `[anon-public-key]` | Production, Preview |
| `NODE_ENV` | `production` | Production |

**注意事項**:
- ✅ **Anon Key**のみを設定（公開可能なキー）
- ❌ **Service Role Key**は絶対に設定しない（セキュリティリスク）
- ✅ 環境変数変更後は再デプロイが必要

詳細: [Vercelデプロイ手順書](VERCEL_DEPLOYMENT.md)

### `.env.example`更新

プロジェクトルートの`.env.example`に本番環境用の設定例を追記済み：

```bash
# 本番環境用（Vercelデプロイ時）
# Vercel Dashboard → Project Settings → Environment Variablesで設定
# 詳細: docs/DEPLOYMENT/VERCEL_DEPLOYMENT.md
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_KEY=your-anon-key-here (Anon Keyのみ使用、Service Role Key禁止)
```

## 🧪 接続テスト

### ローカルアプリから本番DBへの接続テスト

**手順**:

1. **環境変数を本番用に変更**:
   ```bash
   # .env.productionを作成（上記参照）
   cp .env.production .env
   ```

2. **開発サーバー起動**:
   ```bash
   npm run dev
   ```

3. **基本機能テスト**:
   ```
   ✅ アプリケーション起動（http://localhost:5173）
   ✅ ユーザー登録（新規アカウント作成）
   ✅ ログイン（作成したアカウントでログイン）
   ✅ 日記作成（新規日記エントリ作成）
   ✅ 日記一覧表示（作成した日記が表示される）
   ✅ 日記編集（既存日記を編集）
   ✅ 日記削除（既存日記を削除）
   ✅ ログアウト
   ```

4. **Supabase Dashboardでデータ確認**:
   - Dashboard → Database → Table Editor
   - `diaries`テーブルを確認
   - 作成したデータが正しく保存されているか確認

5. **環境変数を元に戻す**:
   ```bash
   # ローカルSupabase環境に戻す
   cp .env.backup .env
   ```

### 認証機能テスト

**テスト項目**:

- [ ] **ユーザー登録**
  - 有効なメールアドレスで登録
  - 確認メールが送信される（Email Confirmationが有効な場合）
  - パスワード強度チェック

- [ ] **ログイン**
  - 正しいメールアドレス・パスワードでログイン成功
  - 誤ったパスワードでログイン失敗
  - 存在しないメールアドレスでログイン失敗

- [ ] **セッション管理**
  - ログイン状態が維持される
  - ブラウザ再起動後もセッション維持（Remember Meが有効な場合）
  - ログアウト後はセッションが無効化される

### CRUD操作テスト

**テスト項目**:

- [ ] **Create（作成）**
  - 日記エントリ作成
  - 必須フィールドバリデーション
  - データベースに正しく保存される

- [ ] **Read（読取）**
  - 日記一覧表示
  - 日記詳細表示
  - 自分の日記のみ表示される（RLS確認）

- [ ] **Update（更新）**
  - 日記エントリ編集
  - 変更内容が正しく保存される
  - `updated_at`が自動更新される

- [ ] **Delete（削除）**
  - 日記エントリ削除
  - ソフトデリート（`deleted_at`が設定される）
  - 削除済みデータは一覧に表示されない

### RLSポリシーテスト

**テスト手順**:

1. **ユーザー1でログイン**:
   - 日記を3件作成
   - 日記一覧で3件表示されることを確認

2. **ユーザー2でログイン**:
   - 日記一覧でユーザー1の日記が表示されないことを確認
   - 日記を2件作成
   - 日記一覧で自分の2件のみ表示されることを確認

3. **ユーザー1に戻る**:
   - 日記一覧で自分の3件のみ表示されることを確認
   - ユーザー2の日記が表示されないことを確認

**期待される結果**:
- ✅ ユーザーは自分のデータのみアクセス可能
- ✅ 他のユーザーのデータは表示されない
- ✅ RLSが正しく機能している

## 📋 ローカル環境 vs 本番環境の差異

### 環境変数

| 項目 | ローカル環境 | 本番環境 |
|------|-------------|---------|
| **Supabase URL** | `http://127.0.0.1:54321` | `https://[project-id].supabase.co` |
| **Supabase Anon Key** | デモキー（固定） | 本番プロジェクトのAnon Key |
| **データベース** | Docker PostgreSQL | Supabase マネージドPostgreSQL |
| **認証** | Supabase Auth（ローカル） | Supabase Auth（クラウド） |

### Supabase設定

| 項目 | ローカル環境 | 本番環境 |
|------|-------------|---------|
| **Email Confirmation** | 無効（デフォルト） | 有効推奨 |
| **Email Provider** | Inbucket（ローカルSMTP） | Supabase内蔵またはSendGrid等 |
| **リージョン** | ローカル | 東京（ap-northeast-1）推奨 |
| **バックアップ** | 手動（Docker Volume） | 自動（Supabase Backup） |

### データベース

| 項目 | ローカル環境 | 本番環境 |
|------|-------------|---------|
| **PostgreSQLバージョン** | 15.x（Supabase CLI準拠） | 15.x（Supabase管理） |
| **接続数制限** | 無制限（ローカル） | Free Tier: 60接続 / Pro Tier: 200接続 |
| **ストレージ容量** | Docker Volume上限まで | Free Tier: 500MB / Pro Tier: 8GB |
| **パフォーマンス** | ローカルマシン依存 | Supabase最適化済み |

### 機能差異

| 機能 | ローカル環境 | 本番環境 |
|------|-------------|---------|
| **Email送信** | Inbucket（テスト用） | 実際のEmail送信 |
| **ストレージ** | ローカルファイルシステム | Supabase Storage（S3互換） |
| **エッジ関数** | ローカル実行（Deno） | Supabase Edge Functions（グローバルCDN） |
| **リアルタイム** | WebSocket（ローカル） | WebSocket（Supabase Realtime） |

## 🔧 型定義自動生成

本番環境セットアップ後、型定義を再生成：

```bash
# ローカル環境の型定義生成（デフォルト）
npm run generate-types

# 本番環境の型定義生成（リンク済みプロジェクト）
supabase gen types typescript --linked > src/types/database.ts
```

**注意事項**:
- 型定義はローカル・本番で同じスキーマを使用しているため、差異はありません
- マイグレーション後は必ず型定義を再生成してください

## ⚠️ 重要な注意事項

### 1. 機密情報管理

- ✅ **Service Role Key**は絶対に公開しない
  - GitHubリポジトリにコミットしない
  - クライアントサイドで使用しない
  - Vercel環境変数に設定しない

- ✅ **Database Password**を安全に保管
  - パスワード管理ツールを使用
  - 定期的なパスワード変更（推奨: 3ヶ月ごと）

- ✅ **`.env`ファイル**をgitにコミットしない
  - `.gitignore`で除外済み
  - ローカル環境のみで使用

### 2. RLSの確実な設定

- ✅ **すべてのテーブルでRLS有効化**
  - RLS未設定のテーブルは全ユーザーがアクセス可能になる危険性
  - 必ずテーブル作成時にRLSを有効化

- ✅ **ポリシーの適切な設定**
  - ユーザー自身のデータのみアクセス可能にする
  - `auth.uid() = user_id`条件を必ず含める

- ✅ **定期的なRLS監査**
  - 新しいテーブル追加時はRLS設定を確認
  - セキュリティ監査レポート参照: [docs/SECURITY/SECURITY_AUDIT.md](../SECURITY/SECURITY_AUDIT.md)

### 3. 段階的なテスト

- ✅ **ローカルアプリから本番DB接続テスト**
  - いきなり本番公開せず、まずローカルで接続確認
  - テストデータで動作確認

- ✅ **プレビューデプロイでの検証**
  - Vercelプレビューデプロイで本番DB接続確認
  - 問題なければ本番デプロイ

- ✅ **小規模リリース**
  - 限定的なユーザーで動作確認
  - 問題なければ全ユーザーに公開

### 4. ロールバック準備

- ✅ **マイグレーション履歴の保持**
  - `supabase/migrations/`ディレクトリを必ず保持
  - マイグレーション実行前にバックアップ

- ✅ **データベースバックアップ**
  - 重要な変更前は手動バックアップ
  - Supabase自動バックアップ機能を有効化（Pro Tier）

- ✅ **ロールバック手順の確認**
  - マイグレーションのrevert手順を事前確認
  - 緊急時の連絡体制を整備

### 5. モニタリング・アラート設定

- ✅ **Supabase Dashboardでのモニタリング**
  - Database → Reports でクエリパフォーマンス確認
  - 接続数・ストレージ使用量の監視

- ✅ **Webhook設定**（オプション）
  - Supabase → Project Settings → Webhooks
  - データベースイベントを外部サービスに通知

- ✅ **アラート設定**（Pro Tier）
  - 接続数上限到達時の通知
  - ストレージ容量警告

## 📊 セットアップ完了チェックリスト

### プロジェクト作成

- [ ] Supabase本番プロジェクトが作成されている
- [ ] Project URL、Anon Keyが取得できている
- [ ] Database Passwordが安全に保管されている
- [ ] リージョンが東京（ap-northeast-1）に設定されている

### データベース移行

- [ ] `supabase db push`でマイグレーション成功
- [ ] テーブルが正しく作成されている（diaries, profiles, settings, emotion_tags, diary_emotion_tags）
- [ ] 感情タグマスターデータ（20件）が投入されている
- [ ] インデックスが作成されている

### RLS設定

- [ ] すべてのテーブルでRLSが有効化されている
- [ ] RLSポリシーが正しく設定されている
- [ ] RLSテストが成功している（他ユーザーのデータが見えない）

### 環境変数

- [ ] `.env.production`ファイルが作成されている
- [ ] Vercel環境変数が設定されている（本番デプロイ時）
- [ ] `.env.example`が最新の状態に更新されている

### 接続テスト

- [ ] ローカルアプリから本番DBへの接続成功
- [ ] ユーザー登録・ログインが正常動作
- [ ] CRUD操作（日記作成・読取・更新・削除）が正常動作
- [ ] Supabase Dashboardでデータが正しく保存されている

### セキュリティ

- [ ] Service Role Keyがクライアントサイドで使用されていない
- [ ] `.env`ファイルがgitにコミットされていない
- [ ] RLSポリシーが適切に機能している

### ドキュメント

- [ ] セットアップ手順がドキュメント化されている
- [ ] 環境変数設定手順が明確になっている
- [ ] ローカル環境と本番環境の差異が明確になっている

## 🔗 関連ドキュメント

### Supabase公式ドキュメント

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase CLI リファレンス](https://supabase.com/docs/reference/cli)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)

### プロジェクトドキュメント

- [開発ワークフロー](../DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)
- [環境セットアップ](../ENVIRONMENT/ENVIRONMENT_SETUP.md)
- [Vercelデプロイ手順](VERCEL_DEPLOYMENT.md)
- [セキュリティガイド](../SECURITY/SECURITY_GUIDE.md)
- [セキュリティ監査レポート](../SECURITY/SECURITY_AUDIT.md)

### 関連Issue

- #315 - 本番Supabase環境セットアップ検証（このドキュメント作成）
- #316 - Vercelデプロイ手順書作成・検証
- #317 - 本番環境デプロイ実施
- #313 - [親チケット] 本番デプロイ・GitHub公開の実現可能性検証

## 🔖 バージョン履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-12-27 | 1.0.0 | 初版作成（Issue #315） |
