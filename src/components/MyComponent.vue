<script setup lang="ts">
import { inject, onMounted } from 'vue'
import { SupabaseClient } from '@supabase/supabase-js'

// inject の戻り値に型を明示的に指定
const supabase = inject('supabase') as SupabaseClient

// Supabase を使用
onMounted(async () => {
  const { data, error } = await supabase.from('table_name').select('*')

  if (error) {
    logger.error(error)
  } else {
    logger.debug(data)
  }
})
</script>
