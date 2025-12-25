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
    <div className="py-12">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h2 className="text-3xl font-bold mb-3">Business Consulting</h2>
        <p className="text-charcoal/70">Get tailored guidance for your reading programs, events, and community initiatives.</p>
      </div>
      <div className="max-w-xl mx-auto">
        <form className="card p-6 grid gap-4" onSubmit={onSubmit}>
          <input className="border rounded-2xl p-3" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="border rounded-2xl p-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="border rounded-2xl p-3" placeholder="Topic" value={topic} onChange={e=>setTopic(e.target.value)} />
          <textarea className="border rounded-2xl p-3" placeholder="Notes" rows={4} value={notes} onChange={e=>setNotes(e.target.value)} />
          <button className="px-5 py-3 rounded-2xl bg-terracotta text-white" disabled={status==='loading'}>
            {status==='loading' ? 'Submitting...' : 'Request Consultation'}
          </button>
          {status==='done' && <div className="text-green-600">Request submitted. We will contact you.</div>}
          {status==='error' && <div className="text-red-600">Submission failed. Try again.</div>}
        </form>
      </div>
    </div>
  )
}
