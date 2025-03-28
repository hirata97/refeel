<template>
  <div class="report-page">
    <!-- ヘッダー -->
    <header class="report-header">
      <h1 class="report-title">レポート</h1>
      <p class="report-description">過去のデータを基にした統計や傾向を確認できます。</p>
    </header>

    <!-- レポートコンテンツ -->
    <section class="report-content">
      <!-- 感情の傾向 -->
      <div class="report-card">
        <h3 class="card-title">感情の傾向</h3>
        <p class="card-description">最近の感情データに基づく傾向を示します。</p>
        <!-- グラフやチャートをここに配置可能 -->
        <div class="chart-placeholder">グラフエリア</div>
      </div>
    </section>

    <!-- アクションボタン -->
    <footer class="report-actions">
      <button @click="navigateTo('/dashboard')" class="button primary">ダッシュボードに戻る</button>
      <button @click="navigateTo('/help')" class="button secondary">ヘルプ</button>
    </footer>
  </div>
</template>

<script lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'

export default {
  name: 'ReportPage',
  setup() {
    const router = useRouter()

    // 認証チェックとリダイレクト処理
    onMounted(() => {
      if (!isAuthenticated()) {
        router.push({
          path: '/login',
          query: { redirect: router.currentRoute.value.fullPath },
        })
      }
    })

    // ページ間の遷移関数
    const navigateTo = (path: string) => {
      router.push(path)
    }

    return {
      navigateTo,
    }
  },
}
</script>

<style scoped>
/* スタイルは変更なし */
.report-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  padding: 16px;
}

.report-header {
  text-align: center;
  margin-bottom: 32px;
}

.report-title {
  font-size: 2rem;
  margin-bottom: 8px;
}

.report-description {
  font-size: 1rem;
  color: #666;
}

.report-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 960px;
  margin-bottom: 32px;
}

.report-card {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 1.25rem;
  margin-bottom: 8px;
}

.card-description {
  font-size: 1rem;
  color: #666;
}

.chart-placeholder {
  height: 150px;
  background: #e0e0e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 1rem;
  margin-top: 16px;
}

.report-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.button {
  padding: 12px 24px;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.primary {
  background-color: #007bff;
  color: #fff;
  border: none;
}

.secondary {
  background-color: #fff;
  color: #007bff;
  border: 1px solid #007bff;
}

.primary:hover {
  background-color: #0056b3;
}

.secondary:hover {
  background-color: #e6f2ff;
}
</style>
