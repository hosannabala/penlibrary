'use client'
import { useState } from 'react'
import { requestConsultation } from '../../lib/api'

export default function ConsultingPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setStatus('loading')
      await requestConsultation({ name, email, topic, notes })
      setStatus('done')
      setName(''); setEmail(''); setTopic(''); setNotes('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h2 className="text-3xl font-bold mb-3">Business Consulting</h2>
        <p className="text-charcoal/70">Get tailored guidance for your reading programs, events, and community initiatives.</p>
      </div>
      <div className="max-w-xl mx-auto w-full">
        <form className="card p-6 grid gap-4 w-full max-w-full overflow-hidden" onSubmit={onSubmit}>
          <input className="border rounded-2xl p-3 w-full max-w-full" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="border rounded-2xl p-3 w-full max-w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="border rounded-2xl p-3 w-full max-w-full" placeholder="Topic" value={topic} onChange={e=>setTopic(e.target.value)} />
          <textarea className="border rounded-2xl p-3 w-full max-w-full" placeholder="Notes" rows={4} value={notes} onChange={e=>setNotes(e.target.value)} />
          <button className="w-full px-5 py-3 rounded-2xl bg-terracotta text-white font-medium hover:bg-terracotta/90 transition-colors" disabled={status==='loading'}>
            {status==='loading' ? 'Submitting...' : 'Request Consultation'}
          </button>
          {status==='done' && <div className="text-green-600 text-center">Request submitted. We will contact you.</div>}
          {status==='error' && <div className="text-red-600 text-center">Submission failed. Try again.</div>}
        </form>
      </div>
    </div>
  )
}
