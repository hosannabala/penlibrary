import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const secret = process.env.DIAGNOSTICS_SECRET
  const provided = req.headers.get('x-diagnostics-secret') ?? new URL(req.url).searchParams.get('secret')
  if (!secret || provided !== secret) {
    return new Response('Forbidden', { status: 403 })
  }
  const results: any = {
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: { present: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: { present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
      SUPABASE_SERVICE_ROLE_KEY: { present: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
      NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: { present: !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY },
      PAYSTACK_SECRET_KEY: { present: !!process.env.PAYSTACK_SECRET_KEY },
    },
    supabase: {
      connection: false,
      booksTable: false,
      latencyMs: 0,
    },
    system: {
      nodeEnv: process.env.NODE_ENV,
      memoryUsage: process.memoryUsage(),
    },
    error: null,
  }

  const start = Date.now()
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from('books').select('id').limit(1)
    if (error) throw error
    results.supabase.connection = true
    results.supabase.booksTable = true
    results.supabase.latencyMs = Date.now() - start
  } catch (error: any) {
    results.error = error.message
    console.error('Diagnostics error:', error)
  }

  return NextResponse.json(results)
}
