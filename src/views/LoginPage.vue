<template>
  <v-container class="login-container">
    <v-text class="display-1 mb-4 text-center">Login</v-text>

    <v-form @submit.prevent="handleLogin" class="login-form">
      <v-alert
        v-if="errorMessage"
        type="error"
        dismissible
        class="mb-3"
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>

      <v-text-field label="Username" v-model="username" outlined full-width class="mb-3" required />
      <v-text-field
        label="Password"
        type="password"
        v-model="password"
        outlined
        full-width
        class="mb-4"
        required
      />
      <v-btn type="submit" color="primary" block class="mb-2">Login</v-btn>
      <v-btn color="secondary" block @click="navigateToRegister">Register</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const password = ref('')
const errorMessage = ref('')

const handleLogin = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (user.username === username.value && user.password === password.value) {
    errorMessage.value = ''
    router.push('/dashboard')
  } else {
    errorMessage.value = 'Invalid username or password.'
  }
}

const navigateToRegister = () => {
  router.push('/register')
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
</style>
