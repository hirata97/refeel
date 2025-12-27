# Vercelデプロイ手順書

> **対象**: 開発者・デプロイ担当者
> **最終更新**: 2025-12-27
> **関連Issue**: #316

## 📝 概要

このドキュメントでは、Refeel（Vue 3 + Vite + Supabase）をVercelにデプロイする手順を説明します。

## 🎯 前提条件

### 必須

- Node.js v20.19.0以上
- npm v10.0.0以上
- GitHubアカウント
- Vercelアカウント（GitHubで認証可能）
- Supabaseプロジェクト（本番環境用）

### 確認事項

```bash
# Node.jsバージョン確認
node --version  # v20.19.0以上

# npmバージョン確認
npm --version   # v10.0.0以上

# ビルド成功確認（ローカル）
npm run ci:all
```

## 🚀 Vercelプロジェクト作成

### 1. Vercel Dashboardにアクセス

1. [Vercel Dashboard](https://vercel.com/)にアクセス
2. GitHubアカウントで認証
3. "Add New Project"をクリック

### 2. リポジトリインポート

1. GitHubリポジトリを選択: `hirata97/GoalCategorizationDiary`
2. "Import"をクリック

### 3. プロジェクト設定

**フレームワーク検出**（自動）:
- Framework Preset: **Vite**（自動検出される）

**ビルド設定**:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`（デフォルト）
- Root Directory: `./`（デフォルト）

**Node.jsバージョン**:
- Node.js Version: **20.x**（package.jsonのenginesに準拠）

### 4. 環境変数設定

**Project Settings → Environment Variables**に移動し、以下を設定：

| 変数名 | 値の例 | 環境 | 説明 |
|--------|--------|------|------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview | Supabase プロジェクトURL |
| `VITE_SUPABASE_KEY` | `eyJhbGciOiJIUzI1...` | Production, Preview | Supabase Anon Key（公開可能） |
| `NODE_ENV` | `production` | Production | 本番環境フラグ |

**重要な注意事項**:
- ✅ **Anon Key**のみを設定（公開可能なキー）
- ❌ **Service Role Key**は絶対に設定しない（セキュリティリスク）
- ✅ `VITE_`プレフィックスは必須（Viteの仕様）
- ✅ 環境変数変更後は再デプロイが必要

**環境変数の取得方法**:
```bash
# Supabase Dashboardから取得
# 1. https://app.supabase.com/
# 2. プロジェクト選択
# 3. Settings → API
# 4. Project URL → VITE_SUPABASE_URL
# 5. Project API keys → anon public → VITE_SUPABASE_KEY
```

### 5. デプロイ実行

1. "Deploy"ボタンをクリック
2. ビルドログを確認
3. デプロイ完了を待つ（通常1-3分）
4. デプロイURLを確認

## 🔄 デプロイフロー

### 自動デプロイ

Vercelは以下のGitイベントで自動デプロイを実行します：

```
┌─────────────────────┬──────────────────┬─────────────────┐
│ イベント            │ ブランチ         │ デプロイタイプ  │
├─────────────────────┼──────────────────┼─────────────────┤
│ Push to main        │ main             │ Production      │
│ Push to feature/*   │ feature/*        │ Preview         │
│ Pull Request作成    │ 任意             │ Preview + 自動コメント │
│ Pull Request更新    │ 任意             │ Preview更新     │
└─────────────────────┴──────────────────┴─────────────────┘
```

**本番デプロイ**:
```bash
# mainブランチにマージすると自動的に本番デプロイ
git checkout main
git pull origin main
git merge feature/your-feature
git push origin main
# → Vercelが自動的に本番デプロイを実行
```

**プレビューデプロイ**:
```bash
# フィーチャーブランチにプッシュすると自動的にプレビューデプロイ
git checkout -b feature/new-feature
# ... コミット ...
git push origin feature/new-feature
# → Vercelが自動的にプレビューデプロイを実行
# → PR作成時にデプロイURLがコメントとして追加される
```

### 手動デプロイ（Vercel CLI）

**初回セットアップ**:
```bash
# Vercel CLIインストール
npm install -g vercel

# ログイン
vercel login
```

**デプロイコマンド**:
```bash
# プレビューデプロイ
vercel

# 本番デプロイ
vercel --prod
```

## ⚙️ ビルド設定詳細

### vercel.json

プロジェクトルートの`vercel.json`でVercel固有の設定を管理：

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "..."
        }
      ]
    }
  ]
}
```

**主要設定の説明**:

1. **rewrites**: Vue Router（SPA）対応
   - すべてのルートを`index.html`にリダイレクト
   - 404エラーを防ぐために必須

2. **headers**: セキュリティヘッダー
   - CSP（Content Security Policy）
   - XSS Protection
   - Clickjacking Protection
   - HSTS（HTTP Strict Transport Security）

3. **buildCommand**: ビルドコマンド
   - `npm run build` → `vite build`を実行
   - 型チェック・Lintを含む

### package.json

ビルドスクリプトの定義：

```json
{
  "scripts": {
    "build": "run-p type-check \"build-only {@}\" --",
    "build-only": "vite build",
    "ci:build": "vite build"
  },
  "engines": {
    "node": ">=20.19.0",
    "npm": ">=10.0.0"
  }
}
```

### vite.config.ts

Viteビルド設定：

- **出力ディレクトリ**: `dist`
- **チャンク分割**: Vue、Vuetify、Chart.js、Supabaseを個別チャンクに分離
- **最小化**: Terserを使用、console.log削除
- **ソースマップ**: 本番環境では無効（セキュリティ）
- **PWA**: Service Worker、マニフェスト生成

## 🧪 デプロイテスト

### プレビューデプロイテスト

1. **ビルド確認**:
   - Vercel Dashboardでビルドログを確認
   - エラーがないことを確認

2. **基本機能確認**:
   ```
   ✅ トップページアクセス
   ✅ ユーザー登録
   ✅ ログイン
   ✅ 日記作成・編集・削除
   ✅ ダッシュボード表示
   ✅ ログアウト
   ```

3. **環境変数確認**:
   - Supabase接続が正常か
   - 認証機能が動作するか

4. **パフォーマンス確認**:
   ```bash
   # Lighthouse測定
   # Chrome DevTools → Lighthouse → Generate report
   # 目標:
   # - Performance: 90以上
   # - Accessibility: 90以上
   # - Best Practices: 90以上
   # - SEO: 90以上
   ```

### 本番デプロイテスト

本番デプロイ前に以下を確認：

```bash
# ローカルで全品質チェック実行
npm run ci:all

# 結果確認
# ✅ Lint: 警告0件
# ✅ 型チェック: エラー0件
# ✅ ユニットテスト: 全パス
# ✅ ビルド: 成功
# ✅ セキュリティ監査: 脆弱性なし
```

## 🔒 セキュリティ設定

### HTTPS強制

Vercelは自動的にHTTPSを強制します：
- HTTPリクエスト → 自動的にHTTPSにリダイレクト
- SSL/TLS証明書は自動発行・更新

### セキュリティヘッダー

`vercel.json`で以下のヘッダーを設定済み：

1. **Content-Security-Policy（CSP）**:
   - XSS攻撃防止
   - 信頼できるソースのみ許可
   - Supabase、Google Fonts、jsDelivrを許可

2. **X-XSS-Protection**:
   - ブラウザのXSSフィルタ有効化

3. **X-Content-Type-Options**:
   - MIMEタイプスニッフィング防止

4. **X-Frame-Options**:
   - クリックジャッキング防止

5. **Referrer-Policy**:
   - リファラー情報の適切な制御

6. **Permissions-Policy**:
   - カメラ・マイク・位置情報へのアクセス禁止

7. **Strict-Transport-Security（HSTS）**:
   - HTTPS強制（2年間）
   - サブドメイン含む
   - HSTSプリロードリスト登録可能

### CORS設定

Supabase側でCORSを設定：

1. Supabase Dashboard → Settings → API
2. CORS settings → 許可するオリジン追加
   - 本番URL: `https://your-app.vercel.app`
   - プレビューURL: `https://*.vercel.app`（ワイルドカード可）

## 📊 監視・ログ

### Vercelログ確認

**アクセス方法**:
1. Vercel Dashboard → プロジェクト選択
2. Deployments → 特定のデプロイを選択
3. Logs タブ

**ログの種類**:
- **ビルドログ**: ビルド時のコンソール出力
- **ランタイムログ**: Serverless Functionsのログ（該当なし）
- **アクセスログ**: リクエストログ（Pro以上）

### エラー監視

**推奨ツール**（オプション）:
- [Sentry](https://sentry.io/) - エラートラッキング
- [LogRocket](https://logrocket.com/) - セッションリプレイ
- [Vercel Analytics](https://vercel.com/analytics) - パフォーマンス分析

**Vercelアラート設定**:
1. Project Settings → Notifications
2. 以下を有効化:
   - Deployment Failed
   - Deployment Ready
   - Comments on Deployments

## 🔄 ロールバック手順

デプロイに問題がある場合、すぐにロールバック可能：

### 方法1: Vercel Dashboardから（推奨）

1. Vercel Dashboard → Deployments
2. 前回の正常なデプロイを選択
3. "Promote to Production"をクリック
4. 確認してロールバック実行

**所要時間**: 約1-2分

### 方法2: Git revert

```bash
# 問題のあるコミットを特定
git log --oneline

# コミットをrevert
git revert <commit-hash>

# mainにプッシュ（自動的に再デプロイ）
git push origin main
```

**所要時間**: 約2-5分（ビルド時間含む）

### 方法3: Vercel CLI

```bash
# 以前のデプロイにロールバック
vercel rollback

# 特定のデプロイIDを指定してロールバック
vercel rollback <deployment-url>
```

## 🌐 カスタムドメイン設定（オプション）

### 手順

1. Vercel Dashboard → Project Settings → Domains
2. "Add Domain"をクリック
3. ドメイン名を入力（例: `refeel.example.com`）
4. DNSレコードを設定:
   ```
   Type: CNAME
   Name: refeel（またはサブドメイン）
   Value: cname.vercel-dns.com
   ```
5. DNS伝播を待つ（最大48時間、通常は数分～数時間）
6. SSL証明書が自動発行される

## ⚠️ トラブルシューティング

### ビルドエラー

**症状**: Vercelでビルドが失敗する

**対処法**:
```bash
# ローカルで同じビルドコマンドを実行
npm run build

# エラーを確認・修正
npm run ci:all

# 修正後、再プッシュ
git add .
git commit -m "fix: ビルドエラー修正"
git push origin main
```

### 環境変数エラー

**症状**: `VITE_SUPABASE_URL is undefined`

**対処法**:
1. Vercel Dashboard → Project Settings → Environment Variables
2. 環境変数が正しく設定されているか確認
3. `VITE_`プレフィックスがあるか確認
4. 環境（Production/Preview）が正しいか確認
5. 再デプロイ実行（環境変数変更は再デプロイが必要）

### 404エラー（Vue Routerルート）

**症状**: `/dashboard`などにアクセスすると404エラー

**対処法**:
- `vercel.json`の`rewrites`設定を確認
- すべてのルートが`/index.html`にリダイレクトされているか確認

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### パフォーマンス問題

**症状**: ページロードが遅い

**対処法**:
1. Lighthouseでパフォーマンス測定
2. Vercel Analytics確認（Pro以上）
3. 最適化:
   - チャンク分割確認（vite.config.ts）
   - 画像最適化
   - 不要なライブラリ削除
   - Lazy Loading実装

## 📋 デプロイチェックリスト

### プレビューデプロイ前

- [ ] `npm run ci:all`成功
- [ ] 環境変数設定確認
- [ ] `vercel.json`設定確認

### 本番デプロイ前

- [ ] プレビューデプロイでの動作確認完了
- [ ] セキュリティ監査完了
- [ ] パフォーマンステスト完了（Lighthouse 90以上）
- [ ] E2Eテスト成功
- [ ] ロールバック手順確認

### 本番デプロイ後

- [ ] 本番URLでの動作確認
- [ ] 主要機能テスト（ログイン、CRUD操作）
- [ ] パフォーマンス測定
- [ ] エラーログ確認（初日は頻繁に確認）

## 🎯 ベストプラクティス

### デプロイタイミング

- ✅ ピークタイム外（深夜・早朝）
- ✅ 問題発生時に対応可能な時間帯
- ❌ 金曜日の夜（週末の監視困難）

### 段階的デプロイ

1. **プレビューデプロイ** → 十分なテスト
2. **本番デプロイ** → 小規模リリース
3. **監視** → エラー率・パフォーマンス確認
4. **段階的拡大** → 問題なければ全ユーザーに公開

### 環境変数管理

- ✅ `.env.example`は常に最新に保つ
- ✅ 本番環境変数はVercel Dashboardで管理
- ❌ `.env`ファイルをGitにコミットしない（.gitignoreで除外済み）

### ビルド最適化

- ✅ 型チェック・Lint通過後にデプロイ
- ✅ 不要な依存関係を削除
- ✅ チャンク分割でロード時間短縮
- ✅ console.log削除（本番環境）

## 📚 参考資料

### 公式ドキュメント

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Vite公式ドキュメント](https://vitejs.dev/guide/build.html)
- [Supabase公式ドキュメント](https://supabase.com/docs)

### 関連ドキュメント

- [開発ワークフロー](../DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)
- [開発コマンド](../DEVELOPMENT/DEVELOPMENT_COMMANDS.md)
- [CI/CDガイド](../CI/CI_CD_DEVELOPER_GUIDE.md)
- [セキュリティガイド](../SECURITY/SECURITY_GUIDE.md)
- [環境セットアップ](../ENVIRONMENT/ENVIRONMENT_SETUP.md)

### 関連Issue

- #316 - Vercelデプロイ手順書作成・検証（このドキュメント作成）
- #315 - 本番Supabase環境セットアップ検証
- #317 - 本番環境デプロイ実施
- #313 - [親チケット] 本番デプロイ・GitHub公開の実現可能性検証

## 🔖 バージョン履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-12-27 | 1.0.0 | 初版作成（Issue #316） |
