<template>
  <v-container class="settings-page">
    <v-typography variant="h4" class="mb-4">設定</v-typography>
    <v-typography variant="body1" class="mb-4">ここではアプリの設定を行います。</v-typography>

    <!-- 設定カード -->
    <v-row dense>
      <!-- 通知設定 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2" size="24">mdi-bell</v-icon>
            通知設定
          </v-card-title>
          <v-card-subtitle>通知のオン/オフを設定します。</v-card-subtitle>
          <v-card-actions>
            <v-switch label="通知を有効にする" class="mt-2" />
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- テーマ設定 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2" size="24">mdi-palette</v-icon>
            テーマ設定
          </v-card-title>
          <v-card-subtitle>アプリのテーマカラーを変更します。</v-card-subtitle>
          <v-card-actions>
            <v-select :items="themes" label="テーマを選択" class="mt-2"></v-select>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// テーマ選択肢
const themes = ['ライト', 'ダーク', 'ブルー', 'グリーン']

// ページ遷移関数
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
/* 設定ページ全体のスタイル */
.settings-page {
  background-color: #f5f7fa;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  min-height: 100vh; /* ページ全体をカバーする高さ */
}

/* マージンのスタイル */
.mb-4 {
  margin-bottom: 16px;
}
</style>
