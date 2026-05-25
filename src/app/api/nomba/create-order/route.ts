import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const NOMBA_BASE = process.env.NOMBA_API_BASE ?? 'https://api.nomba.com/v1'

async function getNombaToken(): Promise<string> {
  const res = await fetch(`${NOMBA_BASE}/auth/token/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accountId: process.env.NOMBA_ACCOUNT_ID!,
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.NOMBA_CLIENT_ID,
      client_secret: process.env.NOMBA_CLIENT_SECRET,
    }),
  })
  const data = await res.json()
  if (data.code !== '00') throw new Error('Nomba auth failed: ' + (data.description ?? 'unknown'))
  return data.data.access_token as string
}

export async function POST(req: Request) {
  try {
    const { email, amountNaira, reference, userId, orderData } = await req.json()

    if (!process.env.NOMBA_ACCOUNT_ID || !process.env.NOMBA_CLIENT_ID || !process.env.NOMBA_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Nomba credentials not configured' }, { status: 500 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const token = await getNombaToken()

    // Create Nomba checkout order (amount in Naira — Nomba uses Naira, not kobo)
    const nombaRes = await fetch(`${NOMBA_BASE}/checkout/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        accountId: process.env.NOMBA_ACCOUNT_ID,
      },
      body: JSON.stringify({
        order: {
          orderReference: reference,
          callbackUrl: `${siteUrl}/checkout/callback`,
          customerEmail: email,
          amount: amountNaira,
          currency: 'NGN',
        },
      }),
    })
    const nombaData = await nombaRes.json()

    if (nombaData.code !== '00') {
      return NextResponse.json(
        { error: nombaData.description || 'Failed to create Nomba checkout' },
        { status: 400 },
      )
    }

    const checkoutUrl = nombaData.data.checkoutLink as string

    // Save pending order so we can confirm it on the callback page
    const db = createServerClient()

    const { data: existing } = await db
      .from('orders')
      .select('id')
      .eq('payment_reference', reference)
      .limit(1)
      .maybeSingle()

    if (!existing) {
      const { error: insertError } = await db.from('orders').insert({
        user_id: userId && userId !== 'guest' ? userId : null,
        items: orderData.items ?? [],
        total: amountNaira,
        status: 'pending',
        payment_reference: reference,
        payment_status: 'pending',
        customer_name: orderData.customerName ?? null,
        customer_email: orderData.customerEmail ?? null,
        customer_phone: orderData.customerPhone ?? null,
        delivery_method: orderData.deliveryMethod ?? null,
        address: orderData.shippingAddress ?? null,
      })
      if (insertError) throw insertError
    }

    return NextResponse.json({ checkoutUrl, orderReference: reference })
  } catch (error: any) {
    console.error('Nomba create-order error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
