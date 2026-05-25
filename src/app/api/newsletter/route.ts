import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const db = createServerClient()
    const { error } = await db
      .from('club_members')
      .upsert({ email: email.toLowerCase().trim() }, { onConflict: 'email', ignoreDuplicates: true })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Newsletter signup error:', err)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
