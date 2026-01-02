import { ref, computed } from 'vue'
import { sanitizeFormData } from '@shared/utils'

// シンプルなフォーム管理（VeeValidateを使わない）
export const useSimpleRegisterForm = () => {
  // フォームフィールド
  const username = ref('')
  const email = ref('')
  const password = ref('')
  const confirmPassword = ref('')

  // エラーメッセージ
  const usernameError = ref('')
  const emailError = ref('')
  const passwordError = ref('')
  const confirmPasswordError = ref('')

  // 送信状態
  const isSubmitting = ref(false)

  // バリデーション関数
  const validateUsername = (value: string): string => {
    if (!value) return 'ユーザー名は必須です'
    if (value.length < 3) return 'ユーザー名は3文字以上で入力してください'
    if (value.length > 20) return 'ユーザー名は20文字以下で入力してください'
    if (!/^[a-zA-Z0-9_-]+$/.test(value))
      return 'ユーザー名は英数字、アンダースコア、ハイフンのみ使用可能です'
    return ''
  }

  const validateEmail = (value: string): string => {
    if (!value) return 'メールアドレスは必須です'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '有効なメールアドレスを入力してください'
    return ''
  }

  const validatePassword = (value: string): string => {
    if (!value) return 'パスワードは必須です'
    if (value.length < 8) return 'パスワードは8文字以上で入力してください'
    if (value.length > 128) return 'パスワードは128文字以下で入力してください'
    if (!/(?=.*[a-z])/.test(value)) return 'パスワードには小文字を含めてください'
    if (!/(?=.*[A-Z])/.test(value)) return 'パスワードには大文字を含めてください'
    if (!/(?=.*\d)/.test(value)) return 'パスワードには数字を含めてください'
    if (!/(?=.*[@$!%*?&])/.test(value)) return 'パスワードには特殊文字(@$!%*?&)を含めてください'
    return ''
  }

  const validateConfirmPassword = (value: string, passwordValue: string): string => {
    if (!value) return 'パスワード確認は必須です'
    if (value !== passwordValue) return 'パスワードが一致しません'
    return ''
  }

  // リアルタイムバリデーション
  const validateField = (field: 'username' | 'email' | 'password' | 'confirmPassword') => {
    switch (field) {
      case 'username':
        usernameError.value = validateUsername(username.value)
        break
      case 'email':
        emailError.value = validateEmail(email.value)
        break
      case 'password':
        passwordError.value = validatePassword(password.value)
        // パスワード変更時は確認パスワードも再検証
        if (confirmPassword.value) {
          confirmPasswordError.value = validateConfirmPassword(
            confirmPassword.value,
            password.value,
          )
        }
        break
      case 'confirmPassword':
        confirmPasswordError.value = validateConfirmPassword(confirmPassword.value, password.value)
        break
    }
  }

  // 全体バリデーション
  const validateForm = (): boolean => {
    usernameError.value = validateUsername(username.value)
    emailError.value = validateEmail(email.value)
    passwordError.value = validatePassword(password.value)
    confirmPasswordError.value = validateConfirmPassword(confirmPassword.value, password.value)

    return (
      !usernameError.value &&
      !emailError.value &&
      !passwordError.value &&
      !confirmPasswordError.value
    )
  }

  // フォーム送信
  const handleSubmit = async (): Promise<{
    username: string
    email: string
    password: string
    confirmPassword: string
  } | null> => {
    if (!validateForm()) {
      return null
    }

    isSubmitting.value = true

    try {
      // データをサニタイズ
      const sanitizedData = sanitizeFormData.userRegistration({
        username: username.value,
        email: email.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
      })

      return sanitizedData
    } finally {
      isSubmitting.value = false
    }
  }

  // フォームリセット
  const resetForm = () => {
    username.value = ''
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    usernameError.value = ''
    emailError.value = ''
    passwordError.value = ''
    confirmPasswordError.value = ''
  }

  // フォームが有効かどうか
  const isFormValid = computed(() => {
    return (
      username.value &&
      email.value &&
      password.value &&
      confirmPassword.value &&
      !usernameError.value &&
      !emailError.value &&
      !passwordError.value &&
      !confirmPasswordError.value
    )
  })

  return {
    // フィールド値
    username,
    email,
    password,
    confirmPassword,

    // エラーメッセージ
    usernameError,
    emailError,
    passwordError,
    confirmPasswordError,

    // 状態
    isSubmitting,
    isFormValid,

    // メソッド
    validateField,
    handleSubmit,
    resetForm,
  }
}

