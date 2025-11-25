# セキュリティ開発ガイド

このドキュメントは、セキュリティ機能を開発する際の実践的なガイドです。Issue #71の経験を基に作成されています。

## 📋 目次

- [🚀 開発前の準備](#-開発前の準備)
- [🔧 段階的実装手順](#-段階的実装手順)
- [✅ 品質保証プロセス](#-品質保証プロセス)
- [🎯 ベストプラクティス](#-ベストプラクティス)
- [🚨 よくある問題と対策](#-よくある問題と対策)

## 🚀 開発前の準備

### 1. 事前調査チェックリスト

#### 技術調査
- [ ] 使用するライブラリのドキュメント確認
  ```bash
  # 例: DOMPurify の設定オプション
  npm docs dompurify
  ```
- [ ] TypeScript型定義の確認
- [ ] 既存コードベースのパターン調査
- [ ] Supabaseセキュリティ設定の確認

#### 要件分析
- [ ] Issue要件の詳細な理解
- [ ] セキュリティ要件の明確化
- [ ] 影響範囲の特定
- [ ] 既存機能への影響評価

### 2. 開発環境の準備

```bash
# 依存関係の確認
npm audit
npm outdated

# 開発ツールの設定確認
npm run lint -- --help
npm run type-check --help
```

### 3. 実装計画の策定

```markdown
## 実装計画例
1. セキュリティヘッダー（1-2時間）
2. 基本的なXSS対策（2-3時間）
3. CSRF対策（1-2時間）
4. 入力値検証強化（1-2時間）
5. セキュリティレポート機能（2-3時間）
6. テスト・検証（1-2時間）
7. ドキュメント作成（1-2時間）
```

## 🔧 段階的実装手順

### Stage 1: セキュリティヘッダーの実装

#### 1.1 Vite設定の更新
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self';",
      'X-Frame-Options': 'DENY',
      // 段階的に追加
    }
  }
})
```

#### 1.2 検証
```bash
npm run dev
# ブラウザ開発者ツールでヘッダー確認
```

### Stage 2: XSS対策の実装

#### 2.1 型定義の準備
```typescript
// types/security.ts
export interface SanitizeOptions {
  allowedTags: string[];
  allowedAttributes: string[];
}

export interface SecurityConfig {
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
}
```

#### 2.2 セキュリティユーティリティの実装
```typescript
// src/utils/security.ts - 段階的に機能追加
export class XSSProtection {
  static sanitizeText(input: string): string {
    // 実装
  }
}
```

#### 2.3 段階的テスト
```bash
# 各機能実装後にテスト
npm run lint
npm run type-check
```

### Stage 3: 既存コンポーネントの更新

#### 3.1 重要度順の実装
1. **高**: ログイン・登録フォーム
2. **中**: データ入力フォーム
3. **低**: 表示系コンポーネント

#### 3.2 実装パターン
```vue
<script setup lang="ts">
import { XSSProtection, InputValidation } from '@/utils/security'

const handleSubmit = async (formData: FormData) => {
  // 1. 入力値の検証
  if (!InputValidation.isValidEmail(email.value)) {
    // エラー処理
    return
  }
  
  // 2. サニタイゼーション
  const sanitizedData = XSSProtection.sanitizeText(input.value)
  
  // 3. 送信処理
  await submitData(sanitizedData)
}
</script>
```

## ✅ 品質保証プロセス

### 1. 実装中のチェック

#### 各ステージ完了時
```bash
# 必須チェック
npm run lint
npm run type-check

# 推奨チェック
npm run test:unit
npm run build
```

#### Git コミット前
```bash
# プリコミットチェック
git add .
npm run lint -- --fix
npm run type-check
git commit -m "feat: セキュリティヘッダー実装"
```

### 2. 機能テスト

#### セキュリティヘッダーの確認
```bash
# 開発サーバー起動
npm run dev

# ブラウザ開発者ツールで確認
# Network タブ → Response Headers
```

#### XSS対策の確認
```javascript
// ブラウザコンソールでテスト
XSSProtection.sanitizeHTML('<script>alert("test")</script><p>安全</p>')
// 期待値: '<p>安全</p>'
```

#### CSRF対策の確認
```javascript
// セッションストレージでトークン確認
console.log(sessionStorage.getItem('csrf_token'))
```

### 3. パフォーマンステスト

```bash
# ビルドサイズの確認
npm run build
ls -la dist/assets/

# 開発サーバーのレスポンス確認
curl -I http://localhost:5173
```

## 🎯 ベストプラクティス

### 1. 型安全性の確保

#### 適切な型定義
```typescript
// ❌ 避けるべき
function processData(data: any): any {
  return data
}

// ✅ 推奨
interface UserInput {
  email: string;
  username: string;
}

function processUserData(data: UserInput): SanitizedUserData {
  return {
    email: XSSProtection.sanitizeText(data.email),
    username: XSSProtection.sanitizeText(data.username)
  }
}
```

#### エラーハンドリング
```typescript
// ✅ 推奨パターン
try {
  const result = await securityOperation()
  return { success: true, data: result }
} catch (error) {
  // ログ記録
  SecurityReporting.reportError(error)
  return { success: false, error: 'セキュリティ処理に失敗しました' }
}
```

### 2. 設定管理

#### 環境別設定
```typescript
// config/security.ts
const securityConfig = {
  development: {
    csp: {
      scriptSrc: "'self' 'unsafe-inline' 'unsafe-eval'", // 開発用
    }
  },
  production: {
    csp: {
      scriptSrc: "'self'", // 本番用（厳格）
    }
  }
}
```

### 3. テスタブルな設計

```typescript
// ✅ テスタブルな設計
export class SecurityService {
  constructor(
    private config: SecurityConfig,
    private logger: Logger
  ) {}
  
  async validateInput(input: string): Promise<ValidationResult> {
    // テスト可能な実装
  }
}
```

## 🚨 よくある問題と対策

### 1. TypeScriptエラー

#### 問題: DOMPurify設定エラー
```typescript
// ❌ エラーの原因
return DOMPurify.sanitize(content, {
  FORBID_SCRIPT: true, // 存在しないオプション
})

// ✅ 修正後
return DOMPurify.sanitize(content, {
  FORBID_TAGS: ['script'],
})
```

#### 問題: Supabaseクライアント型エラー
```typescript
// ❌ 型安全でない
supabase.rpc = function(fn: string, args?: any, options?: any) {
  // 型エラー
}

// ✅ 型安全な実装
interface RPCOptions {
  headers?: Record<string, string>;
}

const enhancedSupabase = {
  ...supabase,
  secureRpc: (fn: string, args?: Record<string, unknown>, options?: RPCOptions) => {
    // 安全な実装
  }
}
```

### 2. CSP設定問題

#### 問題: 過度に緩い設定
```typescript
// ❌ セキュリティリスク
'Content-Security-Policy': "default-src *; script-src *;"

// ✅ 適切な設定
'Content-Security-Policy': "default-src 'self'; script-src 'self' https://trusted-cdn.com;"
```

### 3. パフォーマンス問題

#### 問題: 過度なサニタイゼーション
```typescript
// ❌ 非効率
data.map(item => XSSProtection.sanitizeHTML(item.content))

// ✅ 効率的
const sanitizedData = useMemo(() => 
  data.map(item => XSSProtection.sanitizeHTML(item.content)),
  [data]
)
```

## 🔗 関連リソース

### 開発ツール
- [CSP Validator](https://csp-evaluator.withgoogle.com/)
- [Security Headers Check](https://securityheaders.com/)
- [OWASP ZAP](https://owasp.org/www-project-zap/)

### 参考ドキュメント
- [MDN Security](https://developer.mozilla.org/ja/docs/Web/Security)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Vue.js Security](https://vuejs.org/guide/best-practices/security.html)

---

**最終更新**: 2025-11-25
**基盤Issue**: #71 XSS対策とセキュリティヘッダーの実装
**対応Issue**: #302 ドキュメント整理