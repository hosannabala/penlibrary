import { NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: Request) {
  console.log('Verify API called')
  try {
    const { reference, orderData, userId } = await req.json()
    console.log('Verifying reference:', reference)

    const secret = process.env.PAYSTACK_SECRET

    if (!secret) {
      console.error('PAYSTACK_SECRET is missing')
      return NextResponse.json({ error: 'Server configuration error: PAYSTACK_SECRET missing' }, { status: 500 })
    }

    // 1. Verify with Paystack
    console.log('Calling Paystack API...')
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secret}`
      }
    })

    const verifyData = await verifyRes.json()
    console.log('Paystack response:', verifyData.status, verifyData.message)

    if (!verifyData.status || verifyData.data.status !== 'success') {
      console.error('Paystack verification failed:', verifyData)
      return NextResponse.json({ error: 'Payment verification failed: ' + verifyData.message }, { status: 400 })
    }

    // 2. Check if order exists
    const db = getAdminFirestore()
    const ordersRef = db.collection('orders')
    const q = await ordersRef.where('paymentReference', '==', reference).limit(1).get()

    if (!q.empty) {
      return NextResponse.json({ message: 'Order already exists' }, { status: 200 })
    }

    // 3. Create Order
    // Ensure critical fields are server-controlled or verified
    const amountPaid = verifyData.data.amount / 100

    // Basic validation: Check if paid amount matches order total
    // (Allow small difference for potential rounding, though unlikely with Paystack)
    if (Math.abs(amountPaid - orderData.total) > 50) {
        console.warn('Mismatch in paid amount vs order total', { amountPaid, orderTotal: orderData.total })
        // We still process it but flag it? Or reject? 
        // For now, we update the total to what was actually paid.
    }

    const finalOrder = {
      ...orderData,
      total: amountPaid, // Override with verified amount
      paymentStatus: 'paid',
      paymentReference: reference,
      createdAt: FieldValue.serverTimestamp(), // Server timestamp
      amountPaid: amountPaid // Trusted amount from Paystack
    }

    await ordersRef.add(finalOrder)

    // 4. Update Inventory (Server Side)
    // Decrease stock for each item in the order
    if (orderData.items && Array.isArray(orderData.items)) {
        console.log('Updating inventory...')
        const batch = db.batch()
        
        for (const item of orderData.items) {
            if (item.book && item.book.id) {
                const bookRef = db.collection('books').doc(item.book.id)
                // Use FieldValue.increment with negative quantity
                batch.update(bookRef, { 
                    stock: FieldValue.increment(-item.quantity) 
                })
            }
        }
        
        await batch.commit()
        console.log('Inventory updated.')
    }

    // 5. Gamification (Server Side)
    if (userId && userId !== 'guest') {
        const userRef = db.collection('users').doc(userId)
        
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef)
            if (!doc.exists) return
            
            const data = doc.data()
            const currentXp = data?.xp || 0
            const currentStreak = data?.streak || 0
            const badges = data?.badges || []
            
            // Logic matches gamification.ts
            const newXp = currentXp + 100
            
            let level = 'Bronze'
            if (newXp >= 5000) level = 'Platinum'
            else if (newXp >= 1500) level = 'Gold'
            else if (newXp >= 500) level = 'Silver'

            t.update(userRef, {
                xp: newXp,
                streak: currentStreak + 1,
                level: level,
                // badges could be updated here if we had badge logic
            })
        })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
