'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Knowledge Covers the Earth
        </h1>
        <p className="text-lg md:text-xl text-charcoal/80 mb-8">
          Rekindling reading culture to inspire consistent personal growth.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/catalog" className="px-5 py-3 rounded-2xl bg-terracotta text-white shadow-soft">
            Browse Books
          </Link>
          <Link href="/club" className="px-5 py-3 rounded-2xl bg-beige text-charcoal shadow-soft">
            Join Book Club
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
