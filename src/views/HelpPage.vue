<template>
  <v-container class="help-page">
    <v-typography class="display-1">ヘルプ</v-typography>
    <p>ここではアプリのヘルプ情報を提供します。</p>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'

const router = useRouter()

// ページ読み込み時に認証をチェックし、未認証ならリダイレクト
onMounted(() => {
  if (!isAuthenticated()) {
    router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath }, // 元のページを記憶
    })
  }
})
</script>

<style scoped>
.help-page {
  background-color: #f5f7fa;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>
