<template>
  <div class="dashboard-page">
    <!-- ダッシュボードヘッダー -->
    <header class="dashboard-header">
      <h1 class="dashboard-title">ダッシュボード</h1>
      <p class="dashboard-description">ここでは日記のダッシュボードを表示します。</p>
    </header>

    <section class="dashboard-grid">
      <BaseCard title="最近の日記" class="dashboard-card">
        <p>ここに最近の日記エントリーのプレビューを表示します。</p>
      </BaseCard>

      <BaseCard title="感情の統計" class="dashboard-card">
        <p>ここに最近の感情の傾向を示すグラフを表示します。</p>
      </BaseCard>
    </section>

    <!-- ダッシュボードボタン -->
    <footer class="dashboard-actions">
      <BaseButton @click="navigateTo('/diary-register')" color="primary" size="large" class="mb-2">
        新しい日記を書く
      </BaseButton>
      <BaseButton @click="navigateTo('/setting')" color="secondary" variant="outlined" size="large">
        設定
      </BaseButton>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { BaseCard, BaseButton } from '@/components/base'

const router = useRouter()
const authStore = useAuthStore()

// 認証状態をチェック
onMounted(() => {
  if (!authStore.isAuthenticated) {
    // 認証されていない場合はログインページにリダイレクト
    router.push('/login')
  }
})

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  padding: 16px;
}

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

/* アクションボタン */
.dashboard-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
}

/* モバイル対応 */
@media (max-width: 600px) {
  .dashboard-header {
    margin-bottom: 16px;
  }

  .dashboard-grid {
    gap: 8px;
  }

  .dashboard-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
