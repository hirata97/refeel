<template>
  <div class="report-page">
    <header class="report-header">
      <h1 class="report-title">レポート</h1>
      <p class="report-description">過去のデータを基にした統計や傾向を確認できます。</p>
    </header>

    <section class="report-content">
      <div class="report-card">
        <h3 class="card-title">気分の推移</h3>
        <p class="card-description">過去30日間の気分の変化を表示します。</p>
        <Line v-if="chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
      </div>
    </section>

    <footer class="report-actions">
      <button @click="navigateTo('/dashboard')" class="button primary">ダッシュボードに戻る</button>
      <button @click="navigateTo('/help')" class="button secondary">ヘルプ</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { supabase } from '@/lib/supabase'

// Chart.jsコンポーネントの登録
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const router = useRouter()

// チャートデータの初期状態
const chartData = ref({
  labels: [],
  datasets: [
    {
      label: '気分スコア',
      data: [],
      borderColor: '#4CAF50',
      tension: 0.1,
    },
  ],
})

// チャートのオプション設定
const chartOptions = {
  responsive: true,
  scales: {
    y: {
      min: 1,
      max: 5,
      ticks: {
        stepSize: 1,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
}

// 日記データの取得と加工
const loadMoodData = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // 過去30日分のデータを取得
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from('diaries')
      .select('date, mood')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) throw error

    if (data) {
      // データの加工
      const dates = data.map((entry) => {
        const date = new Date(entry.date)
        return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
      })
      const moods = data.map((entry) => entry.mood)

      // チャートデータの更新
      chartData.value = {
        labels: dates,
        datasets: [
          {
            label: '気分スコア',
            data: moods,
            borderColor: '#4CAF50',
            tension: 0.1,
          },
        ],
      }
    }
  } catch (error) {
    console.error('データ取得エラー:', error)
  }
}

const navigateTo = (path: string) => {
  router.push(path)
}

onMounted(async () => {
  await loadMoodData()
})
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
