// Clientes Supabase para server (service role) e browser (anon key)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** Cliente para Client Components — usa anon key com RLS */
export function createBrowserSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

/** Cliente para API Routes — usa service role key, bypassa RLS */
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey)
}
