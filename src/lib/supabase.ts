import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dgrgcfaoaqxqyttrktql.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncmdjZmFvYXF4cXl0dHJrdHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkwODI5NzYsImV4cCI6MjA0NDY1ODk3Nn0.ds4Y7vrzs4GBPzzfEu1NBL_Ux8j8r1cLpIRrNMJbOu8'

export const supabase = createClient(supabaseUrl, supabaseKey)
