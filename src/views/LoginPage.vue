<template>
  <v-container class="login-container">
    <v-text class="display-1 mb-4 text-center">Login</v-text>

    <v-form ref="form" v-model="valid" @submit.prevent="handleLogin" class="login-form">
      <v-alert
        v-if="errorMessage"
        type="error"
        dismissible
        class="mb-3"
        @click:close="errorMessage = ''"
        aria-live="polite"
      >
        {{ errorMessage }}
      </v-alert>

      <v-text-field
        label="Username"
        v-model="username"
        outlined
        full-width
        class="mb-3"
        required
        :rules="[(v) => !!v || 'Username is required']"
        aria-label="Enter your username"
      />

      <v-text-field
        label="Password"
        type="password"
        v-model="password"
        outlined
        full-width
        class="mb-4"
        required
        :rules="[(v) => !!v || 'Password is required']"
        aria-label="Enter your password"
      />

      <v-btn :loading="isLoading" type="submit" color="primary" block class="mb-2">Login</v-btn>
      <v-btn color="secondary" block @click="navigateToRegister">Register</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VForm } from 'vuetify/components'

const router = useRouter()

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const valid = ref(false)
const form = ref<InstanceType<typeof VForm> | null>(null)
const isLoading = ref(false)

const handleLogin = () => {
  if (!form.value?.validate()) return

  isLoading.value = true

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (user.username === username.value && user.password === password.value) {
    errorMessage.value = ''
    router.push('/dashboard')
  } else {
    errorMessage.value = 'Invalid username or password.'
  }

  isLoading.value = false
}

const navigateToRegister = () => {
  router.push('/register')
}

watch(errorMessage, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  }
})
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
