import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = 'https://usespgmwnqqbvttgvyay.supabase.co'
const supabaseKey = 'sb_publishable_hD5RvCXnRHUxXVxNJW_6sg_a-SwPYYJ'

export const supabase = createClient(supabaseUrl, supabaseKey)
