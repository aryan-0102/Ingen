import { createClient } from '@supabase/supabase-js'

const getUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const getAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
const getServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export function createServerClient() {
  return createClient(getUrl(), getServiceKey(), {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export function createServiceClient() {
  return createClient(getUrl(), getServiceKey(), {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
