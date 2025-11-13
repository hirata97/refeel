<script lang="ts">
import { defineComponent, inject, ref, onMounted } from 'vue'
import { SupabaseClient } from '@supabase/supabase-js'

// データベースレコードの型定義
interface DatabaseRecord {
  id: string | number
  [key: string]: unknown
}

export default defineComponent({
  name: 'SupabaseComponent',
  setup() {
    const supabase = inject('supabase') as SupabaseClient
    const injectedValue = inject('injectedKey')

    const data = ref<DatabaseRecord[]>([])
    const error = ref<string | null>(null)

    onMounted(async () => {
      const { data: result, error: fetchError } = await supabase.from('your_table_name').select('*')

      if (fetchError) {
        error.value = fetchError.message
        logger.error('Error fetching data:', fetchError.message)
      } else {
        data.value = result || []
        logger.debug('Fetched data:', result)
      }
    })

    const json = (value: unknown) => {
      return JSON.stringify(value, null, 2)
    }

    return {
      injectedValue,
      data,
      error,
      json,
    }
  },
})
</script>

<template>
  <div>
    <h1>Supabase データの表示</h1>
    <div v-if="error" class="error">エラー: {{ error }}</div>
    <ul v-else>
      <li v-for="item in data" :key="item.id">
        {{ json(item) }}
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
