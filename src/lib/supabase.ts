import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Guard allows Next.js to import this module during build without throwing.
// Actual requests will fail at runtime if env vars are missing.
export const supabase = url && anon
  ? createClient(url, anon)
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key')

// Server-side client — requires service role key; never falls back to anon
export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Server operations require the service role key.')
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}
