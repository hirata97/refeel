<template>
  <v-container class="register-container">
    <v-text class="display-1 mb-4 text-center">アカウント新規登録</v-text>

    <v-form @submit.prevent="handleRegister" class="register-form">
      <v-alert
        v-if="errorMessage"
        type="error"
        dismissible
        class="mb-3"
        @click:close="clearErrorMessage"
      >
        {{ errorMessage }}
      </v-alert>

      <v-text-field
        label="Username"
        v-model="username"
        outlined
        full-width
        class="mb-3"
        :error="usernameError"
        required
      />
      <v-text-field
        label="Email"
        v-model="email"
        outlined
        full-width
        class="mb-3"
        type="email"
        :error="emailError"
        required
      />
      <v-text-field
        label="Password"
        type="password"
        v-model="password"
        outlined
        full-width
        class="mb-4"
        :error="passwordError"
        required
      />
      <v-btn type="submit" color="primary" block class="mb-2">アカウントを登録する</v-btn>
      <v-btn color="secondary" block @click="navigateToTopPage">トップページに戻る</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

// 各変数の型を string に統一
const username = ref<string>('')
const email = ref<string>('')
const password = ref<string>('')

// エラーメッセージやバリデーションフラグ
const errorMessage = ref<string>('')
const usernameError = ref<boolean>(false)
const emailError = ref<boolean>(false)
const passwordError = ref<boolean>(false)

// メールアドレスの形式をチェックする関数
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// フォーム送信時の処理
const handleRegister = async () => {
  const usernameTrim = username.value.trim()
  const emailTrim = email.value.trim()
  const passwordTrim = password.value.trim()

  usernameError.value = !usernameTrim
  emailError.value = !emailTrim || !isValidEmail(emailTrim)
  passwordError.value = passwordTrim.length < 6

  if (usernameError.value || emailError.value || passwordError.value) {
    errorMessage.value =
      'Please fill in all fields correctly. (Password must be at least 6 characters and email must be valid)'
    return
  }

  // Supabase の認証APIを使って新規ユーザーを登録
  const { data, error } = await supabase.auth.signUp({
    email: emailTrim,
    password: passwordTrim,
  })

  if (error) {
    console.error('Supabase Error:', error)
    errorMessage.value = error.message
    return
  }

  // 登録後にセッションが返されない場合は、ここで自動サインイン
  if (!data.session) {
    // 例: サインイン処理を呼び出す
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailTrim,
      password: passwordTrim,
    })
    if (signInError) {
      console.error('Sign In Error:', signInError)
      errorMessage.value = 'Sign in failed after registration.'
      return
    }
  }

  if (data.user) {
    // accounts テーブルに追加
    const { error: accountError } = await supabase.from('accounts').insert([
      {
        id: data.user.id, // Supabase Auth の user.id を使用
        username: usernameTrim,
        email: emailTrim,
      },
    ])

    if (accountError) {
      errorMessage.value = 'User registration successful, but failed to save account data.'
      return
    }
  }

  clearErrorMessage()
  router.push('/login')
}

// エラーメッセージをクリア
const clearErrorMessage = () => {
  errorMessage.value = ''
}

// トップページへの遷移
const navigateToTopPage = () => {
  router.push('/')
}
</script>

<style scoped>
.register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.register-form {
  width: 100%;
  max-width: 400px;
}
</style>
