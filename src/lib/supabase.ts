import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Key is missing')
}

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey)

export const supabase = createClient(supabaseUrl, supabaseKey)
console.log('Supabase Client:', supabase)
