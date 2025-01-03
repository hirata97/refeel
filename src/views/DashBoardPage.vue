<template>
  <div class="dashboard-page">
    <!-- ダッシュボードヘッダー -->
    <header class="dashboard-header">
      <h1 class="dashboard-title">ダッシュボード</h1>
      <p class="dashboard-description">ここでは日記のダッシュボードを表示します。</p>
    </header>

    <!-- ダッシュボードカード -->
    <section class="dashboard-grid">
      <div class="dashboard-card">
        <div class="card-content">
          <h3 class="card-title">最近の日記</h3>
          <p class="card-description">ここに最近の日記エントリーのプレビューを表示します。</p>
        </div>
      </div>

      <div class="dashboard-card">
        <div class="card-content">
          <h3 class="card-title">感情の統計</h3>
          <p class="card-description">ここに最近の感情の傾向を示すグラフを表示します。</p>
        </div>
      </div>
    </section>

    <!-- ダッシュボードボタン -->
    <footer class="dashboard-actions">
      <button @click="navigateTo('/diary')" class="button primary">新しい日記を書く</button>
      <button @click="navigateTo('/settings')" class="button secondary">設定</button>
    </footer>
  </div>
</template>

<script lang="ts">
import { useRouter } from 'vue-router'

export default {
  name: 'DashboardPage',
  setup() {
    const router = useRouter()

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
/* 全体ページのスタイル */
.dashboard-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  padding: 16px;
}

/* ヘッダー */
.dashboard-header {
  text-align: center;
  margin-bottom: 32px;
}

.dashboard-title {
  font-size: 2rem;
  margin-bottom: 8px;
}

.dashboard-description {
  font-size: 1rem;
  color: #666;
}

/* カードグリッド */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 960px;
  margin-bottom: 32px;
}

.dashboard-card {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1.25rem;
  margin-bottom: 8px;
}

.card-description {
  font-size: 1rem;
  color: #666;
}

/* アクションボタン */
.dashboard-actions {
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
