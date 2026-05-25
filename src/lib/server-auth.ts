import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { createServerClient } from './supabase'

const COOKIE_NAME = 'pl_admin_v1'
const EXPIRY_MS = 2 * 60 * 60 * 1000 // 2 hours

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s) throw new Error('ADMIN_SESSION_SECRET is not configured.')
  return s
}

function sign(email: string, ts: number): string {
  return createHmac('sha256', getSecret())
    .update(`${email}:${ts}`)
    .digest('hex')
}

function safeCompare(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ab.length !== bb.length) return false
    return timingSafeEqual(ab, bb)
  } catch {
    return false
  }
}

/**
 * Called after successful admin check on the client.
 * Verifies the Supabase access token, confirms admin table, sets signed cookie.
 */
export async function createAdminSession(accessToken: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Verify token with anon client (safe: doesn't use service role)
  const client = createClient(url, anon)
  const { data: { user }, error } = await client.auth.getUser(accessToken)
  if (error || !user?.email) throw new Error('Invalid session token.')

  // Confirm admin status in DB
  const db = createServerClient()
  const { data } = await db.from('admins').select('uid').eq('email', user.email).limit(1)
  if (!data?.length) throw new Error('Not an admin.')

  const ts = Date.now()
  const sig = sign(user.email, ts)

  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, `${user.email}:${ts}:${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRY_MS / 1000,
    path: '/',
  })
}

/**
 * Call at the start of every admin-only server action.
 * Returns the admin's email, or throws if not authenticated.
 */
export async function requireAdmin(): Promise<string> {
  const cookieStore = cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) throw new Error('Unauthorized: no admin session.')

  const parts = raw.split(':')
  if (parts.length !== 3) throw new Error('Unauthorized: malformed session.')

  const [email, tsStr, sig] = parts
  const ts = Number(tsStr)
  if (!email || isNaN(ts)) throw new Error('Unauthorized: invalid session.')

  // Constant-time signature check (prevents timing attacks)
  const expected = sign(email, ts)
  if (!safeCompare(expected, sig)) throw new Error('Unauthorized: invalid signature.')

  // Expiry check
  if (Date.now() - ts > EXPIRY_MS) throw new Error('Unauthorized: session expired.')

  return email
}

/**
 * Clears the admin session cookie on logout.
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete(COOKIE_NAME)
}
