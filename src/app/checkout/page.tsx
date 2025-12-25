'use client'
import { useState } from 'react'
import { initializeCheckout } from '../../lib/api'

export default function CheckoutPage() {
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState<number>(5000)
  const [authUrl, setAuthUrl] = useState<string>('')
  const [error, setError] = useState<string>('')

  async function onPay(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setAuthUrl('')
    try {
      const res = await initializeCheckout({
        email,
        amount: Math.round(amount * 100),
        metadata: { uid: 'anonymous', items: [] }
      })
      const url = res?.data?.authorization_url
      if (url) setAuthUrl(url)
      else setError('Payment init failed')
    } catch (err: any) {
      setError(err?.message || 'Payment init failed')
    }
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-semibold mb-4">Checkout</h2>
      <form className="card p-4 grid gap-3 max-w-md" onSubmit={onPay}>
        <input className="border rounded-2xl p-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border rounded-2xl p-3" placeholder="Amount (NGN)" type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
        <button className="px-5 py-3 rounded-2xl bg-terracotta text-white">Pay with Paystack</button>
      </form>
      {authUrl && (
        <a className="block mt-4 text-terracotta" href={authUrl} target="_blank" rel="noreferrer">
          Continue to Paystack
        </a>
      )}
      {error && <div className="mt-4 text-red-600">{error}</div>}
    </div>
  )
}
