'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePaystackPayment } from 'react-paystack'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import type { Order } from '../lib/types'

export default function CheckoutForm() {
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const SHIPPING_FEE = 1500
  const finalTotal = deliveryMethod === 'delivery' ? total + SHIPPING_FEE : total

  // Prefill email if user is logged in
  useEffect(() => {
    if (user?.email) setEmail(user.email)
    if (user?.displayName) setName(user.displayName)
    
    // Debug Paystack Key
    if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
        console.error('Paystack Key Missing in Client!')
    } else {
        console.log('Paystack Key Loaded:', process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.slice(0, 10) + '...')
    }
  }, [user])

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !success) {
      router.push('/cart')
    }
  }, [items, router, success])

  const config = {
    reference: (new Date()).getTime().toString(),
    email,
    amount: Math.round(finalTotal * 100), // Amount is in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    metadata: {
              name,
              phone,
              address: deliveryMethod === 'delivery' ? address : 'Pickup',
              uid: user?.uid,
              items: items.map(item => ({
                book: {
                  id: item.book.id,
                  title: item.book.title,
                  author: item.book.author,
                  category: item.book.category,
                  price: item.book.price,
                  coverUrl: item.book.coverUrl,
                  stock: item.book.stock
                },
                quantity: item.quantity
              })),
              custom_fields: [
                {
                  display_name: "Phone Number",
                  variable_name: "phone",
                  value: phone
                },
        {
          display_name: "Delivery Method",
          variable_name: "delivery_method",
          value: deliveryMethod
        },
        {
          display_name: "Shipping Address",
          variable_name: "shipping_address",
          value: deliveryMethod === 'delivery' ? address : 'Pickup'
        }
      ]
    },
  }

  const initializePayment = usePaystackPayment(config)

  const [isVerifying, setIsVerifying] = useState(false)

  const onSuccess = async (reference: any) => {
    console.log('Paystack onSuccess called with:', reference)
    // IMMEDIATELY show full screen processing state
    // This hides the form so the user doesn't see "input payment details"
    setIsVerifying(true) 
    setLoading(true)
    setError('')
    
    try {
      console.log('Verifying payment with server...')
      // Server-side verification and order creation
      const res = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reference: reference.reference,
            userId: user?.uid,
            orderData: {
                items,
                total: finalTotal,
                customerName: name,
                customerEmail: email,
                shippingAddress: deliveryMethod === 'delivery' ? address : 'Pickup',
                deliveryMethod,
                status: 'pending'
            }
        })
      })

      console.log('Server response status:', res.status)
      const data = await res.json()
      console.log('Server response data:', data)

      if (!res.ok) {
          throw new Error(data.error || 'Payment verification failed')
      }
      
      console.log('Verification successful! Clearing cart and setting success.')
      clearCart()
      setSuccess(true)
      // Note: isVerifying stays true until success takes over rendering
      
    } catch (err: any) {
      console.error('Order creation failed:', err)
      setError(err.message || 'Payment successful but order creation failed. Please contact support with reference: ' + reference.reference)
      setIsVerifying(false) // Allow them to see error
    } finally {
      setLoading(false)
    }
  }

  // Redirect effect
  useEffect(() => {
    if (success) {
        // Instant redirect attempts
        router.push('/dashboard')
        
        // Backup
        const timer = setTimeout(() => {
            window.location.href = '/dashboard'
        }, 1000)
        return () => clearTimeout(timer)
    }
  }, [success, router])

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-terracotta mb-4">Order Confirmed!</h2>
        <p className="text-charcoal/60 mb-8">Thank you for your purchase. Redirecting you to your dashboard...</p>
        
        <div className="flex flex-col gap-3 justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
        </div>
      </div>
    )
  }

  if (isVerifying) {
      return (
        <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-terracotta mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-charcoal mb-2">Processing Payment...</h2>
            <p className="text-charcoal/60">Please wait while we confirm your order.</p>
        </div>
      )
  }

  const onClose = () => {
    console.log('Payment closed')
  }

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name || (deliveryMethod === 'delivery' && !address) || !phone) {
      setError('Please fill in all fields')
      return
    }
    
    if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
        setError('Paystack public key is missing in environment variables.')
        return
    }

    // @ts-ignore - react-paystack types are sometimes inconsistent
    initializePayment(onSuccess, onClose)
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-4 text-charcoal">Order Confirmed!</h2>
        <p className="text-charcoal/70 mb-8">
          Redirecting to your dashboard...
        </p>
        <div className="flex flex-col gap-3 justify-center items-center">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 bg-terracotta text-white rounded-xl shadow-soft hover:shadow-lg transition-all"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="text-sm text-charcoal/60 hover:text-terracotta underline"
            >
              Click here if not redirected
            </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-charcoal">Checkout</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-offwhite p-6 rounded-2xl h-fit">
          <h2 className="text-xl font-bold mb-4 text-charcoal">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.book.id} className="flex justify-between items-center text-sm">
                <span className="text-charcoal/80">
                  {item.quantity}x {item.book.title}
                </span>
                <span className="font-medium">
                  ₦{(item.book.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-beige pt-4 space-y-2 mb-4">
            <div className="flex justify-between text-sm text-charcoal/70">
                <span>Subtotal</span>
                <span>₦{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-charcoal/70">
                <span>Shipping</span>
                <span>{deliveryMethod === 'delivery' ? `₦${SHIPPING_FEE.toLocaleString()}` : 'Free'}</span>
            </div>
          </div>

          <div className="border-t border-beige pt-4 flex justify-between items-center font-bold text-lg">
            <span>Total</span>
            <span className="text-terracotta">₦{finalTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Shipping Form */}
        <form onSubmit={handlePay} className="space-y-4">
          <div className="flex gap-4 p-1 bg-offwhite rounded-xl mb-6">
            <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    deliveryMethod === 'delivery' ? 'bg-terracotta text-white shadow-sm' : 'text-charcoal/60 hover:text-charcoal'
                }`}
            >
                Delivery
            </button>
            <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    deliveryMethod === 'pickup' ? 'bg-terracotta text-white shadow-sm' : 'text-charcoal/60 hover:text-charcoal'
                }`}
            >
                Pickup
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal/70 mb-1">Full Name</label>
            <input 
              required
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta transition-colors"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal/70 mb-1">Email Address</label>
            <input 
              required
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta transition-colors"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal/70 mb-1">Phone Number</label>
            <input 
              required
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta transition-colors"
              placeholder="+234..."
            />
          </div>

          {deliveryMethod === 'delivery' && (
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Shipping Address</label>
                <textarea 
                  required
                  rows={3}
                  value={address} 
                  onChange={e => setAddress(e.target.value)}
                  className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta transition-colors"
                  placeholder="Delivery address..."
                />
              </div>
          )}
          
          {deliveryMethod === 'pickup' && (
              <div className="p-4 bg-beige/20 rounded-xl text-sm text-charcoal/80">
                  <p className="font-semibold mb-1">Pickup Location:</p>
                  <p>Pen Library Services, [Insert Address Here]</p>
                  <p className="mt-2 text-xs text-charcoal/60">Please bring your order confirmation when picking up.</p>
              </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || items.length === 0}
            className="w-full py-4 bg-terracotta text-white rounded-xl font-bold shadow-soft hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Processing...' : `Pay ₦${finalTotal.toLocaleString()}`}
          </button>
          
          <p className="text-xs text-center text-charcoal/50 mt-4">
            Secured by Paystack. Your card details are processed securely.
          </p>
        </form>
      </div>
    </div>
  )
}