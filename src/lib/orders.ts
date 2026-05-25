import { supabase, createServerClient } from './supabase'
import type { Order } from './types'

function mapOrder(r: any): Order {
  return {
    id: r.id,
    userId: r.user_id,
    items: r.items ?? [],
    total: Number(r.total),
    status: r.status,
    paymentReference: r.payment_reference,
    paymentStatus: r.payment_status,
    amountPaid: r.amount_paid != null ? Number(r.amount_paid) : undefined,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    deliveryMethod: r.delivery_method,
    address: r.address,
    createdAt: r.created_at,
  }
}

export async function createOrder(order: Omit<Order, 'id'>) {
  const { data, error } = await supabase.from('orders').insert({
    user_id: order.userId ?? null,
    items: order.items,
    total: order.total,
    status: order.status ?? 'pending',
    payment_reference: order.paymentReference ?? null,
    payment_status: order.paymentStatus ?? 'pending',
    amount_paid: order.amountPaid ?? null,
    customer_name: order.customerName ?? null,
    customer_email: order.customerEmail ?? null,
    customer_phone: order.customerPhone ?? null,
    delivery_method: order.deliveryMethod ?? null,
    address: order.address ?? null,
  }).select().single()
  if (error) throw error
  return data
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapOrder)
}

export async function getAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapOrder)
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const channel = supabase
    .channel('orders-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
      const orders = await getAllOrders()
      callback(orders)
    })
    .subscribe()

  return () => { supabase.removeChannel(channel).catch(() => {}) }
}

export async function updateOrderStatus(id: string, status: Order['status']) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw error
}

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from('orders')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapOrder)
}
