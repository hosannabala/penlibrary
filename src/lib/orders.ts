import { collection, addDoc, getDocs, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { db } from './firebase'
import type { Order } from './types'

export const ordersRef = collection(db, 'orders')

export async function createOrder(order: Omit<Order, 'id'>) {
  return await addDoc(ordersRef, order)
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const q = query(ordersRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Order))
}

export async function getAllOrders(): Promise<Order[]> {
   const q = query(ordersRef, orderBy('createdAt', 'desc'))
   const snapshot = await getDocs(q)
   return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Order))
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
    const q = query(ordersRef, orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snapshot: any) => {
        const orders = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Order))
        callback(orders)
    })
}

export async function updateOrderStatus(id: string, status: Order['status']) {
    const ref = doc(db, 'orders', id)
    await updateDoc(ref, { status })
}
