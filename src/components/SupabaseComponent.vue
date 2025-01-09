<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase クライアントの初期化
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

// データとエラーの状態を定義
const data = ref<any[]>([])
const error = ref<string | null>(null)

// コンポーネントがマウントされたときにデータを取得
onMounted(async () => {
  const { data: result, error: fetchError } = await supabase
    .from('your_table_name') // 取得したいテーブル名
    .select('*')

  if (fetchError) {
    error.value = fetchError.message
    console.error('Error fetching data:', fetchError.message)
  } else {
    data.value = result || []
    console.log('Fetched data:', result)
  }
})
</script>

<template>
  <div>
    <h1>Supabase データの表示</h1>
    <div v-if="error" class="error">エラー: {{ error }}</div>
    <ul v-else>
      <li v-for="item in data" :key="item.id">
        {{ item | json }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.error {
  color: red;
  font-weight: bold;
}
</style>
