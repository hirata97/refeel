# セキュリティトラブルシューティング

このドキュメントでは、セキュリティ機能に関するよくある問題と解決策を説明します。

## 📋 目次

- [🚨 よくある問題](#-よくある問題)
- [🔍 デバッグ手順](#-デバッグ手順)
- [⚡ パフォーマンス問題](#-パフォーマンス問題)
- [🛠️ 設定問題](#️-設定問題)

## 🚨 よくある問題

### 1. CSP違反エラー

#### 症状
```
Refused to execute inline script because it violates the following Content Security Policy directive...
```

#### 原因と解決策

| 原因 | 解決策 |
|------|--------|
| インラインスクリプトの使用 | 外部ファイルに移動、または`'unsafe-inline'`を追加（非推奨） |
| 外部CDNのスクリプト | CSPの`script-src`に該当ドメインを追加 |
| 動的スクリプト生成 | `'unsafe-eval'`を追加、またはCSP対応の実装に変更 |

#### 対処法
```typescript
// vite.config.ts で一時的に緩和
'Content-Security-Policy': "script-src 'self' 'unsafe-inline' https://trusted-domain.com;"
```

### 2. CSRF トークンエラー

#### 症状
```
CSRFトークンが見つかりません
```

#### 確認手順
1. **セッションストレージの確認**
   ```javascript
   console.log(sessionStorage.getItem('csrf_token'))
   ```

2. **初期化の確認**
   ```typescript
   // src/main.ts で initializeSecurity() が呼ばれているか確認
   ```

3. **ヘッダー送信の確認**
   ```javascript
   // ブラウザ開発者ツール → Network → Request Headers
   // X-CSRF-Token: xxxxxx があるか確認
   ```

### 3. XSS サニタイゼーションエラー

#### 症状
```
DOMPurify.sanitize is not a function
```

#### 解決策
```bash
# DOMPurifyの再インストール
npm uninstall dompurify
npm install dompurify
npm install --save-dev @types/dompurify
```

### 4. TypeScript型エラー

#### 症状
```typescript
Property 'FORBID_SCRIPT' does not exist on type 'Config'
```

#### 解決策
```typescript
// ❌ 間違った設定
DOMPurify.sanitize(content, {
  FORBID_SCRIPT: true  // 存在しないオプション
})

// ✅ 正しい設定
DOMPurify.sanitize(content, {
  FORBID_TAGS: ['script']
})
```

## 🔍 デバッグ手順

### 1. セキュリティ機能の動作確認

#### ステップ1: 初期化の確認
```bash
# 開発サーバー起動
npm run dev

# ブラウザコンソールで確認
console.log('CSRF Token:', sessionStorage.getItem('csrf_token'))
```

#### ステップ2: CSPヘッダーの確認
```bash
# curlでヘッダー確認
curl -I http://localhost:5173

# 期待値: Content-Security-Policy ヘッダーが存在
```

#### ステップ3: XSS対策の確認
```javascript
// ブラウザコンソールでテスト
import { XSSProtection } from '@/utils/security'
XSSProtection.sanitizeHTML('<script>alert("test")</script><p>テスト</p>')
// 期待値: '<p>テスト</p>'
```

### 2. エラーログの確認

#### ブラウザコンソール
```javascript
// セキュリティエラーの監視
window.addEventListener('error', (event) => {
  if (event.error?.name === 'SecurityError') {
    console.error('セキュリティエラー:', event.error)
  }
})
```

#### Network タブでの確認
1. リクエストヘッダーに `X-CSRF-Token` があるか
2. レスポンスヘッダーにセキュリティヘッダーがあるか
3. CSP違反のレポートが送信されているか

### 3. 段階的デバッグ

#### 1. 最小構成でテスト
```typescript
// 一時的にセキュリティ機能を無効化してテスト
// src/main.ts
// initializeSecurity() // コメントアウト
```

#### 2. 機能別テスト
```typescript
// XSS対策のみテスト
import { XSSProtection } from '@/utils/security'
console.log(XSSProtection.sanitizeText('<script>'))

// CSRF対策のみテスト  
import { CSRFProtection } from '@/utils/security'
console.log(CSRFProtection.generateToken())
```

## ⚡ パフォーマンス問題

### 1. サニタイゼーション処理の遅延

#### 症状
フォーム送信時の遅延（100ms以上）

#### 原因分析
```javascript
// パフォーマンス測定
console.time('sanitize')
const result = XSSProtection.sanitizeHTML(largeContent)
console.timeEnd('sanitize')
```

#### 解決策
```vue
<script setup>
// useMemoでキャッシュ
const sanitizedContent = computed(() => 
  XSSProtection.sanitizeHTML(content.value)
)

// 大量データの場合は分割処理
const chunkSize = 1000
const processChunks = (data) => {
  return data.reduce((acc, chunk) => {
    return acc + XSSProtection.sanitizeText(chunk)
  }, '')
}
</script>
```

### 2. セキュリティレポート送信の負荷

#### 症状
頻繁なネットワークリクエスト

#### 解決策
```typescript
// レポート送信の制限
class SecurityReporting {
  private static lastReportTime = 0
  private static REPORT_INTERVAL = 5000 // 5秒間隔

  static async reportWithThrottling(data: any) {
    const now = Date.now()
    if (now - this.lastReportTime < this.REPORT_INTERVAL) {
      return // スキップ
    }
    this.lastReportTime = now
    await this.reportSecurityIncident(data)
  }
}
```

## 🛠️ 設定問題

### 1. 開発環境と本番環境の設定差異

#### 問題
開発環境では動作するが本番環境でCSPエラー

#### 解決策
```typescript
// vite.config.ts - 環境別設定
const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': isDev 
        ? "default-src 'self' 'unsafe-inline' 'unsafe-eval';" // 開発用
        : "default-src 'self';" // 本番用
    }
  }
})
```

### 2. Supabase設定の問題

#### 症状
```
Access to fetch at 'https://xxx.supabase.co' has been blocked by CORS policy
```

#### 解決策
```typescript
// CSPでSupabaseドメインを許可
'Content-Security-Policy': `
  default-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
`
```

### 3. 型定義の問題

#### 症状
```
Module '"dompurify"' has no exported member 'sanitize'
```

#### 解決策
```bash
# 型定義の再インストール
npm install --save-dev @types/dompurify

# または型定義ファイルを作成
# types/dompurify.d.ts
declare module 'dompurify' {
  export function sanitize(dirty: string, config?: any): string
}
```

## 🔧 応急処置

### 緊急時の一時的対応

#### 1. セキュリティ機能の無効化
```typescript
// src/main.ts - 緊急時のみ
// initializeSecurity() // 一時的にコメントアウト
```

#### 2. CSPの緩和
```html
<!-- index.html - 緊急時のみ -->
<meta http-equiv="Content-Security-Policy" content="default-src *; script-src *;">
```

#### 3. フォールバック実装
```typescript
// エラー時のフォールバック
try {
  const sanitized = XSSProtection.sanitizeHTML(content)
  return sanitized
} catch (error) {
  console.error('サニタイゼーションエラー:', error)
  // 緊急時は基本的なエスケープのみ
  return content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
```

## 📞 サポート

### 問題解決の優先順位
1. **P0（緊急）**: セキュリティ機能の完全停止
2. **P1（高）**: 一部機能の動作不良
3. **P2（中）**: パフォーマンス問題
4. **P3（低）**: 軽微な警告

### 報告方法
```markdown
## セキュリティ問題報告テンプレート

### 環境
- OS: 
- ブラウザ: 
- Node.js: 
- 発生時刻: 

### 症状
[具体的な症状]

### 再現手順
1. 
2. 
3. 

### エラーメッセージ
```
[エラーログ]
```

### 期待値
[期待される動作]
```

---

**作成日**: 2025-08-17  
**対象Issue**: #71