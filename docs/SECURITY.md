# セキュリティガイドライン

## 概要

このドキュメントでは、GoalCategorizationDiaryプロジェクトにおけるセキュリティ実装のガイドラインと実装状況について説明します。

## 🔒 実装済みセキュリティ機能

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
├── utils/
│   ├── validation.ts      # バリデーションルール定義
│   └── sanitization.ts    # サニタイゼーション機能
├── composables/
│   └── useValidation.ts   # バリデーション用コンポーザブル
├── plugins/
│   └── validation.ts     # バリデーションプラグイン
└── views/
    ├── LoginPage.vue      # ログインフォーム（バリデーション適用済み）
    ├── AccountRegisterPage.vue  # 登録フォーム（バリデーション適用済み）
    └── DiaryRegisterPage.vue    # 日記フォーム（バリデーション適用済み）
```

### 設定ファイル
```
package.json              # セキュリティライブラリの依存関係
src/main.ts              # バリデーションプラグイン登録
```

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

## 📞 セキュリティインシデント対応

### 報告手順
1. セキュリティ脆弱性を発見した場合は、即座に開発チームに報告
2. GitHubのSecurityタブからPrivate Vulnerability Reportingを使用
3. 修正パッチの適用と影響範囲の調査
4. 必要に応じてユーザーへの通知

### 緊急時の連絡先
- GitHub Issues（セキュリティラベル付き）
- プロジェクトメンテナ

---

**最終更新日**: 2025-08-17  
**実装バージョン**: Issue #72対応済み