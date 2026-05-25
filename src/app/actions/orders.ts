'use server'

import { createServerClient } from '@/lib/supabase'

type CreateOrderInput = {
  userId: string | null
  items: any[]
  total: number
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryMethod: 'delivery' | 'pickup'
  shippingAddress: string
  shippingFee: number
  courierName: string | null
}

export async function createPendingOrderAction(input: CreateOrderInput): Promise<string> {
  const db = createServerClient()
  const reference = `PL_${Date.now()}`

  const { error } = await db.from('orders').insert({
    payment_reference: reference,
    user_id: input.userId,
    items: input.items,
    total: input.total,
    status: 'pending',
    payment_status: 'pending',
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    delivery_method: input.deliveryMethod,
    address: input.shippingAddress,
    shipping_fee: input.shippingFee,
    courier_name: input.courierName,
  })

  if (error) throw error
  return reference
}
