import Link from 'next/link'

const values = [
  { label: 'Integrity', icon: '◆' },
  { label: 'Team-Spirit', icon: '◆' },
  { label: 'Discipline', icon: '◆' },
  { label: 'Dedication', icon: '◆' },
  { label: 'Diligence', icon: '◆' },
]

const pillars = [
  {
    title: 'Mission',
    body: 'To rekindle and promote a reading culture that inspires consistent personal growth in every individual we reach.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M2 12l5-5 5 5-5 5Z M12 12l5-5 5 5-5 5Z" />
      </svg>
    ),
  },
  {
    title: 'Vision',
    body: 'To cause a paradigm shift and impact the world through books, seminars, workshops, travels, and consultation.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    title: 'Values',
    body: 'Everything we do is guided by Integrity, Team-Spirit, Discipline, Dedication and Diligence — without exception.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8" style={{ backgroundColor: '#1E3777' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-0.5" style={{ backgroundColor: '#F07A22' }} />
              <p className="text-white/50 text-xs font-semibold tracking-[0.3em] uppercase">Our Story</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
              About Pen Library Services
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              Founded in 2019 in Port Harcourt, we exist to put the right books in the right hands — and to build a community that grows together through reading.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Story */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="section-divider-heading mb-6">
              <span className="text-xl font-bold tracking-[0.12em] uppercase text-charcoal">Our Story</span>
            </div>
            <div className="space-y-4 text-charcoal/70 leading-relaxed">
              <p>
                Pen Library Services was founded on <strong className="text-charcoal">March 4, 2019</strong> (BN 2812026) in Okuru-Ama, Port Harcourt, Rivers State. What started as a passion for books became a mission to transform lives through reading.
              </p>
              <p>
                We saw a gap — quality Christian, motivational, business, and leadership books were hard to find locally, and reading culture was fading. We set out to change that.
              </p>
              <p>
                Today we serve readers across Nigeria with curated titles, a growing book club community, and professional consulting services — all rooted in our belief that <em className="text-charcoal font-medium">knowledge covers the earth</em>.
              </p>
            </div>
          </div>
          <div className="bg-[#F5F5F5] p-10 flex flex-col gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-charcoal/40 mb-1">Founded</p>
              <p className="text-2xl font-bold text-charcoal">March 4, 2019</p>
            </div>
            <div className="w-full h-px bg-charcoal/10" />
            <div>
              <p className="text-xs uppercase tracking-widest text-charcoal/40 mb-1">Registration</p>
              <p className="text-2xl font-bold text-charcoal">BN 2812026</p>
            </div>
            <div className="w-full h-px bg-charcoal/10" />
            <div>
              <p className="text-xs uppercase tracking-widest text-charcoal/40 mb-1">Location</p>
              <p className="text-2xl font-bold text-charcoal">Port Harcourt, Rivers State</p>
            </div>
          </div>
        </div>

        {/* Mission / Vision / Values */}
        <div className="mb-20">
          <div className="section-divider-heading mb-8">
            <span className="text-xl font-bold tracking-[0.12em] uppercase text-charcoal">What Drives Us</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map(p => (
              <div key={p.title} className="border border-[#EBEBEB] p-8 flex flex-col gap-4">
                <div style={{ color: '#F07A22' }}>{p.icon}</div>
                <h3 className="text-lg font-bold uppercase tracking-wide text-charcoal">{p.title}</h3>
                <p className="text-charcoal/65 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-20" style={{ backgroundColor: '#1E3777' }}>
          <div className="p-10 md:p-14 text-center">
            <p className="text-white/50 text-xs font-semibold tracking-[0.3em] uppercase mb-4">Core Values</p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {values.map(v => (
                <span key={v.label} className="text-white font-bold text-sm uppercase tracking-widest px-6 py-3 border border-white/20">
                  {v.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-charcoal/50 text-sm mb-6">Ready to start reading?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/catalog"
              className="px-8 py-4 text-white font-bold uppercase tracking-widest text-sm"
              style={{ backgroundColor: '#F07A22' }}
            >
              Browse Books
            </Link>
            <Link
              href="/club"
              className="px-8 py-4 border border-charcoal/20 text-charcoal font-bold uppercase tracking-widest text-sm hover:border-charcoal transition-colors"
            >
              Join Book Club
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
