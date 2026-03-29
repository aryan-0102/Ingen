import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function isConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.startsWith('http') && !url.includes('placeholder') && !url.includes('<')
}

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  if (!url.startsWith('http') || url.includes('<') || url.includes('placeholder')) {
    // Return a mock client that won't crash
    const mockUrl = 'https://mock.supabase.co'
    const mockKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2siLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjY0MDAwMCwiZXhwIjoxOTYyMjE2MDAwfQ.mock'
    _supabase = createClient(mockUrl, mockKey)
  } else {
    _supabase = createClient(url, key)
  }

  // Monkey-patch getSession to always return a mock authenticated user
  const mockSession = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: 'test-user-id',
      email: 'admin@g',
      app_metadata: {},
      user_metadata: { full_name: 'Test Setup User' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    }
  } as any;

  _supabase.auth.getSession = async () => ({
    data: { session: mockSession },
    error: null
  } as any)

  _supabase.auth.onAuthStateChange = (callback) => {
    setTimeout(() => {
      callback('SIGNED_IN', mockSession);
    }, 0);
    return { data: { subscription: { unsubscribe: () => {} } } } as any;
  };

  return _supabase
}

export function isSupabaseConfigured(): boolean {
  return isConfigured()
}

// For backward compat
export const supabase = typeof window !== 'undefined'
  ? getSupabase()
  : (null as unknown as SupabaseClient)
