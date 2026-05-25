'use client'
import { useState } from 'react'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // silently continue — user sees success regardless to avoid enumeration
    }
    setStatus('success')
    setEmail('')
  }

  return (
    <section style={{ backgroundColor: '#1E3777' }} className="-mx-4 sm:-mx-6 lg:-mx-8 py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <p style={{ color: '#F07A22' }} className="text-xs font-bold uppercase tracking-widest mb-4">
          Stay in the loop
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
          New arrivals &amp; reading picks<br className="hidden sm:block" /> straight to your inbox
        </h2>
        <p className="text-white/60 text-sm mb-10">No spam. Just books worth reading.</p>
        {status === 'success' ? (
          <p className="text-white font-semibold text-lg">
            You&apos;re subscribed! Welcome to the community.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto shadow-2xl">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-1 px-5 py-4 text-sm focus:outline-none text-charcoal placeholder:text-charcoal/40"
            />
            <button
              type="submit"
              style={{ backgroundColor: '#F07A22' }}
              className="hover:opacity-90 text-white font-bold uppercase tracking-widest text-xs px-8 py-4 transition-opacity whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
