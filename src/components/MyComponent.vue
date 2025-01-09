<script setup lang="ts">
import { inject } from 'vue'
import { SupabaseClient } from '@supabase/supabase-js'

// inject の戻り値に型を明示的に指定
const supabase = inject('supabase') as SupabaseClient

// Supabase を使用
const { data, error } = await supabase.from('table_name').select('*')

if (error) {
  console.error(error)
} else {
  console.log(data)
}
</script>
