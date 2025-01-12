<template>
  <v-container class="register-container">
    <v-text class="display-1 mb-4 text-center">Register</v-text>

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
      <v-btn type="submit" color="primary" block class="mb-2">Register</v-btn>
      <v-btn color="secondary" block @click="navigateToLogin">Back to Login</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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

// フォーム送信時の処理
const handleRegister = () => {
  // エラーフラグのリセット
  usernameError.value = !username.value.trim()
  emailError.value = !email.value.trim()
  passwordError.value = !password.value.trim()

  if (usernameError.value || emailError.value || passwordError.value) {
    errorMessage.value = 'Please fill in all fields correctly.'
    return
  }

  // ユーザーデータを保存
  const userData = {
    username: username.value.trim(),
    email: email.value.trim(),
    password: password.value.trim(),
  }

  localStorage.setItem('user', JSON.stringify(userData))
  clearErrorMessage()
  router.push('/login')
}

// エラーメッセージをクリア
const clearErrorMessage = () => {
  errorMessage.value = ''
}

// ログイン画面への遷移
const navigateToLogin = () => {
  router.push('/login')
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
