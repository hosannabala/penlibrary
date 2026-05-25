'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../../../context/CartContext'
import { useAuth } from '../../../context/AuthContext'

type Step = 'verifying' | 'complete' | 'error'

function CallbackHandler() {
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('verifying')
  const [error, setError] = useState('')
  const [orderRef, setOrderRef] = useState('')

  useEffect(() => {
    const reference = searchParams.get('orderReference')
    if (!reference) {
      setError('No order reference found. If you completed payment, contact support.')
      setStep('error')
      return
    }
    setOrderRef(reference)

    fetch('/api/orders/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success || data.message?.includes('confirmed')) {
          clearCart()
          setStep('complete')
        } else {
          throw new Error(data.error || 'Verification failed')
        }
      })
      .catch(err => {
        setError(
          (err.message ?? 'Payment received but verification failed.') +
          ` Save your reference: ${reference}`,
        )
        setStep('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (step === 'verifying') {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-terracotta mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-charcoal mb-2">Confirming your order...</h2>
        <p className="text-charcoal/60">Please don&apos;t close this page.</p>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="max-w-lg mx-auto py-20 text-center px-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-charcoal mb-3">Something went wrong</h2>
        <p className="text-sm text-charcoal/60 mb-6">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="px-6 py-3 border border-charcoal/20 text-charcoal font-semibold uppercase tracking-wide text-sm hover:border-terracotta hover:text-terracotta transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-20 text-center px-4">
      <div className="flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wider mb-12">
        <span className="text-charcoal/40">Shopping Cart</span>
        <span className="text-charcoal/25">›</span>
        <span className="text-charcoal/40">Checkout Details</span>
        <span className="text-charcoal/25">›</span>
        <span className="text-terracotta">Order Complete</span>
      </div>

      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-3xl font-bold text-terracotta mb-3">Order Confirmed!</h2>
      <p className="text-charcoal/60 mb-2">Thank you for your purchase.</p>
      <p className="text-sm text-charcoal/50 mb-8">
        Order reference: <span className="font-semibold text-charcoal">{orderRef}</span>
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {user ? (
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-terracotta text-white font-bold uppercase tracking-wide text-sm hover:bg-terracotta/90 transition-colors"
          >
            View My Orders
          </Link>
        ) : (
          <div className="px-5 py-4 bg-charcoal/5 rounded-xl text-xs text-charcoal/60 text-center max-w-xs mx-auto">
            Save your reference number to track your order.
          </div>
        )}
        <Link
          href="/catalog"
          className="px-6 py-3 border border-charcoal/20 text-charcoal font-semibold uppercase tracking-wide text-sm hover:border-terracotta hover:text-terracotta transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-charcoal/50">Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  )
}
