<template>
  <v-container class="dashboard-container">
    <div class="title">日記アプリゆる開発</div>

    <v-btn class="action-button" color="primary" block @click="navigateTo('/register')">
      アカウント登録
    </v-btn>

    <v-btn class="action-button" color="secondary" block @click="navigateTo('/login')">
      ログイン
    </v-btn>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const navigateTo = (path: string) => router.push(path)
</script>

<style scoped>
.dashboard-container {
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

.title {
  font-size: 2rem;
  margin-bottom: 1rem;
  text-align: center;
}

.action-button {
  margin-bottom: 0.5rem;
}
</style>
