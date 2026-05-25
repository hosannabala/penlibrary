import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendOrderConfirmationEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { reference } = await req.json()

    if (!reference) {
      return NextResponse.json({ error: 'Order reference is required' }, { status: 400 })
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 })
    }

    const db = createServerClient()

    // Idempotency — already confirmed
    const { data: existing } = await db
      .from('orders')
      .select('*')
      .eq('payment_reference', reference)
      .maybeSingle()

    if (existing?.payment_status === 'paid') {
      return NextResponse.json({ success: true, message: 'Order already confirmed' })
    }

    // Verify with Paystack
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    )
    const verifyData = await verifyRes.json()

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      return NextResponse.json({ error: 'Payment not confirmed by Paystack' }, { status: 400 })
    }

    const amountPaid = Math.round(verifyData.data.amount / 100) // kobo → naira

    // Guard against underpayment (allow 1 naira tolerance for rounding)
    if (existing && amountPaid < Math.round(existing.total) - 1) {
      console.error(`Amount mismatch: paid ₦${amountPaid}, expected ₦${existing.total} (ref: ${reference})`)
      return NextResponse.json({ error: 'Payment amount does not match order total' }, { status: 400 })
    }

    if (existing) {
      const { error: updateError } = await db
        .from('orders')
        .update({ status: 'processing', payment_status: 'paid', amount_paid: amountPaid })
        .eq('payment_reference', reference)
      if (updateError) throw updateError

      // Decrement stock
      const items = existing.items ?? []
      for (const item of items) {
        if (item.book?.id && item.quantity > 0) {
          await db.rpc('decrement_stock', { book_id: item.book.id, qty: item.quantity })
        }
      }

      // Award XP if logged-in user
      const userId = existing.user_id
      if (userId) {
        const { data: profile } = await db
          .from('user_profiles')
          .select('xp, streak')
          .eq('uid', userId)
          .single()

        if (profile) {
          const newXp = (profile.xp ?? 0) + 100
          let level = 'Bronze'
          if (newXp >= 5000) level = 'Platinum'
          else if (newXp >= 1500) level = 'Gold'
          else if (newXp >= 500) level = 'Silver'

          await db
            .from('user_profiles')
            .update({ xp: newXp, level, streak: (profile.streak ?? 0) + 1 })
            .eq('uid', userId)
        }
      }
    }

    // Send order confirmation email (fire-and-forget)
    if (existing?.customer_email) {
      const items = (existing.items ?? []).map((i: any) => ({
        title: i.book?.title ?? 'Book',
        quantity: i.quantity ?? 1,
        price: i.book?.salePrice ?? i.book?.price ?? 0,
      }))
      sendOrderConfirmationEmail({
        to: existing.customer_email,
        customerName: existing.customer_name ?? 'Customer',
        orderRef: reference,
        items,
        total: amountPaid,
        deliveryMethod: existing.delivery_method ?? 'delivery',
        shippingAddress: existing.address ?? undefined,
      }).catch(err => console.error('[email] order confirmation failed:', err))
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
