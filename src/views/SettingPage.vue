<template>
  <v-container class="settings-page">
    <v-typography variant="h4" class="mb-4">設定</v-typography>
    <v-typography variant="body1">ここではアプリの設定を行います。</v-typography>
  </v-container>
</template>

<script setup lang="ts"></script>

<style scoped>
.settings-page {
  background-color: #f5f7fa;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  min-height: 100vh; /* ページ全体をカバーする高さ */
}
.mb-4 {
  margin-bottom: 16px;
}
</style>
