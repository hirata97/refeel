<template>
  <BaseForm
    title="Login"
    container-class="login-container"
    form-class="login-form"
    @submit="handleLogin"
  >
    <template #content>
      <BaseAlert
        v-model="showError"
        type="error"
        closable
        :message="errorMessage"
        @close="errorMessage = ''"
      />

      <v-text-field
        label="Email"
        v-model="email"
        variant="outlined"
        class="mb-3"
        required
        :rules="[(v) => !!v || 'Email is required']"
        aria-label="Enter your email"
        autofocus
      />

      <v-text-field
        label="Password"
        type="password"
        v-model="password"
        variant="outlined"
        class="mb-4"
        required
        :rules="[(v) => !!v || 'Password is required']"
        aria-label="Enter your password"
      />
    </template>

    <template #actions>
      <BaseButton
        :loading="isLoading"
        type="submit"
        color="primary"
        block
        class="mb-2"
      >
        Login
      </BaseButton>
      <BaseButton
        color="secondary"
        block
        @click="navigateToTopPage"
      >
        トップページに戻る
      </BaseButton>
    </template>
  </BaseForm>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { BaseForm, BaseButton, BaseAlert } from '@/components/base'

const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const showError = computed({
  get: () => !!errorMessage.value,
  set: (value: boolean) => {
    if (!value) {
      errorMessage.value = ''
    }
  }
})

const handleLogin = async (isValid: boolean) => {
  if (!isValid) return

  isLoading.value = true

  const emailTrim = email.value.trim()
  const passwordTrim = password.value.trim()

  const { error } = await supabase.auth.signInWithPassword({
    email: emailTrim,
    password: passwordTrim,
  })

  if (error) {
    errorMessage.value = error.message
    isLoading.value = false
    return
  }

  router.push('/dashboard')
  isLoading.value = false
}

// 登録ページからトップページに遷移
const navigateToTopPage = () => {
  router.push('/')
}
</script>

<style scoped>
.login-container {
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

.login-form {
  width: 100%;
  max-width: 400px;
}

@media (max-width: 600px) {
  .login-container {
    height: auto;
    padding: 16px;
  }
}
</style>
