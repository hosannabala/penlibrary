import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const arrayBuffer = await req.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const bodyText = buffer.toString('utf-8')

    const signature = req.headers.get('x-paystack-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }
    const hash = crypto.createHmac('sha512', secret).update(buffer).digest('hex')
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(bodyText)
    if (event?.event === 'charge.success') {
      const meta = event?.data?.metadata
      if (meta?.uid && meta?.items) {
        const supabase = createServerClient()

        // Prevent duplicate orders
        const { data: existing } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_reference', event.data.reference)
          .limit(1)

        if (existing?.length) {
          return NextResponse.json({ message: 'Order already processed' }, { status: 200 })
        }

        await supabase.from('orders').insert({
          user_id: meta.uid,
          items: meta.items,
          total: (event?.data?.amount || 0) / 100,
          status: 'processing',
          payment_status: 'paid',
          payment_reference: event?.data?.reference,
          delivery_method: meta?.delivery_method || 'delivery',
          address: meta?.shipping_address || '',
          customer_name: meta?.name || '',
          customer_email: event?.data?.customer?.email || '',
        })
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
