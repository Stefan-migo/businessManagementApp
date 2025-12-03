import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdvemkyvgnfnibntfbwq.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdmVta3l2Z25mbmlibnRmYndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MjMwNzAsImV4cCI6MjA2ODE5OTA3MH0.JhKvg2LIEaDmvcD09QuTkS4pi2ZqB6wZgUNZ2eLDqxQ',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Service role client for admin operations (bypasses RLS)
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdvemkyvgnfnibntfbwq.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdmVta3l2Z25mbmlibnRmYndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MjMwNzAsImV4cCI6MjA2ODE5OTA3MH0.JhKvg2LIEaDmvcD09QuTkS4pi2ZqB6wZgUNZ2eLDqxQ',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
} 