import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hadpnnyxqbxnxjwseovp.supabase.co'
const supabaseAnonKey = 'sb_publishable_HviTJbHzdPIcmB59F3mpTg_EyD0AuSp'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
