<template>
  <v-container
    class="help-page"
    style="
      background-color: #f5f7fa;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    "
  >
    <v-typography class="display-1">ヘルプ</v-typography>
    <p>ここではアプリのヘルプ情報を提供します。</p>
  </v-container>
</template>

<script setup lang="ts"></script>

<style scoped>
.help-page {
  /* CSSファイルに相当するスタイル */
  background-color: #f5f7fa;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>
