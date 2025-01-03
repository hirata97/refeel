<template>
  <v-container class="register-container">
    <v-text class="display-1 mb-4 text-center">Register</v-text>

    <v-form @submit.prevent="handleRegister" class="register-form">
      <v-text-field label="Username" v-model="username" outlined full-width class="mb-3" required />
      <v-text-field
        label="Email"
        v-model="email"
        outlined
        full-width
        class="mb-3"
        type="email"
        required
      />
      <v-text-field
        label="Password"
        type="password"
        v-model="password"
        outlined
        full-width
        class="mb-4"
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

const username = ref('')
const email = ref('')
const password = ref('')

const handleRegister = () => {
  if (!username.value || !email.value || !password.value) {
    alert('All fields are required.')
    return
  }

  const userData = {
    username: username.value,
    email: email.value,
    password: password.value,
  }

  localStorage.setItem('user', JSON.stringify(userData))
  router.push('/login')
}

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
