import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createHmac } from 'crypto'

export async function POST(req: Request) {
  const body = await req.text()

  // Verify HMAC signature
  const secret = process.env.NOMBA_WEBHOOK_SECRET
  if (secret) {
    const signature =
      req.headers.get('x-nomba-signature') ??
      req.headers.get('x-signature') ??
      ''
    const expected = createHmac('sha256', secret).update(body).digest('hex')
    if (expected !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (payload.event_type === 'payment_success') {
    const orderReference =
      payload.data?.transaction?.orderReference ??
      payload.data?.orderReference ??
      null

    if (orderReference) {
      const db = createServerClient()

      const { data: order } = await db
        .from('orders')
        .select('*')
        .eq('payment_reference', orderReference)
        .maybeSingle()

      if (order && order.payment_status !== 'paid') {
        await db
          .from('orders')
          .update({ status: 'processing', payment_status: 'paid' })
          .eq('payment_reference', orderReference)

        const items: any[] = order.items ?? []
        for (const item of items) {
          if (item.book?.id && item.quantity > 0) {
            await db.rpc('decrement_stock', { book_id: item.book.id, qty: item.quantity })
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
