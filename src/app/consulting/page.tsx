'use client'
import { useState } from 'react'
import { requestConsultation } from '../../lib/api'
import Link from 'next/link'
import { useSiteSettings } from '../../context/SiteSettingsContext'

const services = [
  {
    title: 'Reading Programs',
    body: 'We design and implement corporate and community reading programs tailored to your goals and audience.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    title: 'Seminars & Workshops',
    body: 'Transformative in-person and virtual workshops on leadership, personal development, and business growth.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: 'Business Consultation',
    body: 'Strategic advisory for organisations looking to integrate learning culture into their teams and operations.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    title: 'Event Management',
    body: 'End-to-end planning for literary events, book launches, and community reading initiatives.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
]

const steps = [
  { num: '01', title: 'Reach Out', body: 'Fill the form below or contact us directly via WhatsApp.' },
  { num: '02', title: 'Discovery Call', body: 'We schedule a call to understand your goals and context.' },
  { num: '03', title: 'Tailored Proposal', body: 'We send a custom plan and quote within 48 hours.' },
  { num: '04', title: 'Execution', body: 'We deliver — on time and to your standard.' },
]

export default function ConsultingPage() {
  const { phone } = useSiteSettings()
  const [form, setForm] = useState({ name: '', email: '', topic: '', notes: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      await requestConsultation(form)
      setStatus('done')
      setForm({ name: '', email: '', topic: '', notes: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      {/* Hero */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8" style={{ backgroundColor: '#1E3777' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-14 md:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-0.5" style={{ backgroundColor: '#F07A22' }} />
              <p className="text-white/50 text-xs font-semibold tracking-[0.3em] uppercase">Services</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
              Business Consulting
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              We help organisations and individuals build a culture of learning through curated programs, workshops, and strategic advisory.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Services */}
        <div className="mb-20">
          <div className="section-divider-heading mb-8">
            <span className="text-xl font-bold tracking-[0.12em] uppercase text-charcoal">What We Offer</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {services.map(s => (
              <div key={s.title} className="border border-[#EBEBEB] p-8 flex gap-5 hover:border-[#F07A22] transition-colors group">
                <div className="shrink-0 mt-0.5 text-charcoal/30 group-hover:text-[#F07A22] transition-colors">{s.icon}</div>
                <div>
                  <h3 className="font-bold text-charcoal mb-2">{s.title}</h3>
                  <p className="text-sm text-charcoal/60 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="mb-20" style={{ backgroundColor: '#FAFAFA', borderTop: '1px solid #EBEBEB', borderBottom: '1px solid #EBEBEB' }}>
          <div className="py-14 px-8">
            <div className="section-divider-heading mb-10">
              <span className="text-xl font-bold tracking-[0.12em] uppercase text-charcoal">How It Works</span>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
              {steps.map(step => (
                <div key={step.num}>
                  <p className="text-4xl font-bold mb-3" style={{ color: '#F07A22', opacity: 0.35 }}>{step.num}</p>
                  <h4 className="font-bold text-charcoal mb-2">{step.title}</h4>
                  <p className="text-sm text-charcoal/55 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="section-divider-heading mb-6">
              <span className="text-xl font-bold tracking-[0.12em] uppercase text-charcoal">Request a Consultation</span>
            </div>
            <p className="text-charcoal/60 text-sm leading-relaxed mb-8">
              Fill in the form and we&apos;ll be in touch within 24 hours. Prefer to chat? Reach us on WhatsApp directly.
            </p>
            <a
              href={`https://wa.me/${phone}?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20consulting%20services.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 text-white font-bold text-sm uppercase tracking-widest mb-4"
              style={{ backgroundColor: '#25D366' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chat on WhatsApp
            </a>
          </div>

          <div>
            {status === 'done' ? (
              <div className="border border-[#EBEBEB] p-10 text-center">
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#F07A22' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="font-bold text-charcoal text-lg mb-2">Request Received</h3>
                <p className="text-charcoal/60 text-sm">We&apos;ll be in touch within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-charcoal/50 mb-1.5">Full Name *</label>
                  <input
                    value={form.name}
                    onChange={set('name')}
                    required
                    placeholder="Your full name"
                    className="w-full border border-[#EBEBEB] px-4 py-3 text-sm focus:outline-none focus:border-charcoal text-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-charcoal/50 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    required
                    placeholder="you@example.com"
                    className="w-full border border-[#EBEBEB] px-4 py-3 text-sm focus:outline-none focus:border-charcoal text-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-charcoal/50 mb-1.5">Service *</label>
                  <select
                    value={form.topic}
                    onChange={set('topic')}
                    required
                    className="w-full border border-[#EBEBEB] px-4 py-3 text-sm focus:outline-none focus:border-charcoal text-charcoal bg-white"
                  >
                    <option value="">Select a service...</option>
                    {services.map(s => (
                      <option key={s.title} value={s.title}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-charcoal/50 mb-1.5">Additional Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={set('notes')}
                    rows={4}
                    placeholder="Tell us more about what you're looking for..."
                    className="w-full border border-[#EBEBEB] px-4 py-3 text-sm focus:outline-none focus:border-charcoal text-charcoal resize-none"
                  />
                </div>
                {status === 'error' && (
                  <p className="text-red-600 text-sm">Submission failed. Please try again or contact us via WhatsApp.</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="py-4 text-white font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: '#1E3777' }}
                >
                  {status === 'loading' ? 'Submitting...' : 'Send Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
