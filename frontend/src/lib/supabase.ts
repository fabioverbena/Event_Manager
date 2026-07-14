import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hadpnnyxqbxnxjwseovp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZHBubnl4cWJ4bnhqd3Nlb3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODk2NzMsImV4cCI6MjA4NTU2NTY3M30.rH_QWJ_eyfvZpcAuwyqIg2hXPkdShKf2mlFww2nqtRU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)