'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Returns a Supabase client safe for use in Client Components ('use client').
 * Reads/writes the session from browser cookies automatically.
 *
 * Usage:
 *   const supabase = createClient()
 *   const { data } = await supabase.from('profiles').select('*')
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}