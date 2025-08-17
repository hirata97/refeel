# セキュリティ実装ガイド

このドキュメントでは、GoalCategorizationDiaryアプリケーションで実装されたセキュリティ機能について説明します。

## 📋 実装されたセキュリティ機能

### 🛡️ セキュリティヘッダー

以下のセキュリティヘッダーが実装されています：

#### 1. Content Security Policy (CSP)
```
default-src 'self'; 
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; 
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; 
font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; 
img-src 'self' data: https:; 
connect-src 'self' https://*.supabase.co wss://*.supabase.co; 
frame-ancestors 'none';
```

#### 2. その他のセキュリティヘッダー
- **X-XSS-Protection**: `1; mode=block` - XSS攻撃の検出時にページ読み込みをブロック
- **X-Content-Type-Options**: `nosniff` - MIMEタイプスニッフィングを防止
- **X-Frame-Options**: `DENY` - クリックジャッキング攻撃を防止
- **Referrer-Policy**: `strict-origin-when-cross-origin` - リファラー情報の制御
- **Permissions-Policy**: `camera=(), microphone=(), geolocation=()` - 不要な権限を無効化

### 🔒 XSS対策

#### 実装場所
- `src/utils/security.ts` - XSSProtectionクラス

#### 機能
1. **HTMLサニタイゼーション**
   ```typescript
   XSSProtection.sanitizeHTML(content: string): string
   ```
   - DOMPurifyを使用した安全なHTMLサニタイゼーション
   - 許可されたタグのみを保持
   - 危険なタグ（script、object等）を除去

2. **テキストサニタイゼーション**
   ```typescript
   XSSProtection.sanitizeText(input: string): string
   ```
   - HTML特殊文字のエスケープ処理
   - `< > " ' /` を安全な文字に変換

3. **URLサニタイゼーション**
   ```typescript
   XSSProtection.sanitizeURL(url: string): string | null
   ```
   - 危険なプロトコル（javascript:、data:）の検出と除去
   - 許可されたプロトコル（http:、https:、mailto:）のみ受け入れ

#### 実装箇所
- ログインページ (`src/views/LoginPage.vue`)
- アカウント登録ページ (`src/views/AccountRegisterPage.vue`)
- 全フォーム入力でサニタイゼーション実施

### 🛡️ CSRF対策

#### 実装場所
- `src/utils/security.ts` - CSRFProtectionクラス

#### 機能
1. **CSRFトークン生成**
   ```typescript
   CSRFProtection.generateToken(): string
   ```
   - 暗号学的に安全な32バイトランダムトークン生成

2. **トークン管理**
   - セッションストレージでのトークン保存
   - HTTPヘッダーへの自動追加
   - リクエスト毎のトークン検証

3. **Supabase統合**
   - `src/lib/supabase.ts` でCSRFヘッダー自動追加
   - 全APIリクエストにCSRFトークンを含む

#### セキュリティ設定
- **セッションストレージ使用**: XSSリスクを軽減
- **X-Requested-With ヘッダー**: CSRF攻撃の追加防御

### 🔍 入力値検証

#### 実装場所
- `src/utils/security.ts` - InputValidationクラス

#### 機能
1. **メールアドレス検証**
   ```typescript
   InputValidation.isValidEmail(email: string): boolean
   ```

2. **パスワード強度検証**
   ```typescript
   InputValidation.validatePassword(password: string)
   ```
   - 最小8文字、最大128文字
   - 大文字、小文字、数字、特殊文字を要求
   - 詳細なエラーメッセージ提供

3. **SQLインジェクション対策**
   ```typescript
   InputValidation.checkForSQLInjection(input: string): boolean
   ```
   - 危険なSQLキーワードの検出
   - 不正な文字パターンの検証

### 📊 セキュリティレポート

#### 実装場所
- `src/utils/security.ts` - SecurityReportingクラス

#### 機能
1. **CSP違反レポート**
   - ブラウザのCSP違反イベントを監視
   - 自動的にセキュリティエンドポイントにレポート送信

2. **セキュリティインシデント追跡**
   - 認証失敗の監視とログ記録
   - ブルートフォース攻撃の検出
   - セッション異常の検出

3. **認証監査ログ**
   - `src/utils/auth.ts` で認証試行を記録
   - 連続失敗の監視（5回以上でアラート）
   - IPアドレスとユーザーエージェントの記録

### 🔐 認証セキュリティ強化

#### 実装場所
- `src/utils/auth.ts`

#### 機能
1. **認証試行監視**
   ```typescript
   logAuthAttempt(isSuccess: boolean, email: string, reason?: string)
   ```

2. **セッション検証**
   ```typescript
   validateSession(): Promise<boolean>
   ```

3. **ブルートフォース対策**
   - 失敗回数の追跡
   - 連続失敗時の自動アラート

## 🚀 セキュリティ機能の初期化

### 設定場所
- `src/main.ts` でセキュリティ機能を初期化

### 初期化内容
```typescript
initializeSecurity()
```
- CSRFトークンの生成と保存
- CSP違反監視の開始
- グローバルエラーハンドラーの設定

## 📁 関連ファイル

### 新規作成ファイル
- `src/utils/security.ts` - メインセキュリティユーティリティ
- `docs/SECURITY_IMPLEMENTATION.md` - このドキュメント

### 更新ファイル
- `vite.config.ts` - セキュリティヘッダーの設定
- `index.html` - HTMLレベルでのセキュリティメタタグ
- `src/main.ts` - セキュリティ初期化の追加
- `src/lib/supabase.ts` - CSRFトークン統合
- `src/utils/auth.ts` - 認証セキュリティ強化
- `src/views/LoginPage.vue` - ログインセキュリティ強化
- `src/views/AccountRegisterPage.vue` - 登録セキュリティ強化

## 🔍 セキュリティ検証方法

### 1. CSPの動作確認
```bash
# 開発サーバー起動
npm run dev

# ブラウザの開発者ツールでConsoleを確認
# CSP違反があれば警告が表示される
```

### 2. XSS対策の確認
```javascript
// ブラウザコンソールでテスト
XSSProtection.sanitizeHTML('<script>alert("xss")</script><p>安全なテキスト</p>')
// 結果: '<p>安全なテキスト</p>'
```

### 3. CSRF対策の確認
```javascript
// セッションストレージでCSRFトークンを確認
console.log(sessionStorage.getItem('csrf_token'))
```

## 🚨 注意事項

1. **開発環境での設定**
   - CSPの`unsafe-inline`と`unsafe-eval`は開発用
   - 本番環境では削除を推奨

2. **Supabaseセキュリティ**
   - RLS（Row Level Security）の適切な設定が必要
   - Supabase側でのセキュリティポリシー確認

3. **継続的監視**
   - セキュリティレポートの定期確認
   - 認証ログの監視
   - 脆弱性スキャンの実施

## 📚 参考資料

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN Content Security Policy](https://developer.mozilla.org/ja/docs/Web/HTTP/CSP)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

---

**実装完了日**: 2025-08-17  
**対応Issue**: #71 XSS対策とセキュリティヘッダーの実装