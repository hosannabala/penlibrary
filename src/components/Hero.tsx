'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Book } from '@/lib/types'

export default function Hero() {
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('books')
          .select('id, title, cover_url')
          .not('cover_url', 'is', null)
          .eq('featured', true)
          .limit(3)
        const mapped = (data ?? []).map((r: any) => ({ id: r.id, title: r.title, coverUrl: r.cover_url } as Book))
        if (mapped.length > 0) {
          setBooks(mapped)
        } else {
          const { data: d2 } = await supabase.from('books').select('id, title, cover_url').not('cover_url', 'is', null).limit(3)
          setBooks((d2 ?? []).map((r: any) => ({ id: r.id, title: r.title, coverUrl: r.cover_url } as Book)))
        }
      } catch {}
    }
    load()
  }, [])

  return (
    <section
      className="-mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden relative"
      style={{ backgroundColor: '#1E3777' }}
    >
      {/* Orange top accent */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#F07A22' }} />

      {/* Subtle diagonal pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 50px)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 md:py-24 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-0.5" style={{ backgroundColor: '#F07A22' }} />
              <p className="text-white/50 text-xs font-semibold tracking-[0.3em] uppercase">
                Pen Library Services · Port Harcourt
              </p>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-[4.5rem] font-bold text-white leading-[1.05] mb-6 tracking-tight">
              Knowledge<br />
              <span style={{ color: '#F07A22' }}>Covers</span><br />
              the Earth
            </h1>

            <p className="text-white/55 text-base md:text-lg mb-10 max-w-sm leading-relaxed">
              Curated books for your growth — Christian, motivational, leadership &amp; more, delivered to your door.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 text-white font-bold text-sm uppercase tracking-widest px-6 sm:px-8 py-4 transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#F07A22' }}
              >
                Browse Books
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <Link
                href="/club"
                className="inline-flex items-center gap-2 border border-white/25 text-white font-bold text-sm uppercase tracking-widest px-6 sm:px-8 py-4 hover:border-white/60 transition-colors"
              >
                Join Book Club
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex items-center gap-4 sm:gap-8 mt-12 pt-8 border-t border-white/10">
              {[
                { value: '500+', label: 'Titles' },
                { value: 'Fast', label: 'Delivery' },
                { value: '100%', label: 'Secure' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4 sm:gap-8">
                  {i > 0 && <div className="w-px h-8 bg-white/10 -ml-4" />}
                  <div>
                    <p className="text-white font-bold text-xl leading-none">{stat.value}</p>
                    <p className="text-white/35 text-[11px] uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Book covers or abstract spines */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden md:flex items-end justify-center gap-5 h-[360px]"
          >
            {books.length > 0 ? (
              books.map((book, i) => (
                <Link
                  key={book.id}
                  href={`/catalog/${book.id}`}
                  className="relative shrink-0 shadow-2xl hover:-translate-y-3 transition-transform duration-300"
                  style={{
                    width: i === 1 ? 168 : 132,
                    height: i === 1 ? 252 : 204,
                    transform: `rotate(${i === 0 ? '-5deg' : i === 2 ? '5deg' : '0deg'})`,
                    marginBottom: i === 1 ? 0 : 28,
                    zIndex: i === 1 ? 10 : 5,
                  }}
                >
                  <Image src={book.coverUrl!} alt={book.title} fill className="object-cover" sizes="168px" />
                </Link>
              ))
            ) : (
              <div className="flex items-end gap-2.5">
                {[
                  { w: 48, h: 230, bg: '#F07A22', op: 0.9 },
                  { w: 58, h: 290, bg: '#ffffff', op: 0.12 },
                  { w: 44, h: 200, bg: '#F07A22', op: 0.55 },
                  { w: 52, h: 260, bg: '#ffffff', op: 0.08 },
                  { w: 38, h: 175, bg: '#F07A22', op: 0.35 },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="shrink-0 rounded-sm"
                    style={{ width: s.w, height: s.h, backgroundColor: s.bg, opacity: s.op }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
