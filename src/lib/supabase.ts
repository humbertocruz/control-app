import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para componentes do lado do cliente
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Cliente para componentes do lado do servidor
export const createSupabaseServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}