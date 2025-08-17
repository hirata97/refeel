import { ref, computed } from 'vue'
import { useForm, useField } from 'vee-validate'
import { validationSchemas } from '@/utils/validation'
import { sanitizeFormData } from '@/utils/sanitization'

// フォームタイプの定義
export type FormType = 'login' | 'register' | 'diary'

// フィールド設定の型定義（現在未使用だが将来の拡張のため保持）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface FieldConfig {
  name: string
  rules: string
  initialValue?: unknown
}

// useValidationコンポーザブル
export const useValidation = (formType: FormType) => {
  const schema = validationSchemas[formType]
  
  // フォームの初期化
  const { handleSubmit, isSubmitting, resetForm } = useForm({
    validationSchema: schema
  })
  
  // 各フィールドを個別に管理するヘルパー関数
  const createField = (name: string, initialValue: unknown = '') => {
    const { value, errorMessage, handleChange, handleBlur } = useField(name, undefined, {
      initialValue
    })
    
    return {
      value,
      errorMessage,
      handleChange,
      handleBlur,
      // Vuetifyとの統合用プロパティ
      modelValue: value,
      'onUpdate:modelValue': handleChange,
      'error-messages': computed(() => errorMessage.value ? [errorMessage.value] : []),
      onBlur: handleBlur
    }
  }
  
  return {
    handleSubmit,
    isSubmitting,
    resetForm,
    createField
  }
}

// ログインフォーム用コンポーザブル
export const useLoginValidation = () => {
  const { handleSubmit, isSubmitting, resetForm, createField } = useValidation('login')
  
  const emailField = createField('email')
  const passwordField = createField('password')
  
  const onSubmit = handleSubmit((values) => {
    // フォームデータをサニタイズ
    const sanitizedData = sanitizeFormData.userLogin({
      email: values.email,
      password: values.password
    })
    
    return sanitizedData
  })
  
  return {
    emailField,
    passwordField,
    onSubmit,
    isSubmitting,
    resetForm
  }
}

// 登録フォーム用コンポーザブル
export const useRegisterValidation = () => {
  const { handleSubmit, isSubmitting, resetForm, createField } = useValidation('register')
  
  const usernameField = createField('username')
  const emailField = createField('email')
  const passwordField = createField('password')
  const confirmPasswordField = createField('confirmPassword')
  
  const onSubmit = handleSubmit((values) => {
    // フォームデータをサニタイズ
    const sanitizedData = sanitizeFormData.userRegistration({
      username: values.username,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword
    })
    
    return sanitizedData
  })
  
  return {
    usernameField,
    emailField,
    passwordField,
    confirmPasswordField,
    onSubmit,
    isSubmitting,
    resetForm
  }
}

// 日記フォーム用コンポーザブル
export const useDiaryValidation = () => {
  const { handleSubmit, isSubmitting, resetForm, createField } = useValidation('diary')
  
  // 現在の日付を取得
  const getCurrentDate = (): string => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }
  
  const titleField = createField('title')
  const contentField = createField('content')
  const dateField = createField('date', getCurrentDate())
  const baseMoodField = createField('mood', 3)
  const moodField = {
    ...baseMoodField,
    modelValue: computed(() => Number(baseMoodField.value.value) || 3),
    'onUpdate:modelValue': (value: number) => baseMoodField.handleChange(value)
  }
  
  const onSubmit = handleSubmit((values) => {
    // フォームデータをサニタイズ
    const sanitizedData = sanitizeFormData.diary({
      title: values.title,
      content: values.content,
      date: values.date,
      mood: values.mood
    })
    
    return sanitizedData
  })
  
  return {
    titleField,
    contentField,
    dateField,
    moodField,
    onSubmit,
    isSubmitting,
    resetForm
  }
}

// リアルタイムバリデーション用コンポーザブル
export const useRealtimeValidation = (fieldName: string, rules: string) => {
  const isValidating = ref(false)
  const validationMessage = ref<string>('')
  const isValid = computed(() => !validationMessage.value)
  
  // デバウンスされたバリデーション
  let timeoutId: NodeJS.Timeout
  
  const validateField = (value: unknown) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(async () => {
      isValidating.value = true
      
      try {
        // ここで実際のバリデーションロジックを実行
        // 簡略化のため、基本的なチェックのみ実装
        if (!value && rules.includes('required')) {
          validationMessage.value = '必須項目です'
        } else if (rules.includes('email') && value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          validationMessage.value = '有効なメールアドレスを入力してください'
        } else {
          validationMessage.value = ''
        }
      } finally {
        isValidating.value = false
      }
    }, 300) // 300ms のデバウンス
  }
  
  return {
    isValidating,
    validationMessage,
    isValid,
    validateField
  }
}

// フォーム全体のバリデーションステータス管理
export const useFormValidationStatus = () => {
  const hasErrors = ref(false)
  const errorCount = ref(0)
  const errorMessages = ref<string[]>([])
  
  const addError = (message: string) => {
    errorMessages.value.push(message)
    errorCount.value++
    hasErrors.value = true
  }
  
  const removeError = (message: string) => {
    const index = errorMessages.value.indexOf(message)
    if (index > -1) {
      errorMessages.value.splice(index, 1)
      errorCount.value--
      hasErrors.value = errorMessages.value.length > 0
    }
  }
  
  const clearErrors = () => {
    errorMessages.value = []
    errorCount.value = 0
    hasErrors.value = false
  }
  
  return {
    hasErrors,
    errorCount,
    errorMessages,
    addError,
    removeError,
    clearErrors
  }
}