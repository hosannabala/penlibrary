import { NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET

    if (!secret) {
      console.error('PAYSTACK_SECRET is not defined')
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const arrayBuffer = await req.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const bodyText = buffer.toString('utf-8')
    
    // Verify event
    const signature = req.headers.get('x-paystack-signature')
    if (signature) {
        const hash = crypto.createHmac('sha512', secret)
            .update(buffer)
            .digest('hex')
        if (hash !== signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
    }

    const body = JSON.parse(bodyText)
    const event = body
    if (event?.event === 'charge.success') {
      const meta = event?.data?.metadata
      if (meta?.uid && meta?.items) {
        const db = getAdminFirestore()
        
        // Check if order already exists to prevent duplicates
        const existingOrder = await db.collection('orders')
            .where('paymentReference', '==', event.data.reference)
            .limit(1)
            .get()
            
        if (!existingOrder.empty) {
             return NextResponse.json({ message: 'Order already processed' }, { status: 200 })
        }

        await db.collection('orders').add({
          userId: meta.uid,
          items: meta.items,
          total: (event?.data?.amount || 0) / 100,
          status: 'processing',
          paymentStatus: 'paid',
          paymentReference: event?.data?.reference,
          createdAt: FieldValue.serverTimestamp(),
          deliveryMethod: meta?.delivery_method || 'delivery',
          shippingAddress: meta?.shipping_address || '',
          customerName: meta?.name || '',
          customerEmail: event?.data?.customer?.email || ''
        })
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
