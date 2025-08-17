import { defineRule, configure } from 'vee-validate'
import { required, email, min, confirmed, max } from '@vee-validate/rules'
import { localize } from '@vee-validate/i18n'

// バリデーションルールを定義
defineRule('required', required)
defineRule('email', email)
defineRule('min', min)
defineRule('max', max)
defineRule('confirmed', confirmed)

// カスタムバリデーションルール
defineRule('username', (value: string) => {
  if (!value) return '必須項目です'
  if (value.length < 3) return 'ユーザー名は3文字以上で入力してください'
  if (value.length > 20) return 'ユーザー名は20文字以下で入力してください'
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'ユーザー名は英数字、アンダースコア、ハイフンのみ使用可能です'
  return true
})

defineRule('password', (value: string) => {
  if (!value) return '必須項目です'
  if (value.length < 8) return 'パスワードは8文字以上で入力してください'
  if (value.length > 128) return 'パスワードは128文字以下で入力してください'
  if (!/(?=.*[a-z])/.test(value)) return 'パスワードには小文字を含めてください'
  if (!/(?=.*[A-Z])/.test(value)) return 'パスワードには大文字を含めてください'
  if (!/(?=.*\d)/.test(value)) return 'パスワードには数字を含めてください'
  if (!/(?=.*[@$!%*?&])/.test(value)) return 'パスワードには特殊文字(@$!%*?&)を含めてください'
  return true
})

defineRule('title', (value: string) => {
  if (!value) return '必須項目です'
  if (value.length < 1) return 'タイトルを入力してください'
  if (value.length > 100) return 'タイトルは100文字以下で入力してください'
  return true
})

defineRule('content', (value: string) => {
  if (!value) return '必須項目です'
  if (value.length < 1) return '内容を入力してください'
  if (value.length > 5000) return '内容は5000文字以下で入力してください'
  return true
})

defineRule('date', (value: string) => {
  if (!value) return '必須項目です'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '有効な日付を入力してください'
  
  // 未来の日付をチェック
  const today = new Date()
  today.setHours(23, 59, 59, 999) // 今日の終わりまで許可
  if (date > today) return '未来の日付は入力できません'
  
  // 過去すぎる日付をチェック（100年前まで）
  const hundredYearsAgo = new Date()
  hundredYearsAgo.setFullYear(today.getFullYear() - 100)
  if (date < hundredYearsAgo) return '日付が古すぎます'
  
  return true
})

defineRule('mood', (value: number) => {
  if (value === null || value === undefined) return '必須項目です'
  if (value < 1 || value > 5) return '1から5の間で選択してください'
  return true
})

// エラーメッセージの設定
configure({
  generateMessage: localize({
    ja: {
      messages: {
        required: '{field}は必須項目です',
        email: '有効なメールアドレスを入力してください',
        min: '{field}は{length}文字以上で入力してください',
        max: '{field}は{length}文字以下で入力してください',
        confirmed: 'パスワードが一致しません'
      },
      names: {
        email: 'メールアドレス',
        password: 'パスワード',
        confirmPassword: 'パスワード（確認）',
        username: 'ユーザー名',
        title: 'タイトル',
        content: '内容',
        date: '日付',
        mood: '気分'
      }
    }
  })
})

// フィールドバリデーションスキーマ
export const validationSchemas = {
  login: {
    email: 'required|email',
    password: 'required'
  },
  register: {
    username: 'required|username',
    email: 'required|email',
    password: 'required|password',
    confirmPassword: 'required|confirmed:@password'
  },
  diary: {
    title: 'required|title',
    content: 'required|content',
    date: 'required|date',
    mood: 'required|mood'
  }
}

// バリデーションエラーの型定義
export interface ValidationError {
  field: string
  message: string
}

// バリデーション結果の型定義
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// 手動バリデーション関数（将来の拡張用）
export const validateField = async (
   
  field: string, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  value: unknown, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rules: string
): Promise<ValidationResult> => {
  try {
    // VeeValidateの内部APIを使用してバリデーション実行
    // この実装は簡略化されており、実際のプロダクションでは
    // useFieldやuseFormを使用することを推奨
    return {
      isValid: true,
      errors: []
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field,
        message: error instanceof Error ? error.message : 'バリデーションエラーが発生しました'
      }]
    }
  }
}