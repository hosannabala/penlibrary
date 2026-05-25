'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { supabase } from '../lib/supabase'
import { createPendingOrderAction } from '../app/actions/orders'
import type { Book } from '../lib/types'

function effectivePrice(book: Book) {
  return typeof book.salePrice === 'number' && book.salePrice < book.price
    ? book.salePrice : book.price
}


type Courier = {
  courierId: number
  serviceCode: string
  name: string
  fee: number
  deliveryEta: string
}

const FLAT_RATE_FALLBACK: Courier = {
  courierId: 0,
  serviceCode: 'flat-rate',
  name: 'Standard Delivery',
  fee: 2500,
  deliveryEta: '3–5 business days',
}

type Stage = 'form' | 'verifying' | 'complete'

export default function CheckoutForm() {
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const { pickup_address: PICKUP_ADDRESS } = useSiteSettings()

  const [stage, setStage] = useState<Stage>('form')
  const [orderRef, setOrderRef] = useState('')

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  // Shipbubble live rates
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null)
  const [requestToken, setRequestToken] = useState('')
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesError, setRatesError] = useState('')

  const [createAccount, setCreateAccount] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fullAddress = [street, city, state ? `${state} State` : '', 'Nigeria'].filter(Boolean).join(', ')
  const shippingFee = deliveryMethod === 'delivery' ? (selectedCourier?.fee ?? 0) : 0
  const finalTotal = total + shippingFee

  // Load Paystack inline script once
  useEffect(() => {
    if (document.getElementById('paystack-script')) return
    const script = document.createElement('script')
    script.id = 'paystack-script'
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (user?.email) setEmail(user.email)
    if (user?.displayName) setName(user.displayName)
  }, [user])

  async function fetchShippingRates() {
    if (!street || !city || !state || !name || !phone) {
      setRatesError('Please fill in your name, phone, street, city and state first.')
      return
    }
    setRatesLoading(true)
    setRatesError('')
    setCouriers([])
    setSelectedCourier(null)
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerAddress: fullAddress,
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not fetch rates')
      const liveCouriers: Courier[] = data.couriers ?? []
      if (liveCouriers.length > 0) {
        setCouriers(liveCouriers)
        setRequestToken(data.requestToken ?? '')
        setSelectedCourier(liveCouriers[0])
      } else {
        setCouriers([FLAT_RATE_FALLBACK])
        setSelectedCourier(FLAT_RATE_FALLBACK)
        setRatesError('No couriers available for this route — standard rate applied.')
      }
    } catch {
      setCouriers([FLAT_RATE_FALLBACK])
      setSelectedCourier(FLAT_RATE_FALLBACK)
      setRatesError('Live rates unavailable — standard delivery rate of ₦2,500 applied.')
    } finally {
      setRatesLoading(false)
    }
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !name || !phone) {
      setError('Please fill in all required fields.')
      return
    }
    if (deliveryMethod === 'delivery' && (!street || !city || !state)) {
      setError('Please enter your full shipping address (street, city and state).')
      return
    }
    if (deliveryMethod === 'delivery' && !selectedCourier) {
      setError('Please get shipping rates and select a courier before paying.')
      return
    }
    if (!agreed) {
      setError('Please agree to the Terms & Conditions to proceed.')
      return
    }
    if (createAccount && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (createAccount && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (!(window as any).PaystackPop) {
      setError('Payment system is still loading. Please wait a moment and try again.')
      return
    }

    setLoading(true)

    try {
      const shippingAddress = deliveryMethod === 'delivery' ? fullAddress : PICKUP_ADDRESS

      // Create pending order in DB first
      const reference = await createPendingOrderAction({
        userId: user?.uid ?? null,
        items,
        total: finalTotal,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        deliveryMethod,
        shippingAddress,
        shippingFee,
        courierName: selectedCourier?.name ?? null,
      })

      // Optional account creation — fire-and-forget
      if (createAccount && password && !user) {
        supabase.auth.signUp({ email, password }).catch(() => {})
      }

      // Open Paystack popup — callback must be a plain (non-async) function
      const handler = (window as any).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email,
        amount: finalTotal * 100, // kobo
        ref: reference,
        currency: 'NGN',
        metadata: {
          custom_fields: [
            { display_name: 'Phone', variable_name: 'phone', value: phone },
            { display_name: 'Delivery Method', variable_name: 'delivery_method', value: deliveryMethod },
          ],
        },
        callback: (response: { reference: string }) => {
          setStage('verifying')
          fetch('/api/orders/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: response.reference }),
          })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
              if (!ok) throw new Error(data.error || 'Verification failed')
              setOrderRef(reference)
              clearCart()
              setStage('complete')
            })
            .catch((err: any) => {
              setError(
                `Payment received but order update failed. Please contact us with your reference: ${reference}. Error: ${err.message}`
              )
              setStage('form')
              setLoading(false)
            })
        },
        onClose: () => {
          setLoading(false)
        },
      })

      handler.openIframe()
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // ── Verifying screen ────────────────────────────────────────────────────────
  if (stage === 'verifying') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <svg className="animate-spin h-10 w-10 text-terracotta" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
        </svg>
        <p className="text-lg font-bold text-charcoal">Confirming your payment…</p>
        <p className="text-sm text-charcoal/50">Please do not close this page.</p>
      </div>
    )
  }

  // ── Order complete screen ────────────────────────────────────────────────────
  if (stage === 'complete') {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-charcoal mb-2">Order Confirmed!</h1>
        <p className="text-charcoal/60 text-sm mb-1">
          Your order has been placed and is being processed.
        </p>
        <p className="text-xs text-charcoal/40 mb-6">
          Reference: <span className="font-mono font-bold text-charcoal">{orderRef}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {user ? (
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-terracotta text-white font-bold text-sm uppercase tracking-wide hover:bg-terracotta/90 transition-colors"
            >
              View My Orders
            </Link>
          ) : (
            <p className="text-xs text-charcoal/50 px-4">
              Save your reference number above to track your order.
            </p>
          )}
          <Link
            href="/catalog"
            className="px-6 py-3 border border-beige text-charcoal font-bold text-sm uppercase tracking-wide hover:bg-offwhite transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  // ── Checkout form ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-10 overflow-x-auto whitespace-nowrap pb-1">
        <Link href="/cart" className="text-charcoal/50 hover:text-terracotta transition-colors shrink-0">Cart</Link>
        <span className="text-charcoal/30 shrink-0">›</span>
        <span className="text-terracotta shrink-0">Checkout</span>
        <span className="text-charcoal/30 shrink-0">›</span>
        <span className="text-charcoal/40 shrink-0">Complete</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* Left — Billing Form */}
        <form onSubmit={handlePay} className="lg:col-span-3 space-y-6">

          {/* Contact */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Email Address *</label>
                <input
                  required type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-beige rounded-xl text-sm focus:outline-none focus:border-terracotta transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Phone Number *</label>
                <input
                  required type="tel" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-beige rounded-xl text-sm focus:outline-none focus:border-terracotta transition-colors"
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
          </div>

          {/* Delivery method */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-4">Delivery Method</h2>
            <div className="flex gap-1 p-1 bg-offwhite border border-beige rounded-xl">
              {(['delivery', 'pickup'] as const).map(method => (
                <button
                  key={method} type="button"
                  onClick={() => setDeliveryMethod(method)}
                  className={`flex-1 py-3.5 text-sm font-bold uppercase tracking-wide transition-all ${
                    deliveryMethod === method ? 'bg-terracotta text-white shadow-sm' : 'text-charcoal/60 hover:text-charcoal'
                  }`}
                >
                  {method === 'delivery' ? '🚚 Delivery' : '🏪 Free Pickup'}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-4">
              {deliveryMethod === 'delivery' ? 'Shipping Address' : 'Pickup Location'}
            </h2>
            {deliveryMethod === 'delivery' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Full Name *</label>
                  <input
                    required type="text" value={name}
                    onChange={e => { setName(e.target.value); setCouriers([]); setSelectedCourier(null) }}
                    className="w-full px-4 py-3 border border-beige rounded-xl text-sm focus:outline-none focus:border-terracotta transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Street Address *</label>
                  <input
                    required type="text" value={street}
                    onChange={e => { setStreet(e.target.value); setCouriers([]); setSelectedCourier(null) }}
                    className="w-full px-4 py-3 border border-beige rounded-xl text-sm focus:outline-none focus:border-terracotta transition-colors"
                    placeholder="e.g. 12 Aba Road, GRA Phase 2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">City *</label>
                    <input
                      required type="text" value={city}
                      onChange={e => { setCity(e.target.value); setCouriers([]); setSelectedCourier(null) }}
                      className="w-full px-4 py-3 border border-beige rounded-xl text-sm focus:outline-none focus:border-terracotta transition-colors"
                      placeholder="e.g. Port Harcourt"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">State *</label>
                    <select
                      required value={state}
                      onChange={e => { setState(e.target.value); setCouriers([]); setSelectedCourier(null) }}
                      className="w-full px-4 py-3 border border-beige rounded-xl text-sm focus:outline-none focus:border-terracotta transition-colors bg-white"
                    >
                      <option value="">Select state</option>
                      {['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {fullAddress && (
                  <p className="text-xs text-charcoal/50 px-1">Shipping to: <span className="font-medium text-charcoal">{fullAddress}</span></p>
                )}

                <button
                  type="button"
                  onClick={fetchShippingRates}
                  disabled={ratesLoading}
                  className="w-full py-2.5 border-2 border-terracotta text-terracotta text-sm font-bold uppercase tracking-wide hover:bg-terracotta/5 transition-colors disabled:opacity-50"
                >
                  {ratesLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                      </svg>
                      Getting rates...
                    </span>
                  ) : couriers.length > 0 ? 'Refresh Shipping Rates' : 'Get Shipping Rates'}
                </button>

                {ratesError && (
                  <p className={`text-xs px-1 ${ratesError.includes('unavailable') || ratesError.includes('applied') ? 'text-amber-600' : 'text-red-500'}`}>
                    {ratesError}
                  </p>
                )}

                {couriers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide">Select Courier</p>
                    {couriers.map(c => (
                      <label
                        key={c.serviceCode}
                        className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${
                          selectedCourier?.serviceCode === c.serviceCode
                            ? 'border-terracotta bg-terracotta/5'
                            : 'border-beige hover:border-terracotta/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio" name="courier"
                            checked={selectedCourier?.serviceCode === c.serviceCode}
                            onChange={() => setSelectedCourier(c)}
                            className="accent-terracotta"
                          />
                          <div>
                            <p className="text-sm font-semibold text-charcoal">{c.name}</p>
                            {c.deliveryEta && <p className="text-xs text-charcoal/50">{c.deliveryEta}</p>}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-terracotta">₦{c.fee.toLocaleString()}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Full Name *</label>
                  <input
                    required type="text" value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-beige rounded-xl text-sm focus:outline-none focus:border-terracotta transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div className="p-4 bg-beige/30 border border-beige rounded-xl text-sm">
                  <p className="font-semibold mb-1 text-charcoal">Pickup Location</p>
                  <p className="text-charcoal/70">{PICKUP_ADDRESS}</p>
                  <p className="mt-2 text-xs text-charcoal/50">Bring your order confirmation when picking up.</p>
                </div>
              </div>
            )}
          </div>

          {/* Optional account creation */}
          {!user && (
            <div className="border border-beige rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox" checked={createAccount}
                  onChange={e => setCreateAccount(e.target.checked)}
                  className="mt-0.5 accent-terracotta"
                />
                <span className="text-sm text-charcoal/70">
                  <span className="font-semibold text-charcoal">Save my details for faster checkout next time</span>
                  <br />
                  <span className="text-xs">Creates a free account with your email address.</span>
                </span>
              </label>
              {createAccount && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Password *</label>
                    <input
                      type="password" value={password} minLength={6}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-beige rounded-xl text-sm focus:outline-none focus:border-terracotta transition-colors"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Confirm Password *</label>
                    <input
                      type="password" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-beige rounded-xl text-sm focus:outline-none focus:border-terracotta transition-colors"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox" checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 accent-terracotta"
            />
            <span className="text-sm text-charcoal/70">
              I agree to the{' '}
              <Link href={'/terms' as any} className="text-terracotta hover:underline">Terms & Conditions</Link>
              {' '}and{' '}
              <Link href={'/privacy' as any} className="text-terracotta hover:underline">Privacy Policy</Link>.
            </span>
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-4 bg-terracotta text-white font-bold uppercase tracking-widest text-sm hover:bg-terracotta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                </svg>
                Opening payment…
              </span>
            ) : (
              `Pay ₦${finalTotal.toLocaleString()}`
            )}
          </button>

          <p className="text-xs text-center text-charcoal/40">
            Secured by Paystack · Your payment details are encrypted and never stored by us.
          </p>
        </form>

        {/* Right — Order Summary */}
        <div className="lg:col-span-2">
          <div className="border border-beige rounded-2xl p-6 sticky top-24">
            <h2 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-5">Order Summary</h2>

            <div className="space-y-3 mb-5">
              {items.map(item => {
                const price = effectivePrice(item.book)
                return (
                  <div key={item.book.id} className="flex justify-between items-start gap-3 text-sm">
                    <span className="text-charcoal/70 line-clamp-2 flex-1 leading-snug">
                      {item.book.title}
                      <span className="text-charcoal/40"> ×{item.quantity}</span>
                    </span>
                    <span className="font-semibold text-charcoal shrink-0">
                      ₦{(price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-beige pt-4 space-y-2">
              <div className="flex justify-between text-sm text-charcoal/60">
                <span>Subtotal</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-charcoal/60">
                <span>Shipping</span>
                <span>
                  {deliveryMethod === 'pickup'
                    ? 'Free (Pickup)'
                    : selectedCourier
                      ? `₦${shippingFee.toLocaleString()}`
                      : <span className="italic text-xs">Select courier above</span>}
                </span>
              </div>
            </div>

            <div className="border-t border-beige mt-3 pt-4 flex justify-between font-bold text-base">
              <span className="text-charcoal">Total</span>
              <span className="text-terracotta text-lg">₦{finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
