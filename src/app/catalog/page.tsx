'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getAllBooks, getAllCategories } from '../../lib/db'
import type { Book, Category } from '../../lib/types'
import ProductCard from '@/components/ProductCard'

function CatalogContent() {
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'latest' | 'price-asc' | 'price-desc'>('latest')
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.toLowerCase().trim() ?? ''
  const category = searchParams.get('category')?.toLowerCase().trim() ?? ''
  const urlSort = searchParams.get('sort') ?? ''          // newest | bestseller | deals
  const preorder = searchParams.get('preorder') === 'true'

  useEffect(() => {
    Promise.allSettled([getAllBooks(), getAllCategories()])
      .then(([booksRes, catsRes]) => {
        if (booksRes.status === 'fulfilled') setBooks(booksRes.value)
        if (catsRes.status === 'fulfilled') setCategories(catsRes.value)
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    let list = [...books]

    // URL-driven filters (from footer / nav links)
    if (preorder) {
      list = list.filter(b => b.preOrder)
    } else if (urlSort === 'bestseller') {
      list = list.filter(b => b.bestSeller)
    } else if (urlSort === 'deals') {
      list = list.filter(b => typeof b.salePrice === 'number' && b.salePrice < b.price)
    }

    // Search / category
    if (query) {
      list = list.filter(b =>
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query)
      )
    }
    if (category) {
      list = list.filter(b => b.category.toLowerCase().includes(category))
    }

    // User sort (dropdown)
    if (sort === 'price-asc') return list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))
    if (sort === 'price-desc') return list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price))
    // Default: newest first
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [books, sort, query, category, urlSort, preorder])

  const heading = query
    ? `Results for "${query}"`
    : preorder
    ? 'Pre-orders'
    : urlSort === 'bestseller'
    ? 'Best Sellers'
    : urlSort === 'deals'
    ? 'Deals'
    : urlSort === 'newest'
    ? 'New Arrivals'
    : category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'All Books'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
          <Link
            href="/catalog"
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              !category && !query
                ? 'bg-terracotta text-white border-terracotta'
                : 'border-charcoal/20 text-charcoal/60 hover:border-terracotta hover:text-terracotta'
            }`}
          >
            All Books
          </Link>
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/catalog?category=${encodeURIComponent(cat.name)}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                category === cat.name.toLowerCase()
                  ? 'bg-terracotta text-white border-terracotta'
                  : 'border-charcoal/20 text-charcoal/60 hover:border-terracotta hover:text-terracotta'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Heading + sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 mt-2">
        <h1 className="flex items-center gap-3 text-xl font-bold uppercase tracking-[0.12em] text-charcoal">
          <span className="w-1 h-6 rounded-sm shrink-0" style={{ backgroundColor: '#F07A22' }} />
          {heading}
        </h1>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as typeof sort)}
          className="border border-beige px-4 py-2 text-sm focus:outline-none focus:border-terracotta text-charcoal bg-white"
        >
          <option value="latest">Latest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 gap-y-8 mt-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 animate-pulse">
              <div className="aspect-[2/3] bg-beige w-full" />
              <div className="h-3 bg-beige rounded w-1/2" />
              <div className="h-4 bg-beige rounded w-3/4" />
              <div className="h-8 bg-beige rounded w-full mt-1" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 gap-y-8 mt-4">
          {filtered.map(b => (
            <ProductCard key={b.id} book={b} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-charcoal/50 mb-4">
            {query
              ? `No books found for "${query}".`
              : preorder
              ? 'No pre-order titles available right now.'
              : urlSort === 'deals'
              ? 'No deals available right now.'
              : urlSort === 'bestseller'
              ? 'No best sellers tagged yet.'
              : 'No books in this category yet.'}
          </p>
          <Link href="/catalog" className="text-terracotta hover:underline text-sm">
            View all books
          </Link>
        </div>
      )}
    </div>
  )
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 gap-y-8 mt-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 animate-pulse">
              <div className="aspect-[2/3] bg-beige w-full" />
              <div className="h-3 bg-beige rounded w-1/2" />
              <div className="h-4 bg-beige rounded w-3/4" />
              <div className="h-8 bg-beige rounded w-full mt-1" />
            </div>
          ))}
        </div>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  )
}
