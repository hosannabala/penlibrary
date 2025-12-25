'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getAllBooks } from '../../lib/db'
import type { Book } from '../../lib/types'

export default function CatalogPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const data = await getAllBooks()
      setBooks(data)
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div className="py-8">
      <h2 className="text-2xl font-semibold mb-6">Catalog</h2>
      
      {loading ? (
        <div className="text-center py-20 text-charcoal/50">Loading library...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.length > 0 ? (
            books.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/catalog/${b.id}`} className="card h-full flex flex-col overflow-hidden hover:shadow-lg transition-all group">
                  <div className="aspect-[2/3] bg-beige relative overflow-hidden">
                    {b.coverUrl ? (
                      <Image 
                        src={b.coverUrl} 
                        alt={b.title} 
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-charcoal/20 font-bold text-4xl">
                        {b.title[0]}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="font-semibold line-clamp-1 mb-1" title={b.title}>{b.title}</div>
                    <div className="text-sm text-charcoal/70 mb-2">{b.author}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="font-medium text-terracotta">₦{b.price.toLocaleString()}</div>
                      <div className="text-[10px] uppercase tracking-wider px-2 py-1 bg-offwhite rounded-md border border-beige/50">{b.category}</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-offwhite rounded-3xl">
              <p className="text-charcoal/50 mb-4">No books found in the library yet.</p>
              <Link href="/admin" className="text-terracotta hover:underline">Go to Admin to add books</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