// ログインフォーム用
export const useSimpleLoginForm = () => {
  const email = ref('')
  const password = ref('')
  const emailError = ref('')
  const passwordError = ref('')
  const isSubmitting = ref(false)

  const validateEmail = (value: string): string => {
    if (!value) return 'メールアドレスは必須です'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '有効なメールアドレスを入力してください'
    return ''
  }

  const validatePassword = (value: string): string => {
    if (!value) return 'パスワードは必須です'
    return ''
  }

  const validateField = (field: 'email' | 'password') => {
    switch (field) {
      case 'email':
        emailError.value = validateEmail(email.value)
        break
      case 'password':
        passwordError.value = validatePassword(password.value)
        break
    }
  }

  const validateForm = (): boolean => {
    emailError.value = validateEmail(email.value)
    passwordError.value = validatePassword(password.value)
    return !emailError.value && !passwordError.value
  }

  const handleSubmit = async (): Promise<{ email: string; password: string } | null> => {
    if (!validateForm()) {
      return null
    }

    isSubmitting.value = true

    try {
      const sanitizedData = sanitizeFormData.userLogin({
        email: email.value,
        password: password.value,
      })

      return sanitizedData
    } finally {
      isSubmitting.value = false
    }
  }

  const resetForm = () => {
    email.value = ''
    password.value = ''
    emailError.value = ''
    passwordError.value = ''
  }

  const clearPasswordErrorOnInput = () => {
    if (passwordError.value && password.value) {
      passwordError.value = ''
    }
  }

  const clearEmailErrorOnInput = () => {
    if (emailError.value && email.value) {
      emailError.value = ''
    }
  }

  const isFormValid = computed(() => {
    return email.value && password.value && !emailError.value && !passwordError.value
  })

  return {
    email,
    password,
    emailError,
    passwordError,
    isSubmitting,
    isFormValid,
    validateField,
    handleSubmit,
    resetForm,
    clearPasswordErrorOnInput,
    clearEmailErrorOnInput,
  }
}

// 日記フォーム用
export const useSimpleDiaryForm = () => {
  const title = ref('')
  const content = ref('')
  const date = ref(new Date().toISOString().split('T')[0])
  const mood = ref(50)

  const titleError = ref('')
  const contentError = ref('')
  const dateError = ref('')

  const isSubmitting = ref(false)

  const validateTitle = (value: string): string => {
    if (!value) return 'タイトルは必須です'
    if (value.length > 100) return 'タイトルは100文字以下で入力してください'
    return ''
  }

  const validateContent = (value: string): string => {
    if (!value) return '内容は必須です'
    if (value.length > 5000) return '内容は5000文字以下で入力してください'
    return ''
  }

  const validateDate = (value: string): string => {
    if (!value) return '日付は必須です'
    return ''
  }

  const validateField = (field: 'title' | 'content' | 'date') => {
    switch (field) {
      case 'title':
        titleError.value = validateTitle(title.value)
        break
      case 'content':
        contentError.value = validateContent(content.value)
        break
      case 'date':
        dateError.value = validateDate(date.value)
        break
    }
  }

  const validateForm = (): boolean => {
    titleError.value = validateTitle(title.value)
    contentError.value = validateContent(content.value)
    dateError.value = validateDate(date.value)
    return !titleError.value && !contentError.value && !dateError.value
  }

  const handleSubmit = async (): Promise<{
    title: string
    content: string
    date: string
    mood: number
  } | null> => {
    if (!validateForm()) {
      return null
    }

    isSubmitting.value = true

    try {
      const sanitizedData = sanitizeFormData.diary({
        title: title.value,
        content: content.value,
        date: date.value,
        mood: mood.value,
      })

      return sanitizedData
    } finally {
      isSubmitting.value = false
    }
  }

  const resetForm = () => {
    title.value = ''
    content.value = ''
    date.value = new Date().toISOString().split('T')[0]
    mood.value = 50
    titleError.value = ''
    contentError.value = ''
    dateError.value = ''
  }

  const setFormData = (data: { title: string; content: string; date: string; mood: number }) => {
    title.value = data.title
    content.value = data.content
    date.value = data.date
    mood.value = data.mood
  }

  const isFormValid = computed(() => {
    return (
      title.value &&
      content.value &&
      date.value &&
      !titleError.value &&
      !contentError.value &&
      !dateError.value
    )
  })

  return {
    title,
    content,
    date,
    mood,
    titleError,
    contentError,
    dateError,
    isSubmitting,
    isFormValid,
    validateField,
    handleSubmit,
    resetForm,
    setFormData,
  }
}
