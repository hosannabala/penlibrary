'use client'
import { useEffect, useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import { getAllBooks } from '@/lib/db'
import type { Book } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="section-divider-heading">
      <span className="text-lg font-bold tracking-[0.15em] uppercase text-charcoal">
        {title}
      </span>
    </div>
  )
}

function CategoryPromoBanner({ books }: { books: Book[] }) {
  const coverBooks = books.filter(b => b.coverUrl).slice(0, 4)

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 my-12 overflow-hidden" style={{ backgroundColor: '#1E3777' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 flex flex-col md:flex-row items-center gap-8">
        {/* Left text */}
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-xs font-semibold tracking-[0.3em] uppercase mb-3">
            Featured Collection
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
            Christian &amp; Motivational
          </h2>
          <p className="text-white/80 text-sm mb-6 max-w-xs">
            Grow through what you read. Explore our full Christian &amp; Motivational collection.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#F07A22' }}
          >
            SEE ALL →
          </Link>
        </div>

        {/* Right — book covers fan */}
        {coverBooks.length > 0 && (
          <div className="hidden md:flex items-end gap-3 shrink-0 h-44">
            {coverBooks.map((book, i) => {
              const rotations = [-8, -3, 3, 8]
              const heights = [120, 140, 140, 120]
              const widths = [80, 95, 95, 80]
              const mb = [20, 8, 8, 20]
              return (
                <Link
                  key={book.id}
                  href={`/catalog/${book.id}`}
                  className="relative shrink-0 shadow-xl hover:-translate-y-2 transition-transform duration-200"
                  style={{
                    width: widths[i],
                    height: heights[i],
                    transform: `rotate(${rotations[i]}deg)`,
                    marginBottom: mb[i],
                  }}
                >
                  <Image
                    src={book.coverUrl!}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function BookGrid({ items, isNew }: { items: Book[]; isNew?: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-8">
      {items.map(b => (
        <ProductCard key={b.id} book={b} isNew={isNew} />
      ))}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 animate-pulse">
          <div className="aspect-[2/3] bg-beige w-full" />
          <div className="h-3 bg-beige rounded w-1/2" />
          <div className="h-4 bg-beige rounded w-3/4" />
          <div className="h-3 bg-beige rounded w-1/3" />
          <div className="h-8 bg-beige rounded w-full mt-1" />
        </div>
      ))}
    </div>
  )
}

export default function HomeShowcase() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllBooks()
      .then(data => {
        setBooks(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const newArrivals = useMemo(() => {
    const sorted = [...books].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    return sorted.slice(0, 12)
  }, [books])

  const deals = useMemo(
    () => books.filter(b => typeof b.salePrice === 'number' && b.salePrice < b.price).slice(0, 12),
    [books]
  )
  const hot = useMemo(() => books.filter(b => b.featured).slice(0, 12), [books])
  const preOrders = useMemo(() => books.filter(b => b.preOrder).slice(0, 12), [books])
  const bestSellers = useMemo(() => books.filter(b => b.bestSeller).slice(0, 12), [books])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeading title="New Arrivals" />
        <SkeletonGrid />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {newArrivals.length > 0 && (
        <section>
          <SectionHeading title="New Arrivals" />
          <BookGrid items={newArrivals} isNew />
        </section>
      )}

      {deals.length > 0 && (
        <section className="mt-10">
          <SectionHeading title="Deals of the Day" />
          <BookGrid items={deals} />
        </section>
      )}

      {/* Full-width category promo banner */}
      <CategoryPromoBanner books={hot.length >= 4 ? hot : newArrivals} />

      {hot.length > 0 && (
        <section>
          <SectionHeading title="Hot" />
          <BookGrid items={hot} />
        </section>
      )}

      {preOrders.length > 0 && (
        <section className="mt-10">
          <SectionHeading title="Available on Pre-Order" />
          <BookGrid items={preOrders} />
        </section>
      )}

      {bestSellers.length > 0 && (
        <section className="mt-10 mb-12">
          <SectionHeading title="Best Selling Books" />
          <BookGrid items={bestSellers} />
        </section>
      )}
    </div>
  )
}
