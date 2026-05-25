'use client'
import { useState } from 'react'
import { useSiteSettings } from '../../context/SiteSettingsContext'

export default function ContactPage() {
  const { email, phone, address, instagram_url } = useSiteSettings()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'done'>('idle')

  const contactInfo = [
    {
      label: 'Address',
      value: address,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      ),
    },
    {
      label: 'Email',
      value: email,
      href: `mailto:${email}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
    },
    ...(phone ? [{
      label: 'Phone / WhatsApp',
      value: `+${phone}`,
      href: `https://wa.me/${phone}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.08 4.18 2 2 0 0 1 5.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
    }] : []),
    ...(instagram_url ? [{
      label: 'Instagram',
      value: `@${instagram_url.replace(/.*instagram\.com\//, '').replace(/\/$/, '')}`,
      href: instagram_url,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
        </svg>
      ),
    }] : []),
  ]

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = encodeURIComponent(
      `Hi, my name is ${form.name} (${form.email}).\n\n${form.message}`
    )
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
    setStatus('done')
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <>
      {/* Hero */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8" style={{ backgroundColor: '#1E3777' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-14 md:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-0.5" style={{ backgroundColor: '#F07A22' }} />
              <p className="text-white/50 text-xs font-semibold tracking-[0.3em] uppercase">Get in Touch</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
              Contact Us
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              We&apos;re based in Port Harcourt and happy to help — whether it&apos;s a book order question, consulting inquiry, or just a hello.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">

          {/* Contact info */}
          <div>
            <div className="section-divider-heading mb-8">
              <span className="text-xl font-bold tracking-[0.12em] uppercase text-charcoal">Find Us</span>
            </div>

            <div className="space-y-6 mb-10">
              {contactInfo.map(c => (
                <div key={c.label} className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 border border-[#EBEBEB] flex items-center justify-center text-charcoal/40 mt-0.5">
                    {c.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-charcoal/40 mb-1">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-sm text-charcoal hover:text-[#F07A22] transition-colors font-medium">
                        {c.value}
                      </a>
                    ) : (
                      <p className="text-sm text-charcoal font-medium">{c.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-4 text-white font-bold text-sm uppercase tracking-widest"
              style={{ backgroundColor: '#25D366' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          {/* Form */}
          <div>
            <div className="section-divider-heading mb-8">
              <span className="text-xl font-bold tracking-[0.12em] uppercase text-charcoal">Send a Message</span>
            </div>

            {status === 'done' ? (
              <div className="border border-[#EBEBEB] p-10 text-center">
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#25D366' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 className="font-bold text-charcoal text-lg mb-2">Message Opened in WhatsApp</h3>
                <p className="text-charcoal/60 text-sm">We&apos;ll respond as soon as possible during business hours.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-charcoal/50 mb-1.5">Your Name *</label>
                  <input
                    value={form.name}
                    onChange={set('name')}
                    required
                    placeholder="Full name"
                    className="w-full border border-[#EBEBEB] px-4 py-3 text-sm focus:outline-none focus:border-charcoal text-charcoal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-charcoal/50 mb-1.5">Email *</label>
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
                  <label className="block text-xs font-bold uppercase tracking-wide text-charcoal/50 mb-1.5">Message *</label>
                  <textarea
                    value={form.message}
                    onChange={set('message')}
                    required
                    rows={5}
                    placeholder="How can we help you?"
                    className="w-full border border-[#EBEBEB] px-4 py-3 text-sm focus:outline-none focus:border-charcoal text-charcoal resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="py-4 text-white font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-90 flex items-center justify-center gap-3"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Send via WhatsApp
                </button>
                <p className="text-xs text-charcoal/40 text-center">
                  Clicking send will open WhatsApp with your message pre-filled.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
