'use client'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { createOrder } from '../../lib/orders'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function CartPage() {
  const { items, removeFromCart, total, clearCart } = useCart()
  const { user, loginWithGoogle, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  async function handleCheckout() {
    if (!user) {
      loginWithGoogle()
      return
    }
    router.push('/checkout')
  }

  if (authLoading || !user) return <div className="py-20 text-center">Loading...</div>

  if (items.length === 0) {
     return (
        <div className="py-20 text-center">
            <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
            <p className="text-charcoal/60 mb-8">Looks like you haven't added any books yet.</p>
            <button onClick={() => router.push('/catalog')} className="px-6 py-3 bg-terracotta text-white rounded-xl">Browse Books</button>
        </div>
     )
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-semibold mb-6">Shopping Cart</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
            {items.map(item => (
                <div key={item.book.id} className="card p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {item.book.coverUrl && <img src={item.book.coverUrl} className="w-20 h-24 object-cover rounded shadow-sm shrink-0" alt={item.book.title} />}
                    <div className="flex-grow w-full">
                        <h3 className="font-semibold text-lg">{item.book.title}</h3>
                        <p className="text-sm text-charcoal/60 mb-2">{item.book.author}</p>
                        <div className="flex sm:hidden justify-between items-center mt-2">
                             <div className="font-bold">₦{item.book.price.toLocaleString()}</div>
                             <div className="text-sm text-charcoal/60">Qty: {item.quantity}</div>
                        </div>
                    </div>
                    <div className="hidden sm:block text-right shrink-0">
                        <div className="font-bold text-lg">₦{item.book.price.toLocaleString()}</div>
                        <div className="text-sm text-charcoal/60">Qty: {item.quantity}</div>
                        <button onClick={() => removeFromCart(item.book.id)} className="text-sm text-red-500 hover:text-red-700 mt-1 font-medium">Remove</button>
                    </div>
                    <button onClick={() => removeFromCart(item.book.id)} className="sm:hidden w-full py-2 text-red-500 border border-red-200 rounded-lg text-sm font-medium">Remove</button>
                </div>
            ))}
        </div>
        <div>
            <div className="card p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                <div className="flex justify-between mb-2">
                    <span>Subtotal</span>
                    <span>₦{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-6 font-bold text-xl text-terracotta">
                    <span>Total</span>
                    <span>₦{total.toLocaleString()}</span>
                </div>
                <button 
                    onClick={handleCheckout} 
                    disabled={loading}
                    className="w-full py-3 bg-terracotta text-white rounded-xl shadow-soft hover:shadow-lg transition-all disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Checkout'}
                </button>
            </div>
        </div>
      </div>
    </div>
  )
}
