# セキュリティガイドライン

このドキュメントは、GoalCategorizationDiaryプロジェクトにおけるセキュリティポリシーと実装ガイドラインを包括的に説明します。

## 📋 目次

- [🛡️ セキュリティポリシー](#️-セキュリティポリシー)
- [🔒 実装済みセキュリティ機能](#-実装済みセキュリティ機能)
- [🎯 セキュリティ要件](#-セキュリティ要件)
- [🛡️ セキュリティ実装パターン](#️-セキュリティ実装パターン)
- [📚 関連ドキュメント](#-関連ドキュメント)
- [🚨 セキュリティインシデント対応](#-セキュリティインシデント対応)

## 🛡️ セキュリティポリシー

### 基本方針
1. **多層防御**: 複数のセキュリティ機能を組み合わせた包括的な保護
2. **入力値検証**: 全ての外部入力に対する厳格な検証
3. **最小権限の原則**: 必要最小限の権限のみを付与
4. **継続的監視**: セキュリティイベントの監視とログ記録

### 対象脅威
- **XSS（Cross-Site Scripting）**: 悪意のあるスクリプト実行
- **CSRF（Cross-Site Request Forgery）**: 偽装リクエスト
- **クリックジャッキング**: UIの偽装による操作強制
- **データ漏洩**: 機密情報の不正アクセス
- **ブルートフォース攻撃**: 認証情報の総当たり攻撃

## 🔒 実装済みセキュリティ機能

### 🏗️ 統合セキュリティアーキテクチャ（2025年統合済み）

**セキュリティモジュール**: `src/security/`
- `core/index.ts` - 基本セキュリティ機能
- `monitoring/index.ts` - セキュリティ監視・アラートシステム
- `reporting/index.ts` - インシデント報告・統計機能
- `index.ts` - 統一エクスポート

```typescript
// 統合セキュリティモジュールの使用例
import { 
  SecurityMonitor, 
  SecurityAlertManager,
  SecurityIncidentReporter 
} from '@/security'

// セキュリティ監視開始
SecurityMonitor.getInstance().startMonitoring()

// セキュリティイベント記録
SecurityMonitor.getInstance().recordEvent({
  type: 'auth_failure',
  severity: 'medium',
  userId: 'user123',
  action: 'Login attempt failed'
})
```

### 入力値検証 (Input Validation)

#### バリデーションライブラリ
- **VeeValidate 4.x**: Vue 3対応の包括的なフォームバリデーション
- **@vee-validate/rules**: 標準バリデーションルール
- **@vee-validate/i18n**: 国際化対応（日本語エラーメッセージ）

#### 実装済みバリデーションルール

##### ユーザー認証
```typescript
// ユーザー名バリデーション
- 長さ: 3-20文字
- 文字種: 英数字、アンダースコア、ハイフンのみ
- パターン: /^[a-zA-Z0-9_-]+$/

// パスワードバリデーション
- 長さ: 8-128文字
- 必須文字種:
  - 小文字 (a-z)
  - 大文字 (A-Z)  
  - 数字 (0-9)
  - 特殊文字 (@$!%*?&)

// メールアドレス
- RFC準拠の形式チェック
- 最大長: 254文字
```

##### 日記コンテンツ
```typescript
// タイトル
- 長さ: 1-100文字
- HTMLタグ除去
- 特殊文字エスケープ

// 内容
- 長さ: 1-5000文字
- HTMLタグ除去（許可タグ以外）
- 改行コード正規化

// 日付
- 有効な日付形式
- 未来日付の制限
- 100年以前の制限

// 気分スコア
- 範囲: 1-5の整数
- 型チェック
```

### データサニタイゼーション (Data Sanitization)

#### サニタイゼーションライブラリ
- **DOMPurify 3.x**: XSS攻撃対策のHTMLサニタイゼーション

#### 実装済み機能

##### HTMLサニタイゼーション
```typescript
// 許可HTMLタグ
const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br']

// 処理内容
- 不正なHTMLタグの除去
- JavaScript実行の無効化
- 属性の制限
- コンテンツの保持
```

##### 特殊文字エスケープ
```typescript
// エスケープ対象
'&' → '&amp;'
'<' → '&lt;'
'>' → '&gt;'
'"' → '&quot;'
"'" → '&#x27;'
'/' → '&#x2F;'
```

##### 攻撃パターン検出
```typescript
// XSS攻撃パターン
- <script>タグ
- javascript:プロトコル
- onイベントハンドラ
- <iframe>, <object>, <embed>
- data:text/html
- vbscript:プロトコル
- expression()関数

// SQLインジェクション攻撃パターン  
- SQLキーワード (SELECT, INSERT, UPDATE, DELETE等)
- クォート文字の不正使用
- コメント記号 (--, /*)
- UNION, OR, AND演算子の不正使用
```

## 🛡️ セキュリティ実装パターン

### フォームバリデーション

#### 基本的な使用方法
```vue
<template>
  <v-form @submit.prevent="handleSubmit">
    <v-text-field
      v-bind="emailField"
      label="メールアドレス"
      type="email"
    />
    <v-text-field
      v-bind="passwordField"
      label="パスワード"
      type="password"
    />
    <v-btn type="submit" :loading="isSubmitting">
      送信
    </v-btn>
  </v-form>
</template>

<script setup>
import { useLoginValidation } from '@/composables/useValidation'

const { emailField, passwordField, onSubmit, isSubmitting } = useLoginValidation()

const handleSubmit = async () => {
  const sanitizedData = await onSubmit()
  if (sanitizedData) {
    // 検証済み・サニタイズ済みデータを使用
    await authStore.signIn(sanitizedData.email, sanitizedData.password)
  }
}
</script>
```

#### カスタムバリデーションルール追加
```typescript
// src/utils/validation.ts
defineRule('customRule', (value: string) => {
  if (!value) return '必須項目です'
  // カスタムバリデーションロジック
  if (/* 条件 */) return 'エラーメッセージ'
  return true
})
```

### データサニタイゼーション

#### 基本的な使用方法
```typescript
import { sanitizeText, performSecurityCheck } from '@/utils/sanitization'

// テキストのサニタイゼーション
const cleanText = sanitizeText(userInput)

// セキュリティチェック
const securityResult = performSecurityCheck(userInput)
if (!securityResult.isSecure) {
  throw new Error(`セキュリティ脅威を検出: ${securityResult.threats.join(', ')}`)
}
```

#### フォームデータの一括サニタイゼーション
```typescript
import { sanitizeFormData } from '@/utils/sanitization'

// 日記データのサニタイゼーション
const sanitizedDiary = sanitizeFormData.diary({
  title: formData.title,
  content: formData.content,
  date: formData.date,
  mood: formData.mood
})
```

## 🔧 開発時のセキュリティチェックリスト

### フォーム作成時
- [ ] 適切なバリデーションルールの適用
- [ ] エラーメッセージの日本語化
- [ ] リアルタイムバリデーションの実装
- [ ] サニタイゼーション処理の組み込み

### API通信時
- [ ] 入力データのセキュリティチェック
- [ ] サニタイズされたデータの使用
- [ ] エラーハンドリングの実装
- [ ] 適切なHTTPステータスコードの返却

### データベース操作時
- [ ] パラメータバインディングの使用（Supabaseで自動対応）
- [ ] 入力値の事前検証
- [ ] 不正なSQLパターンの検出

## 📁 関連ファイル

### 実装ファイル
```
src/
├── security/             # 統合セキュリティモジュール
│   ├── core/            # 基本セキュリティ機能
│   ├── monitoring/      # セキュリティ監視
│   ├── reporting/       # インシデント報告
│   └── index.ts        # 統一エクスポート
├── utils/
│   ├── security.ts      # セキュリティユーティリティ（CSRFProtection, XSSProtection, InputValidation）
│   └── sanitization.ts  # サニタイゼーション機能
├── composables/
│   └── useValidation.ts # バリデーション用コンポーザブル
├── plugins/
│   └── validation.ts   # バリデーションプラグイン
└── views/
    ├── LoginPage.vue    # ログインフォーム（バリデーション適用済み）
    ├── AccountRegisterPage.vue  # 登録フォーム（バリデーション適用済み）
    └── DiaryRegisterPage.vue    # 日記フォーム（バリデーション適用済み）
```

### 設定ファイル
```
vite.config.ts           # セキュリティヘッダー設定
package.json             # セキュリティライブラリの依存関係
src/main.ts             # セキュリティ初期化・バリデーションプラグイン登録
```

## 🎯 セキュリティ要件

### 必須要件
- [x] 全入力フォームでのサニタイゼーション実装
- [ ] CSRFトークンによる状態変更操作の保護
- [x] セキュリティヘッダーの適切な設定
- [ ] 認証試行の監視とログ記録
- [x] パスワード強度の検証

### 推奨要件
- [ ] CSP違反の監視とアラート
- [ ] セキュリティ設定の定期的な見直し
- [ ] 脆弱性スキャンの実施
- [ ] セキュリティ教育の実施

## 📚 関連ドキュメント

- **[🔧 セキュリティ開発ガイド](SECURITY_DEVELOPMENT.md)** - 実装手順とベストプラクティス
- **[📖 セキュリティ実装詳細](SECURITY_IMPLEMENTATION.md)** - 技術的な実装内容
- **[🔍 トラブルシューティング](SECURITY_TROUBLESHOOTING.md)** - 問題解決ガイド

## 🔄 今後の拡張予定

### 追加予定のセキュリティ機能
- [ ] ファイルアップロード時のセキュリティチェック
- [ ] CSRFトークンの実装
- [ ] レート制限の実装
- [ ] セキュリティヘッダーの強化
- [ ] セキュリティ監査ログの詳細化

### セキュリティテスト
- [ ] ペネトレーションテストの実施
- [ ] 自動セキュリティスキャンの導入
- [ ] セキュリティコードレビューの自動化

## 🚨 セキュリティインシデント対応

### 緊急連絡先
- **開発チーム**: GitHub Issues (priority:P0)
- **セキュリティ担当**: [設定要]

### 対応フロー
1. **検知**: 監視システムまたは報告による発見
2. **初期対応**: 影響範囲の特定と緊急対策
3. **調査**: 原因分析と詳細調査
4. **対策**: 根本的な解決策の実装
5. **報告**: インシデントレポートの作成

### 報告対象
- 認証システムの異常
- 不正アクセスの検知
- CSP違反の大量発生
- データベースへの不正クエリ
- その他のセキュリティ異常

### 報告手順
1. セキュリティ脆弱性を発見した場合は、即座に開発チームに報告
2. GitHubのSecurityタブからPrivate Vulnerability Reportingを使用
3. 修正パッチの適用と影響範囲の調査
4. 必要に応じてユーザーへの通知

## 🔍 セキュリティレビュー

### コードレビューチェックリスト
- [ ] 入力値のサニタイゼーション実装
- [ ] SQLインジェクション対策
- [ ] 認証・認可の適切な実装
- [ ] 機密情報のハードコード回避
- [ ] エラーメッセージの情報漏洩防止

### 定期レビュー項目
- [ ] セキュリティヘッダーの設定確認
- [ ] 依存関係の脆弱性チェック
- [ ] 権限設定の見直し
- [ ] ログ監視の有効性確認

---

**最終更新**: 2025-11-25
**実装バージョン**: Issue #71 XSS対策、Issue #72 入力値検証、統合セキュリティアーキテクチャ対応済み
**次回レビュー予定**: 2025-12-25
